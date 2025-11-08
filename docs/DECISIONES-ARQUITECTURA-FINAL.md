# DECISIONES DE ARQUITECTURA FINAL

**Fecha:** 2025-01-04
**Estado:** APROBADO - Listo para implementación
**Timeline:** 3 semanas (23 días)

---

## RESUMEN EJECUTIVO

Ecommerce para Confitería Quelita con:
- **1000-1500 productos** (~85% simples, ~15% con variantes)
- **Sistema híbrido:** ProductParent + ProductVariant (variantes opcionales)
- **Checkout:** WhatsApp (sin pasarela de pago en MVP)
- **Admin:** Super-guiado para usuarios sin conocimiento técnico
- **Cliente:** Mobile-first, experiencia premium

---

## 1. MODELO DE DATOS

### ✅ DECISIÓN: ProductParent + ProductVariant (Variantes Opcionales)

**Implementación:**
```typescript
// Producto simple (85% de casos)
ProductParent: "Galleta Serranita Fruna"
  variantAttributes: []  // Vacío
  → Genera automáticamente 1 ProductVariant default

// Producto con variantes (15% de casos)
ProductParent: "Coca-Cola Clásica"
  variantAttributes: [{ name: "tamaño", values: ["250ml", "500ml", "1.5L", "3L"] }]
  → Admin crea manualmente cada variante con precio/stock
```

**Ventajas:**
- ✓ Flexibilidad para ambos casos
- ✓ Agrupación visual en catálogo cliente
- ✓ Descuentos escalonados por atributo
- ✓ Escalabilidad futura

**Desventajas aceptadas:**
- Admin requiere wizard guiado (se implementará)
- Curva de aprendizaje 2-3 días (se mitigará con ayudas visuales)

---

## 2. CATEGORÍAS

### ✅ DECISIÓN: Con Subcategorías (2 niveles)

**Estructura:**
```
Category (parent: null)
  ├─ Subcategory (parent: ObjectId)
  ├─ Subcategory (parent: ObjectId)
  └─ Subcategory (parent: ObjectId)
```

**Ejemplo:**
```
Bebidas
  ├─ Gaseosas
  ├─ Jugos
  └─ Agua

Snacks
  ├─ Papas fritas
  ├─ Nachos
  └─ Galletas saladas
```

**Razón:** Con 1000-1500 productos, categorías flat no son suficientes para organización.

**Implementación:**
- Revertir cambios en Category.ts (agregar campo `parent`)
- Máximo 2 niveles (no tercer nivel)
- Un producto puede estar en múltiples categorías

---

## 3. TAGS

### ✅ DECISIÓN: Implementar en MVP - Lista Predefinida

**Campo en ProductParent:**
```typescript
tags: string[]  // ["sin gluten", "vegano", "importado", "nuevo", "oferta"]
```

**Lista inicial de tags:**
- "sin gluten"
- "vegano"
- "sin azúcar"
- "importado"
- "nuevo"
- "oferta"
- "descuento"

**Admin puede agregar nuevos tags desde configuración.**

**Razón:** Esencial para filtros avanzados del catálogo.

---

## 4. CAMPOS ADICIONALES EN MODELOS

### ProductParent (Actualizar)

**Agregar:**
```typescript
tags: string[]                    // Tags predefinidos
seoTitle?: string                 // Título SEO (opcional)
seoDescription?: string           // Meta descripción (opcional)
relatedProducts?: ObjectId[]      // Productos relacionados (Fase 2)
```

### ProductVariant (Actualizar)

**Agregar:**
```typescript
description?: string              // Descripción específica de variante (opcional)
                                  // Si no existe, usa la del padre
```

### Category (Revertir + Actualizar)

**Revertir:**
```typescript
parent?: ObjectId                 // Ref Category (para subcategorías)
```

**Agregar métodos:**
```typescript
hasSubcategories()               // Verificar si tiene hijos
getSubcategories()               // Obtener subcategorías
```

---

## 5. DESCUENTOS ESCALONADOS

### ✅ DECISIÓN: Por Atributo (Opción 1B)

**Lógica:**

**Para productos CON variantes:**
```typescript
// Descuento aplica solo a variantes con mismo valor de atributo
ProductParent: "Coca-Cola"
  tieredDiscounts: [{
    attribute: "tamaño",
    attributeValue: "500ml",
    tiers: [
      { minQty: 6, maxQty: 11, type: 'percentage', value: 10 },  // 6-11 unidades: 10% off
      { minQty: 12, maxQty: null, type: 'percentage', value: 15 } // 12+ unidades: 15% off
    ]
  }]

// Carrito:
// 8× Coca-Cola 500ml → 10% descuento ✓
// 5× Coca-Cola 500ml + 3× Coca-Cola 1.5L → NO aplica ✗
```

**Para productos SIN variantes:**
```typescript
// Descuento aplica a cantidad total
ProductParent: "Galleta Serranita"
  variantAttributes: []
  tieredDiscounts: [{
    attribute: null,              // Null = aplica a producto completo
    attributeValue: null,
    tiers: [
      { minQty: 6, maxQty: 11, type: 'percentage', value: 10 }
    ]
  }]
```

---

## 6. BÚSQUEDA Y FILTROS

### ✅ Filtros del Catálogo (MVP):

**Barra de búsqueda:**
- Búsqueda por texto (nombre/descripción) - Full-text search
- Debounce 300ms
- Autocompletado con últimas búsquedas

**Filtros laterales (desktop) / Sheet (mobile):**
- ✓ Categoría (select jerárquico con subcategorías)
- ✓ Marca (múltiple selección)
- ✓ Rango de precio (slider min-max)
- ✓ Tags (chips seleccionables)
- ✓ En oferta (checkbox)
- ✗ Stock disponible (NO en MVP - permitimos mostrar sin stock)

**Ordenamiento:**
- Relevancia (default)
- Precio: menor a mayor
- Precio: mayor a menor
- Nombre: A-Z
- Nuevos primero (createdAt desc)
- ~~Más vendidos~~ (Fase 2 - requiere analytics)

---

## 7. IMÁGENES

### ProductParent:
```typescript
images?: string[]  // 0-5 imágenes (opcional)
                   // Imágenes generales del producto
```

### ProductVariant:
```typescript
images: string[]   // 1-5 imágenes (requerido al menos 1)
                   // Imágenes específicas de esta variante
```

**Comportamiento:**
- Si variante tiene imágenes propias → usa esas
- Si variante NO tiene imágenes → usa las del padre
- En admin: opción "Usar imágenes del padre" (checkbox)

**Procesamiento:**
- Upload: Multer
- Procesamiento: Sharp (4 tamaños: thumbnail, small, medium, large)
- Storage: Filesystem local (`/uploads/products/`)
- Fase 2: Migrar a Cloudinary/S3

---

## 8. CAMPOS NO IMPLEMENTADOS (Fase 2)

**Descartados del MVP:**

### ✗ Fecha de Vencimiento
- Razón: Añade complejidad innecesaria
- Fase 2: Agregar `expirationDate` opcional en ProductVariant

### ✗ Información Nutricional
- Razón: No crítico para MVP
- Fase 2: Agregar `nutritionalInfo` opcional en ProductParent

### ✗ Peso/Dimensiones
- Razón: No hay envíos calculados en MVP
- Fase 2: Agregar `weight`, `dimensions` en ProductVariant

### ✗ Código de Barras
- Razón: No hay sistema de escaneo
- Fase 2: Agregar `barcode` opcional en ProductVariant

---

## 9. ROLES Y PERMISOS

### Roles Confirmados:

**1. visita** (sin autenticación)
- Ver catálogo
- Buscar productos
- Ver detalle
- Agregar al carrito
- Crear orden (checkout como guest)

**2. cliente** (autenticado)
- Todo de visita +
- Ver historial de órdenes propias
- Re-ordenar (copiar orden anterior)
- Guardar dirección

**3. funcionario** (autenticado)
- Ver todas las órdenes
- Cambiar estado de órdenes (confirmar, preparar, enviar)
- Ver stock
- Ver alertas de stock bajo
- **NO puede:** cambiar precios, crear/editar productos

**4. admin** (autenticado)
- Acceso completo
- Crear/editar/eliminar productos, categorías, marcas
- Gestionar usuarios (bloquear clientes, crear funcionarios)
- Configurar descuentos
- Ver auditoría completa

---

## 10. ADMIN UI - ESTRATEGIA UX

### ✅ FILOSOFÍA: "Si tu hermano no puede usarlo sin llamarte, fracasamos"

**Características obligatorias:**

### 1. Wizard Guiado para Crear Productos

**Flujo para producto simple (85% de casos):**
```
[Paso 1/3] Información Básica
  ├─ Nombre
  ├─ Descripción (WYSIWYG editor simple)
  ├─ Categorías (select jerárquico)
  ├─ Marca
  └─ Imágenes (drag & drop + preview)

[Paso 2/3] Precio y Stock
  ├─ SKU (auto-generado, editable)
  ├─ Precio
  ├─ Stock
  └─ Permitir sobreventa (checkbox con tooltip)

[Paso 3/3] Descuentos (opcional)
  ├─ Descuento fijo (checkbox)
  │   └─ Si activo: tipo (% o $), valor, fechas
  └─ Descuento por cantidad (checkbox)
      └─ Si activo: tabla para configurar escalones

[Botón: Crear Producto]
  → Sistema crea ProductParent + ProductVariant automáticamente
  → Usuario nunca ve "Parent" o "Variant"
```

**Flujo para producto con variantes (15% de casos):**
```
[Paso 1/3] Información Básica
  (igual que arriba)

[Paso 2/3] ¿Este producto tiene variantes?

  Ayuda visual:
  "Las variantes son útiles cuando el mismo producto viene en diferentes
   opciones (ej: tamaños, sabores, colores) y quieres mostrarlos juntos.

   Ejemplos:
   ✓ Coca-Cola en 250ml, 500ml, 1.5L, 3L
   ✓ Chocolate en 50g, 100g, 200g

   NO usar variantes para:
   ✗ Productos con nombres diferentes (Coca-Cola vs Pepsi)
   ✗ Sabores muy diferentes (Chocolate con leche vs amargo)"

  [○ No, es un producto simple] → Ir a flujo simple

  [○ Sí, tiene variantes] → Continuar

  Definir atributos:
  ├─ Atributo 1: [nombre: "tamaño"] [valores: "250ml, 500ml, 1.5L, 3L"]
  └─ [+ Agregar otro atributo] (opcional, máx 3)

[Paso 3/3] Configurar Variantes

  Tabla generada automáticamente:

  | Variante        | SKU (auto) | Precio | Stock | Imagen | Activo |
  |-----------------|------------|--------|-------|--------|--------|
  | 250ml           | COCA-250   | $500   | 100   | [📷]   | [✓]    |
  | 500ml           | COCA-500   | $900   | 50    | [📷]   | [✓]    |
  | 1.5L            | COCA-1500  | $1500  | 30    | [📷]   | [✓]    |
  | 3L              | COCA-3000  | $2500  | 20    | [📷]   | [✓]    |

  Nota: "Puedes desactivar variantes que no vendas actualmente"

[Paso 4/3] Descuentos por Cantidad (opcional)

  "Configura descuentos cuando compran varias unidades del mismo tamaño"

  Para tamaño: [Select: 250ml ▼]

  | Desde | Hasta    | Descuento  |
  |-------|----------|------------|
  | 6     | 11       | 10% OFF    |
  | 12    | Infinito | 15% OFF    |

  [+ Configurar descuento para otro tamaño]

[Botón: Crear Producto con Variantes]
```

### 2. Tooltips y Ayudas Contextuales

**Implementar en TODOS los campos:**
- Icono [?] hover/click con explicación
- Ejemplos concretos
- Advertencias cuando sea necesario

**Ejemplos:**
```
SKU [?]
  "Código único para identificar el producto.
   Ejemplo: COCA-500, GALSER-01
   Se genera automáticamente pero puedes editarlo."

Permitir sobreventa [?]
  "Si está activado, los clientes pueden comprar aunque no haya stock.
   Útil cuando esperas reposición pronto.
   ⚠️ Si está desactivado, el producto desaparecerá del catálogo cuando stock = 0"

Descuento escalonado [?]
  "Descuento automático cuando compran varias unidades.
   Ejemplo: Compra 6 y obtén 10% OFF

   ⚠️ Solo aplica si compran variantes con el mismo tamaño/sabor"
```

### 3. Vista Previa en Tiempo Real

**Mientras el admin configura:**
- Panel derecho muestra cómo se verá en el catálogo
- Actualización en vivo al cambiar imágenes/nombre
- Preview mobile + desktop

### 4. Validaciones Amigables

**Ejemplo:**
```
❌ MAL:
  Error: "variantAttributes.values must have at least 2 items"

✅ BIEN:
  "Para crear variantes necesitas al menos 2 opciones.
   Ejemplo: Si el atributo es 'tamaño', necesitas al menos 2 tamaños diferentes.

   ¿Quieres crear un producto simple en lugar de uno con variantes?"
```

### 5. Modo de Edición Rápida

**Para editar solo precio/stock sin wizard completo:**
- Lista de productos con edición inline
- Click en precio → input editable
- Click en stock → input editable
- Guardar automático al perder foco

---

## 11. CATÁLOGO CLIENTE

### Agrupación de Variantes

**En grid de productos:**
```
┌─────────────────────────┐
│  [Imagen Coca-Cola]     │
│  Coca-Cola Clásica      │
│  Desde $500             │
│  [4 tamaños disponibles]│ ← Indicador de variantes
│  [Ver opciones]         │
└─────────────────────────┘
```

**En página de producto:**
```
Coca-Cola Clásica
─────────────────

[Carousel de imágenes]

Elige el tamaño:
┌──────┬──────┬──────┬──────┐
│250ml │500ml │ 1.5L │  3L  │
│ $500 │ $900 │$1500 │$2500 │
└──────┴──────┴──────┴──────┘
   ↑ Selected

Precio: $900
Stock: 50 disponibles

[Selector cantidad: 1 ▼]

[Agregar al carrito - $900]

Descuento por cantidad:
• Lleva 6-11 y obtén 10% OFF
• Lleva 12+ y obtén 15% OFF
```

---

## 12. MOBILE-FIRST (PRIORIDAD MÁXIMA)

### Breakpoints:
```
xs:  320px+  (móvil pequeño)
sm:  640px+  (móvil grande)
md:  768px+  (tablet)
lg:  1024px+ (desktop)
xl:  1280px+ (desktop grande)
2xl: 1536px+ (desktop extra grande)
```

### Componentes Críticos:

**Catálogo:**
- Grid: 1 col (xs) → 2 cols (sm) → 3 cols (lg) → 4 cols (xl)
- Cards optimizadas para touch (mínimo 44×44px)

**Filtros:**
- Mobile: Sheet desde bottom con height 90vh
- Desktop: Sidebar sticky izquierda

**Carrito:**
- Mobile: Sheet desde right con swipe-to-close
- Desktop: Dropdown o sidebar derecha

**Producto Detail:**
- Mobile: Stack vertical (imagen → info → opciones)
- Desktop: Grid 2 cols (imagen izq, info der)

**Selector de Variantes:**
- Mobile: Botones grandes (48px altura)
- Desktop: Botones medianos (40px altura)

---

## 13. ORDEN DE IMPLEMENTACIÓN

### Semana 1: Backend + Modelos Finales
**Días 1-2:**
- ✓ Actualizar Category (agregar parent)
- ✓ Actualizar ProductParent (agregar tags, seoTitle, seoDescription)
- ✓ Actualizar ProductVariant (agregar description)
- ✓ Crear Tag model predefinido
- ✓ Crear índices optimizados

**Días 3-5:**
- Controllers: productParentController, productVariantController
- Services: discountService (calcular descuentos por atributo)
- Services: stockService (gestión con StockMovement)
- Routes completas con middleware de roles

**Día 6-7:**
- WhatsApp service (generación de mensajes)
- Order controller completo con validación de stock
- Testing backend con Postman

### Semana 2: Admin UI
**Días 8-10:**
- Setup Next.js Admin App
- Layout base con navegación
- Dashboard simple (stats básicos)
- Lista de productos con edición inline

**Días 11-13:**
- Wizard creación producto simple (3 pasos)
- Wizard creación producto con variantes (4 pasos)
- Drag & drop imágenes con preview
- Gestión de categorías (CRUD con subcategorías)

**Día 14:**
- Tooltips y ayudas contextuales en todos los campos
- Validaciones amigables con mensajes en español
- Vista previa en tiempo real

### Semana 3: Cliente UI + Testing
**Días 15-17:**
- Setup Next.js Client App
- Catálogo con grid responsive
- Filtros (Sheet mobile, Sidebar desktop)
- Búsqueda con autocompletado

**Días 18-19:**
- Página de producto con selector de variantes
- Carrito con cálculo de descuentos
- Checkout + generación WhatsApp

**Días 20-21:**
- Testing en dispositivos reales (móvil, tablet, desktop)
- Ajustes de UX según feedback
- Optimización de performance (Lighthouse > 90)

**Días 22-23:**
- Bug fixing
- Documentación de uso para admin
- Deploy a VPS

---

## 14. TECH STACK CONFIRMADO

### Backend:
- Node.js 20+
- Express.js 5
- TypeScript
- MongoDB + Mongoose
- JWT (httpOnly cookies)
- Multer + Sharp (imágenes)
- Bcrypt (passwords)

### Frontend Admin:
- Next.js 14 App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- React Hook Form + Zod
- TanStack Query
- Zustand (state)

### Frontend Cliente:
- Next.js 14 App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- Framer Motion (animaciones)
- TanStack Query
- Zustand (carrito)

---

## 15. MÉTRICAS DE ÉXITO

### MVP se considera exitoso si:

**Técnicas:**
- ✓ Lighthouse mobile score > 90
- ✓ Tiempo de carga < 3s en 3G
- ✓ 0 errores críticos en producción
- ✓ Funciona en Chrome, Safari, Firefox (últimas 2 versiones)

**UX:**
- ✓ Tu hermano puede crear 10 productos sin llamarte
- ✓ Cliente puede completar orden en < 2 minutos
- ✓ Funciona perfectamente en iPhone y Android

**Negocio:**
- ✓ Al menos 1 orden real completada
- ✓ Sistema de descuentos funciona correctamente
- ✓ Stock se gestiona automáticamente sin errores

---

## 16. RIESGOS Y MITIGACIÓN

### Riesgo 1: Admin demasiado complejo
**Probabilidad:** Media
**Impacto:** Alto
**Mitigación:**
- Testing con tu hermano en Día 14
- Ajustar wizard según feedback
- Simplificar si es necesario

### Riesgo 2: Performance en móvil
**Probabilidad:** Media
**Impacto:** Alto (es prioridad máxima)
**Mitigación:**
- Code splitting agresivo
- Lazy loading de imágenes
- Testing continuo en dispositivos reales

### Riesgo 3: Bugs en descuentos escalonados
**Probabilidad:** Alta
**Impacto:** Crítico (afecta ingresos)
**Mitigación:**
- Test suite extensivo con casos edge
- Logging detallado de cálculos
- Panel de auditoría para revisar descuentos aplicados

---

## 17. FUERA DE ALCANCE (Fase 2)

**NO implementar en MVP:**
- ✗ Reviews y ratings
- ✗ Wishlist
- ✗ Notificaciones en tiempo real
- ✗ Panel de estadísticas avanzado
- ✗ Integración Bicom
- ✗ Más vendidos / Recomendados
- ✗ Cupones de descuento
- ✗ Programa de puntos / fidelidad
- ✗ Chat en vivo
- ✗ Tracking de envío
- ✗ Facturación electrónica

---

## APROBACIÓN

**Decisiones aprobadas por:** Usuario
**Fecha de aprobación:** 2025-01-04
**Próximo paso:** Actualizar modelos y comenzar implementación

**Firma digital:** ✓ Arquitectura validada y lista para desarrollo

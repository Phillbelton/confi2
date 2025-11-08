# ESPECIFICACIÓN DE FEATURES - MVP

Especificación detallada de features complementarias del MVP.

**Fecha:** 2025-01-03
**Versión:** 1.0

---

## 1. BÚSQUEDA AVANZADA

### 1.1 Características

**Búsqueda por texto:**
- Busca en: nombre de producto padre, descripción, nombre de variante, SKU
- Algoritmo: Full-text search de MongoDB
- Sin búsqueda fonética (Fase 2)

**Autocompletado:**
- Se activa después de 3 caracteres
- Muestra hasta 10 sugerencias
- Incluye imagen thumbnail + precio desde
- Debounce de 300ms para evitar requests excesivos

### 1.2 Filtros Disponibles

```typescript
interface SearchFilters {
  query?: string                    // Texto de búsqueda
  categories?: string[]             // IDs de categorías (múltiples)
  brands?: string[]                 // IDs de marcas (múltiples)
  minPrice?: number                 // Precio mínimo
  maxPrice?: number                 // Precio máximo
  attributes?: {                    // Filtros por atributos de variante
    [key: string]: string[]         // Ej: { tamaño: ["350ml", "500ml"] }
  }
  inStock?: boolean                 // Solo con stock > 0
  hasDiscount?: boolean             // Solo con descuento activo
  featured?: boolean                // Solo destacados
}
```

### 1.3 Ordenamiento

**Opciones:**
- `name_asc`: Alfabético A-Z
- `name_desc`: Alfabético Z-A
- `price_asc`: Precio menor a mayor (usa precio mínimo de variantes)
- `price_desc`: Precio mayor a menor (usa precio máximo de variantes)
- `newest`: Más recientes primero
- `mostSold`: Más vendidos (por cantidad de órdenes - Fase 2)

### 1.4 UI de Búsqueda

**Barra de búsqueda (Header):**
```
┌──────────────────────────────────────────────┐
│ [🔍] Buscar productos...            [Buscar] │
│                                               │
│ [Autocompletado si escribió 3+ caracteres]   │
│ ┌─────────────────────────────────────────┐  │
│ │ Bebida Cola 350ml        Desde $500     │  │
│ │ Bebida Cola 500ml        Desde $700     │  │
│ │ ...                                     │  │
│ └─────────────────────────────────────────┘  │
└──────────────────────────────────────────────┘
```

**Página de resultados:**
```
┌────────────────────────────────────────────────┐
│ Resultados para "cola" (24 productos)          │
├────────────────────────────────────────────────┤
│                                                │
│ [Sidebar Filtros]      [Grid de Productos]    │
│                                                │
│ Categorías             ┌─────┐ ┌─────┐        │
│ ☑ Bebidas              │ ... │ │ ... │        │
│ ☐ Golosinas            └─────┘ └─────┘        │
│                                                │
│ Marcas                 [Paginación]            │
│ ☑ Coca Cola                                    │
│ ☐ Pepsi                                        │
│                                                │
│ Precio                                         │
│ [500] ──────●──── [2000]                      │
│                                                │
│ Tamaño                                         │
│ ☑ 350ml                                        │
│ ☐ 500ml                                        │
│ ☐ 1L                                           │
│                                                │
│ [Limpiar filtros]                              │
└────────────────────────────────────────────────┘
```

---

## 2. EDITOR DE IMÁGENES

### 2.1 Características (Opción B - Medio)

**Funciones incluidas:**
- Subir imagen (drag & drop o click)
- Recortar (crop con aspect ratio configurable)
- Rotar (90°, 180°, 270°)
- Flip horizontal/vertical
- Ajustar brillo (-100 a +100)
- Ajustar contraste (-100 a +100)
- Ajustar saturación (-100 a +100)
- Preview en tiempo real
- Reset (volver a original)

**Librerías sugeridas:**
- `react-image-crop` - Para recortar
- `react-easy-crop` - Alternativa moderna
- Custom canvas manipulation para ajustes de color

### 2.2 Flujo de Uso

```
1. Admin abre modal "Subir imágenes" en variante
2. Arrastra imagen o hace click para seleccionar
3. Imagen se carga en editor
4. Aplica ajustes:
   - Recorta a cuadrado (1:1)
   - Rota si es necesario
   - Ajusta brillo/contraste
5. Click "Guardar"
6. Backend procesa con Sharp:
   - Aplica transformaciones
   - Genera 4 versiones (thumbnail, card, detail, zoom)
   - Optimiza peso (compress)
   - Guarda en /uploads
7. URL se guarda en array de images de variante
```

### 2.3 UI del Editor

```
┌────────────────────────────────────────────────┐
│ Editor de Imagen                               │
├────────────────────────────────────────────────┤
│                                                │
│  [Preview de imagen]                           │
│  ┌──────────────────────────────────────────┐ │
│  │                                          │ │
│  │         [Imagen con overlay]            │ │
│  │                                          │ │
│  └──────────────────────────────────────────┘ │
│                                                │
│  Herramientas:                                 │
│  [↻ Rotar] [↔ Flip H] [↕ Flip V] [✂ Recortar] │
│                                                │
│  Ajustes:                                      │
│  Brillo:     [────●────] 0                    │
│  Contraste:  [────●────] 0                    │
│  Saturación: [────●────] 0                    │
│                                                │
│  [Reset] [Cancelar] [Guardar]                 │
└────────────────────────────────────────────────┘
```

### 2.4 Validaciones

- Formatos: JPG, PNG, WebP
- Peso máximo: 3MB por imagen
- Resolución mínima: 300×300px
- Máximo 5 imágenes por variante
- Primera imagen es la principal

---

## 3. GESTIÓN DE MÚLTIPLES USUARIOS

### 3.1 Crear Usuario Admin/Funcionario

**Formulario:**
```
┌────────────────────────────────────┐
│ Crear Nuevo Usuario                │
├────────────────────────────────────┤
│                                    │
│ Nombre completo *                  │
│ [Juan Pérez_________________]     │
│                                    │
│ Email *                            │
│ [juan@example.com___________]     │
│                                    │
│ Contraseña *                       │
│ [●●●●●●●●___________________]     │
│                                    │
│ Confirmar contraseña *             │
│ [●●●●●●●●___________________]     │
│                                    │
│ Rol *                              │
│ ● Admin  ○ Funcionario             │
│                                    │
│ Estado                             │
│ ☑ Activo                           │
│                                    │
│ [Cancelar] [Crear Usuario]         │
└────────────────────────────────────┘
```

### 3.2 Lista de Usuarios

**Vista:**
```
┌────────────────────────────────────────────────────┐
│ Usuarios Admin y Funcionarios                      │
├────────────────────────────────────────────────────┤
│                                                    │
│ [+ Nuevo Usuario] [Buscar__________] [Filtro ▼]   │
│                                                    │
│ ┌──────────────────────────────────────────────┐  │
│ │ Nombre      │Email        │Rol     │Estado  │  │
│ ├──────────────────────────────────────────────┤  │
│ │ Admin User  │admin@...    │Admin   │✅ Activo│ │
│ │ Juan Pérez  │juan@...     │Func.   │✅ Activo│ │
│ │ Ana García  │ana@...      │Func.   │⛔ Bloq. │ │
│ └──────────────────────────────────────────────┘  │
│                                                    │
│ [Paginación]                                       │
└────────────────────────────────────────────────────┘
```

**Acciones por fila:**
- Ver/Editar (nombre, email)
- Cambiar contraseña
- Activar/Desactivar (toggle)
- NO se puede eliminar físicamente

### 3.3 Reglas

- Solo Admin puede crear otros usuarios
- Admin puede crear Admin o Funcionario
- Funcionario NO puede crear usuarios
- Usuario bloqueado NO puede hacer login
- NO se eliminan físicamente (preservar auditoría)
- Email único en el sistema

---

## 4. ALERTAS DE STOCK BAJO

### 4.1 Widget en Dashboard

**Ubicación:** Dashboard de Admin y Funcionario

```
┌────────────────────────────────────────────────┐
│ 🚨 Alertas de Stock Bajo (12)                  │
├────────────────────────────────────────────────┤
│                                                │
│ Filtros: [Crítico ▼] [Buscar___________]      │
│                                                │
│ ┌──────────────────────────────────────────┐  │
│ │ Producto            │Stock│Umbral│Acción │  │
│ ├──────────────────────────────────────────┤  │
│ │ Cola 350ml Original │  2  │  5   │[Edit]│  │
│ │ Cola 500ml Zero     │  3  │  5   │[Edit]│  │
│ │ Chocolate 100g      │  1  │  5   │[Edit]│  │
│ └──────────────────────────────────────────┘  │
│                                                │
│ [Ver todos] [Exportar CSV]                     │
└────────────────────────────────────────────────┘
```

### 4.2 Configuración

**Por variante:**
- Umbral global: 5 unidades (configurable por admin)
- Umbral custom por variante (override del global)

**Niveles:**
- **Crítico:** Stock <= 2
- **Bajo:** Stock <= umbral
- **Normal:** Stock > umbral

### 4.3 Acciones

- Click en [Edit] → Abre modal de edición rápida de stock
- Exportar CSV con lista completa
- Filtro para ver solo críticos
- Búsqueda por nombre de variante

---

## 5. AUDITORÍA DE ACCIONES CRÍTICAS

### 5.1 Acciones Auditadas

**Se registra en `AuditLog`:**

| Acción | Entity | Detalles |
|--------|--------|----------|
| Crear producto | product | Datos completos |
| Editar producto | product | Campos modificados (before/after) |
| Eliminar producto | product | Datos del producto eliminado |
| Cambiar precio | variant | Precio anterior y nuevo |
| Cambiar stock | variant | Stock anterior y nuevo |
| Crear descuento | product | Configuración del descuento |
| Cancelar orden | order | Orden completa + motivo |
| Crear usuario | user | Datos del nuevo usuario |
| Bloquear usuario | user | Usuario bloqueado |

**NO se audita:**
- Login/logout
- Consultas de lectura
- Cambios normales de estado de orden (pending → confirmed)

### 5.2 Vista de Logs (Admin)

```
┌────────────────────────────────────────────────────┐
│ Log de Auditoría                                   │
├────────────────────────────────────────────────────┤
│                                                    │
│ Filtros:                                           │
│ Usuario: [Todos ▼]  Acción: [Todas ▼]            │
│ Fecha: [01/01/2025] - [31/01/2025]               │
│                                                    │
│ ┌──────────────────────────────────────────────┐  │
│ │ Fecha    │Usuario │Acción  │Entidad│Detalles│  │
│ ├──────────────────────────────────────────────┤  │
│ │ 03/01 10:30│Admin │Cancelar│Orden  │[Ver]  │  │
│ │ 03/01 09:15│Juan  │Editar  │Product│[Ver]  │  │
│ │ 02/01 18:45│Admin │Crear   │User   │[Ver]  │  │
│ └──────────────────────────────────────────────┘  │
│                                                    │
│ [Paginación]                                       │
└────────────────────────────────────────────────────┘
```

**Detalle de log:**
- Timestamp completo
- Usuario que realizó la acción
- IP address
- User agent
- Before/After (JSON diff)

---

## 6. CATEGORÍAS MÚLTIPLES

### 6.1 Asignación en Producto

**Al crear/editar producto padre:**

```
Categorías * (múltiples)
┌────────────────────────────┐
│ ☑ Bebidas                  │
│ ☑ Gaseosas                 │
│ ☐ Sin TACC                 │
│ ☑ Productos Importados     │
│ ☐ Ofertas                  │
│ ☐ Chocolates               │
│ ☐ Golosinas                │
└────────────────────────────┘

Seleccionadas (3):
[Bebidas ×] [Gaseosas ×] [Productos Importados ×]
```

### 6.2 Navegación

**Menú de categorías (orden alfabético):**
```
Categorías
├─ Bebidas (45)
├─ Chocolates (120)
├─ Gaseosas (30)
├─ Golosinas (200)
├─ Productos Importados (25)
└─ Sin TACC (15)
```

**Al hacer click en categoría:**
- Muestra todos los productos que tienen esa categoría
- Un producto puede aparecer en múltiples listados
- Badges muestran todas las categorías del producto

### 6.3 Filtros Especiales

**"Nuevos":**
- NO es categoría
- Filtro: `createdAt >= hace30días`
- Badge: "NUEVO" en card de producto

**"Ofertas":**
- NO es categoría
- Filtro: tiene descuento activo (fijo o escalonado)
- Badge: "OFERTA" o badge custom del descuento

---

## 7. RE-ORDENAR (VOLVER A COMPRAR)

### 7.1 Funcionalidad

**Ubicación:** Página `/mis-ordenes`, en cada orden completada

**Botón:** "Volver a comprar"

**Comportamiento:**
1. Click en botón
2. Sistema verifica disponibilidad:
   - Variantes siguen existiendo y activas
   - Stock suficiente
3. Agrega todos los items al carrito
4. Redirige a `/carrito`
5. Toast: "Productos agregados al carrito. Revisa cantidades y precios."

**Advertencias:**
- Si una variante ya no existe: "Producto X ya no está disponible"
- Si hay stock insuficiente: "Stock limitado para producto Y (disponible: Z)"
- Precios pueden haber cambiado
- Descuentos pueden ser diferentes

---

## 8. CANCELACIÓN DE ÓRDENES

### 8.1 Por Cliente

**Ubicación:** Detalle de orden en `/mis-ordenes/[orderNumber]`

**Condiciones:**
- Solo en estado `pending_whatsapp`
- Botón "Cancelar Orden"
- Confirmación modal

**Modal de confirmación:**
```
┌────────────────────────────────────┐
│ ¿Cancelar orden?                   │
├────────────────────────────────────┤
│                                    │
│ Estás por cancelar la orden        │
│ #QUE-20250103-001                 │
│                                    │
│ Se devolverá el stock              │
│ automáticamente.                   │
│                                    │
│ ¿Motivo? (opcional)                │
│ [Textarea____________]            │
│                                    │
│ [Volver] [Sí, cancelar orden]      │
└────────────────────────────────────┘
```

### 8.2 Por Funcionario/Admin

**Ubicación:** Detalle de orden en admin

**Condiciones:**
- Funcionario: solo en `pending_whatsapp` o `confirmed`
- Admin: en cualquier estado excepto `completed`

**UI:**
- Botón "Cancelar Orden" (rojo)
- Requiere confirmación
- Campo obligatorio de motivo
- Registra en auditoría

---

## 9. BADGES DE DESCUENTOS EN PRODUCTOS

### 9.1 Diseño Visual (a definir por usuario)

**Propuesta inicial:**

**Badge de Descuento Fijo:**
```
┌─────────────────┐
│  15% OFF        │ ← Fondo naranja/rojo
│  [Icono 🔥]     │    Texto blanco, bold
└─────────────────┘
```

**Badge de Descuento Escalonado:**
```
┌──────────────────────┐
│  6+ unidades: 10% OFF │ ← Fondo azul
│  [Icono 📦]          │    Texto blanco
└──────────────────────┘
```

**Posición en card:**
- Top-right corner (absolute position)
- Sobre la imagen del producto
- Con sombra para destacar

### 9.2 Información Detallada

**En detalle de producto:**

```
┌─────────────────────────────────────────┐
│ 💰 DESCUENTOS DISPONIBLES               │
├─────────────────────────────────────────┤
│                                         │
│ Descuento Fijo:                         │
│ ✓ 15% de descuento                      │
│ ✓ Válido hasta: 31/01/2025             │
│                                         │
│ Descuentos por Cantidad (350ml):        │
│ ┌─────────────────────────────────────┐ │
│ │ 6-11 unidades   → 10% ($450/u)     │ │
│ │ 12-23 unidades  → 15% ($425/u)     │ │
│ │ 24+ unidades    → 20% ($400/u)     │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ 💡 Compra más y ahorra más!             │
└─────────────────────────────────────────┘
```

---

**Especificación de features completa.**
**Listo para implementación.**

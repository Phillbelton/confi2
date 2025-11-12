# Confitería Quelita - Ecommerce con Sistema de Variantes

**Proyecto:** Sistema de ecommerce para confitería con gestión avanzada de variantes de productos y descuentos escalonados.

**Stack:**
- **Backend:** Node.js + Express + TypeScript + MongoDB (Mongoose)
- **Frontend:** Next.js 14 + React 19 + TypeScript + Tailwind CSS 4 + shadcn/ui

**Estado:** Backend 100% | Frontend 70% | En desarrollo activo

---

## 🎯 CONCEPTO FUNDAMENTAL: Sistema de Variantes

### Arquitectura ProductParent + ProductVariant

```
ProductParent (NO se vende, es un agrupador)
├── name: "Bebida Cola"
├── description: "Refresco de cola"
├── hasVariants: true
├── variantAttributes: [
│     { name: "tamaño", values: ["350ml", "500ml", "1L"] },
│     { name: "sabor", values: ["Original", "Zero"] }
│   ]
└── tieredDiscounts: [...]  // Descuentos escalonados por atributo

ProductVariant (SE VENDE, tiene precio y stock)
├── parentProduct: ref(ProductParent)
├── attributes: { tamaño: "350ml", sabor: "Original" }
├── sku: "COLA-350-ORIG"
├── price: 500
├── stock: 100
├── images: [...]
└── fixedDiscount: {...}  // Descuento fijo opcional
```

**Regla clave:** El carrito guarda **variantes**, no padres. Cada combinación de atributos es una variante única con precio/stock independiente.

---

## 💰 SISTEMA DE DESCUENTOS ESCALONADOS

### Descuentos por Cantidad + Atributo

**Concepto:**
- Se configuran en **ProductParent**
- Se aplican a **variantes que comparten un valor de atributo**
- Requieren **cantidad mínima** para activarse
- **NO hay compra mínima obligatoria** (el cliente puede comprar 1 unidad)

**Ejemplo real:**
```typescript
ProductParent: "Bebida Cola"
tieredDiscounts: [{
  attribute: "tamaño",
  attributeValue: "350ml",
  tiers: [
    { minQuantity: 6, maxQuantity: 11, value: 10, type: 'percentage' },
    { minQuantity: 12, value: 15, type: 'percentage' }
  ]
}]

// Carrito del cliente:
- 4× Cola 350ml Original ($500 c/u)
- 3× Cola 350ml Zero ($550 c/u)
- 2× Cola 500ml Original ($700 c/u)

// Cálculo:
Grupo 350ml: 4 + 3 = 7 unidades → ✅ Aplica tier 1 (10% descuento)
Grupo 500ml: 2 unidades → ❌ No aplica (necesita 6)

// Resultado:
Item 1: $500 - 10% = $450 c/u × 4 = $1.800
Item 2: $550 - 10% = $495 c/u × 3 = $1.485
Item 3: $700 (sin desc.) × 2 = $1.400
Total: $4.685
```

**Algoritmo:**
1. Agrupar items del carrito por `parentProduct` + `atributo clave`
2. Sumar cantidades del grupo
3. Buscar tier aplicable según cantidad total
4. Aplicar descuento a TODAS las variantes del grupo
5. Comparar con descuento fijo (si existe) y aplicar el mejor

---

## 📊 ESTADO DEL PROYECTO

### ✅ BACKEND (100% Implementado)

**Modelos (11):**
- User (roles: visita, cliente, funcionario, admin)
- ProductParent (producto padre con variantes opcionales)
- ProductVariant (variantes individuales)
- Category (categorías planas, múltiples por producto)
- Brand, Tag
- Order (con hooks automáticos de stock)
- StockMovement (audit trail)
- AuditLog, PasswordResetToken

**Services (3):**
- `discountService.ts` - Cálculo automático de descuentos escalonados
- `stockService.ts` - Deducción/restauración automática de stock
- `whatsappService.ts` - Generación de mensajes pre-formateados

**Controllers (8):**
- productParentController, productVariantController
- categoryController, brandController, tagController
- orderController, stockMovementController, userController
- authController

**APIs Clave:**
```
GET    /api/products/parents?category&brand&tags&search&page
GET    /api/products/parents/:id/variants
GET    /api/products/variants/:id/discount-preview?quantity=6
POST   /api/orders
```

**Características:**
- ✅ Descuentos escalonados automáticos
- ✅ Stock automático (deducción al crear orden, devolución al cancelar)
- ✅ Audit trail completo con StockMovement
- ✅ Control de acceso por roles (JWT + cookies httpOnly)
- ✅ Integración WhatsApp para checkout

### 🟡 FRONTEND (70% Implementado)

**Completado:**
- ✅ Setup Next.js 14 + TypeScript + Tailwind CSS 4
- ✅ shadcn/ui (30+ componentes instalados)
- ✅ ProductCard con selector de variantes y badges de descuento
- ✅ ProductFilters (desktop sidebar + mobile sheet)
- ✅ Página de catálogo con filtros avanzados y paginación
- ✅ Layout (Header, Footer)
- ✅ useCartStore (Zustand) con persistencia
- ✅ React Query configurado
- ✅ Axios client

**Pendiente (30%):**
- ⚠️ Integrar variantes desde API (ProductCard línea 199 tiene `variants={[]}`)
- ⚠️ Detalle de producto (`/productos/[slug]`)
  - Galería de imágenes
  - Selector de variantes visual
  - Tabla de descuentos escalonados
  - Precio dinámico
- ⚠️ Carrito Sheet completo
  - Cálculo de descuentos escalonados
  - Totales dinámicos
  - Modificar/eliminar items
- ⚠️ Checkout (`/checkout`)
  - Form con validación
  - Integración WhatsApp
  - Creación de orden
- ⚠️ Panel Admin completo
  - Wizard para crear productos con variantes
  - Configurar descuentos escalonados
  - Gestión de órdenes (cambiar estado)
  - Dashboard

---

## 📁 ESTRUCTURA DEL PROYECTO

```
confi2/
├── backend/                    ✅ 100% COMPLETO
│   ├── src/
│   │   ├── models/            (11 modelos)
│   │   ├── controllers/       (8 controllers)
│   │   ├── services/          (discount, stock, whatsapp)
│   │   ├── routes/            (8 routers)
│   │   ├── middleware/        (auth, validation, error)
│   │   ├── schemas/           (Zod validation)
│   │   └── config/            (db, env, logger)
│   ├── scripts/               (seeds, migrations)
│   └── .env                   ✅ Configurado
│
├── frontend/                   🟡 70% IMPLEMENTADO
│   ├── app/
│   │   ├── page.tsx           ✅ Home
│   │   ├── productos/
│   │   │   └── page.tsx       ✅ Catálogo con filtros
│   │   ├── checkout/          ⚠️ PENDIENTE
│   │   └── admin/             ⚠️ PENDIENTE
│   ├── components/
│   │   ├── products/
│   │   │   ├── ProductCard.tsx      ✅ Con variantes
│   │   │   └── ProductFilters.tsx   ✅ Desktop + Mobile
│   │   ├── layout/            ✅ Header, Footer
│   │   └── ui/                ✅ 30+ componentes shadcn
│   ├── lib/
│   │   ├── axios.ts           ✅ HTTP client
│   │   └── utils.ts           ✅ Helpers
│   ├── store/
│   │   └── useCartStore.ts    ✅ Zustand (falta cálculo descuentos)
│   ├── hooks/                 ✅ useProducts, useCategories, useBrands
│   ├── types/                 ✅ TypeScript interfaces
│   └── .env.local             ✅ Configurado
│
└── docs/                       📚 DOCUMENTACIÓN COMPLETA
    ├── VARIANT-SYSTEM-DETAILED.md     (709 líneas)
    ├── BUSINESS-LOGIC.md              (642 líneas)
    ├── DATABASE-SCHEMA-V2.md          (esquema completo)
    ├── DECISIONES-ARQUITECTURA-FINAL.md
    └── IMPLEMENTATION-ROADMAP.md
```

---

## 🔧 SETUP LOCAL

### Backend
```bash
cd backend
npm install
npm run build
npm run dev  # Puerto 5000

# Seeds (primera vez)
npm run seed:admin
npm run seed:categories
npm run seed:brands
npm run seed:tags
```

### Frontend
```bash
cd frontend
npm install
npm run dev  # Puerto 3000
```

**Variables de entorno:**
- `backend/.env` - ✅ Configurado (MongoDB, JWT, WhatsApp)
- `frontend/.env.local` - ✅ Configurado (API URL, WhatsApp)

---

## 🎨 CRITERIOS DE DISEÑO (MVP)

### Mobile-First es PRIORIDAD MÁXIMA
```tsx
// SIEMPRE empezar con mobile
<div className="p-4 md:p-6 lg:p-8">  // ✅
```

### Microinteracciones (parte del MVP)
- ✅ Hover en cards: `scale(1.02)` + `shadow-lg`
- ✅ Agregar al carrito: loading → checkmark → badge pulse
- ✅ Precio con animación counting
- ✅ Transitions suaves (200ms)

### Loading States Profesionales
- ✅ Skeleton screens (NO spinners genéricos)
- ✅ Shimmer effect
- ✅ Optimistic UI

### Touch-Friendly
- ✅ Botones mínimo 44×44px
- ✅ Espaciado generoso en mobile

---

## 🐛 PROBLEMAS CONOCIDOS / PENDIENTES

### Alta Prioridad:
1. ⚠️ **ProductCard no muestra variantes reales** (línea 199: `variants={[]}`)
   - Falta fetch desde `/api/products/parents/:id/variants`
   - Actualmente solo muestra producto sin selector

2. ⚠️ **Carrito no calcula descuentos escalonados**
   - useCartStore tiene estructura pero falta algoritmo
   - Necesita implementar `calculateDiscounts()` según docs/VARIANT-SYSTEM-DETAILED.md

3. ⚠️ **Checkout no existe**
   - Necesita form con validación (react-hook-form + zod)
   - Integración WhatsApp (generar mensaje + abrir URL)

### Media Prioridad:
4. ⚠️ Detalle de producto completo
5. ⚠️ Panel admin (wizard para variantes)
6. ⚠️ Gestión de órdenes (cambiar estado)

---

## 📖 GUÍAS RÁPIDAS

### Cómo crear un Producto con Variantes (Backend)

```typescript
// 1. Crear ProductParent
POST /api/products/parents
{
  name: "Bebida Cola",
  description: "...",
  hasVariants: true,
  variantAttributes: [
    { name: "tamaño", values: [{ value: "350ml" }, { value: "500ml" }] },
    { name: "sabor", values: [{ value: "Original" }, { value: "Zero" }] }
  ],
  tieredDiscounts: [{
    attribute: "tamaño",
    attributeValue: "350ml",
    tiers: [{ minQuantity: 6, value: 10, type: 'percentage' }]
  }]
}

// 2. Crear Variantes (4 combinaciones)
POST /api/products/variants (×4)
{
  parentProduct: "parent_id",
  attributes: { tamaño: "350ml", sabor: "Original" },
  sku: "COLA-350-ORIG",
  price: 500,
  stock: 100,
  images: [...]
}
```

### Cómo calcular Descuentos en el Frontend

```typescript
// En useCartStore
import { discountService } from '@/lib/discountService';

const calculateTotals = (items: CartItem[]) => {
  // 1. Agrupar por parent + atributo
  const groups = groupByAttribute(items);

  // 2. Para cada grupo, buscar tier aplicable
  groups.forEach(group => {
    const totalQty = sum(group.items.map(i => i.quantity));
    const discount = group.parent.tieredDiscounts?.find(
      d => d.attribute === group.attribute && d.attributeValue === group.value
    );

    const tier = discount?.tiers.find(
      t => totalQty >= t.minQuantity && (!t.maxQuantity || totalQty <= t.maxQuantity)
    );

    if (tier) {
      group.items.forEach(item => {
        item.appliedDiscount = (item.variant.price * tier.value) / 100;
        item.finalPrice = item.variant.price - item.appliedDiscount;
      });
    }
  });

  return {
    subtotal: sum(items.map(i => i.variant.price * i.quantity)),
    totalDiscount: sum(items.map(i => (i.appliedDiscount || 0) * i.quantity)),
    total: subtotal - totalDiscount
  };
};
```

### Cómo mostrar Badge de Descuento

```tsx
// En ProductCard o Detalle
{product.tieredDiscounts?.map(discount => {
  const minTier = discount.tiers[0];
  const discountedPrice = variant.price - (variant.price * minTier.value / 100);

  return (
    <Badge className="bg-accent">
      Desde {minTier.minQuantity} un ${discountedPrice.toLocaleString()} c/u
    </Badge>
  );
})}
```

---

## 🎯 PRÓXIMOS PASOS SUGERIDOS

### Opción A: Completar Funcionalidad Cliente (Recomendado)
1. ✅ Fetch variantes en ProductCard
2. ✅ Implementar detalle de producto
3. ✅ Carrito con descuentos escalonados
4. ✅ Checkout + WhatsApp
5. ✅ Testing completo flujo de compra

### Opción B: Panel Admin
1. ✅ Login admin
2. ✅ Dashboard con métricas
3. ✅ Wizard para crear productos con variantes
4. ✅ Configurar descuentos escalonados (UI compleja)
5. ✅ Gestión de órdenes

---

## 📚 DOCUMENTACIÓN CLAVE

**Lectura obligatoria antes de modificar:**
- `docs/VARIANT-SYSTEM-DETAILED.md` - Sistema de variantes completo
- `docs/BUSINESS-LOGIC.md` - Reglas de negocio (roles, stock, órdenes)
- `UI-UX-PREMIUM.md` - Especificación de diseño
- `frontend/CRITERIOS-ACEPTACION-UIUX.md` - Criterios de aceptación por componente

**Archivos de referencia:**
- `RESUMEN-BACKEND.md` - Estado backend 100%
- `MVP-SCOPE.md` - Alcance del MVP
- `backend/src/services/discountService.ts` - Implementación de descuentos

---

## 💬 FILOSOFÍA DEL PROYECTO

### Principios clave:
1. **Mobile-first es SAGRADO** - Todas las decisiones priorizan mobile
2. **Admin super-guiado** - Un empleado nuevo debe poder usarlo sin capacitación
3. **Descuentos sin compra mínima** - El cliente puede comprar 1 unidad, los descuentos son un beneficio opcional
4. **WhatsApp como canal principal** - El checkout termina en WhatsApp, no en pasarela de pago
5. **Transparencia total en precios** - Mostrar siempre precio original + descuento aplicado

### Decisiones técnicas:
- **ProductParent/Variant** en vez de producto simple con SKUs - Mayor flexibilidad
- **Descuentos escalonados por atributo** en vez de cupones - Más intuitivo para el cliente
- **Stock automático** (hooks de Mongoose) - Evita inconsistencias
- **Categorías múltiples planas** en vez de jerárquicas - Más flexible

---

## 🚨 IMPORTANTE: Qué NO hacer

❌ **NO cambiar la arquitectura ProductParent/Variant** - Todo el sistema depende de esto
❌ **NO modificar el algoritmo de descuentos** sin entender completamente `discountService.ts`
❌ **NO usar productos simples** - Migrar a ProductParent + 1 variante
❌ **NO hacer descuentos acumulativos** - Solo el mejor descuento aplica
❌ **NO descartar mobile-first** - Es la prioridad #1

---

## 📧 CONTACTO Y CONTEXTO

**Usuario:** Desarrollando para confitería familiar (hermano)
**Objetivo:** MVP funcional en 3-4 semanas
**Prioridad:** Experiencia mobile impecable
**Despliegue:** VPS con Nginx + PM2 (futuro)

**Git:**
- Rama actual: `claude/development-phase-check-011CV2iZTnQmPKpEKbEUHjzt`
- Main branch: (sin definir aún)
- Commits: Push a rama de desarrollo cuando se complete funcionalidad

---

**Última actualización:** 2025-01-12
**Estado:** En desarrollo activo - Frontend 70%
**Próxima tarea:** Integrar fetch de variantes en ProductCard

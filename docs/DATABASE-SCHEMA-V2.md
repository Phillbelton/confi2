# ESQUEMAS DE BASE DE DATOS V2.0

Especificación completa de todos los modelos de MongoDB con el sistema de variantes.

**Fecha:** 2025-01-03
**Versión:** 2.0
**Estado:** Aprobado

---

## MODELOS PRINCIPALES

### 1. User

```typescript
{
  _id: ObjectId
  name: string                     // Nombre completo
  email: string                    // Único, índice
  password: string                 // Hasheado (bcrypt), select: false
  role: 'cliente' | 'funcionario' | 'admin'
  phone?: string                   // Teléfono (opcional)
  address?: {
    street?: string
    number?: string
    city?: string
    postalCode?: string
  }
  active: boolean                  // Default: true, para bloquear usuarios
  createdAt: Date
  updatedAt: Date
}

// Índices
{
  email: 1 (unique)
  role: 1
  active: 1
  createdAt: -1
}
```

---

### 2. ProductParent

**Nuevo modelo que reemplaza Product para productos con variantes**

```typescript
{
  _id: ObjectId
  name: string                     // "Bebida Cola"
  slug: string                     // "bebida-cola" (único, auto-generado)
  description: string              // Descripción completa (HTML)

  categories: ObjectId[]           // Array de categorías (ref Category)
  brand: ObjectId                  // Ref Brand (opcional)

  // Sistema de variantes
  variantAttributes: [
    {
      name: string                 // "tamaño" (interno, lowercase, sin espacios)
      displayName: string          // "Tamaño" (para UI)
      order: number                // Orden de aparición en selectores
      values: [
        {
          value: string            // "350ml" (interno)
          displayValue: string     // "350ml" (para UI)
          order: number            // Orden en dropdown
        }
      ]
    }
  ]

  // Descuentos escalonados por atributo
  tieredDiscounts: [
    {
      attribute: string            // "tamaño"
      attributeValue: string       // "350ml"
      tiers: [
        {
          minQuantity: number      // 6
          maxQuantity: number      // 11 (null = infinito)
          type: 'percentage' | 'amount'
          value: number            // 10 (10% o $10)
        }
      ]
      startDate: Date              // Opcional
      endDate: Date                // Opcional
      badge: string                // "Oferta Mayorista" (opcional)
      active: boolean              // Default: true
    }
  ]

  // Metadata
  featured: boolean                // Default: false
  active: boolean                  // Default: true
  views: number                    // Contador de vistas (opcional)

  createdAt: Date
  updatedAt: Date
}

// Índices
{
  slug: 1 (unique)
  categories: 1, active: 1
  brand: 1, active: 1
  featured: 1, active: 1
  name: "text", description: "text"  // Full-text search
  createdAt: -1
}

// Virtuals
hasVariants: boolean  // true si variantAttributes.length > 0
```

---

### 3. ProductVariant

**Nuevo modelo - variantes individuales que se venden**

```typescript
{
  _id: ObjectId
  parentProduct: ObjectId          // Ref ProductParent (requerido)
  sku: string                      // "COLA-350-ORIG" (único, auto-generado o manual)

  // Combinación de atributos de esta variante
  attributes: {
    [key: string]: string          // Ej: { tamaño: "350ml", sabor: "original" }
  }

  // Nombre y slug generados automáticamente
  name: string                     // "Bebida Cola 350ml Original"
  slug: string                     // "bebida-cola-350ml-original" (único)

  // Datos comerciales
  price: number                    // Precio de esta variante
  stock: number                    // Stock disponible
  images: string[]                 // URLs de imágenes (máx 5)

  // Control de stock
  trackStock: boolean              // Default: true
  allowBackorder: boolean          // Default: true (permite stock negativo)
  lowStockThreshold: number        // Default: 5

  // Descuento fijo individual (sobreescribe descuento escalonado)
  fixedDiscount?: {
    enabled: boolean
    type: 'percentage' | 'amount'
    value: number
    startDate?: Date
    endDate?: Date
    badge?: string                 // "15% OFF"
  }

  // Metadata
  active: boolean                  // Default: true (permite desactivar variante específica)
  order: number                    // Orden de aparición (opcional)
  views: number                    // Contador de vistas (opcional)

  createdAt: Date
  updatedAt: Date
}

// Índices
{
  sku: 1 (unique)
  slug: 1 (unique)
  parentProduct: 1, active: 1
  price: 1
  stock: 1
  "attributes.tamaño": 1           // Índice por cada atributo común
  "attributes.sabor": 1
  createdAt: -1
}

// Virtuals
inStock: boolean                   // stock > 0 && active
lowStock: boolean                  // stock <= lowStockThreshold && stock > 0
hasActiveDiscount: boolean         // Calcula si tiene descuento activo
```

---

### 4. Category

**Simplificado - sin subcategorías (todas flat)**

```typescript
{
  _id: ObjectId
  name: string                     // "Bebidas"
  slug: string                     // "bebidas" (único)
  description?: string             // Descripción (opcional)
  image?: string                   // URL imagen representativa (opcional)
  color?: string                   // Hex color para badges (ej: "#F97316")
  order: number                    // Orden alfabético o manual (default: 0)
  active: boolean                  // Default: true

  createdAt: Date
  updatedAt: Date
}

// Índices
{
  slug: 1 (unique)
  active: 1
  order: 1
  name: 1
}

// Virtuals (mediante queries)
productCount: number               // Cantidad de productos en esta categoría
```

**Nota:** Se eliminó el campo `parent`. Todas las categorías son del mismo nivel.

---

### 5. Brand

```typescript
{
  _id: ObjectId
  name: string                     // "Coca Cola"
  slug: string                     // "coca-cola" (único)
  logo?: string                    // URL del logo (opcional)
  description?: string             // Descripción de la marca (opcional)
  active: boolean                  // Default: true

  createdAt: Date
  updatedAt: Date
}

// Índices
{
  slug: 1 (unique)
  active: 1
  name: 1
}

// Virtuals
productCount: number               // Cantidad de productos de esta marca
```

---

### 6. Order

```typescript
{
  _id: ObjectId
  orderNumber: string              // "QUE-20250103-001" (único, auto-generado)

  // Información del cliente
  customer: {
    user?: ObjectId                // Ref User (si está autenticado)
    name: string
    email: string
    phone: string                  // WhatsApp
    address: {
      street: string
      number: string
      city: string
      postalCode: string
    }
  }

  // Items de la orden
  items: [
    {
      variant: ObjectId            // Ref ProductVariant
      variantSnapshot: {           // Snapshot de datos al momento de compra
        sku: string
        name: string
        price: number
        attributes: Object         // { tamaño: "350ml", sabor: "original" }
        image: string              // Primera imagen
      }
      quantity: number
      pricePerUnit: number         // Precio unitario al momento de compra
      discount: number             // Descuento aplicado por unidad
      subtotal: number             // (pricePerUnit - discount) * quantity
    }
  ]

  // Montos
  subtotal: number                 // Suma de (price * quantity) sin descuentos
  totalDiscount: number            // Suma de todos los descuentos
  shippingCost: number             // Costo de envío
  total: number                    // subtotal - totalDiscount + shippingCost

  // Método de entrega y pago
  deliveryMethod: 'pickup' | 'delivery'
  paymentMethod: 'cash' | 'transfer'
  paymentProof?: string            // URL comprobante (si es transferencia)

  // Estados
  status: 'pending_whatsapp' | 'confirmed' | 'preparing' | 'shipped' | 'completed' | 'cancelled'

  // WhatsApp tracking
  whatsappSent: boolean            // Default: false
  whatsappSentAt?: Date
  whatsappMessageId?: string       // ID del mensaje (si API lo provee)

  // Notas
  customerNotes?: string           // Notas del cliente
  adminNotes?: string              // Notas internas del admin/funcionario

  // Cancelación
  cancelledBy?: ObjectId           // User que canceló (si aplica)
  cancelledAt?: Date
  cancellationReason?: string

  // Timestamps
  createdAt: Date
  updatedAt: Date
  confirmedAt?: Date               // Cuando cambió a confirmed
  completedAt?: Date               // Cuando cambió a completed
}

// Índices
{
  orderNumber: 1 (unique)
  "customer.email": 1
  "customer.user": 1
  status: 1, createdAt: -1
  createdAt: -1
}

// Métodos estáticos
getStats(startDate, endDate)       // Estadísticas de órdenes
getByStatus(status)                // Órdenes por estado
```

---

### 7. StockMovement

**Nuevo modelo - historial de cambios de stock**

```typescript
{
  _id: ObjectId
  variant: ObjectId                // Ref ProductVariant

  // Información del movimiento
  type: 'sale' | 'cancellation' | 'adjustment' | 'return' | 'restock'
  quantity: number                 // Positivo = incremento, Negativo = decremento
  previousStock: number            // Stock antes del cambio
  newStock: number                 // Stock después del cambio

  // Referencias
  order?: ObjectId                 // Ref Order (si el movimiento viene de una orden)
  user?: ObjectId                  // Ref User (quien hizo el cambio, si aplica)

  // Detalles
  reason: string                   // Motivo del cambio
  notes?: string                   // Notas adicionales

  createdAt: Date
}

// Índices
{
  variant: 1, createdAt: -1
  order: 1
  type: 1
  createdAt: -1
}
```

---

### 8. Wishlist (Fase 2)

```typescript
{
  _id: ObjectId
  user: ObjectId                   // Ref User
  variants: [
    {
      variant: ObjectId            // Ref ProductVariant
      addedAt: Date
    }
  ]

  createdAt: Date
  updatedAt: Date
}

// Índices
{
  user: 1 (unique)
  "variants.variant": 1
}
```

---

### 9. Review (Fase 2)

```typescript
{
  _id: ObjectId
  parentProduct: ObjectId          // Ref ProductParent
  variant?: ObjectId               // Ref ProductVariant (opcional, si review es de variante específica)
  user: ObjectId                   // Ref User

  // Review
  comment: string                  // Comentario de texto
  helpful: number                  // Contador de "útiles" (default: 0)

  // Moderación
  status: 'pending' | 'approved' | 'rejected'
  moderatedBy?: ObjectId           // Ref User (admin que moderó)
  moderatedAt?: Date

  // Metadata
  verified: boolean                // true si compró el producto

  createdAt: Date
  updatedAt: Date
}

// Índices
{
  parentProduct: 1, status: 1, createdAt: -1
  user: 1
  status: 1
}
```

---

### 10. Notification (Fase 2 - MVP sin notificaciones en tiempo real)

```typescript
{
  _id: ObjectId
  user: ObjectId                   // Ref User (funcionario o admin)

  type: 'new_order' | 'low_stock' | 'order_status_change' | 'system'
  title: string                    // "Nueva orden recibida"
  message: string                  // Contenido de la notificación

  // Datos relacionados
  relatedOrder?: ObjectId          // Ref Order
  relatedVariant?: ObjectId        // Ref ProductVariant

  // Estado
  read: boolean                    // Default: false
  readAt?: Date

  createdAt: Date
}

// Índices
{
  user: 1, read: 1, createdAt: -1
  type: 1
  relatedOrder: 1
}
```

---

### 11. AuditLog

```typescript
{
  _id: ObjectId
  user: ObjectId                   // Ref User que realizó la acción

  action: 'create' | 'update' | 'delete' | 'cancel' | 'block'
  entity: 'product' | 'variant' | 'order' | 'user' | 'category' | 'brand'
  entityId: ObjectId               // ID de la entidad afectada

  // Cambios
  changes: {
    before: Object                 // Estado previo (JSON)
    after: Object                  // Estado nuevo (JSON)
  }

  // Metadata
  ipAddress: string
  userAgent: string

  createdAt: Date
}

// Índices
{
  user: 1, createdAt: -1
  entity: 1, entityId: 1
  action: 1
  createdAt: -1
}
```

---

## RELACIONES ENTRE MODELOS

```
User (1) ──────────────┬──> (N) Order
                       │
                       ├──> (N) Review
                       │
                       └──> (1) Wishlist

ProductParent (1) ─────┬──> (N) ProductVariant
                       │
                       ├──> (N) Review
                       │
Category (N) <─────────┤
                       │
Brand (1) <────────────┘

ProductVariant (1) ────┬──> (N) OrderItem (dentro de Order)
                       │
                       ├──> (N) StockMovement
                       │
                       └──> (N) WishlistItem (dentro de Wishlist)

Order (1) ─────────────┬──> (N) OrderItem
                       │
                       └──> (N) StockMovement
```

---

## VALIDACIONES A NIVEL DE ESQUEMA

### ProductParent
- `name`: requerido, 3-200 caracteres
- `slug`: único, auto-generado
- `description`: requerido, 10-5000 caracteres
- `categories`: array no vacío
- `variantAttributes`: si existe, cada atributo debe tener al menos 2 valores

### ProductVariant
- `sku`: único, requerido
- `slug`: único, auto-generado
- `price`: >= 0
- `stock`: >= 0 (puede ser negativo si allowBackorder = true)
- `images`: array de 1-5 elementos
- `attributes`: debe corresponder con variantAttributes del padre

### Order
- `orderNumber`: único, auto-generado
- `customer.email`: formato válido
- `customer.phone`: formato válido
- `items`: array no vacío
- `total`: >= 0

### StockMovement
- `variant`: requerido
- `quantity`: != 0
- `previousStock`: requerido
- `newStock`: requerido

---

## TRIGGERS Y HOOKS

### ProductVariant - Pre-save
```javascript
- Generar `name` si no existe (combina nombre padre + atributos)
- Generar `slug` único
- Validar que `attributes` correspondan con `variantAttributes` del padre
```

### Order - Pre-save
```javascript
- Generar `orderNumber` único si es nuevo
- Validar stock de variantes antes de crear
- Si isNew, descontar stock de variantes
- Si status cambia a 'cancelled', devolver stock
- Actualizar timestamps según estado (confirmedAt, completedAt, cancelledAt)
```

### Order - Post-save (cancelled)
```javascript
- Crear StockMovement por cada item (type: 'cancellation', quantity: positivo)
```

### Order - Post-save (new)
```javascript
- Crear StockMovement por cada item (type: 'sale', quantity: negativo)
```

---

## MIGRACIONES NECESARIAS

### De Product a ProductParent + ProductVariant

```javascript
// Productos simples sin variantes
for (const oldProduct of oldProducts) {
  // 1. Crear ProductParent
  const parent = await ProductParent.create({
    name: oldProduct.name,
    slug: oldProduct.slug,
    description: oldProduct.description,
    categories: [oldProduct.category], // Convertir a array
    brand: oldProduct.brand,
    variantAttributes: [],              // Sin variantes
    tieredDiscounts: [],
    featured: oldProduct.featured,
    active: oldProduct.active
  });

  // 2. Crear ProductVariant única
  await ProductVariant.create({
    parentProduct: parent._id,
    sku: oldProduct.sku || generateSku(oldProduct.name),
    attributes: {},
    name: oldProduct.name,
    slug: oldProduct.slug + '-default',
    price: oldProduct.price,
    stock: oldProduct.stock,
    images: oldProduct.images,
    trackStock: true,
    allowBackorder: true,
    active: oldProduct.active
  });
}
```

### De Category con parent a Category flat

```javascript
// Eliminar campo parent
db.categories.updateMany({}, { $unset: { parent: "" } });

// Las subcategorías se convierten en categorías regulares
// Opcionalmente, renombrar para mantener jerarquía:
// "Chocolates > Artesanales" → "Chocolates Artesanales"
```

---

## ÍNDICES COMPUESTOS ADICIONALES

```javascript
// Para queries frecuentes
db.productVariants.createIndex({ parentProduct: 1, active: 1, stock: 1 });
db.productVariants.createIndex({ price: 1, active: 1 });
db.orders.createIndex({ status: 1, createdAt: -1 });
db.orders.createIndex({ "customer.user": 1, status: 1 });
db.stockMovements.createIndex({ variant: 1, type: 1, createdAt: -1 });
```

---

**Esquemas completos y listos para implementación.**

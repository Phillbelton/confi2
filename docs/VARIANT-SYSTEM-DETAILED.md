# SISTEMA DE VARIANTES - Diseño Técnico Detallado

Especificación técnica completa del sistema de variantes de productos.

**Fecha:** 2025-01-03
**Versión:** 1.0

---

## 1. ARQUITECTURA DEL SISTEMA

### 1.1 Modelos de Base de Datos

```typescript
// Producto Padre (no se vende directamente)
ProductParent {
  _id: ObjectId
  name: string                    // "Bebida Cola"
  slug: string                    // "bebida-cola" (único)
  description: string             // Descripción común
  categories: ObjectId[]          // Múltiples categorías
  brand: ObjectId                 // Marca

  // Definición de atributos que generan variantes
  variantAttributes: [
    {
      name: string                // "tamaño" (interno, lowercase)
      displayName: string         // "Tamaño" (para mostrar)
      order: number               // Orden en UI (1, 2, 3...)
      values: [
        {
          value: string           // "350ml" (interno)
          displayValue: string    // "350ml" (para mostrar)
          order: number           // Orden en selector
        }
      ]
    }
  ]

  // Descuentos escalonados por atributo
  tieredDiscounts: [
    {
      attribute: string           // "tamaño"
      attributeValue: string      // "350ml"
      tiers: [
        {
          minQuantity: number     // 6
          maxQuantity: number     // 11 (null = infinito)
          type: 'percentage' | 'amount'
          value: number           // 10
        }
      ]
      startDate: Date             // Opcional
      endDate: Date               // Opcional
      badge: string               // "Oferta Mayorista 350ml"
    }
  ]

  active: boolean
  createdAt: Date
  updatedAt: Date
}

// Variante (se vende)
ProductVariant {
  _id: ObjectId
  parentProduct: ObjectId         // Referencia al padre
  sku: string                     // "COLA-350ML-ORIGINAL" (único)

  // Combinación específica de atributos
  attributes: {
    tamaño: "350ml",
    sabor: "original"
  }

  // Nombre generado automáticamente
  name: string                    // "Bebida Cola 350ml Original"
  slug: string                    // "bebida-cola-350ml-original"

  // Datos específicos de esta variante
  price: number
  stock: number
  images: string[]                // Hasta 5 imágenes

  // Control de stock
  trackStock: boolean             // Default: true
  allowBackorder: boolean         // Default: true
  lowStockThreshold: number       // Default: 5

  // Descuento fijo individual (opcional)
  fixedDiscount: {
    enabled: boolean
    type: 'percentage' | 'amount'
    value: number
    startDate: Date
    endDate: Date
    badge: string                 // "15% OFF"
  }

  active: boolean                 // Se puede desactivar variante específica
  createdAt: Date
  updatedAt: Date
}
```

### 1.2 Relaciones

```
ProductParent (1) ──┬──> (N) ProductVariant
                    │
Category (N) <──────┘
Brand (1) <─────────┘

Order (1) ──> (N) OrderItem ──> (1) ProductVariant
```

---

## 2. FLUJO DE CREACIÓN DE PRODUCTOS CON VARIANTES

### 2.1 Paso a Paso (Admin UI)

#### **Paso 1: Información General**

```
┌────────────────────────────────────────┐
│ CREAR PRODUCTO CON VARIANTES           │
├────────────────────────────────────────┤
│                                        │
│ Nombre del Producto *                 │
│ [Bebida Cola___________________]      │
│                                        │
│ Descripción *                         │
│ [Textarea con editor rico]            │
│                                        │
│ Categorías * (múltiples)              │
│ ☑ Bebidas                             │
│ ☑ Gaseosas                            │
│ ☐ Sin TACC                            │
│ ☐ Productos Artesanales               │
│                                        │
│ Marca *                               │
│ [Coca Cola ▼]                         │
│                                        │
│ [Siguiente: Definir Variantes]        │
└────────────────────────────────────────┘
```

#### **Paso 2: Definir Atributos de Variación**

```
┌────────────────────────────────────────┐
│ DEFINIR ATRIBUTOS DE VARIACIÓN         │
├────────────────────────────────────────┤
│                                        │
│ ┌────────────────────────────────────┐│
│ │ Atributo 1                         ││
│ │                                    ││
│ │ Nombre: [tamaño_________]         ││
│ │ Mostrar como: [Tamaño____]        ││
│ │                                    ││
│ │ Valores:                           ││
│ │  1. [350ml____] [Eliminar]        ││
│ │  2. [500ml____] [Eliminar]        ││
│ │  3. [1L_______] [Eliminar]        ││
│ │  [+ Agregar valor]                 ││
│ │                                    ││
│ │ [Eliminar atributo]                ││
│ └────────────────────────────────────┘│
│                                        │
│ ┌────────────────────────────────────┐│
│ │ Atributo 2                         ││
│ │                                    ││
│ │ Nombre: [sabor__________]         ││
│ │ Mostrar como: [Sabor_____]        ││
│ │                                    ││
│ │ Valores:                           ││
│ │  1. [original__] [Eliminar]       ││
│ │  2. [zero______] [Eliminar]       ││
│ │  3. [light_____] [Eliminar]       ││
│ │  [+ Agregar valor]                 ││
│ │                                    ││
│ │ [Eliminar atributo]                ││
│ └────────────────────────────────────┘│
│                                        │
│ [+ Agregar otro atributo]             │
│                                        │
│ Variantes que se generarán: 9         │
│ (3 tamaños × 3 sabores)               │
│                                        │
│ [Volver] [Generar Variantes]          │
└────────────────────────────────────────┘
```

#### **Paso 3: Configurar Variantes**

Sistema genera tabla con todas las combinaciones:

```
┌──────────────────────────────────────────────────────────────────────────┐
│ CONFIGURAR VARIANTES (9 generadas)                                       │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│ Filtros: [Todos ▼] [Buscar SKU/nombre________________] [🔍]            │
│                                                                          │
│ ┌────────────────────────────────────────────────────────────────────┐ │
│ │ SKU            │Tamaño│Sabor   │Precio │Stock│Imágenes│Activo    │ │
│ ├────────────────┼──────┼────────┼───────┼─────┼────────┼──────────┤ │
│ │ COLA-350-ORIG  │350ml │Original│[500_] │[100]│[📷 0/5]│☑ Activo │ │
│ │ COLA-350-ZERO  │350ml │Zero    │[550_] │[80_]│[📷 0/5]│☑ Activo │ │
│ │ COLA-350-LIGHT │350ml │Light   │[520_] │[60_]│[📷 0/5]│☑ Activo │ │
│ │ COLA-500-ORIG  │500ml │Original│[700_] │[50_]│[📷 0/5]│☑ Activo │ │
│ │ COLA-500-ZERO  │500ml │Zero    │[750_] │[40_]│[📷 0/5]│☑ Activo │ │
│ │ COLA-500-LIGHT │500ml │Light   │[720_] │[30_]│[📷 0/5]│☑ Activo │ │
│ │ COLA-1L-ORIG   │1L    │Original│[1200] │[20_]│[📷 0/5]│☑ Activo │ │
│ │ COLA-1L-ZERO   │1L    │Zero    │[1300] │[15_]│[📷 0/5]│☑ Activo │ │
│ │ COLA-1L-LIGHT  │1L    │Light   │[1250] │[10_]│[📷 0/5]│☑ Activo │ │
│ └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│ [Edición rápida]:                                                       │
│ • Click en precio/stock para editar inline                              │
│ • Click en Imágenes para abrir modal de upload                         │
│ • Click en Activo para toggle on/off                                   │
│                                                                          │
│ [Volver] [Siguiente: Configurar Descuentos]                            │
└──────────────────────────────────────────────────────────────────────────┘
```

#### **Paso 4: Configurar Descuentos Escalonados (Opcional)**

```
┌──────────────────────────────────────────────────────────────────┐
│ CONFIGURAR DESCUENTOS ESCALONADOS                                 │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│ ¿Aplicar descuentos mayoristas?                                 │
│ ● Sí, configurar descuentos  ○ No, omitir                       │
│                                                                  │
│ ═══════════════════════════════════════════════════════════════ │
│                                                                  │
│ Descuento #1                                              [🗑️]  │
│ ┌────────────────────────────────────────────────────────────┐ │
│ │ Aplicar a variantes con:                                   │ │
│ │   Atributo: [tamaño ▼]                                     │ │
│ │   Valor: [350ml ▼]                                         │ │
│ │                                                            │ │
│ │ Tiers de descuento:                                        │ │
│ │   ┌──────────────────────────────────────────────┐        │ │
│ │   │ Tier 1:                             [🗑️]    │        │ │
│ │   │ Desde [6_] hasta [11_] unidades             │        │ │
│ │   │ Descuento: [10_]% ○ Monto fijo             │        │ │
│ │   └──────────────────────────────────────────────┘        │ │
│ │   ┌──────────────────────────────────────────────┐        │ │
│ │   │ Tier 2:                             [🗑️]    │        │ │
│ │   │ Desde [12_] hasta [23_] unidades            │        │ │
│ │   │ Descuento: [15_]% ○ Monto fijo             │        │ │
│ │   └──────────────────────────────────────────────┘        │ │
│ │   ┌──────────────────────────────────────────────┐        │ │
│ │   │ Tier 3:                             [🗑️]    │        │ │
│ │   │ Desde [24_] hasta [∞] (sin límite)          │        │ │
│ │   │ Descuento: [20_]% ○ Monto fijo             │        │ │
│ │   └──────────────────────────────────────────────┘        │ │
│ │   [+ Agregar tier]                                         │ │
│ │                                                            │ │
│ │ Vigencia (opcional):                                       │ │
│ │   Desde: [01/01/2025_] Hasta: [31/12/2025_]              │ │
│ │                                                            │ │
│ │ Badge a mostrar: [Oferta 350ml___________]                │ │
│ └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ [+ Agregar otro descuento para otro atributo]                   │
│                                                                  │
│ ─────────────────────────────────────────────────────────────   │
│                                                                  │
│ Descuento #2                                              [🗑️]  │
│ ┌────────────────────────────────────────────────────────────┐ │
│ │ Aplicar a variantes con:                                   │ │
│ │   Atributo: [tamaño ▼]                                     │ │
│ │   Valor: [500ml ▼]                                         │ │
│ │                                                            │ │
│ │ [Configuración similar...]                                 │ │
│ └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ [Volver] [Guardar Producto]                                     │
└──────────────────────────────────────────────────────────────────┘
```

### 2.2 Validaciones del Sistema

**Al crear producto padre:**
- ✅ Nombre requerido (mín 3 caracteres)
- ✅ Descripción requerida (mín 10 caracteres)
- ✅ Al menos 1 categoría seleccionada
- ✅ Marca seleccionada

**Al definir atributos:**
- ✅ Al menos 1 atributo definido
- ✅ Cada atributo con al menos 2 valores
- ✅ Nombres de atributos únicos (no duplicados)
- ✅ Valores de atributos únicos dentro del mismo atributo

**Al configurar variantes:**
- ✅ Precio > 0 para todas las variantes activas
- ✅ Stock >= 0 para todas las variantes activas
- ✅ Al menos 1 variante activa
- ✅ SKU único en todo el sistema

**Al configurar descuentos escalonados:**
- ✅ minQuantity >= 1
- ✅ maxQuantity > minQuantity (o null)
- ✅ Sin solapamiento de rangos en tiers
- ✅ Valor de descuento > 0
- ✅ Si tipo = percentage, valor <= 100

---

## 3. LÓGICA DE CÁLCULO DE DESCUENTOS

### 3.1 Algoritmo Completo

```typescript
// Función principal
calculateDiscountsForCart(cartItems: CartItem[]): DiscountResult {

  // 1. Agrupar items por producto padre y atributo clave
  const groups = groupByParentAndAttribute(cartItems);

  // 2. Para cada grupo, calcular descuento escalonado
  for (const group of groups) {
    const totalQuantity = group.items.reduce((sum, item) => sum + item.quantity, 0);

    // Buscar descuento escalonado aplicable
    const tieredDiscount = findApplicableTieredDiscount(
      group.parentProduct,
      group.attribute,
      group.attributeValue,
      totalQuantity
    );

    if (tieredDiscount) {
      // Aplicar descuento a todos los items del grupo
      for (const item of group.items) {
        item.tieredDiscount = calculateDiscount(
          item.variant.price,
          tieredDiscount.type,
          tieredDiscount.value
        );
      }
    }
  }

  // 3. Para cada item, verificar descuento fijo individual
  for (const item of cartItems) {
    const fixedDiscount = item.variant.fixedDiscount;

    if (fixedDiscount && fixedDiscount.enabled && isDiscountActive(fixedDiscount)) {
      item.fixedDiscount = calculateDiscount(
        item.variant.price,
        fixedDiscount.type,
        fixedDiscount.value
      );
    }
  }

  // 4. Para cada item, aplicar el mejor descuento
  for (const item of cartItems) {
    const bestDiscount = Math.max(
      item.tieredDiscount || 0,
      item.fixedDiscount || 0
    );

    item.appliedDiscount = bestDiscount;
    item.finalPrice = Math.max(0, item.variant.price - bestDiscount);
  }

  // 5. Calcular totales
  const subtotal = cartItems.reduce((sum, item) =>
    sum + (item.variant.price * item.quantity), 0
  );

  const totalDiscount = cartItems.reduce((sum, item) =>
    sum + (item.appliedDiscount * item.quantity), 0
  );

  const total = subtotal - totalDiscount;

  return {
    items: cartItems,
    subtotal,
    totalDiscount,
    total
  };
}

// Función auxiliar: agrupar por atributo
groupByParentAndAttribute(items: CartItem[]): Group[] {
  const groups: Map<string, Group> = new Map();

  for (const item of items) {
    const parent = item.variant.parentProduct;

    // Para cada descuento escalonado del padre
    for (const tieredDiscount of parent.tieredDiscounts) {
      const attrValue = item.variant.attributes[tieredDiscount.attribute];

      if (attrValue === tieredDiscount.attributeValue) {
        const key = `${parent._id}-${tieredDiscount.attribute}-${attrValue}`;

        if (!groups.has(key)) {
          groups.set(key, {
            parentProduct: parent,
            attribute: tieredDiscount.attribute,
            attributeValue: attrValue,
            items: []
          });
        }

        groups.get(key)!.items.push(item);
      }
    }
  }

  return Array.from(groups.values());
}

// Función auxiliar: buscar tier aplicable
findApplicableTieredDiscount(
  parent: ProductParent,
  attribute: string,
  attributeValue: string,
  quantity: number
): Tier | null {

  const discountConfig = parent.tieredDiscounts.find(
    d => d.attribute === attribute && d.attributeValue === attributeValue
  );

  if (!discountConfig) return null;

  // Verificar vigencia
  if (!isDiscountActive(discountConfig)) return null;

  // Buscar tier aplicable
  const applicableTier = discountConfig.tiers.find(tier => {
    const meetsMin = quantity >= tier.minQuantity;
    const meetsMax = tier.maxQuantity === null || quantity <= tier.maxQuantity;
    return meetsMin && meetsMax;
  });

  return applicableTier || null;
}

// Función auxiliar: calcular descuento
calculateDiscount(price: number, type: string, value: number): number {
  if (type === 'percentage') {
    return (price * value) / 100;
  } else {
    return Math.min(value, price); // No puede ser mayor que el precio
  }
}

// Función auxiliar: verificar vigencia
isDiscountActive(discount: Discount): boolean {
  const now = new Date();

  if (discount.startDate && now < discount.startDate) return false;
  if (discount.endDate && now > discount.endDate) return false;

  return true;
}
```

### 3.2 Ejemplo Práctico

**Carrito del cliente:**
```
Item 1: Cola 350ml Original × 3 → $500/u
Item 2: Cola 350ml Zero × 3 → $550/u
Item 3: Cola 500ml Original × 2 → $700/u
```

**Descuentos configurados:**
```
Descuento A:
  Atributo: tamaño = "350ml"
  Tier 1: 6-11 unidades → 10%

Descuento B:
  Atributo: tamaño = "500ml"
  Tier 1: 6-11 unidades → 8%
```

**Cálculo:**

1. **Agrupar por atributo:**
   - Grupo 350ml: Item 1 (3×) + Item 2 (3×) = 6 unidades
   - Grupo 500ml: Item 3 (2×) = 2 unidades

2. **Verificar descuentos escalonados:**
   - Grupo 350ml: 6 unidades → Cumple Tier 1 (6-11) → 10% descuento
   - Grupo 500ml: 2 unidades → NO cumple Tier 1 (necesita 6) → Sin descuento

3. **Aplicar descuentos:**
   - Item 1: $500 - 10% = $450/u × 3 = $1350
   - Item 2: $550 - 10% = $495/u × 3 = $1485
   - Item 3: $700 (sin descuento) × 2 = $1400

4. **Totales:**
   - Subtotal: ($500×3) + ($550×3) + ($700×2) = $4550
   - Descuento: ($50×3) + ($55×3) + ($0×2) = $315
   - Total: $4235

---

## 4. GESTIÓN DE IMÁGENES POR VARIANTE

### 4.1 Características

- **Máximo:** 5 imágenes por variante
- **Formatos:** JPG, PNG, WebP
- **Tamaño máximo:** 3MB por imagen
- **Procesamiento:** Resize automático a múltiples tamaños
  - Thumbnail: 150×150px
  - Card: 400×400px
  - Detail: 800×800px
  - Zoom: Original (max 2000×2000px)

### 4.2 Flujo de Upload

```
1. Admin selecciona variante
2. Click en "Subir imágenes"
3. Modal de upload con drag & drop
4. Selecciona hasta 5 imágenes
5. Preview de imágenes
6. Editor básico (recortar, rotar, brillo, contraste)
7. Guardar
8. Backend procesa imágenes (Sharp):
   - Valida formato y tamaño
   - Genera 4 versiones (thumbnail, card, detail, zoom)
   - Guarda en /uploads/products/variants/{variantId}/
   - Actualiza array de images en DB
```

### 4.3 URLs de Imágenes

**Estructura:**
```
/uploads/products/variants/{variantId}/{size}/{filename}

Ejemplo:
/uploads/products/variants/507f1f77bcf86cd799439011/thumbnail/image-1.jpg
/uploads/products/variants/507f1f77bcf86cd799439011/card/image-1.jpg
/uploads/products/variants/507f1f77bcf86cd799439011/detail/image-1.jpg
/uploads/products/variants/507f1f77bcf86cd799439011/zoom/image-1.jpg
```

---

## 5. BÚSQUEDA Y FILTRADO CON VARIANTES

### 5.1 Búsqueda por Texto

**Busca en:**
- Nombre del producto padre
- Descripción del producto padre
- Nombre generado de variante
- SKU de variante

**Retorna:**
- Producto padre con variantes que coinciden
- Ordena por relevancia

### 5.2 Filtros

**Filtros disponibles:**
- Por categorías (múltiples)
- Por marca
- Por rango de precio (usa precio mínimo de variantes)
- Por atributos de variante (ej: solo 350ml, solo sabor Zero)
- Por disponibilidad (en stock)
- Por descuento (con oferta activa)

**Ejemplo de filtro por atributo:**
```
Cliente selecciona: Tamaño = 350ml

Sistema filtra:
  - Solo productos padre que tengan al menos 1 variante con tamaño=350ml
  - Al mostrar producto, destacar variantes con ese atributo
```

### 5.3 Ordenamiento

**Opciones:**
- Más recientes (por createdAt del padre)
- Precio: menor a mayor (usa precio mínimo de variantes)
- Precio: mayor a menor (usa precio máximo de variantes)
- Más vendidos (por cantidad de órdenes)
- Alfabético (A-Z)

---

## 6. CONSIDERACIONES DE PERFORMANCE

### 6.1 Índices de MongoDB

```javascript
// ProductParent
db.productParents.createIndex({ slug: 1 }, { unique: true });
db.productParents.createIndex({ categories: 1, active: 1 });
db.productParents.createIndex({ brand: 1, active: 1 });
db.productParents.createIndex({ name: "text", description: "text" });
db.productParents.createIndex({ createdAt: -1 });

// ProductVariant
db.productVariants.createIndex({ sku: 1 }, { unique: true });
db.productVariants.createIndex({ parentProduct: 1, active: 1 });
db.productVariants.createIndex({ price: 1 });
db.productVariants.createIndex({ stock: 1 });
db.productVariants.createIndex({ "attributes.tamaño": 1 });
db.productVariants.createIndex({ "attributes.sabor": 1 });
```

### 6.2 Queries Optimizadas

**Listar productos con variantes:**
```javascript
// Usar aggregation pipeline
db.productParents.aggregate([
  { $match: { active: true, categories: categoryId } },
  {
    $lookup: {
      from: "productVariants",
      localField: "_id",
      foreignField: "parentProduct",
      as: "variants",
      pipeline: [
        { $match: { active: true } },
        { $sort: { price: 1 } },
        { $limit: 10 } // Solo primeras 10 variantes por padre
      ]
    }
  },
  { $match: { "variants.0": { $exists: true } } }, // Solo padres con variantes activas
  { $skip: skip },
  { $limit: limit }
]);
```

### 6.3 Caché

**En Frontend:**
- Cache de React Query para listados de productos
- TTL: 5 minutos
- Invalidar al agregar al carrito

**En Backend:**
- Cache de cálculo de descuentos en Redis (Fase 2)
- Cache de queries frecuentes (listado homepage)

---

## 7. MIGRACIONES Y COMPATIBILIDAD

### 7.1 Migración de Productos Simples a Variantes

**Productos sin variantes:**
- Siguen funcionando como antes
- Se modelan como ProductParent sin variantAttributes
- Se crea 1 sola variante automáticamente

**Script de migración:**
```javascript
// Migrar productos simples existentes
for (const product of existingProducts) {
  // Crear padre
  const parent = await ProductParent.create({
    name: product.name,
    slug: product.slug,
    description: product.description,
    categories: product.categories,
    brand: product.brand,
    variantAttributes: [], // Sin atributos
    tieredDiscounts: [],
    active: product.active
  });

  // Crear variante única
  await ProductVariant.create({
    parentProduct: parent._id,
    sku: product.sku || generateSku(product.name),
    attributes: {}, // Sin atributos
    name: product.name,
    slug: product.slug,
    price: product.price,
    stock: product.stock,
    images: product.images,
    trackStock: true,
    allowBackorder: true,
    active: product.active
  });
}
```

---

**Documento técnico completo. Listo para implementación.**

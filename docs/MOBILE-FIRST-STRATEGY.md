# ESTRATEGIA MOBILE-FIRST

Especificación completa para desarrollo mobile-first con excelente experiencia en todas las pantallas.

**Fecha:** 2025-01-03
**Versión:** 1.0
**Prioridad:** CRÍTICA

---

## 1. FILOSOFÍA MOBILE-FIRST

### 1.1 Principio Fundamental

**Diseñar primero para móvil, luego escalar a desktop.**

**Razón:**
- 70-80% del tráfico ecommerce es mobile
- Más fácil escalar de mobile a desktop que al revés
- Obliga a priorizar contenido esencial
- Touch-first interactions

### 1.2 Breakpoints de Tailwind CSS

```css
/* Mobile First (default - sin prefijo) */
/* 0px - 639px */
.text-sm { }

/* sm: Tablets pequeños */
@media (min-width: 640px) {
  .sm:text-base { }
}

/* md: Tablets */
@media (min-width: 768px) {
  .md:text-lg { }
}

/* lg: Desktop pequeño */
@media (min-width: 1024px) {
  .lg:text-xl { }
}

/* xl: Desktop grande */
@media (min-width: 1280px) {
  .xl:text-2xl { }
}

/* 2xl: Desktop muy grande */
@media (min-width: 1536px) {
  .2xl:text-3xl { }
}
```

**Uso correcto:**
```tsx
// ✅ CORRECTO: Mobile first, luego escalar
<div className="p-4 md:p-6 lg:p-8">
  <h1 className="text-2xl md:text-3xl lg:text-4xl">
    Título
  </h1>
</div>

// ❌ INCORRECTO: Desktop first
<div className="lg:p-8 md:p-6 p-4">
  ...
</div>
```

---

## 2. COMPONENTES CRÍTICOS MOBILE-FIRST

### 2.1 Navegación (Header)

**Mobile (< 768px):**
```
┌─────────────────────────────┐
│ [☰] LOGO    [🔍] [🛒(3)]   │
└─────────────────────────────┘
```

**Features mobile:**
- Hamburger menu (Sheet desde izquierda)
- Logo centrado o a la izquierda
- Iconos grandes (mín 44×44px touch target)
- Carrito con badge flotante
- Búsqueda: icon → expande a full-width input

**Desktop (>= 768px):**
```
┌──────────────────────────────────────────────┐
│ LOGO  Inicio Productos Ofertas  [🔍___] [🛒] │
└──────────────────────────────────────────────┘
```

**Código ejemplo:**
```tsx
// Header.tsx
<header className="sticky top-0 z-50 bg-white shadow-md">
  <div className="container mx-auto px-4">
    {/* Mobile */}
    <div className="flex items-center justify-between py-3 md:hidden">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon">
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left">
          <MobileNav />
        </SheetContent>
      </Sheet>

      <Logo className="h-8" />

      <div className="flex gap-2">
        <SearchButton />
        <CartButton />
      </div>
    </div>

    {/* Desktop */}
    <div className="hidden md:flex items-center justify-between py-4">
      <Logo className="h-10" />
      <DesktopNav />
      <div className="flex gap-4 items-center">
        <SearchBar />
        <CartButton />
        <UserMenu />
      </div>
    </div>
  </div>
</header>
```

---

### 2.2 Catálogo de Productos

**Mobile:**
- 1 columna (o 2 en landscape)
- Cards más grandes
- Imágenes cuadradas 1:1
- Información esencial visible
- Scroll infinito preferible a paginación

**Tablet:**
- 2-3 columnas
- Cards medianas

**Desktop:**
- 3-4 columnas
- Hover states
- Información adicional visible

**Grid responsivo:**
```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
  {products.map(product => (
    <ProductCard key={product.id} product={product} />
  ))}
</div>
```

**ProductCard móvil-optimizado:**
```tsx
<Card className="overflow-hidden">
  {/* Imagen grande en mobile */}
  <AspectRatio ratio={1}>
    <Image
      src={product.image}
      alt={product.name}
      fill
      className="object-cover"
    />
    {/* Badge de descuento - esquina superior derecha */}
    {product.hasDiscount && (
      <Badge className="absolute top-2 right-2">
        {product.discountBadge}
      </Badge>
    )}
  </AspectRatio>

  <CardContent className="p-3 md:p-4">
    {/* Nombre - 2 líneas máx en mobile */}
    <h3 className="text-sm md:text-base font-semibold line-clamp-2 mb-2">
      {product.name}
    </h3>

    {/* Precio grande y visible */}
    <div className="mb-3">
      {product.hasDiscount && (
        <span className="text-xs md:text-sm text-gray-500 line-through mr-2">
          ${product.originalPrice}
        </span>
      )}
      <span className="text-lg md:text-xl font-bold text-primary">
        ${product.price}
      </span>
    </div>

    {/* Botón full-width en mobile */}
    <Button className="w-full" size="sm">
      <ShoppingCart className="h-4 w-4 mr-2" />
      Agregar
    </Button>
  </CardContent>
</Card>
```

---

### 2.3 Detalle de Producto

**Mobile - Layout vertical:**
```
┌─────────────────────────┐
│  [Galería Imágenes]     │ ← Swipe horizontal
│  ● ○ ○ ○               │ ← Dots indicator
├─────────────────────────┤
│  Nombre del Producto    │
│  $500  $450             │
│                         │
│  Tamaño: ●350ml ○500ml  │ ← Radio buttons grandes
│  Sabor:  ●Original ○Zero│
│                         │
│  [- 1 +]               │ ← Selector cantidad grande
│  Stock: 10 disponibles  │
│                         │
│  [Agregar al Carrito]   │ ← Botón sticky bottom
│                         │
│  [Tabs: Descripción]    │
│  [Info detallada...]    │
└─────────────────────────┘
```

**Desktop - Layout horizontal:**
```
┌────────────────────────────────────────┐
│  [Galería]     │ Nombre Producto       │
│                │ $500 $450             │
│  [Preview]     │                       │
│  [Thumbnails]  │ Tamaño: ●350ml ○500ml │
│                │ Sabor: ●Orig ○Zero    │
│                │                       │
│                │ [- 1 +] [Agregar]    │
│                │                       │
│                │ [Tabs con más info]   │
└────────────────────────────────────────┘
```

**Código ejemplo:**
```tsx
<div className="container mx-auto px-4 py-6">
  {/* Layout responsivo */}
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12">

    {/* Galería */}
    <div>
      <ProductGallery
        images={variant.images}
        className="mb-4"
      />
    </div>

    {/* Info y acciones */}
    <div>
      <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4">
        {product.name}
      </h1>

      {/* Precio */}
      <div className="mb-6">
        {hasDiscount && (
          <span className="text-xl text-gray-500 line-through mr-3">
            ${variant.originalPrice}
          </span>
        )}
        <span className="text-3xl md:text-4xl font-bold text-primary">
          ${variant.price}
        </span>
      </div>

      {/* Selectores de variantes */}
      <div className="space-y-4 mb-6">
        {product.variantAttributes.map(attr => (
          <VariantSelector
            key={attr.name}
            attribute={attr}
            selected={selectedAttrs[attr.name]}
            onChange={(value) => handleAttrChange(attr.name, value)}
          />
        ))}
      </div>

      {/* Cantidad - mobile: más grande */}
      <div className="flex items-center gap-4 mb-6">
        <span className="text-sm font-medium">Cantidad:</span>
        <QuantitySelector
          value={quantity}
          onChange={setQuantity}
          max={variant.stock}
          className="flex-1 md:flex-initial"
        />
      </div>

      {/* Botón agregar - sticky en mobile */}
      <Button
        size="lg"
        className="w-full sticky bottom-4 z-10 md:static"
        onClick={handleAddToCart}
      >
        <ShoppingCart className="mr-2" />
        Agregar al Carrito
      </Button>

      {/* Info adicional */}
      <Tabs defaultValue="description" className="mt-8">
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="description">Descripción</TabsTrigger>
          <TabsTrigger value="discounts">Descuentos</TabsTrigger>
        </TabsList>
        <TabsContent value="description">
          {product.description}
        </TabsContent>
        <TabsContent value="discounts">
          <DiscountTable />
        </TabsContent>
      </Tabs>
    </div>
  </div>
</div>
```

---

### 2.4 Carrito de Compras

**Mobile - Sheet desde abajo:**
```
┌─────────────────────────┐
│ Tu Carrito (3)      [×] │
├─────────────────────────┤
│ [Img] Producto 1        │
│       350ml × Original  │
│       [- 2 +]    $1000  │
│                         │
│ [Img] Producto 2        │
│       ...               │
├─────────────────────────┤
│ Subtotal:        $3000  │
│ Descuento:        -$300 │
│ Total:           $2700  │
│                         │
│ [Proceder al Checkout]  │
└─────────────────────────┘
```

**Desktop - Sheet desde derecha:**
```
                    ┌──────────────────┐
                    │ Carrito (3)  [×] │
                    ├──────────────────┤
                    │ [Items...]       │
                    │                  │
                    │ Total: $2700     │
                    │ [Checkout]       │
                    └──────────────────┘
```

**Código:**
```tsx
<Sheet>
  <SheetTrigger asChild>
    <Button variant="outline" size="icon" className="relative">
      <ShoppingCart className="h-5 w-5" />
      {itemCount > 0 && (
        <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center">
          {itemCount}
        </Badge>
      )}
    </Button>
  </SheetTrigger>

  {/* Mobile: desde abajo, Desktop: desde derecha */}
  <SheetContent
    side={isMobile ? "bottom" : "right"}
    className={cn(
      "flex flex-col",
      isMobile ? "h-[90vh] rounded-t-xl" : "w-full sm:max-w-lg"
    )}
  >
    <SheetHeader>
      <SheetTitle>Tu Carrito ({itemCount})</SheetTitle>
    </SheetHeader>

    <ScrollArea className="flex-1 -mx-6 px-6">
      {items.map(item => (
        <CartItem key={item.id} item={item} />
      ))}
    </ScrollArea>

    <div className="border-t pt-4 space-y-2">
      <div className="flex justify-between text-sm">
        <span>Subtotal</span>
        <span>${subtotal}</span>
      </div>
      <div className="flex justify-between text-sm text-green-600">
        <span>Descuento</span>
        <span>-${discount}</span>
      </div>
      <div className="flex justify-between text-lg font-bold">
        <span>Total</span>
        <span>${total}</span>
      </div>

      <Button size="lg" className="w-full" asChild>
        <Link href="/checkout">
          Proceder al Checkout
        </Link>
      </Button>
    </div>
  </SheetContent>
</Sheet>
```

---

### 2.5 Filtros de Productos

**Mobile - Sheet desde abajo:**
```
[Botón flotante: "Filtros (3)"]

Al hacer click:
┌─────────────────────────┐
│ Filtros          [×]    │
├─────────────────────────┤
│ Categorías              │
│ ☑ Bebidas               │
│ ☐ Golosinas             │
│                         │
│ Precio                  │
│ [500] ──●──── [2000]    │
│                         │
│ Tamaño                  │
│ ☑ 350ml                 │
│ ☐ 500ml                 │
├─────────────────────────┤
│ [Limpiar] [Aplicar (3)] │
└─────────────────────────┘
```

**Desktop - Sidebar:**
```
┌─────────────┬──────────────┐
│ Filtros     │  [Grid]      │
│             │              │
│ Categorías  │  Productos   │
│ ☑ Bebidas   │              │
│             │              │
│ Precio      │              │
│ [──●────]   │              │
└─────────────┴──────────────┘
```

---

## 3. INTERACCIONES TOUCH-OPTIMIZADAS

### 3.1 Tamaños Mínimos (Touch Targets)

**Regla WCAG 2.1:**
- Mínimo: 44×44px (iOS)
- Recomendado: 48×48px (Android/Material)

```tsx
// ✅ CORRECTO
<Button size="lg">        // 48×48px mínimo
  Agregar
</Button>

<Button size="icon">      // 44×44px mínimo
  <Heart />
</Button>

// ❌ INCORRECTO
<button className="p-1">  // Muy pequeño para touch
  <X className="h-3 w-3" />
</button>
```

### 3.2 Spacing Adecuado

```tsx
// Espaciado entre elementos táctiles
<div className="flex gap-3 md:gap-2">
  <Button>Cancelar</Button>
  <Button>Aceptar</Button>
</div>
```

### 3.3 Gestos Touch

**Swipe:**
- Galería de imágenes
- Carrusel de productos
- Navegación entre tabs

**Librerías:**
```tsx
// Para swipes y gestures
import { useSwipeable } from 'react-swipeable';

// Para carruseles
import useEmblaCarousel from 'embla-carousel-react';
```

**Pull-to-refresh:** (Opcional)
```tsx
import PullToRefresh from 'react-simple-pull-to-refresh';
```

---

## 4. PERFORMANCE MOBILE

### 4.1 Imágenes Optimizadas

```tsx
import Image from 'next/image';

// ✅ CORRECTO: next/image con sizes
<Image
  src={product.image}
  alt={product.name}
  width={400}
  height={400}
  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
  priority={isAboveFold}
/>
```

**Tamaños sugeridos:**
- Mobile: 400×400px
- Tablet: 600×600px
- Desktop: 800×800px
- Zoom: 1200×1200px

### 4.2 Lazy Loading

```tsx
// Lazy load componentes pesados
const AdminPanel = dynamic(() => import('@/components/AdminPanel'), {
  loading: () => <Skeleton />,
  ssr: false
});

// Lazy load imágenes below the fold
<Image
  src={image}
  alt={alt}
  loading="lazy"
/>
```

### 4.3 Código Splitting

```tsx
// Separar código por rutas
// Next.js lo hace automáticamente por página

// Para componentes grandes
const HeavyComponent = dynamic(() => import('./HeavyComponent'));
```

---

## 5. FORMULARIOS MOBILE-FRIENDLY

### 5.1 Inputs Optimizados

```tsx
// Input types correctos para teclado móvil
<Input
  type="email"          // Muestra @ en teclado
  inputMode="email"
/>

<Input
  type="tel"            // Teclado numérico
  inputMode="tel"
/>

<Input
  type="number"         // Teclado numérico
  inputMode="numeric"
/>

<Input
  type="text"
  autoComplete="name"   // Autocompletado
/>
```

### 5.2 Labels y Validación

```tsx
// Labels grandes y visibles
<Label className="text-base md:text-sm">
  Nombre completo
</Label>
<Input
  className="h-12 md:h-10 text-base"  // Input más alto en mobile
/>

// Errores visibles
{error && (
  <p className="text-sm text-destructive mt-2">
    {error.message}
  </p>
)}
```

### 5.3 Checkout Mobile

**Pasos más simples en mobile:**
```tsx
// Mobile: 1 campo por pantalla (wizard)
// Desktop: Varios campos por step

const isMobile = useMediaQuery('(max-width: 768px)');

{isMobile ? (
  <MobileCheckoutWizard />  // Paso a paso
) : (
  <DesktopCheckoutForm />   // Todo visible
)}
```

---

## 6. TESTING RESPONSIVE

### 6.1 Breakpoints a Testear

**Obligatorio:**
- ✅ Mobile: 375×667 (iPhone SE)
- ✅ Mobile: 390×844 (iPhone 14)
- ✅ Mobile: 360×800 (Android común)
- ✅ Tablet: 768×1024 (iPad)
- ✅ Desktop: 1920×1080 (común)

**Adicional:**
- 320×568 (iPhone 5 - mínimo)
- 428×926 (iPhone 14 Pro Max)
- 1366×768 (laptop pequeña)
- 2560×1440 (desktop grande)

### 6.2 Herramientas

```bash
# Chrome DevTools
- Cmd/Ctrl + Shift + M (toggle device toolbar)
- Probar diferentes dispositivos
- Throttling de red (3G/4G)

# Lighthouse
- Auditoría de performance mobile
- Accessibility checks
```

### 6.3 Tests Reales

**Imprescindible:**
- Testear en dispositivo real (al menos 1 Android + 1 iOS)
- Usar BrowserStack o similar para múltiples devices
- Probar en red lenta (3G simulado)

---

## 7. COMPONENTES SHADCN/UI MOBILE-READY

### 7.1 Componentes que funcionan bien en mobile

✅ **Sheet:** Perfecto para menús, carrito, filtros
✅ **Dialog:** Responsive automáticamente
✅ **Drawer:** Específico para mobile
✅ **Command:** Search con atajos de teclado
✅ **Popover:** Se adapta al viewport
✅ **Toast:** Notificaciones mobile-friendly
✅ **Accordion:** Ahorra espacio en mobile
✅ **Tabs:** Navegación simple

### 7.2 Componentes a ajustar

⚠️ **Table:** Usar scroll horizontal o cards en mobile
⚠️ **Dropdown:** Asegurar touch targets grandes
⚠️ **Tooltip:** No funcionan bien en touch, usar Popover

**Tabla responsive:**
```tsx
// Mobile: Cards
// Desktop: Table
{isMobile ? (
  <div className="space-y-4">
    {orders.map(order => (
      <Card key={order.id}>
        <CardContent className="p-4">
          <div className="flex justify-between mb-2">
            <span className="font-semibold">{order.number}</span>
            <Badge>{order.status}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {order.date}
          </p>
          <p className="text-lg font-bold mt-2">
            ${order.total}
          </p>
        </CardContent>
      </Card>
    ))}
  </div>
) : (
  <Table>
    {/* Tabla tradicional */}
  </Table>
)}
```

---

## 8. CHECKLIST MOBILE-FIRST

### Pre-development
- [ ] Diseñar wireframes mobile primero
- [ ] Definir breakpoints críticos
- [ ] Planificar touch interactions

### Durante desarrollo
- [ ] Escribir CSS mobile-first (sin prefijo primero)
- [ ] Touch targets mínimo 44×44px
- [ ] Spacing adecuado entre elementos táctiles
- [ ] Inputs con type/inputMode correcto
- [ ] Imágenes con next/image y sizes
- [ ] Componentes lazy-loaded
- [ ] Testing en DevTools mobile

### Pre-deploy
- [ ] Lighthouse score mobile > 90
- [ ] Testear en dispositivo real
- [ ] Testear en red lenta (3G)
- [ ] Verificar todos los breakpoints
- [ ] Touch gestures funcionando
- [ ] Scroll suave y sin lag
- [ ] Formularios fáciles de usar

---

## 9. CONFIGURACIÓN TAILWIND MOBILE-FIRST

```js
// tailwind.config.ts
export default {
  theme: {
    extend: {
      // Espaciado consistente
      spacing: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
      },
      // Alturas de touch targets
      height: {
        'touch': '44px',
        'touch-lg': '48px',
      },
      minHeight: {
        'touch': '44px',
      },
      // Fuentes legibles en mobile
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1.5' }],
        'sm': ['0.875rem', { lineHeight: '1.5' }],
        'base': ['1rem', { lineHeight: '1.6' }],
        'lg': ['1.125rem', { lineHeight: '1.6' }],
      },
    },
  },
  plugins: [
    // Plugin para container queries (útil para componentes)
    require('@tailwindcss/container-queries'),
  ],
}
```

---

**ESTRATEGIA MOBILE-FIRST COMPLETA Y LISTA PARA IMPLEMENTACIÓN.**

**PRIORIDAD MÁXIMA EN TODO EL DESARROLLO.**

# UI/UX PREMIUM - CONFITERÍA QUELITA

## 🎨 FILOSOFÍA DE DISEÑO

### Principios Clave
1. **Clean & Modern** - Diseño minimalista pero sofisticado
2. **Fast & Responsive** - Transiciones suaves, sin lag
3. **Touch-Optimized** - Pensado mobile-first
4. **Micro-interactions** - Feedback visual en cada acción
5. **Accesibilidad** - WCAG 2.1 AA compliant

---

## 📦 COMPONENTES PREMIUM CON SHADCN/UI

### ¿Por qué shadcn/ui?

**Ventajas sobre otras librerías:**
- ✅ **No es una dependencia NPM** - Los componentes se copian a tu proyecto (full control)
- ✅ **Basado en Radix UI** - Primitivos accesibles por defecto (keyboard nav, ARIA, focus management)
- ✅ **Totalmente customizable** - Son tuyos, los modificas como quieras
- ✅ **Tailwind nativo** - Integración perfecta, no CSS-in-JS
- ✅ **TypeScript first** - Type-safety completo
- ✅ **Actualizado constantemente** - Comunidad activa, muchos ejemplos

**Comparación:**
```
Material UI:     ❌ Pesado, difícil de customizar, estilos forzados
Chakra UI:       ⚠️  Bueno pero CSS-in-JS (performance hit)
Ant Design:      ❌ Look corporativo, no moderno
Mantine:         ⚠️  Similar a shadcn pero menos flexible
shadcn/ui:       ✅ Ligero, moderno, 100% customizable
```

---

## 🎯 COMPONENTES A USAR

### 1. Componentes de Navegación

#### Header/Navbar
```tsx
- Sheet (mobile menu slide-in)
- NavigationMenu (desktop mega-menu)
- Command (⌘K search bar)
- Avatar (usuario logueado)
- Badge (notificaciones, carrito count)
```

**Features:**
- Sticky header con blur effect al scroll
- Search bar con atajos de teclado (Cmd/Ctrl + K)
- Carrito floating badge con animación
- Mobile menu con sheet slide-in suave

#### Breadcrumbs
```tsx
- Breadcrumb component
- Con iconos y separadores custom
```

### 2. Componentes de Catálogo

#### ProductCard
```tsx
- Card (estructura base)
- AspectRatio (imágenes consistentes 1:1 o 4:3)
- Badge (descuentos, nuevo, agotado)
- Button (agregar al carrito)
- Tooltip (info rápida al hover)
- Heart icon animado (favoritos - fase 2)
```

**Efectos:**
- Hover: scale(1.02) + shadow-lg
- Imagen: zoom in al hover
- Badge de descuento: animación pulse
- Botón "Agregar": loading spinner + success checkmark

#### Filtros
```tsx
- Accordion (filtros colapsables)
- Slider (rango de precio)
- Checkbox (categorías, marcas)
- RadioGroup (ordenamiento)
- Separator (divisores visuales)
```

**Features:**
- Accordion con iconos animados
- Slider con preview de precios en tiempo real
- Checkbox con indeterminate state
- Mobile: filtros en Sheet slide-up

#### Paginación
```tsx
- Pagination component
- Con números + previous/next
```

### 3. Componentes de Producto (Detalle)

#### Galería de Imágenes
```tsx
- Carousel (embla-carousel-react)
- Dialog (modal fullscreen)
- AspectRatio
```

**Features:**
- Thumbnails clickeables
- Click en imagen → fullscreen modal
- Swipe en mobile
- Zoom on hover (desktop)
- Lazy loading de imágenes

#### Selector de Cantidad
```tsx
- Input (número)
- Button (+ y -)
```

**Features:**
- Botones grandes touch-friendly
- Validación en tiempo real (max = stock)
- Animación al cambiar cantidad

#### Información
```tsx
- Tabs (descripción, especificaciones)
- Accordion (detalles expandibles)
- Alert (stock bajo, agotado)
```

### 4. Carrito de Compras

```tsx
- Sheet (drawer lateral)
- ScrollArea (lista de productos scrolleable)
- Separator (divisor entre items)
- Button (checkout, seguir comprando)
- Badge (cantidad de items)
```

**Features:**
- Slide-in desde la derecha
- Animación al agregar producto (shake + pulse)
- Auto-scroll al nuevo item
- Empty state con ilustración
- Subtotal actualizado en tiempo real
- Botón de eliminar con confirmación (AlertDialog)

### 5. Checkout

#### Form Steps
```tsx
- Tabs o Steps (visual progress)
- Form (react-hook-form)
- Input, Select, Textarea
- Label con asterisco en requeridos
- FormMessage (errores)
```

**Features:**
- Validación en tiempo real
- Errores inline con animación shake
- Progress bar arriba
- BotonesNext/Previous con loading states
- Auto-save en localStorage

#### Resumen de Orden
```tsx
- Card (resumen)
- Separator
- ScrollArea (lista de productos)
- Badge (descuentos)
```

**Effects:**
- Sticky sidebar (desktop)
- Animación al aplicar descuento
- Total con número animado (counting up)

### 6. Admin Panel

#### Dashboard
```tsx
- Card (métricas)
- Chart (recharts - gráficos)
- Table (órdenes recientes)
- Badge (estados)
```

#### Data Tables
```tsx
- Table (tanstack/react-table)
- Input (search)
- Select (filtros)
- DropdownMenu (acciones)
- Dialog (crear/editar)
```

**Features:**
- Sorting en columnas
- Búsqueda en tiempo real
- Paginación
- Selección múltiple (checkbox)
- Acciones bulk
- Filtros avanzados

#### Forms (Productos, Categorías, etc.)
```tsx
- Form (react-hook-form + zod)
- Input, Textarea, Select
- Switch (activo/inactivo)
- RadioGroup (tipo de descuento)
- Combobox (selector con search)
- Calendar + Popover (fechas)
- FileUpload custom (drag & drop)
```

**Features:**
- Drag & drop para imágenes
- Preview de imágenes
- Reordenar imágenes (drag)
- Validación estricta
- Auto-save draft (opcional)
- Confirmar antes de salir si hay cambios

#### Gestión de Descuentos Escalonados
```tsx
- Card (cada tier)
- Button (agregar/eliminar tier)
- Input (rangos, valores)
- Alert (errores de solapamiento)
```

**Features:**
- Agregar tier con animación fade-in
- Eliminar tier con confirmación
- Validación de rangos en tiempo real
- Preview del descuento aplicado

---

## 🎨 PALETA DE COLORES SUGERIDA

### Opción 1: Cálida (Confitería clásica)
```css
:root {
  /* Brand */
  --primary: 25 95% 53%;        /* Naranja cálido #F97316 */
  --primary-foreground: 0 0% 98%; /* Blanco */

  /* Accents */
  --secondary: 340 82% 52%;     /* Rosa/fucsia #E11D48 */
  --accent: 45 93% 58%;         /* Amarillo dorado #FBBF24 */

  /* Neutrales */
  --background: 0 0% 100%;      /* Blanco puro */
  --foreground: 222 47% 11%;    /* Casi negro */
  --muted: 210 40% 96%;         /* Gris muy claro */
  --border: 214 32% 91%;        /* Gris borde */

  /* Estados */
  --success: 142 76% 36%;       /* Verde */
  --warning: 38 92% 50%;        /* Naranja advertencia */
  --error: 0 84% 60%;           /* Rojo */
}
```

### Opción 2: Moderna (Premium & Minimalista)
```css
:root {
  /* Brand */
  --primary: 262 83% 58%;       /* Violeta/púrpura #8B5CF6 */
  --primary-foreground: 0 0% 98%;

  /* Accents */
  --secondary: 221 83% 53%;     /* Azul eléctrico */
  --accent: 158 64% 52%;        /* Turquesa/verde agua */

  /* Neutrales */
  --background: 0 0% 100%;
  --foreground: 224 71% 4%;
  --muted: 220 14% 96%;
  --border: 220 13% 91%;
}
```

### Opción 3: Elegante (Dark mode ready)
```css
:root {
  /* Brand */
  --primary: 217 91% 60%;       /* Azul royal #3B82F6 */
  --primary-foreground: 0 0% 98%;

  /* Accents */
  --secondary: 280 80% 60%;     /* Morado */
  --accent: 142 71% 45%;        /* Verde esmeralda */

  /* Neutrales Light */
  --background: 0 0% 100%;
  --foreground: 222 47% 11%;
}

.dark {
  /* Neutrales Dark */
  --background: 222 47% 11%;
  --foreground: 213 31% 91%;
  --muted: 223 47% 16%;
  --border: 216 34% 17%;
}
```

**Recomendación:** Opción 1 (cálida) es más apropiada para una confitería, genera sensación de dulzura y calidez.

---

## ✨ MICROINTERACCIONES Y ANIMACIONES

### Transitions Globales
```css
* {
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}
```

### Animaciones Específicas

#### 1. Agregar al Carrito
```tsx
1. Click botón "Agregar"
2. Botón → loading spinner (500ms)
3. Producto → animación flyToCart (imagen vuela al ícono carrito)
4. Carrito badge → pulse + incremento número
5. Botón → checkmark verde (800ms)
6. Toast notification → slide-in desde arriba
```

**Implementación:** Framer Motion + Auto Animate

#### 2. Hover en ProductCard
```tsx
- Card: scale(1.02) + shadow-2xl
- Imagen: scale(1.1) (dentro del contenedor)
- Badge descuento: pulse animation
- Botón: slide-up desde abajo
- Duration: 200ms ease-out
```

#### 3. Page Transitions
```tsx
- Fade in/out entre páginas
- Slide al navegar productos (prev/next)
- Scale + fade en modals/dialogs
```

#### 4. Loading States
```tsx
- Skeleton screens (no spinners aburridos)
- Shimmer effect en placeholders
- Progress bar en top de página (como YouTube)
```

#### 5. Scroll Animations
```tsx
- Fade in al entrar al viewport
- Stagger children (items aparecen uno por uno)
- Parallax sutil en hero section
```

**Librería:** Framer Motion `useInView` hook

#### 6. Formularios
```tsx
- Input focus: border glow + scale(1.01)
- Error: shake animation
- Success: checkmark green fade-in
- Submit: button loading → success → redirect
```

#### 7. Números Animados
```tsx
- Total del carrito: counting up animation
- Descuento aplicado: slide + color change
- Stock restante: decrease with easing
```

**Librería:** `react-countup` o custom hook

---

## 📱 RESPONSIVE DESIGN

### Breakpoints (Tailwind)
```js
sm: '640px',   // Mobile landscape
md: '768px',   // Tablet
lg: '1024px',  // Desktop
xl: '1280px',  // Large desktop
2xl: '1536px'  // Extra large
```

### Estrategia Mobile-First
```tsx
// Default: mobile
<div className="p-4 md:p-6 lg:p-8">

// Grids
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

// Tipografía
<h1 className="text-2xl md:text-3xl lg:text-4xl">
```

### Componentes Adaptativos

#### Navigation
- Mobile: Hamburger → Sheet
- Desktop: Horizontal menu

#### Filtros
- Mobile: Floating button → Sheet from bottom
- Desktop: Sidebar sticky

#### Product Grid
- Mobile: 1 columna
- Tablet: 2 columnas
- Desktop: 3-4 columnas

#### Carrito
- Mobile: Sheet full height from bottom
- Desktop: Sheet from right (400px width)

---

## 🎭 ESTADOS ESPECIALES

### Empty States
```tsx
- Carrito vacío: Ilustración + CTA "Ver productos"
- Sin resultados búsqueda: Ilustración + sugerencias
- Sin órdenes: Ilustración + "Haz tu primera compra"
```

**Ilustraciones:** undraw.co o ilustraciones custom

### Loading States
```tsx
- Productos: Skeleton cards (grid completo)
- Imágenes: Blur placeholder → fade in real image
- Forms: Disabled state + spinner en botón
- Page: Top loading bar (nprogress)
```

### Error States
```tsx
- 404: Página custom con ilustración
- 500: Error graceful con botón "Reintentar"
- Network error: Toast + banner offline
- Form errors: Inline con iconos
```

### Success States
```tsx
- Pedido enviado: Confetti animation + checkmark gigante
- Producto agregado: Toast + badge pulse
- Formulario guardado: Checkmark green + auto-hide
```

---

## 🔧 CONFIGURACIÓN DE SHADCN/UI

### Instalación
```bash
npx shadcn-ui@latest init
```

### Configuración Recomendada
```
✔ Which style would you like to use? › Default
✔ Which color would you like to use as base color? › Orange (o custom)
✔ Would you like to use CSS variables for colors? › yes (recomendado)
✔ Where is your global CSS file? › src/app/globals.css
✔ Would you like to use React Server Components? › yes
✔ Write configuration to components.json? › yes
```

### Componentes Iniciales a Instalar
```bash
# Básicos
npx shadcn-ui@latest add button
npx shadcn-ui@latest add input
npx shadcn-ui@latest add card
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add separator

# Navegación
npx shadcn-ui@latest add sheet
npx shadcn-ui@latest add navigation-menu
npx shadcn-ui@latest add breadcrumb

# Forms
npx shadcn-ui@latest add form
npx shadcn-ui@latest add select
npx shadcn-ui@latest add textarea
npx shadcn-ui@latest add checkbox
npx shadcn-ui@latest add radio-group
npx shadcn-ui@latest add switch
npx shadcn-ui@latest add slider
npx shadcn-ui@latest add calendar
npx shadcn-ui@latest add popover

# Feedback
npx shadcn-ui@latest add toast
npx shadcn-ui@latest add alert
npx shadcn-ui@latest add alert-dialog
npx shadcn-ui@latest add dialog

# Data Display
npx shadcn-ui@latest add table
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add accordion
npx shadcn-ui@latest add avatar
npx shadcn-ui@latest add scroll-area
npx shadcn-ui@latest add aspect-ratio

# Utilidades
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add tooltip
npx shadcn-ui@latest add command
npx shadcn-ui@latest add skeleton
```

---

## 🎬 EFECTOS PREMIUM ESPECÍFICOS

### 1. Glassmorphism (cristal esmerilado)
```tsx
<div className="backdrop-blur-md bg-white/80 border border-white/20 shadow-xl">
  {/* Header sticky, modals, cards especiales */}
</div>
```

### 2. Gradient Borders
```tsx
<div className="relative rounded-lg p-[1px] bg-gradient-to-r from-primary to-secondary">
  <div className="bg-background rounded-lg p-4">
    {/* Contenido */}
  </div>
</div>
```

### 3. Shine Effect (tarjetas)
```css
.card-shine {
  position: relative;
  overflow: hidden;
}

.card-shine::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(
    45deg,
    transparent,
    rgba(255, 255, 255, 0.1),
    transparent
  );
  animation: shine 3s infinite;
}

@keyframes shine {
  0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
  100% { transform: translateX(100%) translateY(100%) rotate(45deg); }
}
```

### 4. Floating Elements
```tsx
// Hero section con elementos flotantes
<motion.div
  animate={{
    y: [0, -20, 0],
  }}
  transition={{
    duration: 3,
    repeat: Infinity,
    ease: "easeInOut"
  }}
>
  <CandyIcon />
</motion.div>
```

### 5. Magnetic Cursor (desktop)
```tsx
// Botones que "atraen" el cursor
// Implementar con Framer Motion useMotionValue
```

---

## 📐 TIPOGRAFÍA

### Fuentes Sugeridas

**Opción 1: Moderna & Limpia**
```tsx
import { Inter, Playfair_Display } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })
const playfair = Playfair_Display({ subsets: ['latin'] })

// Headings: Playfair Display (elegante, serif)
// Body: Inter (legible, sans-serif)
```

**Opción 2: Amigable & Redondeada** (mejor para confitería)
```tsx
import { DM_Sans, Comfortaa } from 'next/font/google'

const dmSans = DM_Sans({ subsets: ['latin'] })
const comfortaa = Comfortaa({ subsets: ['latin'] })

// Headings: Comfortaa (redondeada, amigable)
// Body: DM Sans (moderna, legible)
```

**Opción 3: Actual (del proyecto anterior)**
```tsx
import { Baloo_2, Poppins } from 'next/font/google'

// Ya probadas y funcionan bien
```

### Escala Tipográfica
```css
.text-xs:    0.75rem  (12px)
.text-sm:    0.875rem (14px)
.text-base:  1rem     (16px)  ← Body default
.text-lg:    1.125rem (18px)
.text-xl:    1.25rem  (20px)
.text-2xl:   1.5rem   (24px)
.text-3xl:   1.875rem (30px)
.text-4xl:   2.25rem  (36px)  ← H1
.text-5xl:   3rem     (48px)  ← Hero
```

---

## 🎯 PERFORMANCE OPTIMIZATIONS

### 1. Imágenes
```tsx
// Usar next/image con blur placeholder
<Image
  src="/producto.jpg"
  alt="Producto"
  width={400}
  height={400}
  placeholder="blur"
  blurDataURL={product.blurHash}
  className="object-cover"
/>
```

### 2. Code Splitting
```tsx
// Lazy load componentes pesados
const AdminPanel = dynamic(() => import('@/components/AdminPanel'), {
  loading: () => <Skeleton />,
  ssr: false
})
```

### 3. Framer Motion Optimized
```tsx
// Usar layoutId para animaciones compartidas
// Evitar animating width/height (usar scale)
// Usar will-change con cuidado
```

### 4. Fonts Optimization
```tsx
// Preload critical fonts
// Use font-display: swap
// Self-host Google Fonts (Next.js hace esto automático)
```

---

## ✅ CHECKLIST FINAL UI/UX

- [ ] Todas las interacciones tienen feedback visual
- [ ] Loading states en todos los async operations
- [ ] Error states informativos y útiles
- [ ] Empty states con call-to-action
- [ ] Responsive en todos los breakpoints
- [ ] Touch targets mínimo 44x44px (mobile)
- [ ] Contrast ratio WCAG AA compliant
- [ ] Focus visible en keyboard navigation
- [ ] Animaciones respetan prefers-reduced-motion
- [ ] Images con alt text descriptivo
- [ ] Forms con labels y error messages accesibles
- [ ] Page titles únicos y descriptivos
- [ ] Meta descriptions para SEO

---

## 🚀 PRÓXIMO PASO

Una vez confirmado este stack de UI/UX premium, procederemos a:
1. Crear la estructura del proyecto con estas configuraciones
2. Instalar y configurar shadcn/ui
3. Crear sistema de diseño base (colores, tipografía, spacing)
4. Implementar componentes base reutilizables

**¿Aprobamos este stack premium y comenzamos?**

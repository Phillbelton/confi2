# 🎨 Component Library - Confitería Quelita

**Versión:** 1.0.0
**Última actualización:** 3 de Diciembre, 2025
**Stack:** Next.js 16 + React 19 + TypeScript + shadcn/ui + Framer Motion

---

## 📋 Tabla de Contenidos

1. [Introducción](#introducción)
2. [Sistema de Diseño](#sistema-de-diseño)
3. [Componentes UI Base (shadcn/ui)](#componentes-ui-base)
4. [Componentes Premium Custom](#componentes-premium-custom)
5. [Animaciones y Motion Variants](#animaciones-y-motion-variants)
6. [Patrones de Uso](#patrones-de-uso)
7. [Mejores Prácticas](#mejores-prácticas)

---

## 🎯 Introducción

Esta es la biblioteca de componentes de **Confitería Quelita**, un sistema de diseño premium enfocado en crear una experiencia visual memorable para un e-commerce de confitería.

### Filosofía de Diseño

- **Cálido y Acogedor:** Paleta de colores inspirada en dulces (naranja, rosa, dorado)
- **Micro-interacciones:** Cada acción tiene feedback visual sutil
- **Performance First:** Optimizado para Core Web Vitals
- **Accesible:** Componentes con soporte ARIA y keyboard navigation

---

## 🎨 Sistema de Diseño

### Paleta de Colores

```css
/* Brand Colors - Warm palette for confectionery */
--primary: oklch(0.685 0.203 27.33);        /* Orange #F97316 */
--secondary: oklch(0.568 0.232 13.18);      /* Pink/Rose #E11D48 */
--accent: oklch(0.843 0.154 85.87);         /* Golden Yellow #FBBF24 */
--success: oklch(0.587 0.178 155.41);       /* Green #10B981 */
--destructive: oklch(0.577 0.245 27.325);   /* Red */

/* Neutral Colors */
--background: oklch(1 0 0);                 /* White */
--foreground: oklch(0.205 0 0);             /* Near Black */
--muted: oklch(0.97 0 0);                   /* Light Gray */
--border: oklch(0.922 0 0);                 /* Border Gray */
```

**Uso en código:**
```tsx
<div className="bg-primary text-primary-foreground">Orange Button</div>
<div className="bg-secondary text-secondary-foreground">Pink Badge</div>
<div className="bg-accent text-accent-foreground">Golden Tag</div>
```

### Tipografía

```tsx
// Layout.tsx setup
import { Playfair_Display, Inter, Caveat } from 'next/font/google'

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-display',  // Headings elegantes
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',     // Body text moderno
})

const caveat = Caveat({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-handwriting',  // Acentos manuscritos
})
```

**Clases de uso:**
```tsx
<h1 className="font-display">Título Elegante</h1>      // Playfair
<p className="font-sans">Texto de cuerpo</p>           // Inter
<span className="font-handwriting">¡Nuevo!</span>      // Caveat
```

### Espaciado y Border Radius

```css
--radius: 0.5rem;           /* Default 8px */
--radius-sm: 4px;           /* Pequeño */
--radius-md: 6px;           /* Medio */
--radius-lg: 8px;           /* Grande */
--radius-xl: 12px;          /* Extra grande */
```

---

## 📦 Componentes UI Base (shadcn/ui)

Estos son componentes base de **shadcn/ui** que se usan en todo el proyecto:

### Button

**Ubicación:** `components/ui/button.tsx`

```tsx
import { Button } from "@/components/ui/button"

// Variantes disponibles
<Button variant="default">Default</Button>
<Button variant="destructive">Destructive</Button>
<Button variant="outline">Outline</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>

// Tamaños
<Button size="default">Default</Button>
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>
<Button size="icon">Icon</Button>
```

**Props:**
- `variant`: `"default" | "destructive" | "outline" | "secondary" | "ghost" | "link"`
- `size`: `"default" | "sm" | "lg" | "icon"`
- `asChild`: boolean - Para composición con otros componentes

### Card

**Ubicación:** `components/ui/card.tsx`

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"

<Card>
  <CardHeader>
    <CardTitle>Título de la Card</CardTitle>
    <CardDescription>Descripción opcional</CardDescription>
  </CardHeader>
  <CardContent>
    Contenido principal
  </CardContent>
  <CardFooter>
    Acciones o footer
  </CardFooter>
</Card>
```

### Dialog

**Ubicación:** `components/ui/dialog.tsx`

```tsx
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

<Dialog>
  <DialogTrigger asChild>
    <Button>Abrir Dialog</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Título del Modal</DialogTitle>
    </DialogHeader>
    <p>Contenido del modal</p>
  </DialogContent>
</Dialog>
```

### Sheet (Drawer)

**Ubicación:** `components/ui/sheet.tsx`

```tsx
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"

<Sheet>
  <SheetTrigger asChild>
    <Button>Abrir Drawer</Button>
  </SheetTrigger>
  <SheetContent side="right">  {/* left | right | top | bottom */}
    <SheetHeader>
      <SheetTitle>Título</SheetTitle>
    </SheetHeader>
    <div>Contenido del drawer</div>
  </SheetContent>
</Sheet>
```

### Skeleton

**Ubicación:** `components/ui/skeleton.tsx`

```tsx
import { Skeleton } from "@/components/ui/skeleton"

// Loading state básico
<Skeleton className="h-12 w-full" />
<Skeleton className="h-4 w-[250px]" />
<Skeleton className="h-4 w-[200px]" />
```

### Badge

**Ubicación:** `components/ui/badge.tsx`

```tsx
import { Badge } from "@/components/ui/badge"

<Badge>Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="destructive">Destructive</Badge>
<Badge variant="outline">Outline</Badge>
```

### Input

**Ubicación:** `components/ui/input.tsx`

```tsx
import { Input } from "@/components/ui/input"

<Input type="text" placeholder="Ingresa tu nombre" />
<Input type="email" placeholder="email@ejemplo.com" />
<Input type="password" placeholder="Contraseña" />
```

### Select

**Ubicación:** `components/ui/select.tsx`

```tsx
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"

<Select>
  <SelectTrigger className="w-[180px]">
    <SelectValue placeholder="Selecciona opción" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="opcion1">Opción 1</SelectItem>
    <SelectItem value="opcion2">Opción 2</SelectItem>
  </SelectContent>
</Select>
```

### Otros Componentes Base

- **Alert:** `components/ui/alert.tsx` - Mensajes de alerta
- **Avatar:** `components/ui/avatar.tsx` - Imágenes de perfil
- **Checkbox:** `components/ui/checkbox.tsx` - Checkboxes
- **Dropdown Menu:** `components/ui/dropdown-menu.tsx` - Menús desplegables
- **Form:** `components/ui/form.tsx` - Sistema de formularios con react-hook-form
- **Label:** `components/ui/label.tsx` - Labels accesibles
- **Popover:** `components/ui/popover.tsx` - Popovers flotantes
- **Radio Group:** `components/ui/radio-group.tsx` - Botones de radio
- **Separator:** `components/ui/separator.tsx` - Líneas divisoras
- **Slider:** `components/ui/slider.tsx` - Control deslizante
- **Switch:** `components/ui/switch.tsx` - Toggle switches
- **Table:** `components/ui/table.tsx` - Tablas
- **Tabs:** `components/ui/tabs.tsx` - Pestañas
- **Textarea:** `components/ui/textarea.tsx` - Área de texto
- **Toast/Sonner:** `components/ui/toast.tsx`, `components/ui/sonner.tsx` - Notificaciones
- **Tooltip:** `components/ui/tooltip.tsx` - Tooltips

---

## ✨ Componentes Premium Custom

Estos son componentes personalizados creados para Confitería Quelita con animaciones premium.

### AnimatedButton

**Ubicación:** `components/ui/animated-button.tsx`
**Creado en:** Fase 2 - Micro-interacciones

Botón con micro-interacciones avanzadas: ripple effect, shimmer, glow, loading states.

```tsx
import { AnimatedButton } from "@/components/ui/animated-button"

// Básico
<AnimatedButton onClick={() => console.log('click')}>
  Click me
</AnimatedButton>

// Con efectos
<AnimatedButton shimmer glow intensity="strong">
  Botón Premium
</AnimatedButton>

// Con loading state
<AnimatedButton
  loading={isLoading}
  loadingText="Procesando..."
  onClick={handleSubmit}
>
  Enviar
</AnimatedButton>

// Con shine effect
<AnimatedButton showShine>
  Hover para shine
</AnimatedButton>
```

**Props:**
- `shimmer`: boolean - Efecto shimmer de brillo
- `glow`: boolean - Efecto glow al hover
- `intensity`: `"subtle" | "medium" | "strong"` - Intensidad de animaciones
- `loading`: boolean - Activa estado de carga
- `loadingText`: string - Texto durante loading
- `showShine`: boolean - Efecto de brillo al hover
- `disabled`: boolean - Deshabilita el botón
- `onClick`: () => void - Callback de click

**Variantes Predefinidas:**

```tsx
import { PrimaryButton, HeroButton, SubtleButton, AnimatedIconButton } from "@/components/ui/animated-button"

<PrimaryButton>Primary Action</PrimaryButton>
<HeroButton>Hero CTA</HeroButton>
<SubtleButton>Subtle Action</SubtleButton>
<AnimatedIconButton icon={<Plus />} />
```

---

### AnimatedInput

**Ubicación:** `components/ui/animated-input.tsx`
**Creado en:** Fase 6 - Form & Input Premium

Input con floating label, animaciones suaves, y estados de validación visual.

```tsx
import { AnimatedInput } from "@/components/ui/animated-input"

// Input básico con floating label
<AnimatedInput
  label="Nombre completo"
  placeholder="Juan Pérez"
  value={nombre}
  onChange={(e) => setNombre(e.target.value)}
/>

// Con validación
<AnimatedInput
  label="Email"
  type="email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  error="Email inválido"
  success={emailValido}
/>

// Password con toggle
<AnimatedInput
  label="Contraseña"
  type="password"
  value={password}
  onChange={(e) => setPassword(e.target.value)}
/>

// Con help text
<AnimatedInput
  label="Teléfono"
  placeholder="+595 xxx xxx xxx"
  helpText="Formato: +595 xxx xxx xxx"
/>
```

**Props:**
- `label`: string - Label flotante
- `type`: string - Tipo de input (`text`, `email`, `password`, etc.)
- `value`: string - Valor controlado
- `onChange`: (e) => void - Callback de cambio
- `error`: string - Mensaje de error (activa estado error)
- `success`: boolean - Activa estado success
- `helpText`: string - Texto de ayuda
- `disabled`: boolean - Deshabilita el input
- `required`: boolean - Campo requerido

**Estados Visuales:**
- **Focus:** Ring animado con pulse effect
- **Error:** Borde rojo + icono AlertCircle + mensaje
- **Success:** Borde verde + icono Check
- **Disabled:** Opacidad reducida

---

### PasswordStrength

**Ubicación:** `components/ui/password-strength.tsx`
**Creado en:** Fase 6 - Form & Input Premium

Indicador visual de seguridad de contraseña con validaciones.

```tsx
import { PasswordStrength } from "@/components/ui/password-strength"

<PasswordStrength password={password} />
```

**Validaciones:**
- ✅ Mínimo 8 caracteres
- ✅ Al menos una mayúscula
- ✅ Al menos una minúscula
- ✅ Al menos un número
- ✅ Al menos un carácter especial

**Niveles de Seguridad:**
- **Débil (0-1):** Rojo
- **Regular (2):** Naranja
- **Buena (3-4):** Amarillo
- **Fuerte (5):** Verde

---

### SkeletonCard

**Ubicación:** `components/ui/skeleton-card.tsx`
**Creado en:** Fase 3 - Optimización de Carga

Sistema completo de skeleton loaders premium con shimmer effect.

```tsx
import {
  SkeletonCard,
  SkeletonGrid,
  SkeletonList,
  SkeletonCategory,
  SkeletonText
} from "@/components/ui/skeleton-card"

// Card individual
<SkeletonCard variant="default" />
<SkeletonCard variant="compact" />
<SkeletonCard variant="wide" />

// Grid de productos (20 items con stagger animation)
<SkeletonGrid count={20} />

// Lista vertical (5 items)
<SkeletonList count={5} />

// Categorías (8 items)
<SkeletonCategory count={8} />

// Texto placeholder
<SkeletonText lines={3} />
```

**Props SkeletonCard:**
- `variant`: `"default" | "compact" | "wide"` - Variantes de tamaño
- `delay`: number - Delay de animación (para stagger)

**Características:**
- Shimmer effect animado (Framer Motion)
- Stagger animations
- Accessible (`aria-busy`, `aria-label`)

---

### GradientCard

**Ubicación:** `components/ui/gradient-card.tsx`
**Creado en:** Fase 1 - Fundamentos Visuales

Card con gradiente de fondo y efectos hover premium.

```tsx
import { GradientCard } from "@/components/ui/gradient-card"

<GradientCard
  variant="orange"
  className="p-6"
>
  <h3>Contenido con gradiente naranja</h3>
</GradientCard>

<GradientCard variant="pink">
  <h3>Gradiente rosa</h3>
</GradientCard>

<GradientCard variant="yellow">
  <h3>Gradiente dorado</h3>
</GradientCard>
```

**Props:**
- `variant`: `"orange" | "pink" | "yellow" | "gradient"` - Color del gradiente
- `children`: ReactNode - Contenido de la card
- `className`: string - Clases adicionales

**Efectos:**
- Hover: Shadow transition (lg → xl)
- Hover: Scale sutil (1.02)
- Gradientes suaves con brand colors

---

### Logo (Animado)

**Ubicación:** `components/layout/Logo.tsx`
**Creado en:** Fase 1 - Fundamentos Visuales

Logo de Confitería Quelita con animaciones de entrada.

```tsx
import { Logo } from "@/components/layout/Logo"

<Logo />
```

**Animaciones:**
- Glow effect en el ícono
- Rotate sutil en hover
- Letter bounce en el texto
- Spring physics

---

### ProductCardEnhanced

**Ubicación:** `components/products/ProductCardEnhanced.tsx`
**Creado en:** Fase 2-4 (Múltiples mejoras)

Card de producto premium con micro-interacciones avanzadas.

```tsx
import { ProductCardEnhanced } from "@/components/products/ProductCardEnhanced"

<ProductCardEnhanced
  product={producto}
  variants={variantes}
  index={0}  // Para lazy loading inteligente
/>
```

**Features:**
- ✅ **Confetti animation** al agregar al carrito
- ✅ **Lazy loading inteligente** (primeras 4 eager, resto lazy)
- ✅ **Hover effects** con Framer Motion
- ✅ **Badge de descuento** animado
- ✅ **Badge "Nuevo"** con pulse
- ✅ **Selector de variantes** con preview
- ✅ **Optimización de imágenes** Cloudinary

**Animaciones:**
```tsx
// Confetti al click en "Agregar"
confetti({
  particleCount: 30,
  spread: 60,
  colors: ['#F97316', '#E11D48', '#FBBF24'],
  origin: { x, y }
});
```

---

### ProductCarousel

**Ubicación:** `components/home/ProductCarousel.tsx`
**Creado en:** Fase 4 - Featured Products Premium

Carrusel de productos profesional con features avanzadas.

```tsx
import { ProductCarousel } from "@/components/home/ProductCarousel"

<ProductCarousel
  products={productos}
  autoPlay={true}
  interval={5000}
/>
```

**Features:**
- ✅ **Keyboard Navigation** (← → arrow keys)
- ✅ **Drag-to-Scroll** (click & drag)
- ✅ **Dot Indicators** clickeables con animaciones
- ✅ **Auto-play** opcional con pausa al drag
- ✅ **Scroll Progress Bar** animado
- ✅ **Navigation Arrows** con estados dinámicos
- ✅ **Parallax Effects** en cards
- ✅ **Lazy Loading** con IntersectionObserver
- ✅ **Accessibility** (role="tablist", aria-selected)

**Props:**
- `products`: Product[] - Lista de productos
- `autoPlay`: boolean - Auto-play enabled
- `interval`: number - Intervalo de auto-play (ms)

---

### CartSheet

**Ubicación:** `components/cart/CartSheet.tsx`
**Creado en:** Fase 5 - Cart Drawer Premium

Drawer de carrito con animaciones premium y micro-interacciones.

```tsx
import { CartSheet } from "@/components/cart/CartSheet"

<CartSheet />  // Se integra automáticamente con zustand store
```

**Features:**
- ✅ **Empty State Premium** con ícono flotante animado
- ✅ **Stagger Animations** en items (delay: index * 0.05s)
- ✅ **Counter Animations** con flip effect
- ✅ **Price Animations** con scale + spring
- ✅ **Ripple Effect** en botón checkout
- ✅ **Mini Confetti** al hacer checkout (20 partículas)
- ✅ **Exit Animations** al eliminar items
- ✅ **AnimatePresence** con mode="popLayout"

**Estados Animados:**
- Empty state: ShoppingBag con animación continua
- Items: Entrada con stagger (fadeIn + slideUp)
- Delete: Slide-out con fade
- Checkout: Ripple + mini confetti

---

### HeroSection

**Ubicación:** `components/home/HeroSection.tsx`
**Creado en:** Fase 1 - Fundamentos Visuales

Hero section premium con orbs decorativos y animaciones complejas.

```tsx
import { HeroSection } from "@/components/home/HeroSection"

<HeroSection />
```

**Features:**
- ✅ **Stagger animations** en contenido
- ✅ **Orbs decorativos** con animación flotante infinita
- ✅ **Texto con gradiente** animado
- ✅ **Botones con spring physics**
- ✅ **Badge con pulse effect**
- ✅ **Responsive** (mobile, tablet, desktop)

---

### FeaturesSection

**Ubicación:** `components/home/FeaturesSection.tsx`
**Creado en:** Fase 2 - Micro-interacciones

Sección de características con animaciones on-scroll.

```tsx
import { FeaturesSection } from "@/components/home/FeaturesSection"

<FeaturesSection />
```

**Features:**
- ✅ **Stagger animations** con IntersectionObserver
- ✅ **Hover lift effect** (-8px translate)
- ✅ **Icon rotation** on hover ([0, -10, 10, 0])
- ✅ **Viewport once** para performance

---

### CategoriesSection

**Ubicación:** `components/home/CategoriesSection.tsx`
**Creado en:** Fase 3 - Optimización de Carga

Sección de categorías con skeleton loaders.

```tsx
import { CategoriesSection } from "@/components/home/CategoriesSection"

<CategoriesSection />
```

**Features:**
- ✅ **SkeletonCategory** durante carga (8 items)
- ✅ **Header animado** con fadeIn
- ✅ **Botón "Ver todas"** con hover slide (x: 4px)
- ✅ **CategoryCard** con animaciones

---

## 🎬 Animaciones y Motion Variants

### Framer Motion Setup

Todas las animaciones usan **Framer Motion** con physics-based animations.

```tsx
import { motion, AnimatePresence } from "framer-motion"
```

### Variants Comunes

#### FadeIn

```tsx
const fadeIn = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.3 }
  }
}

<motion.div
  initial="hidden"
  animate="visible"
  variants={fadeIn}
>
  Contenido
</motion.div>
```

#### SlideUp

```tsx
const slideUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" }
  }
}
```

#### Stagger Container

```tsx
const container = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,  // 100ms entre hijos
    }
  }
}

const item = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

<motion.div variants={container} initial="hidden" animate="visible">
  {items.map(item => (
    <motion.div key={item.id} variants={item}>
      {item.content}
    </motion.div>
  ))}
</motion.div>
```

#### Spring Physics

```tsx
<motion.button
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
  transition={{
    type: "spring",
    stiffness: 400,
    damping: 17
  }}
>
  Click me
</motion.button>
```

### AnimatePresence

Para animaciones de entrada/salida:

```tsx
<AnimatePresence mode="wait">
  {isVisible && (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
    >
      Contenido
    </motion.div>
  )}
</AnimatePresence>
```

### Confetti Effect

```tsx
import confetti from 'canvas-confetti'

// Mini confetti (cart, checkout)
confetti({
  particleCount: 20,
  spread: 50,
  colors: ['#F97316', '#E11D48', '#FBBF24'],
  origin: { y: 0.6 }
})

// Full confetti (grandes celebraciones)
confetti({
  particleCount: 100,
  spread: 70,
  origin: { y: 0.6 }
})
```

### Shimmer Effect

```tsx
<motion.div
  animate={{
    backgroundPosition: ["0% 0%", "100% 0%"],
  }}
  transition={{
    duration: 1.5,
    repeat: Infinity,
    ease: "linear"
  }}
  style={{
    backgroundImage: "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)",
    backgroundSize: "200% 100%"
  }}
/>
```

---

## 🔧 Patrones de Uso

### Pattern 1: Form con AnimatedInput

```tsx
"use client"
import { useState } from "react"
import { AnimatedInput } from "@/components/ui/animated-input"
import { AnimatedButton } from "@/components/ui/animated-button"

export default function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // ... lógica de login

    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <AnimatedInput
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />

      <AnimatedInput
        label="Contraseña"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />

      <AnimatedButton
        type="submit"
        loading={loading}
        loadingText="Iniciando sesión..."
        shimmer
        className="w-full"
      >
        Iniciar sesión
      </AnimatedButton>
    </form>
  )
}
```

### Pattern 2: Grid con Skeleton Loading

```tsx
"use client"
import { ProductCardEnhanced } from "@/components/products/ProductCardEnhanced"
import { SkeletonGrid } from "@/components/ui/skeleton-card"
import { useProducts } from "@/hooks/useProducts"

export default function ProductsPage() {
  const { data: products, isLoading } = useProducts()

  if (isLoading) {
    return <SkeletonGrid count={20} />
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {products?.map((product, index) => (
        <ProductCardEnhanced
          key={product._id}
          product={product}
          variants={product.variants}
          index={index}
        />
      ))}
    </div>
  )
}
```

### Pattern 3: Dialog con Animaciones

```tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AnimatedButton } from "@/components/ui/animated-button"
import { motion } from "framer-motion"

<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Confirmar acción</DialogTitle>
    </DialogHeader>

    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <p>¿Estás seguro de realizar esta acción?</p>

      <div className="flex gap-2 justify-end">
        <AnimatedButton
          variant="outline"
          onClick={() => setIsOpen(false)}
        >
          Cancelar
        </AnimatedButton>

        <AnimatedButton
          onClick={handleConfirm}
          shimmer
        >
          Confirmar
        </AnimatedButton>
      </div>
    </motion.div>
  </DialogContent>
</Dialog>
```

---

## ✅ Mejores Prácticas

### 1. Performance

```tsx
// ✅ BUENO: Lazy loading de imágenes
<Image
  src={imageUrl}
  alt={product.name}
  fill
  loading={index < 4 ? "eager" : "lazy"}  // Primeras 4 eager
  priority={index < 4}                     // Primeras 4 priority
  sizes="(max-width: 768px) 50vw, 25vw"
/>

// ❌ MALO: Todas las imágenes eager
<Image src={imageUrl} alt={product.name} loading="eager" />
```

### 2. Animaciones

```tsx
// ✅ BUENO: AnimatePresence con mode
<AnimatePresence mode="wait">
  {items.map(item => (
    <motion.div key={item.id} exit={{ opacity: 0 }}>
      {item.content}
    </motion.div>
  ))}
</AnimatePresence>

// ❌ MALO: Sin exit animation
{items.map(item => (
  <div key={item.id}>{item.content}</div>
))}
```

### 3. Accesibilidad

```tsx
// ✅ BUENO: Labels accesibles
<AnimatedInput
  label="Email"  // Label visible y accesible
  type="email"
  aria-required="true"
/>

// ❌ MALO: Sin label
<input type="email" placeholder="Email" />
```

### 4. Loading States

```tsx
// ✅ BUENO: Skeleton durante carga
{isLoading ? (
  <SkeletonGrid count={20} />
) : (
  <ProductGrid products={products} />
)}

// ❌ MALO: Sin feedback visual
{!isLoading && <ProductGrid products={products} />}
```

### 5. Error Handling

```tsx
// ✅ BUENO: Estados de error claros
<AnimatedInput
  label="Email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  error={errors.email}  // "Email inválido"
  success={isEmailValid}
/>

// ❌ MALO: Sin feedback de error
<Input value={email} onChange={(e) => setEmail(e.target.value)} />
```

---

## 📚 Referencias

### Documentación Oficial

- **Next.js:** https://nextjs.org/docs
- **React:** https://react.dev/
- **Framer Motion:** https://www.framer.com/motion/
- **shadcn/ui:** https://ui.shadcn.com/
- **Tailwind CSS:** https://tailwindcss.com/docs

### Recursos del Proyecto

- **Design System:** `app/globals.css`
- **Type Definitions:** `types/index.ts`
- **Hooks Personalizados:** `hooks/`
- **Utilidades:** `lib/utils.ts`, `lib/image-utils.ts`

---

## 🎯 Componentes por Categoría

### Navegación y Layout
- `Header` - Cabecera principal con cart badge animado
- `Footer` - Pie de página
- `Logo` - Logo animado
- `AdminSidebar` - Sidebar del admin
- `ClientSidebar` - Sidebar del cliente

### Productos
- `ProductCardEnhanced` - Card premium con confetti
- `ProductCarousel` - Carrusel con keyboard nav
- `QuickViewModal` - Modal de vista rápida
- `ProductFilters` - Filtros de productos

### Carrito y Checkout
- `CartSheet` - Drawer animado del carrito
- `FlyingCartParticle` - Partícula voladora (no usado actualmente)

### Forms e Inputs
- `AnimatedInput` - Input con floating label
- `AnimatedButton` - Botón con micro-interacciones
- `PasswordStrength` - Indicador de contraseña

### Loading States
- `SkeletonCard` - Card skeleton
- `SkeletonGrid` - Grid skeleton
- `SkeletonList` - List skeleton
- `SkeletonCategory` - Category skeleton

### Home/Landing
- `HeroSection` - Hero animado
- `FeaturesSection` - Características
- `CategoriesSection` - Categorías
- `FeaturedProductsSection` - Productos destacados

---

**Última actualización:** 3 de Diciembre, 2025
**Mantenido por:** Equipo Confitería Quelita
**Versión:** 1.0.0

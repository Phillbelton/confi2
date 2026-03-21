# Sistema de Diseño basado en HeroSection Premium

## Filosofía de Diseño

**Inspiración:** HeroSection Premium - El componente que define la identidad visual de Confitería Quelita

**Principios:**
1. **Ambiente Envolvente** - Fondos con gradientes sutiles y elementos decorativos animados
2. **Animaciones Sutiles** - Movimientos suaves que dan vida sin distraer
3. **Espaciado Generoso** - py-12 md:py-16 lg:py-20 (mucho aire respirable)
4. **Jerarquía Visual Clara** - Títulos grandes con gradientes, badges, stats destacados
5. **Interactividad Deliciosa** - Hover effects con scale, sombras premium
6. **Accesibilidad Mobile-First** - w-full sm:w-auto, touch-friendly

---

## 🎨 Elementos Decorativos Signature

### 1. Gradient Orbs (Orbes de Luz Ambiente)

```tsx
{/* Orbe Primary - Top Right */}
<motion.div
  animate={{
    scale: [1, 1.2, 1],
    opacity: [0.3, 0.5, 0.3],
  }}
  transition={{
    duration: 8,
    repeat: Infinity,
    ease: 'easeInOut',
  }}
  className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-primary/20 blur-3xl"
/>

{/* Orbe Secondary - Bottom Left */}
<motion.div
  animate={{
    scale: [1, 1.3, 1],
    opacity: [0.2, 0.4, 0.2],
  }}
  transition={{
    duration: 10,
    repeat: Infinity,
    ease: 'easeInOut',
    delay: 2,
  }}
  className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-secondary/20 blur-3xl"
/>
```

**Uso:** Aplica a todos los componentes principales (secciones, cards grandes, modales)

### 2. Floating Icons (Iconos Flotantes Decorativos)

```tsx
{/* Icon 1 - Floating up/down */}
<motion.div
  animate={{
    y: [0, -20, 0],
    rotate: [0, 5, 0],
  }}
  transition={{
    duration: 6,
    repeat: Infinity,
    ease: 'easeInOut',
  }}
  className="absolute top-12 right-32 text-primary/20"
>
  <Sparkles className="w-16 h-16" />
</motion.div>
```

**Patrones de movimiento:**
- Y: [-20, 0] o [0, 20] (vertical float)
- Rotate: [-5, 5] (sutil balanceo)
- Duration: 6-7s (lento y relajado)
- Opacity: 20% del color (muy sutil)

### 3. Wave Bottom Decoration

```tsx
<div className="absolute bottom-0 left-0 right-0">
  <svg
    className="w-full h-8 md:h-12 fill-background"
    viewBox="0 0 1200 120"
    preserveAspectRatio="none"
  >
    <path d="M0,0 C150,80 350,80 600,40 C850,0 1050,0 1200,40 L1200,120 L0,120 Z" />
  </svg>
</div>
```

**Uso:** Final de secciones importantes para transición suave

---

## 📐 Sistema de Espaciado

### Contenedores Principales

```css
/* Wrapper de Sección */
.section-wrapper {
  @apply relative w-full overflow-hidden;
  @apply bg-gradient-subtle rounded-2xl; /* rounded corners! */
  @apply mb-8 shadow-premium;
}

/* Contenedor Interior */
.section-content {
  @apply relative z-10 container mx-auto px-4;
  @apply py-12 md:py-16 lg:py-20; /* generoso padding vertical */
}

/* Contenido Centrado */
.centered-content {
  @apply max-w-3xl mx-auto text-center;
}
```

### Spacing Scale (basado en HeroSection)

- **Extra Small:** gap-2 (8px)
- **Small:** gap-4, mb-4 (16px)
- **Medium:** gap-6, mb-6 (24px) - badges, titles
- **Large:** gap-8, mb-8 (32px) - sections, descriptions
- **Extra Large:** mt-12 (48px) - stats section

---

## 🎭 Animaciones Signature

### Secuencia de Entrada Staggered

```tsx
{/* Badge - enters first */}
<motion.div
  initial={{ opacity: 0, y: -20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={motionTransitions.smooth}
>

{/* Title - delay: 0.1s */}
<motion.h1
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ ...motionTransitions.smooth, delay: 0.1 }}
>

{/* Description - delay: 0.2s */}
<motion.p
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ ...motionTransitions.smooth, delay: 0.2 }}
>

{/* CTA - delay: 0.3s */}
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ ...motionTransitions.smooth, delay: 0.3 }}
>

{/* Stats - delay: 0.4s, then stagger children */}
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ ...motionTransitions.smooth, delay: 0.4 }}
>
  {stats.map((stat, index) => (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        ...motionTransitions.spring,
        delay: 0.5 + index * 0.1, // stagger by 100ms
      }}
    />
  ))}
</motion.div>
```

**Patrón:** Badge → Title → Description → CTA → Details (staggered)

### Button Hover Effects

```tsx
<Button
  className="gradient-primary text-white shadow-premium hover:shadow-premium-lg transition-all hover:scale-105"
>
```

**Elementos:**
- `gradient-primary` - Fondo con gradiente
- `shadow-premium` → `hover:shadow-premium-lg` - Elevación dinámica
- `hover:scale-105` - Crece 5% al hover
- `transition-all` - Transición suave

### Stats/Icon Circles

```tsx
<div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
  <Icon className="w-6 h-6 text-primary" />
</div>
```

**Patrón:**
- Circle: w-12 h-12 (48px)
- Background: primary/10 (10% opacity)
- Icon: w-6 h-6 (24px), color primary

---

## 🏷️ Typography Hierarchy

### Títulos Principales

```tsx
{/* Hero Title - con gradient */}
<h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 font-display">
  <span className="gradient-text-sunset">
    Dulces Premium
  </span>
  <br />
  <span className="text-foreground">
    Para Cada Momento
  </span>
</h1>
```

**Scale:**
- Mobile: text-4xl (36px)
- Tablet: md:text-5xl (48px)
- Desktop: lg:text-6xl (60px)
- Font: font-display (Playfair Display)
- Weight: font-bold

### Descripciones

```tsx
<p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed">
  Descubre nuestra selección curada de confitería artesanal.
</p>
```

**Scale:**
- Mobile: text-lg (18px)
- Desktop: md:text-xl (20px)
- Color: text-muted-foreground
- Leading: leading-relaxed (1.625)

### Badges/Pills

```tsx
<div className="px-4 py-2 rounded-full bg-primary/10 backdrop-blur-sm border border-primary/20">
  <div className="flex items-center gap-2">
    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
    <span className="text-sm font-medium text-primary">Nuevos productos</span>
  </div>
</div>
```

**Elementos:**
- Rounded: rounded-full
- Background: primary/10 con backdrop-blur-sm
- Border: border-primary/20
- Pulse dot: w-2 h-2 con animate-pulse
- Text: text-sm font-medium

---

## 🎯 Component Patterns

### Section Container Template

```tsx
export function PremiumSection({ children, decorative = true }) {
  return (
    <section className="relative w-full overflow-hidden bg-gradient-subtle rounded-2xl mb-8 shadow-premium">
      {/* Decorative Background - Optional */}
      {decorative && (
        <div className="absolute inset-0 overflow-hidden">
          {/* Gradient Orbs */}
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-primary/20 blur-3xl"
          />
          <motion.div
            animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
            className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-secondary/20 blur-3xl"
          />
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-12 md:py-16 lg:py-20">
        {children}
      </div>

      {/* Wave Bottom */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg className="w-full h-8 md:h-12 fill-background" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M0,0 C150,80 350,80 600,40 C850,0 1050,0 1200,40 L1200,120 L0,120 Z" />
        </svg>
      </div>
    </section>
  );
}
```

### Premium Card Template

```tsx
export function PremiumCard({ children, hover = true }) {
  return (
    <motion.div
      whileHover={hover ? { y: -4, scale: 1.02 } : {}}
      className="relative overflow-hidden rounded-xl bg-card border border-border shadow-md hover:shadow-premium transition-all"
    >
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-subtle opacity-50" />

      {/* Content */}
      <div className="relative z-10 p-6">
        {children}
      </div>
    </motion.div>
  );
}
```

---

## 🌈 Color Usage Patterns

### Gradients en Títulos

```css
.gradient-text-sunset {
  background: var(--gradient-sunset);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}
```

### Botones con Gradiente

```tsx
{/* Primary CTA */}
<Button className="gradient-primary text-white shadow-premium hover:shadow-premium-lg">

{/* Secondary CTA */}
<Button variant="outline" className="border-primary/30 hover:bg-primary/5">
```

### Backgrounds con Transparencia

- Cards: `bg-primary/10`
- Borders: `border-primary/20`
- Orbs: `bg-primary/20 blur-3xl`
- Icons decorativos: `text-primary/20`

---

## 📱 Mobile-First Responsive Patterns

### Flexbox Stacking

```tsx
{/* Stack vertical en mobile, horizontal en desktop */}
<div className="flex flex-col sm:flex-row items-center justify-center gap-4">
  <Button className="w-full sm:w-auto">...</Button>
  <Button className="w-full sm:w-auto">...</Button>
</div>
```

### Grid Adaptativo

```tsx
{/* Stats - 3 columns en mobile, más separación en desktop */}
<div className="grid grid-cols-3 gap-6 md:gap-8">
  {stats.map(...)}
</div>
```

### Text Breaks Controlados

```tsx
<p>
  Primera línea
  <br className="hidden md:block" /> {/* Solo break en desktop */}
  Segunda línea
</p>
```

---

## 🎪 Checklist de Implementación

Al crear un nuevo componente premium, verifica:

- [ ] **Background decorativo**
  - [ ] Gradient orbs animados (primary top-right, secondary bottom-left)
  - [ ] Opcional: Floating icons (Sparkles, Gift, etc.)

- [ ] **Estructura de contenedor**
  - [ ] Overflow hidden en wrapper
  - [ ] Container con max-width
  - [ ] Padding generoso: py-12 md:py-16 lg:py-20
  - [ ] Z-index: content z-10, decorations z-0

- [ ] **Animaciones de entrada**
  - [ ] Stagger delays: 0.1s increments
  - [ ] Fade + slide from bottom (y: 20)
  - [ ] Children con spring transitions

- [ ] **Tipografía**
  - [ ] Títulos con font-display
  - [ ] Gradientes en palabras clave
  - [ ] Muted-foreground para descripciones

- [ ] **Interactividad**
  - [ ] Buttons con hover:scale-105
  - [ ] Shadow elevation en hover
  - [ ] Touch-friendly (w-full sm:w-auto)

- [ ] **Detalles finales**
  - [ ] Rounded corners: rounded-2xl en secciones
  - [ ] Shadow-premium
  - [ ] Wave decoration al final (opcional)

---

## 🚀 Próximos Pasos

1. **Crear componente base:** `<PremiumSection>` reusable
2. **Aplicar a página productos:** Rediseñar layout completo
3. **Navbar con dropdown:** Estilo Central Mayorista
4. **Product cards:** Misma estética que stats del hero
5. **Filters sidebar:** Transformar en experiencia premium

**Objetivo:** Todo el sitio debe sentirse como una extensión del HeroSection.

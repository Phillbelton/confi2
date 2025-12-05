# PROPUESTA DE REDISEÑO: CATÁLOGO DE PRODUCTOS /productos

**Proyecto:** Confitería Quelita - E-Commerce
**Fecha:** 3 de Diciembre, 2025
**Versión:** 1.0 - Propuesta Premium

---

## ÍNDICE

1. [Análisis de la Situación Actual](#1-análisis-de-la-situación-actual)
2. [Investigación y Tendencias 2025](#2-investigación-y-tendencias-2025)
3. [Objetivos del Rediseño](#3-objetivos-del-rediseño)
4. [Propuesta de Diseño](#4-propuesta-de-diseño)
5. [Arquitectura de Información](#5-arquitectura-de-información)
6. [Componentes Nuevos y Mejorados](#6-componentes-nuevos-y-mejorados)
7. [Sistema de Diseño Premium](#7-sistema-de-diseño-premium)
8. [Especificaciones Técnicas](#8-especificaciones-técnicas)
9. [Plan de Implementación](#9-plan-de-implementación)
10. [Métricas de Éxito](#10-métricas-de-éxito)

---

## 1. ANÁLISIS DE LA SITUACIÓN ACTUAL

### 1.1 Estado del Código Actual

**Página Principal:** `frontend/app/productos/page.tsx`

#### Fortalezas Identificadas:
✅ **Funcionalidad completa:** Sistema de filtros, búsqueda, paginación y sorting funcionan correctamente
✅ **Performance:** Implementación de lazy loading y optimización de imágenes con Cloudinary
✅ **Animaciones:** Uso de framer-motion y auto-animate para transiciones suaves
✅ **Responsive:** Diseño adaptativo con mobile-first
✅ **Features avanzadas:** Quick view modal, filtros jerárquicos, variantes de producto

#### Áreas de Mejora Identificadas:
⚠️ **Presentación visual:** Diseño funcional pero no premium/impactante
⚠️ **Jerarquía visual:** La información importante no destaca lo suficiente
⚠️ **Experiencia mobile:** Puede optimizarse para mayor engagement
⚠️ **Microinteracciones:** Falta refinamiento en detalles de UX
⚠️ **Arquitectura de información:** Puede ser más intuitiva y escaneable
⚠️ **Espaciado y ritmo:** Layout denso que puede beneficiarse de más espacio respirable

### 1.2 Componentes Existentes

**ProductCardEnhanced.tsx:** Card completo con animaciones 3D, variantes, descuentos
- Fortaleza: Animaciones avanzadas y lógica completa
- Mejora: Presentación visual más elegante y refinada

**ProductFilters.tsx:** Sistema de filtros con accordion
- Fortaleza: Funcionalidad completa
- Mejora: Interfaz más premium y accesible

**CategoryPills:** Selector de categorías horizontal
- Fortaleza: Scroll horizontal fluido
- Mejora: Diseño más atractivo y con mejor contraste

---

## 2. INVESTIGACIÓN Y TENDENCIAS 2025

### 2.1 Tendencias E-Commerce Premium 2025

Basándome en investigación de las mejores prácticas actuales, identifiqué estas tendencias clave:

#### 🎨 **Minimalismo Premium**
- Diseño limpio y sin saturación que enfoca en el producto
- Espaciado generoso (whitespace) que transmite lujo
- Tipografía elegante y jerarquizada
- Paletas cálidas y sofisticadas

#### 🖼️ **Contenido Visual de Alta Calidad**
- Imágenes grandes y de alta resolución
- Proporción 1:1 o 4:5 para products
- Hover effects sutiles que revelan más información
- Video integration en heroes y productos destacados

#### 🎯 **Personalización con IA**
- Recomendaciones inteligentes
- Filtros predictivos
- Orden dinámico basado en comportamiento

#### 📱 **Mobile-First Radical**
- Grid de 2 columnas en mobile optimizado
- Touch targets de mínimo 44x44px
- Gestos naturales (swipe, pinch)
- Bottom navigation para acciones frecuentes

#### ✨ **Microinteracciones Premium**
- Transiciones fluidas y naturales
- Feedback visual inmediato
- Estados de loading elegantes
- Animaciones con propósito funcional

#### 🎭 **Experiencias Inmersivas**
- AR/VR integration
- 360° product views
- Interactive customization
- Gamificación sutil

### 2.2 Mejores Prácticas UX/UI

#### Grid Systems
- **Desktop:** 4-6 columnas para productos
- **Tablet:** 3 columnas
- **Mobile:** 2 columnas con espacio respirable
- Gutters consistentes: 16-24px mobile, 24-32px desktop

#### Navegación y Filtros
- **Filtros sticky** en desktop (sidebar izquierdo)
- **Bottom sheet** para filtros en mobile
- **Tag-based filters** para selección rápida
- **Faceted navigation** con contadores de resultados
- **Applied filters chips** visibles y fáciles de remover

#### Product Cards
- **Hover effects:** Zoom sutil (1.05-1.1x) en imagen
- **Quick actions:** Aparecen en hover desktop, siempre visibles en mobile
- **Secondary image:** Se muestra en hover
- **Price hierarchy:** Precio destacado, descuentos en rojo
- **CTA visible:** Botón "Agregar" siempre accesible

---

## 3. OBJETIVOS DEL REDISEÑO

### 3.1 Objetivos de Negocio

1. **Aumentar conversión:** Hacer más fácil y atractivo agregar productos al carrito
2. **Reducir bounce rate:** Captar atención en los primeros 3 segundos
3. **Aumentar engagement:** Fomentar exploración de catálogo
4. **Mejorar percepción de marca:** Transmitir profesionalismo y calidad premium

### 3.2 Objetivos de Usuario

1. **Encontrar productos rápidamente:** Navegación intuitiva y filtros eficientes
2. **Entender valor:** Información clara de precios, descuentos y disponibilidad
3. **Tomar decisiones informadas:** Imágenes de calidad y detalles accesibles
4. **Experiencia placentera:** Interface bella y fluida que invite a explorar

### 3.3 Objetivos Técnicos

1. **Mantener performance:** No sacrificar velocidad por belleza
2. **Accesibilidad:** WCAG 2.1 AA compliance
3. **SEO optimizado:** Estructura semántica correcta
4. **Escalabilidad:** Componentes reutilizables y bien documentados

---

## 4. PROPUESTA DE DISEÑO

### 4.1 Concepto Visual: "Elegancia Cálida Premium"

**Filosofía:** Combinar la calidez de una confitería tradicional con la sofisticación de una boutique premium moderna.

#### Mood Board Conceptual:
- **Referencias:** Hermès e-commerce, Ladurée, Net-a-Porter, Farfetch
- **Adjetivos:** Elegante, Cálido, Sofisticado, Acogedor, Premium, Apetitoso
- **Evitar:** Corporativo frío, Minimalismo extremo, Saturación excesiva

### 4.2 Hero Section (Nuevo)

```
┌─────────────────────────────────────────────────────────────┐
│ [Imagen full-width con overlay sutil]                      │
│                                                             │
│   🍬 Descubre Nuestros Dulces                              │
│   Premium Collection                                        │
│                                                             │
│   [CTA: Explorar Catálogo]                                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Características:**
- Altura: 40vh mobile, 50vh desktop
- Imagen de alta calidad de productos
- Overlay gradient sutil con paleta cálida
- Tipografía display elegante
- CTA con micro-animación de bounce sutil

### 4.3 Search & Quick Filters Section

```
┌─────────────────────────────────────────────────────────────┐
│ [🔍 Search bar con icon y sugerencias]                     │
│                                                             │
│ ⭐ Destacados  🏷️ Ofertas  🆕 Nuevos  🎁 Regalos         │
└─────────────────────────────────────────────────────────────┘
```

**Mejoras:**
- Search bar más prominente con auto-complete
- Quick filter pills con iconos y hover effects
- Animación de selección con scale y color transition
- Badge de contador cuando filtro activo

### 4.4 Category Navigation (Mejorado)

```
┌─────────────────────────────────────────────────────────────┐
│ ← [🍫 Chocolates] [🍬 Caramelos] [🎂 Pasteles] ... →       │
└─────────────────────────────────────────────────────────────┘
```

**Mejoras:**
- Pills más grandes (min-height: 44px) para mobile
- Iconos coloridos para cada categoría
- Hover effect: elevación y brillo sutil
- Active state: gradiente de marca + sombra
- Smooth scroll con momentum

### 4.5 Toolbar (Rediseñado)

```
┌─────────────────────────────────────────────────────────────┐
│ Mostrando 42 productos                                      │
│                                                             │
│ [Ordenar: Más recientes ▼]  [▦ Grid] [☰ List]            │
└─────────────────────────────────────────────────────────────┘
```

**Mejoras:**
- Contador de resultados más prominente
- Sort dropdown rediseñado con iconos
- View toggles con mejor contraste
- Sticky en scroll para mantener controles accesibles

### 4.6 Layout Principal

#### Desktop (≥1024px):
```
┌───────────┬─────────────────────────────────────────────────┐
│  FILTERS  │  PRODUCTS GRID (4 columns)                     │
│  Sidebar  │  ┌────┬────┬────┬────┐                         │
│  (256px)  │  │ P1 │ P2 │ P3 │ P4 │                         │
│           │  ├────┼────┼────┼────┤                         │
│ - Precio  │  │ P5 │ P6 │ P7 │ P8 │                         │
│ - Marca   │  └────┴────┴────┴────┘                         │
│ - Cat.    │                                                 │
│           │  [Load More / Pagination]                      │
└───────────┴─────────────────────────────────────────────────┘
```

#### Tablet (768px-1023px):
```
┌─────────────────────────────────────────────────────────────┐
│ [Filtros Button]   [Sort ▼]   [View Toggle]                │
│                                                             │
│  ┌──────┬──────┬──────┐                                    │
│  │  P1  │  P2  │  P3  │  (3 columns)                      │
│  ├──────┼──────┼──────┤                                    │
│  │  P4  │  P5  │  P6  │                                    │
│  └──────┴──────┴──────┘                                    │
└─────────────────────────────────────────────────────────────┘
```

#### Mobile (≤767px):
```
┌──────────────────────────┐
│ [Filtros] [Sort ▼]       │
│                          │
│  ┌──────┬──────┐         │
│  │  P1  │  P2  │         │
│  ├──────┼──────┤         │
│  │  P3  │  P4  │         │
│  └──────┴──────┘         │
│                          │
│  [🔝 Volver arriba]      │
└──────────────────────────┘
```

**Espaciado:**
- Gap entre cards: 16px mobile, 24px desktop
- Márgenes laterales: 16px mobile, 24px tablet, 32px desktop
- Padding interno cards: 12px mobile, 16px desktop

---

## 5. ARQUITECTURA DE INFORMACIÓN

### 5.1 Jerarquía de Información

```
1. HERO SECTION (Opcional - solo si hay promoción destacada)
   └─ CTA principal

2. DISCOVERY SECTION
   ├─ Search bar prominent
   ├─ Quick filters (Destacados, Ofertas, Nuevos)
   └─ Category pills

3. CONTROL SECTION
   ├─ Results counter
   ├─ Sort selector
   └─ View toggle

4. CONTENT SECTION
   ├─ Filters sidebar (desktop)
   └─ Products grid

5. NAVIGATION SECTION
   └─ Pagination / Infinite scroll

6. FOOTER ACTIONS (Sticky bottom mobile)
   ├─ Scroll to top
   └─ Help/Contact
```

### 5.2 Estados de la Vista

#### Estado Inicial (Sin filtros)
- Mostrar todos los productos
- Orden por defecto: "Más recientes"
- Hero visible (si existe)

#### Estado Filtrado
- Applied filters chips visibles
- Contador actualizado
- Clear all button habilitado
- URL sincronizada

#### Estado Vacío
- Ilustración amigable
- Mensaje empático
- Sugerencias de búsqueda
- CTA para limpiar filtros

#### Estado Cargando
- Skeleton screens elegantes
- Loading indicators sutiles
- Mantener estructura del layout

---

## 6. COMPONENTES NUEVOS Y MEJORADOS

### 6.1 ProductCardPremium (Nuevo)

**Mejoras sobre ProductCardEnhanced:**

```typescript
interface ProductCardPremiumProps {
  product: ProductParent;
  variants?: ProductVariant[];
  viewMode?: 'grid' | 'list';
  priority?: boolean; // Para LCP optimization
  lazyLoad?: boolean;
  onQuickView?: () => void;
}
```

**Características Premium:**

1. **Layout Mejorado**
   ```
   ┌─────────────────────────┐
   │     IMAGEN (1:1)        │
   │   [Secondary on hover]  │
   │  [Quick view overlay]   │
   ├─────────────────────────┤
   │ 🏷️ Badge Oferta (si aplica) │
   │                         │
   │ Título Producto         │
   │ Subtítulo/Categoría     │
   │                         │
   │ ⭐⭐⭐⭐⭐ (4.5) 234    │
   │                         │
   │ $12,900  ̶$̶1̶5̶,̶9̶0̶0̶     │
   │ [▪️ ▪️ ▪️] Variantes     │
   │                         │
   │ [- 1 +] [Agregar 🛒]    │
   │                         │
   │ Stock: Solo quedan 3    │
   └─────────────────────────┘
   ```

2. **Hover Effects (Desktop)**
   - Imagen: Scale 1.08x + brightness 1.05
   - Card: Elevación sutil (shadow-xl)
   - Quick actions: Fade in desde top
   - Secondary image: Crossfade si existe

3. **Mobile Optimizations**
   - Touch target mínimo: 44x44px
   - Swipe horizontal en galería de imágenes
   - Bottom sheet para variantes (si muchas opciones)
   - Add to cart sticky cuando scroll

4. **Accesibilidad**
   - ARIA labels completos
   - Keyboard navigation
   - Focus visible mejorado
   - Screen reader friendly

5. **Performance**
   - Lazy loading con intersection observer
   - Image optimization con Cloudinary
   - CSS containment para mejor rendering
   - Memoization de componentes pesados

### 6.2 FiltersPremium (Nuevo)

**Mejoras sobre ProductFilters:**

```typescript
interface FiltersPremiumProps {
  filters: Filters;
  onFilterChange: (filters: Filters) => void;
  categories: CategoryWithSubcategories[];
  brands: Brand[];
  priceRange: { min: number; max: number };
  resultCount: number;
  layout: 'sidebar' | 'drawer' | 'modal';
}
```

**Características:**

1. **Accordion Mejorado**
   - Iconos para cada sección
   - Smooth expand/collapse
   - Contadores de items activos
   - Estado persistente en URL

2. **Price Range Slider Premium**
   - Dual thumbs
   - Valores en tiempo real
   - Histograma de distribución de precios
   - Presets comunes (< $10k, $10k-$20k, etc.)

3. **Category Tree**
   - Expandible con animación
   - Checkboxes con indeterminate state
   - Parent-child relationships claros
   - Iconos por categoría

4. **Brand Filter**
   - Search box para muchas marcas
   - Logos de marca (si disponible)
   - Most popular primero
   - "Ver más" expandible

5. **Applied Filters**
   - Chips removibles uno por uno
   - "Clear all" button
   - Animación de remove
   - Resumen de filtros activos

6. **Mobile Drawer**
   - Full-height bottom sheet
   - Sticky header con close button
   - Sticky footer con "Apply" CTA
   - Swipe down to close

### 6.3 SearchBarPremium (Nuevo)

```typescript
interface SearchBarPremiumProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  suggestions?: SearchSuggestion[];
  recentSearches?: string[];
  showTrending?: boolean;
}
```

**Características:**

1. **Autocomplete Inteligente**
   - Sugerencias mientras escribe
   - Categorías de resultados:
     - Productos
     - Categorías
     - Marcas
   - Highlighting de términos coincidentes

2. **Recent Searches**
   - Historial del usuario
   - Clear individual o todos
   - Click para re-buscar

3. **Trending Searches**
   - Búsquedas populares
   - Con iconos de tendencia
   - Actualizado dinámicamente

4. **Mobile Optimization**
   - Teclado optimizado (type="search")
   - Clear button visible
   - Focus automático en abrir

### 6.4 CategoryPillsPremium (Mejorado)

**Mejoras:**

1. **Visual**
   - Iconos coloridos para cada categoría
   - Gradientes sutiles en active state
   - Sombras para dar profundidad
   - Indicador de scroll (fade edges)

2. **Interacción**
   - Smooth scroll con momentum
   - Snap to pill center
   - Touch-friendly (min 44px height)
   - Keyboard navigation

3. **Responsive**
   - Horizontal scroll en mobile
   - Multi-line en tablet (si espacio)
   - Botones prev/next en desktop hover

### 6.5 ProductGridPremium (Nuevo)

```typescript
interface ProductGridPremiumProps {
  products: ProductParent[];
  viewMode: 'grid' | 'list';
  columns?: { mobile: number; tablet: number; desktop: number };
  loading?: boolean;
  onLoadMore?: () => void;
  infiniteScroll?: boolean;
}
```

**Características:**

1. **Adaptive Grid**
   ```css
   .grid-premium {
     display: grid;
     grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
     gap: var(--grid-gap);
   }

   @media (max-width: 768px) {
     grid-template-columns: repeat(2, 1fr);
     gap: 16px;
   }
   ```

2. **Skeleton Loading**
   - Placeholders elegantes
   - Shimmer effect
   - Mantiene layout sin CLS

3. **Infinite Scroll (Opcional)**
   - Intersection observer
   - Loading indicator sutil
   - "Load more" button fallback

4. **List View (Alternativo)**
   ```
   ┌────────────────────────────────────────┐
   │ [IMG] Producto Name                    │
   │       Descripción corta...             │
   │       ⭐⭐⭐⭐ (4.5)                    │
   │       $12,900  [Agregar]               │
   └────────────────────────────────────────┘
   ```

### 6.6 QuickViewModalPremium (Mejorado)

**Mejoras sobre QuickViewModal:**

1. **Layout Mejorado**
   ```
   ┌──────────────────────────────────────────┐
   │ [×]                              Premium │
   ├─────────────┬────────────────────────────┤
   │             │                            │
   │   GALERÍA   │   DETALLES                 │
   │             │   - Título                 │
   │   Imagen    │   - Precio                 │
   │   Principal │   - Rating                 │
   │             │   - Descripción            │
   │   [▫▫▫▫]    │   - Variantes              │
   │   Thumbs    │   - Cantidad               │
   │             │   - [Agregar al Carrito]   │
   │             │   - [Ver Detalles]         │
   └─────────────┴────────────────────────────┘
   ```

2. **Galería Mejorada**
   - Zoom en hover (desktop)
   - Pinch to zoom (mobile)
   - Swipe entre imágenes
   - Lightbox para full-screen

3. **Mobile Full-Screen**
   - Ocupa toda la pantalla
   - Scroll vertical natural
   - Sticky add-to-cart button

---

## 7. SISTEMA DE DISEÑO PREMIUM

### 7.1 Paleta de Colores Mejorada

**Colores ya definidos (mantener):**
```css
--primary: oklch(0.685 0.203 27.33);    /* Orange #F97316 */
--secondary: oklch(0.568 0.232 13.18);  /* Pink #E11D48 */
--accent: oklch(0.843 0.154 85.87);     /* Yellow #FBBF24 */
```

**Nuevos colores de apoyo:**
```css
/* Neutrales Premium */
--neutral-50: oklch(0.99 0 0);     /* Off-white */
--neutral-100: oklch(0.97 0 0);    /* Lightest gray */
--neutral-200: oklch(0.94 0 0);    /* Light gray */
--neutral-300: oklch(0.88 0 0);    /* Medium-light gray */
--neutral-400: oklch(0.70 0 0);    /* Medium gray */
--neutral-500: oklch(0.56 0 0);    /* Base gray */
--neutral-600: oklch(0.42 0 0);    /* Dark gray */
--neutral-700: oklch(0.30 0 0);    /* Darker gray */
--neutral-800: oklch(0.21 0 0);    /* Almost black */
--neutral-900: oklch(0.15 0 0);    /* Near black */

/* Semantic Colors */
--success-light: oklch(0.70 0.15 155);    /* Light green */
--warning-light: oklch(0.80 0.15 85);     /* Light yellow */
--error-light: oklch(0.70 0.20 27);       /* Light red */
--info-light: oklch(0.70 0.15 250);       /* Light blue */

/* Surface Colors */
--surface-elevated: oklch(1 0 0);         /* White */
--surface-overlay: oklch(0 0 0 / 0.4);    /* Dark overlay */
--surface-glass: oklch(1 0 0 / 0.8);      /* Glassmorphism */
```

### 7.2 Tipografía Premium

```css
/* Font Families */
--font-display: 'Playfair Display', serif;  /* Headings elegantes */
--font-sans: 'Inter', system-ui, sans-serif; /* Body text */
--font-mono: 'Fira Code', monospace;         /* Code/números */

/* Font Sizes - Escala modular (1.250 - Major Third) */
--text-xs: 0.75rem;      /* 12px - Labels pequeños */
--text-sm: 0.875rem;     /* 14px - Secondary text */
--text-base: 1rem;       /* 16px - Body text */
--text-lg: 1.125rem;     /* 18px - Large body */
--text-xl: 1.25rem;      /* 20px - Small headings */
--text-2xl: 1.563rem;    /* 25px - Section headings */
--text-3xl: 1.953rem;    /* 31px - Page headings */
--text-4xl: 2.441rem;    /* 39px - Hero headings */
--text-5xl: 3.052rem;    /* 49px - Display headings */

/* Font Weights */
--font-light: 300;
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;

/* Line Heights */
--leading-tight: 1.25;     /* Headings */
--leading-snug: 1.375;     /* Large text */
--leading-normal: 1.5;     /* Body text */
--leading-relaxed: 1.625;  /* Comfortable reading */
--leading-loose: 2;        /* Very spacious */

/* Letter Spacing */
--tracking-tight: -0.025em;   /* Headings grandes */
--tracking-normal: 0;         /* Default */
--tracking-wide: 0.025em;     /* Labels */
--tracking-wider: 0.05em;     /* Uppercase text */
```

### 7.3 Espaciado y Ritmo

```css
/* Spacing Scale - Fibonacci-inspired */
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.5rem;    /* 24px */
--space-6: 2rem;      /* 32px */
--space-7: 3rem;      /* 48px */
--space-8: 4rem;      /* 64px */
--space-9: 6rem;      /* 96px */
--space-10: 8rem;     /* 128px */

/* Container Max-widths */
--container-sm: 640px;
--container-md: 768px;
--container-lg: 1024px;
--container-xl: 1280px;
--container-2xl: 1536px;
```

### 7.4 Sombras Premium

```css
/* Elevation System */
--shadow-xs: 0 1px 2px oklch(0 0 0 / 0.05);
--shadow-sm: 0 1px 3px oklch(0 0 0 / 0.1),
             0 1px 2px oklch(0 0 0 / 0.06);
--shadow-md: 0 4px 6px -1px oklch(0 0 0 / 0.1),
             0 2px 4px -1px oklch(0 0 0 / 0.06);
--shadow-lg: 0 10px 15px -3px oklch(0 0 0 / 0.1),
             0 4px 6px -2px oklch(0 0 0 / 0.05);
--shadow-xl: 0 20px 25px -5px oklch(0 0 0 / 0.1),
             0 10px 10px -5px oklch(0 0 0 / 0.04);
--shadow-2xl: 0 25px 50px -12px oklch(0 0 0 / 0.25);

/* Colored Shadows (Premium effect) */
--shadow-primary: 0 8px 16px -4px oklch(0.685 0.203 27.33 / 0.3);
--shadow-success: 0 8px 16px -4px oklch(0.587 0.178 155.41 / 0.3);
```

### 7.5 Border Radius

```css
--radius-sm: 0.25rem;   /* 4px */
--radius-md: 0.5rem;    /* 8px - Default */
--radius-lg: 0.75rem;   /* 12px */
--radius-xl: 1rem;      /* 16px */
--radius-2xl: 1.5rem;   /* 24px */
--radius-full: 9999px;  /* Circular */
```

### 7.6 Transiciones y Animaciones

```css
/* Timing Functions */
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
--ease-spring: cubic-bezier(0.68, -0.55, 0.265, 1.55);

/* Durations */
--duration-fast: 150ms;
--duration-base: 250ms;
--duration-slow: 350ms;
--duration-slower: 500ms;

/* Common Transitions */
--transition-colors: color var(--duration-base) var(--ease-out),
                     background-color var(--duration-base) var(--ease-out),
                     border-color var(--duration-base) var(--ease-out);

--transition-transform: transform var(--duration-base) var(--ease-out);

--transition-all: all var(--duration-base) var(--ease-out);
```

### 7.7 Microanimaciones Premium

**Nuevas animaciones CSS:**

```css
/* Shimmer Effect (para loading) */
@keyframes shimmer-premium {
  0% {
    background-position: -1000px 0;
  }
  100% {
    background-position: 1000px 0;
  }
}

/* Pulse Glow (para badges de oferta) */
@keyframes pulse-glow {
  0%, 100% {
    box-shadow: 0 0 0 0 var(--primary);
  }
  50% {
    box-shadow: 0 0 20px 5px var(--primary);
  }
}

/* Float Animation (para elementos destacados) */
@keyframes float {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
}

/* Scale Bounce (para CTAs) */
@keyframes scale-bounce {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

/* Fade Slide In (para elementos que entran) */
@keyframes fade-slide-in {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

---

## 8. ESPECIFICACIONES TÉCNICAS

### 8.1 Stack Tecnológico (Mantener)

- **Framework:** Next.js 14+ (App Router)
- **UI Library:** React 18+
- **Styling:** Tailwind CSS 4+ con variables CSS
- **Animations:** Framer Motion
- **State:** Zustand (cart) + React Query (data fetching)
- **Components:** shadcn/ui (base)
- **Forms:** React Hook Form + Zod
- **Icons:** Lucide React

### 8.2 Nuevas Dependencias

```json
{
  "dependencies": {
    "@tanstack/react-virtual": "^3.0.0",      // Virtual scrolling
    "embla-carousel-react": "^8.0.0",         // Carousels premium
    "react-use-gesture": "^9.1.3",            // Gestos touch
    "framer-motion": "^10.0.0",               // Ya existe, verificar versión
    "intersection-observer": "^0.12.0",       // Polyfill IE
    "react-responsive": "^9.0.0"              // Media queries en JS
  },
  "devDependencies": {
    "@storybook/react": "^7.0.0",             // Component documentation
    "@testing-library/react": "^14.0.0",      // Testing
    "chromatic": "^10.0.0"                    // Visual regression testing
  }
}
```

### 8.3 Estructura de Archivos Propuesta

```
frontend/
├── app/
│   └── productos/
│       ├── page.tsx                    (Rediseñado)
│       ├── loading.tsx                 (Nuevo - Skeleton)
│       └── error.tsx                   (Mejorado)
│
├── components/
│   ├── products/
│   │   ├── premium/                    (Nuevo directorio)
│   │   │   ├── ProductCardPremium.tsx
│   │   │   ├── ProductGridPremium.tsx
│   │   │   ├── FiltersPremium.tsx
│   │   │   ├── SearchBarPremium.tsx
│   │   │   ├── CategoryPillsPremium.tsx
│   │   │   ├── QuickViewModalPremium.tsx
│   │   │   ├── ProductHero.tsx         (Nuevo)
│   │   │   ├── AppliedFilters.tsx      (Nuevo)
│   │   │   └── EmptyState.tsx          (Nuevo)
│   │   │
│   │   ├── ProductCardEnhanced.tsx     (Mantener backup)
│   │   └── ...
│   │
│   └── ui/                             (shadcn/ui - mantener)
│
├── lib/
│   ├── design-system/                  (Nuevo)
│   │   ├── colors.ts
│   │   ├── typography.ts
│   │   ├── spacing.ts
│   │   └── animations.ts
│   │
│   └── utils/
│       ├── product-utils.ts            (Mejorado)
│       └── filter-utils.ts             (Nuevo)
│
├── styles/
│   ├── globals.css                     (Mejorado)
│   └── premium.css                     (Nuevo - estilos premium)
│
└── public/
    └── images/
        └── placeholders/                (Nuevo)
            ├── product-placeholder.svg
            └── hero-default.jpg
```

### 8.4 Performance Targets

#### Core Web Vitals:
- **LCP (Largest Contentful Paint):** < 2.5s
  - Lazy loading progresivo
  - Priority hints en hero image
  - Optimización Cloudinary

- **FID (First Input Delay):** < 100ms
  - Code splitting por ruta
  - Defer non-critical JS

- **CLS (Cumulative Layout Shift):** < 0.1
  - Aspect ratios fijos en imágenes
  - Skeleton screens del mismo tamaño
  - No dynamic content injection

#### Custom Metrics:
- **Time to Interactive:** < 3.5s
- **First Contentful Paint:** < 1.8s
- **Total Blocking Time:** < 300ms

#### Optimization Strategies:
1. **Image Optimization**
   - WebP/AVIF con fallback
   - Responsive images con srcset
   - Lazy loading con IntersectionObserver
   - Cloudinary transformations

2. **Code Splitting**
   - Dynamic imports para modals
   - Route-based splitting
   - Component-level splitting

3. **Caching Strategy**
   - SWR for product data
   - Service Worker para assets
   - CDN caching headers

### 8.5 Accesibilidad (WCAG 2.1 AA)

#### Keyboard Navigation:
- Tab order lógico
- Focus visible mejorado
- Skip links para navegación
- Escape para cerrar modals

#### Screen Readers:
- ARIA labels descriptivos
- ARIA live regions para actualizaciones
- Semantic HTML
- Alt text significativos

#### Contraste de Color:
- Mínimo 4.5:1 para texto normal
- Mínimo 3:1 para texto grande
- Herramienta: WebAIM Contrast Checker

#### Touch Targets:
- Mínimo 44x44px (WCAG 2.5.5)
- Espaciado adecuado entre elementos
- No overlapping clickable areas

### 8.6 SEO Optimization

```typescript
// app/productos/page.tsx
export const metadata: Metadata = {
  title: 'Catálogo de Productos Premium | Confitería Quelita',
  description: 'Descubre nuestra selección premium de dulces, chocolates y confitería artesanal. Calidad garantizada y envío a todo el país.',
  openGraph: {
    title: 'Catálogo Premium - Confitería Quelita',
    description: 'Explora nuestros productos artesanales',
    images: ['/images/og-catalog.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
  },
  alternates: {
    canonical: '/productos',
  },
};
```

**Schema Markup:**
```typescript
const productListSchema = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  "itemListElement": products.map((product, index) => ({
    "@type": "ListItem",
    "position": index + 1,
    "item": {
      "@type": "Product",
      "name": product.name,
      "image": product.images[0],
      "offers": {
        "@type": "Offer",
        "price": product.price,
        "priceCurrency": "ARS",
        "availability": product.stock > 0 ? "InStock" : "OutOfStock"
      }
    }
  }))
};
```

---

## 9. PLAN DE IMPLEMENTACIÓN

### 9.1 Fases del Proyecto

#### FASE 1: Fundación (Semana 1)
**Objetivo:** Establecer base del nuevo sistema de diseño

**Tareas:**
1. Actualizar `globals.css` con nuevas variables premium
2. Crear archivo `premium.css` con animaciones y utilities
3. Implementar nuevos componentes base de shadcn/ui (si faltan)
4. Configurar Storybook para documentación
5. Setup de testing con React Testing Library

**Entregables:**
- Sistema de diseño documentado
- Storybook funcional
- Variables CSS actualizadas

#### FASE 2: Componentes Core (Semana 2)
**Objetivo:** Crear componentes principales premium

**Tareas:**
1. **ProductCardPremium**
   - Layout base
   - Hover effects
   - Mobile optimization
   - Variantes selector mejorado

2. **FiltersPremium**
   - Sidebar desktop
   - Drawer mobile
   - Applied filters chips
   - Price range slider mejorado

3. **SearchBarPremium**
   - Autocomplete
   - Sugerencias
   - Recent searches

**Entregables:**
- 3 componentes premium documentados
- Tests unitarios
- Storybook stories

#### FASE 3: Layout y Navegación (Semana 3)
**Objetivo:** Implementar estructura principal de la página

**Tareas:**
1. **Hero Section**
   - Diseño responsive
   - Animaciones
   - CTA optimization

2. **CategoryPillsPremium**
   - Scroll behavior
   - Active states
   - Icons integration

3. **ProductGridPremium**
   - Responsive grid
   - Skeleton loading
   - Infinite scroll (opcional)

4. **Toolbar Section**
   - Sort selector mejorado
   - View toggle
   - Results counter

**Entregables:**
- Página `/productos` completamente rediseñada
- Mobile-first responsive
- Loading states implementados

#### FASE 4: Interacciones Premium (Semana 4)
**Objetivo:** Agregar detalles y microinteracciones

**Tareas:**
1. **QuickViewModalPremium**
   - Galería mejorada
   - Zoom functionality
   - Mobile full-screen

2. **EmptyState**
   - Ilustración personalizada
   - Sugerencias inteligentes
   - CTAs relevantes

3. **Microanimaciones**
   - Hover effects refinados
   - Transiciones suaves
   - Loading states elegantes

4. **Sticky Elements**
   - Sticky toolbar on scroll
   - Sticky filters sidebar
   - Sticky mobile actions

**Entregables:**
- Quick view funcional
- Empty states completos
- Animaciones refinadas

#### FASE 5: Optimización y Testing (Semana 5)
**Objetivo:** Performance y calidad

**Tareas:**
1. **Performance Optimization**
   - Lighthouse audit
   - Core Web Vitals check
   - Image optimization verification
   - Code splitting review

2. **Accessibility Audit**
   - WCAG 2.1 AA compliance
   - Keyboard navigation testing
   - Screen reader testing
   - Contrast verification

3. **Cross-browser Testing**
   - Chrome, Firefox, Safari
   - Edge, Samsung Internet
   - iOS Safari, Android Chrome

4. **Responsive Testing**
   - Mobile devices (320px-767px)
   - Tablets (768px-1023px)
   - Desktop (1024px+)
   - Large screens (1920px+)

**Entregables:**
- Performance report
- Accessibility audit document
- Cross-browser compatibility matrix
- Bug fixes implementados

#### FASE 6: Polish y Deploy (Semana 6)
**Objetivo:** Refinamiento final y lanzamiento

**Tareas:**
1. **Visual Polish**
   - Spacing refinement
   - Typography adjustments
   - Color harmony verification
   - Animation timing tweaks

2. **User Testing**
   - Internal testing team
   - Beta users (opcional)
   - A/B testing setup
   - Analytics events

3. **Documentation**
   - Component usage guide
   - Design system documentation
   - Developer handbook
   - Changelog

4. **Deployment**
   - Staging deployment
   - QA verification
   - Production deployment
   - Monitoring setup

**Entregables:**
- Página rediseñada en producción
- Documentación completa
- Monitoring dashboard
- Success metrics baseline

### 9.2 Estrategia de Rollout

#### Opción A: Big Bang (Recomendada si timeline apretado)
- Desarrollar todo en feature branch
- Testing extensivo en staging
- Deploy completo en producción
- Rollback plan preparado

**Pros:**
- Una sola migración
- Consistencia inmediata
- Menos complejidad técnica

**Contras:**
- Mayor riesgo
- Requiere testing exhaustivo
- No hay validación incremental

#### Opción B: Gradual Rollout (Recomendada para minimizar riesgo)

**Fase 1:** Feature Flag (10% usuarios)
- Deploy con feature flag deshabilitado
- Habilitar para 10% de tráfico
- Monitorear métricas 48h

**Fase 2:** Expansión (30% usuarios)
- Si métricas positivas, expandir a 30%
- Continuar monitoreo
- Ajustar basado en feedback

**Fase 3:** Mayoría (60% usuarios)
- Expandir a 60% de tráfico
- Validar performance a escala
- Bug fixes si necesario

**Fase 4:** Full Rollout (100%)
- Deploy completo
- Remover feature flag
- Celebrar 🎉

**Pros:**
- Menor riesgo
- Feedback incremental
- Fácil rollback parcial

**Contras:**
- Más complejo técnicamente
- Requiere feature flag system
- Timeline más largo

### 9.3 Métricas de Seguimiento Durante Rollout

```typescript
// analytics-events.ts
const trackProductCatalogEvent = (event: {
  action: 'view' | 'filter' | 'sort' | 'add_to_cart' | 'quick_view';
  category?: string;
  product_id?: string;
  filters_applied?: string[];
  sort_by?: string;
}) => {
  // GTM or analytics tracking
};
```

**Métricas Clave:**
1. **Engagement**
   - Time on page
   - Products viewed
   - Filter usage rate
   - Quick view open rate

2. **Conversion**
   - Add to cart rate
   - Products per session
   - Bounce rate
   - Exit rate

3. **Performance**
   - Page load time
   - Time to interactive
   - LCP, FID, CLS

4. **UX Quality**
   - Error rate
   - Search success rate
   - Filter refinement rate
   - Mobile vs desktop behavior

---

## 10. MÉTRICAS DE ÉXITO

### 10.1 KPIs de Negocio

**Objetivo:** Aumentar conversión y engagement

| Métrica | Baseline Actual | Target Post-Rediseño | Plazo |
|---------|----------------|---------------------|-------|
| **Conversion Rate** | (Medir actual) | +15% | 1 mes |
| **Add to Cart Rate** | (Medir actual) | +20% | 1 mes |
| **Products per Session** | (Medir actual) | +25% | 1 mes |
| **Time on Page** | (Medir actual) | +30% | 1 mes |
| **Bounce Rate** | (Medir actual) | -20% | 1 mes |
| **Mobile Conversion** | (Medir actual) | +40% | 2 meses |
| **Search Usage** | (Medir actual) | +35% | 1 mes |
| **Filter Usage** | (Medir actual) | +50% | 1 mes |

### 10.2 KPIs Técnicos

**Objetivo:** Mantener/mejorar performance

| Métrica | Target | Herramienta |
|---------|--------|-------------|
| **Lighthouse Score** | > 90 | Chrome DevTools |
| **LCP** | < 2.5s | Core Web Vitals |
| **FID** | < 100ms | Core Web Vitals |
| **CLS** | < 0.1 | Core Web Vitals |
| **TTI** | < 3.5s | Lighthouse |
| **Bundle Size** | < 200KB (gzipped) | Webpack Bundle Analyzer |
| **API Response Time** | < 500ms p95 | Backend monitoring |

### 10.3 KPIs de UX

**Objetivo:** Mejorar satisfacción del usuario

| Métrica | Método de Medición | Target |
|---------|-------------------|--------|
| **User Satisfaction** | NPS Survey | > 50 |
| **Task Completion Rate** | User Testing | > 90% |
| **Error Rate** | Analytics | < 2% |
| **Accessibility Score** | WAVE / aXe | 100% WCAG AA |
| **Mobile Usability** | Google Search Console | Sin issues |

### 10.4 Plan de Medición

#### Pre-Launch (1 semana antes):
1. Establecer baselines de todas las métricas
2. Configurar dashboards de monitoreo
3. Setup A/B testing (si aplica)
4. Preparar encuestas de satisfacción

#### Post-Launch (1 mes después):
1. **Semana 1:**
   - Monitoreo diario de métricas críticas
   - Hotfix de bugs críticos
   - Recolección de feedback inicial

2. **Semana 2:**
   - Análisis de tendencias
   - Ajustes menores de UI/UX
   - Optimización de performance

3. **Semana 3:**
   - Comparación con baselines
   - Identificación de oportunidades
   - Planning de iteraciones

4. **Semana 4:**
   - Reporte ejecutivo de resultados
   - Lessons learned
   - Roadmap de mejoras continuas

#### Seguimiento Continuo:
- **Mensual:** Review de KPIs principales
- **Trimestral:** User research sessions
- **Semestral:** Redesign evaluation

---

## ANEXOS

### Anexo A: Checklist de QA

```markdown
## Pre-Launch Checklist

### Funcionalidad
- [ ] Búsqueda funciona correctamente
- [ ] Filtros se aplican sin errores
- [ ] Sorting cambia el orden correctamente
- [ ] Paginación funciona en ambas direcciones
- [ ] Add to cart desde catálogo funciona
- [ ] Quick view muestra datos correctos
- [ ] Variantes cambian precio e imagen
- [ ] URL se sincroniza con filtros
- [ ] Navegación entre categorías funciona
- [ ] Empty states muestran mensajes correctos

### UI/UX
- [ ] Spacing consistente en todos los breakpoints
- [ ] Tipografía legible y jerarquizada
- [ ] Colores según design system
- [ ] Hover effects funcionan en desktop
- [ ] Touch targets de 44x44px mínimo en mobile
- [ ] Animaciones suaves sin jank
- [ ] Loading states claros
- [ ] Error states informativos
- [ ] Success feedback visible

### Responsive
- [ ] Mobile (320px - 767px)
- [ ] Tablet (768px - 1023px)
- [ ] Desktop (1024px - 1439px)
- [ ] Large desktop (1440px+)
- [ ] Orientación landscape en mobile
- [ ] iPad specific tests

### Performance
- [ ] Lighthouse score > 90
- [ ] LCP < 2.5s
- [ ] FID < 100ms
- [ ] CLS < 0.1
- [ ] Bundle size optimizado
- [ ] Images lazy loaded
- [ ] No console errors
- [ ] No memory leaks

### Accessibility
- [ ] Keyboard navigation completa
- [ ] Focus visible en todos los elementos
- [ ] ARIA labels presentes
- [ ] Alt text en todas las imágenes
- [ ] Contraste de color WCAG AA
- [ ] Screen reader testing
- [ ] No flickering animations (epilepsy)

### Cross-Browser
- [ ] Chrome (últimas 2 versiones)
- [ ] Firefox (últimas 2 versiones)
- [ ] Safari (últimas 2 versiones)
- [ ] Edge (últimas 2 versiones)
- [ ] iOS Safari
- [ ] Android Chrome
- [ ] Samsung Internet

### SEO
- [ ] Metadata correcta
- [ ] Schema markup implementado
- [ ] Canonical URLs
- [ ] Robots.txt permite crawling
- [ ] Sitemap actualizado
- [ ] Semantic HTML
- [ ] H1-H6 hierarchy correcta
```

### Anexo B: Design Tokens (Exportable)

```json
{
  "colors": {
    "brand": {
      "primary": "oklch(0.685 0.203 27.33)",
      "secondary": "oklch(0.568 0.232 13.18)",
      "accent": "oklch(0.843 0.154 85.87)"
    },
    "neutral": {
      "50": "oklch(0.99 0 0)",
      "100": "oklch(0.97 0 0)",
      "200": "oklch(0.94 0 0)",
      "300": "oklch(0.88 0 0)",
      "400": "oklch(0.70 0 0)",
      "500": "oklch(0.56 0 0)",
      "600": "oklch(0.42 0 0)",
      "700": "oklch(0.30 0 0)",
      "800": "oklch(0.21 0 0)",
      "900": "oklch(0.15 0 0)"
    }
  },
  "typography": {
    "fontFamily": {
      "display": "'Playfair Display', serif",
      "sans": "'Inter', system-ui, sans-serif",
      "mono": "'Fira Code', monospace"
    },
    "fontSize": {
      "xs": "0.75rem",
      "sm": "0.875rem",
      "base": "1rem",
      "lg": "1.125rem",
      "xl": "1.25rem",
      "2xl": "1.563rem",
      "3xl": "1.953rem",
      "4xl": "2.441rem",
      "5xl": "3.052rem"
    },
    "fontWeight": {
      "light": 300,
      "normal": 400,
      "medium": 500,
      "semibold": 600,
      "bold": 700
    }
  },
  "spacing": {
    "1": "0.25rem",
    "2": "0.5rem",
    "3": "0.75rem",
    "4": "1rem",
    "5": "1.5rem",
    "6": "2rem",
    "7": "3rem",
    "8": "4rem",
    "9": "6rem",
    "10": "8rem"
  },
  "borderRadius": {
    "sm": "0.25rem",
    "md": "0.5rem",
    "lg": "0.75rem",
    "xl": "1rem",
    "2xl": "1.5rem",
    "full": "9999px"
  }
}
```

### Anexo C: Recursos y Referencias

#### Inspiración de Diseño:
- [Hermès E-commerce](https://www.hermes.com) - Elegancia y sofisticación
- [Net-a-Porter](https://www.net-a-porter.com) - Grid premium y filtros
- [Farfetch](https://www.farfetch.com) - Mobile-first excellence
- [Ladurée](https://www.laduree.com) - Confectionery premium aesthetic
- [Apple](https://www.apple.com) - Product presentation mastery

#### UX Research:
- [Baymard Institute - E-commerce UX](https://baymard.com/research/ecommerce-product-lists)
- [Nielsen Norman Group - Grid Systems](https://www.nngroup.com/articles/using-grids-in-interface-designs/)
- [Smashing Magazine - Layout Grids](https://www.smashingmagazine.com/2017/12/building-better-ui-designs-layout-grids/)

#### Technical Resources:
- [Next.js Performance](https://nextjs.org/docs/pages/building-your-application/optimizing)
- [Framer Motion Docs](https://www.framer.com/motion/)
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Web.dev Performance](https://web.dev/performance/)

#### Tools:
- **Design:** Figma, Adobe XD
- **Prototyping:** Framer, ProtoPie
- **Testing:** Lighthouse, WebPageTest, BrowserStack
- **Accessibility:** WAVE, aXe DevTools, Stark
- **Analytics:** Google Analytics 4, Hotjar, Microsoft Clarity

---

## CONCLUSIÓN

Este rediseño del catálogo de productos de Confitería Quelita representa una evolución significativa hacia una experiencia premium que combina:

✨ **Belleza Visual:** Diseño elegante y sofisticado con paleta cálida
🎯 **Funcionalidad Superior:** Features avanzadas que facilitan la navegación
📱 **Mobile-First:** Experiencia optimizada para el dispositivo principal
⚡ **Performance:** Velocidad sin sacrificar riqueza visual
♿ **Accesibilidad:** Inclusivo y usable para todos
📈 **Resultados:** Enfocado en conversión y satisfacción del usuario

### Próximos Pasos Recomendados:

1. **Aprobación de Propuesta:** Revisar y aprobar este documento
2. **Planning Sprint:** Refinar estimaciones y asignar recursos
3. **Design Mockups:** Crear mockups de alta fidelidad en Figma (opcional pero recomendado)
4. **Kick-off:** Comenzar Fase 1 del plan de implementación
5. **Iteración Continua:** Mejora basada en datos y feedback

**Esta propuesta está diseñada para ser flexible y adaptable.** Cada componente puede implementarse de forma incremental, permitiendo validación continua y ajustes basados en feedback real de usuarios.

---

**Preparado por:** Claude (Asistente IA)
**Fecha:** 3 de Diciembre, 2025
**Versión:** 1.0
**Estado:** Propuesta para Aprobación

---

## FUENTES Y REFERENCIAS

### Investigación de Tendencias E-commerce 2025:
- [15 Best Product Catalog 2025 - UI Creative](https://uicreative.net/blog/15-best-product-catalog-2025.html)
- [9 Best Product Catalog Website Designs (2025) | DesignRush](https://www.designrush.com/best-designs/websites/trends/best-product-catalog-website-designs)
- [Ecommerce Product Catalog Trends in 2025 | DCatalog](https://dcatalog.com/ecommerce-product-catalog-trends/)
- [The Future of Luxury E-Commerce: Where Premium Brands Need to Be in 2025](https://www.otherstandard.com/blog/the-future-of-luxurye-commerce-where-premium-brands-need-to-be-in-2025)
- [Luxury e-Commerce in 2025: Trends that will dominate this year — Gem Media](https://www.gemmedia.co/blog/2025-luxury-ecommerce-trends)
- [10+ Leading eCommerce Design Trends in 2025 [+ Examples] – GemPages](https://gempages.net/blogs/shopify/ecommerce-design-trends)

### Mejores Prácticas UX/UI:
- [Understanding Grid Systems in UI/UX Design: A Complete Guide for Modern Interfaces | Medium](https://medium.com/@faridafaijati/understanding-grid-systems-in-ui-ux-design-a-complete-guide-for-modern-interfaces-e619abc5c6c2)
- [Using Grids in Interface Designs - NN/G](https://www.nngroup.com/articles/using-grids-in-interface-designs/)
- [Mobile App UX Design: Grid View For Products | UX Planet](https://uxplanet.org/mobile-app-ux-design-grid-view-for-products-947e94c1fcb8)
- [Building Better UI Designs With Layout Grids — Smashing Magazine](https://www.smashingmagazine.com/2017/12/building-better-ui-designs-layout-grids/)

### Filtros y Navegación:
- [15 Filter UI Patterns That Actually Work in 2025 (With Examples)](https://bricxlabs.com/blogs/universal-search-and-filters-ui)
- [Homepage & Navigation UX Best Practices 2025 – Baymard](https://baymard.com/blog/ecommerce-navigation-best-practice)
- [E-Commerce Product Lists & Filtering UX: An Original UX Research Study – Baymard](https://baymard.com/research/ecommerce-product-lists)
- [25 Ecommerce Product Filters With UX Design Best Practices](https://thegood.com/insights/ecommerce-product-filters/)

### Product Cards y Hover Effects:
- [How to Design a Product Card to Convert Better – FoxEcom](https://foxecom.com/blogs/all/product-card-design)
- [A Comprehensive Study on Product Card Design Strategies: Optimizing the User Experience | Medium](https://j2zerozone.medium.com/a-comprehensive-study-on-product-card-design-strategies-optimizing-the-user-experience-437f6561c50b)
- [10 CSS Card Hover Effect Examples](https://www.subframe.com/tips/css-card-hover-effect-examples)
- [32 CSS Card Hover Effects | FreeFrontend](https://freefrontend.com/css-card-hover-effects/)

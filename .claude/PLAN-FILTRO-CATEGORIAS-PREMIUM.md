# PLAN DE IMPLEMENTACIÓN: FILTRO DE CATEGORÍAS PREMIUM MOBILE-FIRST

## 📋 ANÁLISIS COMPARATIVO

### Proyecto Anterior (Confitería) - Características
```tsx
✅ Diseño visual tipo "card" con iconos y colores personalizados
✅ Animaciones suaves (transform scale, transitions)
✅ Gradient header (from-pink-500 to-purple-500)
✅ Descripciones bajo cada categoría
✅ Iconos de Lucide React personalizados por categoría
✅ Estados visuales claros (seleccionado vs no seleccionado)
✅ Secciones colapsables con ChevronUp/Down
✅ Contador de productos
✅ Resumen de filtros activos con badges
```

### Proyecto Actual (Quelita) - Características
```tsx
✅ Sistema de filtros jerárquico (parent → subcategories)
✅ Animaciones con Framer Motion (más avanzadas)
✅ Búsqueda de categorías
✅ Checkboxes animados personalizados
✅ Emojis dinámicos por categoría
✅ Sistema de colores pastel rotativo
✅ Mobile-first con Sheet component (Shadcn)
✅ Esquemas de color por índice
✅ Estados: checked, indeterminate, unchecked
✅ Auto-expansión de categorías con hijos seleccionados
```

### 🎯 CONCLUSIÓN DEL ANÁLISIS
**El proyecto actual (Quelita) YA TIENE un sistema más avanzado que el anterior**. Sin embargo, el proyecto anterior tiene elementos visuales específicos que pueden **mejorar la experiencia mobile-first**.

---

## 🎨 ELEMENTOS A INTEGRAR DEL PROYECTO ANTERIOR

### 1. **Header con Gradiente Premium**
```tsx
// Del proyecto anterior
<div className="bg-gradient-to-r from-pink-500 to-purple-500 p-6 text-white">
  <Filter icon />
  <h3>Filtros</h3>
  <p>X productos encontrados</p>
  <button>Limpiar filtros</button>
</div>
```

**Adaptación Mobile-First:**
- Desktop: Header fijo en sidebar con gradiente
- Mobile: Header sticky en Sheet con gradiente y glassmorphism

### 2. **Cards de Categorías con Hover Effects**
```tsx
// Del anterior
<label className="p-3 rounded-xl border-2 hover:scale-105 shadow-md">
  <div className="p-2 rounded-lg bg-white shadow-sm">
    <IconComponent />
  </div>
  <span>Categoría</span>
  <div className="text-xs">Descripción</div>
</label>
```

**Adaptación:**
- Mantener el sistema actual de emojis
- Agregar efecto scale y shadow más prominente
- Agregar descripciones opcionales

### 3. **Resumen de Filtros Activos Mejorado**
```tsx
// Del anterior
<div className="p-4 bg-gradient-to-r from-pink-50 to-purple-50">
  <h4>Filtros Activos</h4>
  <div className="space-y-2">
    {filters.map(filter => (
      <div className="p-2 bg-white rounded-lg">
        <span>{filter}</span>
        <button><X /></button>
      </div>
    ))}
  </div>
</div>
```

---

## 🏗️ ARQUITECTURA MOBILE-FIRST

### Breakpoints Estratégicos
```css
Mobile:   < 640px  (sm)  - Sheet fullscreen, categorías en stack
Tablet:   640-1024px     - Sheet 90vh, 2 columnas de categorías
Desktop:  > 1024px (lg)  - Sidebar fijo, categorías en lista jerárquica
```

### Estructura de Componentes

```
FiltersPremium (wrapper principal)
├── FiltersHeader (nuevo componente)
│   ├── Gradient background
│   ├── Título + icono
│   ├── Contador de productos
│   └── Botón limpiar filtros
│
├── FiltersQuickActions (existente mejorado)
│   ├── Featured checkbox (mejorado visualmente)
│   └── On Sale checkbox (mejorado visualmente)
│
├── CategoryFilterPremium (mejorado)
│   ├── SearchBar (existente)
│   ├── CategoryCard (nuevo - estilo del proyecto anterior)
│   │   ├── Emoji/Icon (existente)
│   │   ├── Nombre + Badge contador
│   │   ├── Descripción opcional (nuevo)
│   │   ├── Hover effects mejorados
│   │   └── AnimatedCheckbox (existente)
│   │
│   └── SubcategoryList (existente mejorado)
│       └── SubcategoryCard con más visual feedback
│
├── BrandFilter (existente)
├── PriceRangeFilter (existente mejorado)
│   └── Visual price range display
│
└── ActiveFiltersPanel (nuevo - del proyecto anterior)
    └── Gradient background + badges interactivos
```

---

## 📱 DISEÑO MOBILE-FIRST DETALLADO

### Mobile (< 640px)

#### Sheet Component Layout
```tsx
<Sheet>
  {/* Header Sticky */}
  <SheetHeader className="sticky top-0 bg-gradient-primary z-10">
    <div className="bg-gradient-to-r from-pink-500/90 to-purple-500/90 backdrop-blur-md">
      <Filter + Title />
      <ProductCounter />
      {activeFilters > 0 && <ClearButton />}
    </div>
  </SheetHeader>

  {/* Content Scrollable */}
  <div className="overflow-y-auto pb-20">
    {/* Quick Filters - Cards horizontales */}
    <div className="grid grid-cols-2 gap-2 mb-4">
      <QuickFilterCard>Destacados</QuickFilterCard>
      <QuickFilterCard>En Oferta</QuickFilterCard>
    </div>

    {/* Categories - Stack vertical */}
    <CategoryList layout="stack">
      <CategoryCard size="large" showDescription={true} />
    </CategoryList>

    {/* Brands - Compact list */}
    <BrandFilter compact={true} maxVisible={8} />

    {/* Price - Visual slider */}
    <PriceFilter size="large" showVisualRange={true} />

    {/* Active Filters Summary */}
    {activeCount > 0 && (
      <ActiveFiltersPanelGradient />
    )}
  </div>

  {/* Footer Sticky */}
  <SheetFooter className="sticky bottom-0 bg-white/95 backdrop-blur border-t">
    <Button gradient="primary" size="lg" fullWidth>
      Ver {productCount} Productos
    </Button>
  </SheetFooter>
</Sheet>
```

#### Características Mobile
- **Touch targets mínimos:** 44x44px (WCAG AAA)
- **Spacing generoso:** p-4, gap-4 entre elementos
- **Categorías:** Cards grandes (min-height: 80px)
- **Texto legible:** text-base (16px) para labels
- **Botones:** Altura mínima 48px
- **Sheet height:** 90vh para dejar ver contenido detrás

### Tablet (640px - 1024px)

```tsx
{/* Categories - Grid de 2 columnas */}
<div className="grid sm:grid-cols-2 gap-3">
  <CategoryCard size="medium" />
</div>

{/* Brands - 2 columnas también */}
<div className="grid sm:grid-cols-2 gap-2">
  <BrandCheckbox />
</div>
```

### Desktop (> 1024px)

```tsx
<aside className="w-80 sticky top-20">
  {/* Header con gradiente */}
  <div className="bg-gradient-to-r from-pink-500 to-purple-500 p-6 rounded-t-2xl">
    <FilterHeader />
  </div>

  {/* Content */}
  <div className="bg-white border border-t-0 rounded-b-2xl p-6">
    {/* Lista vertical jerárquica */}
    <CategoryFilter layout="hierarchical" />
  </div>
</aside>
```

---

## 🎨 SISTEMA DE DISEÑO VISUAL

### Paleta de Colores (del globals.css actual)
```css
--primary: oklch(0.85 0.10 345)         /* Soft pastel pink */
--gradient-primary: linear-gradient(135deg,
  oklch(0.88 0.08 345),
  oklch(0.90 0.06 350))

Gradients adicionales disponibles:
- gradient-sunset (3 colores)
- gradient-candy
- gradient-golden
```

### Mapeo de Categorías → Colores + Iconos

```typescript
// Basado en seedCategories.ts
const categoryVisualConfig = {
  // Categorías principales
  'Categoria-1-Bebidas': {
    emoji: '🥤',
    gradient: 'from-cyan-400 to-blue-500',
    bgColor: 'bg-cyan-50',
    borderColor: 'border-cyan-200',
    textColor: 'text-cyan-700',
    description: 'Gaseosas, jugos, aguas y bebidas refrescantes'
  },
  'Categoria-2-Snacks': {
    emoji: '🥨',
    gradient: 'from-amber-400 to-orange-500',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    textColor: 'text-amber-700',
    description: 'Snacks salados, dulces y frutos secos'
  },
  'Categoria-3-Chocolates': {
    emoji: '🍫',
    gradient: 'from-brown-400 to-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-300',
    textColor: 'text-amber-800',
    description: 'Barras, bombones y chocolates premium'
  },
  'Categoria-4-Caramelos': {
    emoji: '🍬',
    gradient: 'from-pink-400 to-rose-500',
    bgColor: 'bg-pink-50',
    borderColor: 'border-pink-200',
    textColor: 'text-pink-700',
    description: 'Caramelos duros, gomitas y chicles'
  },
  'Categoria-5-Reposteria': {
    emoji: '🍰',
    gradient: 'from-purple-400 to-pink-500',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    textColor: 'text-purple-700',
    description: 'Galletas, alfajores y obleas'
  },
  'Categoria-6-Helados': {
    emoji: '🍦',
    gradient: 'from-blue-300 to-cyan-400',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-700',
    description: 'Paletas, cassatas y conos helados'
  }
};
```

### Animaciones y Transiciones

```tsx
// Framer Motion variants para CategoryCard
const cardVariants = {
  initial: { opacity: 0, y: 20, scale: 0.95 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.3, ease: 'easeOut' }
  },
  hover: {
    scale: 1.02,
    y: -2,
    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
    transition: { duration: 0.2 }
  },
  tap: { scale: 0.98 },
  selected: {
    scale: 1.02,
    boxShadow: '0 8px 32px rgba(245, 184, 208, 0.3)', // primary color shadow
  }
};

// Animación del checkbox
const checkboxVariants = {
  checked: {
    scale: [1, 1.2, 1],
    rotate: [0, 10, -10, 0],
    transition: { duration: 0.4, ease: 'easeOut' }
  }
};

// Stagger para lista de categorías
const listVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1
    }
  }
};
```

---

## 📝 COMPONENTES NUEVOS A CREAR

### 1. FiltersHeaderPremium.tsx
```tsx
interface FiltersHeaderPremiumProps {
  productCount?: number;
  activeFilterCount: number;
  onClearFilters: () => void;
  isMobile?: boolean;
}

<div className="bg-gradient-to-r from-pink-500 to-purple-500 p-4 sm:p-6">
  {/* Icon + Title */}
  <div className="flex items-center gap-3 mb-2">
    <Filter className="w-5 h-5 sm:w-6 sm:h-6" />
    <h3 className="text-lg sm:text-xl font-bold">Filtros</h3>
  </div>

  {/* Product Counter */}
  {productCount !== undefined && (
    <p className="text-sm text-white/90">
      {productCount} productos encontrados
    </p>
  )}

  {/* Clear Button */}
  {activeFilterCount > 0 && (
    <motion.button
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-3 flex items-center gap-2 text-white/90 hover:text-white"
    >
      <X size={16} />
      Limpiar filtros
    </motion.button>
  )}
</div>
```

### 2. CategoryCardPremium.tsx
```tsx
interface CategoryCardPremiumProps {
  category: CategoryWithSubcategories;
  isSelected: boolean;
  selectedChildCount?: number;
  visualConfig: VisualConfig;
  onToggle: () => void;
  onExpand?: () => void;
  size?: 'small' | 'medium' | 'large';
  showDescription?: boolean;
}

// Diseño del proyecto anterior + sistema actual
<motion.div
  variants={cardVariants}
  initial="initial"
  animate="animate"
  whileHover="hover"
  whileTap="tap"
  className={cn(
    'group relative flex items-center gap-3 p-3 sm:p-4',
    'rounded-xl border-2 transition-all duration-200 cursor-pointer',
    isSelected
      ? `${config.bgColor} ${config.borderColor} shadow-lg scale-105`
      : 'border-transparent hover:border-primary/30 bg-muted/30'
  )}
  onClick={onToggle}
>
  {/* Icon Container with gradient background */}
  <div className={cn(
    'flex items-center justify-center',
    'w-12 h-12 sm:w-14 sm:h-14 rounded-lg',
    'text-2xl sm:text-3xl',
    isSelected
      ? 'bg-white shadow-md'
      : `bg-gradient-to-br ${config.gradient}`
  )}>
    {config.emoji}
  </div>

  {/* Content */}
  <div className="flex-1 min-w-0">
    <div className="flex items-center gap-2">
      <span className={cn(
        'font-medium text-sm sm:text-base truncate',
        isSelected ? config.textColor : 'text-foreground'
      )}>
        {category.name}
      </span>

      {selectedChildCount > 0 && (
        <Badge className="bg-primary text-white">
          {selectedChildCount}
        </Badge>
      )}
    </div>

    {/* Description (nuevo del proyecto anterior) */}
    {showDescription && config.description && (
      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
        {config.description}
      </p>
    )}
  </div>

  {/* Checkbox */}
  <AnimatedCheckbox
    checked={isSelected}
    onChange={onToggle}
    colorScheme={config}
  />

  {/* Selection Indicator Bar */}
  <AnimatePresence>
    {isSelected && (
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: 4 }}
        exit={{ width: 0 }}
        className="absolute left-0 top-2 bottom-2 rounded-full bg-gradient-to-b ${config.gradient}"
      />
    )}
  </AnimatePresence>
</motion.div>
```

### 3. ActiveFiltersPanelPremium.tsx
```tsx
interface ActiveFiltersPanelPremiumProps {
  filters: Filters;
  categories: CategoryWithSubcategories[];
  brands: Brand[];
  onRemoveFilter: (type: string, value: string) => void;
}

<motion.div
  initial={{ opacity: 0, y: 10 }}
  animate={{ opacity: 1, y: 0 }}
  className="p-4 rounded-xl bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-100"
>
  <h4 className="font-semibold text-sm flex items-center gap-2 mb-3">
    <Sparkles className="w-4 h-4 text-primary" />
    Filtros Activos
  </h4>

  <div className="space-y-2">
    {filters.categories?.map(catId => {
      const cat = findCategory(catId, categories);
      const config = getCategoryConfig(cat?.name);

      return (
        <motion.div
          key={catId}
          layout
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          className="flex items-center justify-between p-2 bg-white rounded-lg shadow-sm"
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">{config.emoji}</span>
            <span className={cn('text-sm font-medium', config.textColor)}>
              {cat?.name}
            </span>
          </div>

          <motion.button
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onRemoveFilter('category', catId)}
            className="p-1 rounded-full hover:bg-pink-100"
          >
            <X className="w-4 h-4 text-pink-500" />
          </motion.button>
        </motion.div>
      );
    })}

    {/* Brands */}
    {filters.brands?.map(brandId => (/* similar */)}

    {/* Price Range */}
    {(filters.minPrice || filters.maxPrice) && (/* similar */)}
  </div>
</motion.div>
```

---

## 🔧 MODIFICACIONES A COMPONENTES EXISTENTES

### CategoryFilterPremium.tsx (modificar)

**Cambios:**
1. **Reemplazar ParentCategory** con `CategoryCardPremium`
2. **Agregar sistema de configuración visual** por categoría
3. **Mejorar efectos hover** con más shadow y scale
4. **Agregar descripciones opcionales**
5. **Mejorar responsive**: cards más grandes en mobile

```tsx
// ANTES
<ParentCategory
  category={parent}
  colorIndex={index}
  // ...
/>

// DESPUÉS
<CategoryCardPremium
  category={parent}
  isSelected={checkState !== 'unchecked'}
  selectedChildCount={selectedChildCount}
  visualConfig={getCategoryVisualConfig(parent.name)}
  size={isMobile ? 'large' : 'medium'}
  showDescription={isMobile || !parent.subcategories?.length}
  onToggle={() => handleParentToggle(parent)}
  onExpand={hasChildren ? () => toggleExpand(parent._id) : undefined}
/>
```

### FiltersPremium.tsx (modificar)

**Cambios:**
1. **Agregar FiltersHeaderPremium** al inicio
2. **Agregar ActiveFiltersPanelPremium** al final
3. **Mejorar Quick Filters** con card design
4. **Ajustar spacing mobile-first**

```tsx
// Mobile Sheet
<SheetContent side="bottom" className="h-[90vh]">
  <FiltersHeaderPremium
    productCount={productCount}
    activeFilterCount={activeCount}
    onClearFilters={clearAllFilters}
    isMobile
  />

  <ScrollArea className="flex-1 px-4 py-6">
    {/* Quick Filters - Grid en mobile */}
    <div className="grid grid-cols-2 gap-2 mb-6">
      <QuickFilterCardPremium
        checked={filters.featured}
        onChange={() => onFilterChange({ ...filters, featured: !filters.featured })}
        icon={Sparkles}
        label="Destacados"
      />
      <QuickFilterCardPremium
        checked={filters.onSale}
        onChange={() => onFilterChange({ ...filters, onSale: !filters.onSale })}
        icon={Tag}
        label="En Oferta"
      />
    </div>

    {/* Categories */}
    <CategoryFilterPremium
      categories={categories}
      selectedCategories={filters.categories || []}
      onSelectionChange={handleCategorySelectionChange}
      isMobile
    />

    {/* Brands */}
    <BrandFilterPremium brands={brands} ... />

    {/* Price */}
    <PriceRangeFilterPremium ... />

    {/* Active Filters Panel */}
    {activeCount > 0 && (
      <ActiveFiltersPanelPremium
        filters={filters}
        categories={categories}
        brands={brands}
        onRemoveFilter={handleRemoveFilter}
      />
    )}
  </ScrollArea>

  <SheetFooter className="border-t p-4 bg-white/95 backdrop-blur-md">
    <Button
      size="lg"
      className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white"
      onClick={() => setOpen(false)}
    >
      Ver {productCount} Productos
    </Button>
  </SheetFooter>
</SheetContent>

// Desktop Sidebar
<div className="bg-white rounded-2xl shadow-lg border border-pink-100 overflow-hidden">
  <FiltersHeaderPremium
    productCount={productCount}
    activeFilterCount={activeCount}
    onClearFilters={clearAllFilters}
  />

  <div className="p-6">
    {/* Resto del contenido */}
  </div>
</div>
```

---

## 📊 CONFIGURACIÓN VISUAL POR CATEGORÍA

### Crear archivo: `frontend/lib/categoryVisualConfig.ts`

```typescript
export interface CategoryVisualConfig {
  emoji: string;
  gradient: string;
  bgColor: string;
  borderColor: string;
  hoverBg: string;
  textColor: string;
  ringColor: string;
  description: string;
}

// Configuración basada en las categorías del seed
export const categoryVisualMap: Record<string, CategoryVisualConfig> = {
  'Categoria-1-Bebidas': {
    emoji: '🥤',
    gradient: 'from-cyan-400 to-blue-500',
    bgColor: 'bg-cyan-50',
    borderColor: 'border-cyan-200',
    hoverBg: 'hover:bg-cyan-100',
    textColor: 'text-cyan-700',
    ringColor: 'ring-cyan-300',
    description: 'Gaseosas, jugos, aguas y más'
  },
  // ... resto de categorías

  // Subcategorías de Bebidas
  'Subcat-1A-Gaseosas': {
    emoji: '🥤',
    gradient: 'from-cyan-300 to-blue-400',
    // ... config similar pero más clara
  },
  'Subcat-1B-Jugos': {
    emoji: '🧃',
    // ...
  },

  // Fallback genérico
  'default': {
    emoji: '📦',
    gradient: 'from-gray-300 to-gray-400',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    hoverBg: 'hover:bg-gray-100',
    textColor: 'text-gray-700',
    ringColor: 'ring-gray-300',
    description: 'Productos generales'
  }
};

export function getCategoryVisualConfig(
  categoryName: string
): CategoryVisualConfig {
  return categoryVisualMap[categoryName] || categoryVisualMap['default'];
}

// Función para obtener configuración por slug si es necesario
export function getCategoryVisualConfigBySlug(
  slug: string
): CategoryVisualConfig {
  const key = Object.keys(categoryVisualMap).find(k =>
    categoryVisualMap[k].slug === slug
  );
  return key ? categoryVisualMap[key] : categoryVisualMap['default'];
}
```

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

### Fase 1: Configuración Visual (30 min)
- [ ] Crear `frontend/lib/categoryVisualConfig.ts`
- [ ] Mapear TODAS las 27 categorías del seed (6 principales + 21 subcategorías)
- [ ] Asignar emojis, gradientes y colores a cada una
- [ ] Escribir descripciones breves y atractivas
- [ ] Exportar funciones helper

### Fase 2: Componentes Nuevos (1.5 horas)
- [ ] Crear `FiltersHeaderPremium.tsx`
  - [ ] Variant mobile (compact, sticky)
  - [ ] Variant desktop (con más padding)
  - [ ] Gradient background configurable
  - [ ] Contador de productos reactivo
  - [ ] Botón limpiar con animación

- [ ] Crear `CategoryCardPremium.tsx`
  - [ ] Sistema de tamaños (small, medium, large)
  - [ ] Integrar visualConfig
  - [ ] Animaciones Framer Motion
  - [ ] Descripción opcional
  - [ ] Indicadores visuales (bar, badge, shadow)
  - [ ] Touch targets 44x44px mínimo

- [ ] Crear `ActiveFiltersPanelPremium.tsx`
  - [ ] Gradient background
  - [ ] Badges animados por filtro
  - [ ] Botones de eliminación individual
  - [ ] Layout responsive (stack en mobile, grid en desktop)

- [ ] Crear `QuickFilterCardPremium.tsx`
  - [ ] Card design (no solo checkbox)
  - [ ] Icon + label
  - [ ] Animaciones hover/tap
  - [ ] Estados visuales claros

### Fase 3: Modificar Componentes Existentes (2 horas)

- [ ] **CategoryFilterPremium.tsx**
  - [ ] Importar `getCategoryVisualConfig`
  - [ ] Reemplazar `<ParentCategory>` con `<CategoryCardPremium>`
  - [ ] Ajustar props y lógica
  - [ ] Mejorar `<SubCategory>` con más visual feedback
  - [ ] Agregar prop `isMobile` para ajustar tamaños
  - [ ] Aumentar touch targets en mobile

- [ ] **FiltersPremium.tsx**
  - [ ] Agregar `<FiltersHeaderPremium>` arriba
  - [ ] Reemplazar Quick Filters con `<QuickFilterCardPremium>`
  - [ ] Agregar `<ActiveFiltersPanelPremium>` abajo
  - [ ] Ajustar spacing mobile-first
  - [ ] Mejorar SheetFooter con gradiente
  - [ ] Agregar glassmorphism en Sheet header
  - [ ] Ajustar ScrollArea padding

- [ ] **FiltersContent** (función interna)
  - [ ] Pasar `productCount` como prop
  - [ ] Pasar `isMobile` a todos los sub-componentes
  - [ ] Implementar `handleRemoveFilter` para ActiveFiltersPanel

### Fase 4: Ajustes Responsivos (1 hora)

- [ ] **Mobile (< 640px)**
  - [ ] CategoryCard: size="large", min-h-20, p-4
  - [ ] Quick Filters: grid-cols-2, gap-2
  - [ ] Sheet height: 90vh
  - [ ] Header: p-4, text-base
  - [ ] Footer button: h-14, text-base

- [ ] **Tablet (640px - 1024px)**
  - [ ] CategoryCard: size="medium", 2 columnas opcionales
  - [ ] Brands: 2 columnas
  - [ ] Sheet height: 85vh

- [ ] **Desktop (> 1024px)**
  - [ ] Sidebar: w-80
  - [ ] CategoryCard: size="medium", lista vertical
  - [ ] Header: p-6, rounded-t-2xl
  - [ ] Sticky positioning: top-20

### Fase 5: Pruebas y Refinamiento (1 hora)

- [ ] **Pruebas Funcionales**
  - [ ] Selección de categorías padre (select all children)
  - [ ] Selección individual de subcategorías
  - [ ] Estados indeterminate funcionando
  - [ ] Búsqueda de categorías
  - [ ] Limpiar filtros (individual y global)
  - [ ] Persistencia en URL

- [ ] **Pruebas Visuales**
  - [ ] Animaciones suaves en todos los estados
  - [ ] Gradientes renderizando correctamente
  - [ ] Touch targets suficientes (mobile)
  - [ ] Colores de categorías aplicados
  - [ ] Descripciones visibles donde corresponde

- [ ] **Pruebas Responsive**
  - [ ] Mobile portrait (320px - 480px)
  - [ ] Mobile landscape (480px - 640px)
  - [ ] Tablet portrait (640px - 768px)
  - [ ] Tablet landscape (768px - 1024px)
  - [ ] Desktop (1024px+)

- [ ] **Accesibilidad**
  - [ ] Touch targets > 44x44px
  - [ ] Focus visible en todos los elementos
  - [ ] Labels para screen readers
  - [ ] Keyboard navigation
  - [ ] Color contrast WCAG AA

### Fase 6: Optimización (30 min)

- [ ] **Performance**
  - [ ] Lazy load de categorías si > 20
  - [ ] Memoizar configuraciones visuales
  - [ ] Optimizar re-renders con React.memo
  - [ ] Reducir layout shifts

- [ ] **Bundle Size**
  - [ ] Tree-shaking de Framer Motion
  - [ ] Solo importar iconos usados de Lucide
  - [ ] Code splitting si necesario

---

## 📐 ESPECIFICACIONES TÉCNICAS

### Tamaños y Espaciados

```typescript
const SIZES = {
  mobile: {
    headerHeight: 'auto',
    categoryCard: {
      minHeight: '80px',
      padding: 'p-4',
      gap: 'gap-3',
      iconSize: 'w-12 h-12',
      fontSize: 'text-base',
    },
    quickFilter: {
      height: '60px',
      padding: 'p-3',
    },
    touchTarget: {
      minWidth: '44px',
      minHeight: '44px',
    },
    sheetHeight: '90vh',
    footerButtonHeight: 'h-14',
  },
  tablet: {
    categoryCard: {
      minHeight: '72px',
      padding: 'p-3',
    },
    sheetHeight: '85vh',
  },
  desktop: {
    sidebarWidth: '320px', // w-80
    categoryCard: {
      minHeight: '64px',
      padding: 'p-3',
      gap: 'gap-2.5',
      iconSize: 'w-10 h-10',
    },
    headerPadding: 'p-6',
  }
};
```

### Animaciones Estándar

```typescript
export const ANIMATION_DURATIONS = {
  fast: 0.15,
  normal: 0.2,
  slow: 0.3,
};

export const ANIMATION_EASINGS = {
  easeOut: [0.0, 0.0, 0.2, 1],
  easeInOut: [0.4, 0.0, 0.2, 1],
  spring: { type: 'spring', stiffness: 300, damping: 25 },
};
```

---

## 🎯 OBJETIVOS DE UX/UI

### Mobile-First Priorities

1. **Accesibilidad Táctil**
   - Touch targets > 44x44px en TODOS los elementos interactivos
   - Spacing generoso entre elementos (min 8px)
   - Botones y cards con área clickeable completa

2. **Velocidad de Filtrado**
   - Quick filters visibles sin scroll
   - Categorías principales above the fold
   - Search accesible en 1 tap

3. **Feedback Visual Inmediato**
   - Animaciones < 300ms
   - Estados hover/active claros
   - Contadores actualizados en tiempo real

4. **Navegación Eficiente**
   - Jerarquía visual clara
   - Breadcrumbs en filtros activos
   - Botón "Ver resultados" sticky

5. **Minimizar Scroll**
   - Secciones colapsables por defecto
   - Sticky header y footer
   - Scroll smooth

### Desktop Enhancements

1. **Hover States Ricos**
   - Scale + shadow en cards
   - Gradient transitions
   - Icon rotations suaves

2. **Layout Aprovechado**
   - Sidebar fijo (no mobile sheet)
   - Más información visible simultáneamente
   - Descripciones expandidas

3. **Interacciones Avanzadas**
   - Drag & drop (futuro)
   - Multi-select con Shift
   - Keyboard shortcuts

---

## 🚀 TIEMPO ESTIMADO TOTAL: **6-7 horas**

### Distribución:
- Configuración visual: 30 min
- Componentes nuevos: 1.5 horas
- Modificar existentes: 2 horas
- Responsivo: 1 hora
- Pruebas: 1 hora
- Optimización: 30 min
- Buffer/refinamiento: 30 min

---

## 📌 NOTAS IMPORTANTES

1. **NO eliminar funcionalidad existente** - El sistema actual es más avanzado, solo mejoramos visualmente

2. **Mantener jerarquía de categorías** - Sistema parent/children debe seguir funcionando igual

3. **Backward compatibility** - Componentes antiguos deben seguir funcionando si alguien los usa

4. **Progressive enhancement** - Si algo falla, el filtro básico debe seguir funcionando

5. **Performance first** - Animaciones deben ser opt-in en dispositivos lentos (`prefers-reduced-motion`)

6. **Tipo-seguridad** - Todos los componentes nuevos con TypeScript estricto

7. **Testing mobile real** - Probar en dispositivos físicos, no solo DevTools

---

## 🎨 INSPIRACIÓN VISUAL FINAL

```
┌─────────────────────────────────────────────┐
│  🎨 FILTROS                    [23 productos]│
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │ ← Gradient Header
│  ✨ Limpiar filtros                          │
├─────────────────────────────────────────────┤
│                                              │
│  ⚡ Filtros Rápidos                          │
│  ┌──────────┐  ┌──────────┐                │
│  │ ✨ Desta │  │ 🏷️ Oferta│                │
│  └──────────┘  └──────────┘                │
│                                              │
│  🔍 [Buscar categorías...]                  │
│                                              │
│  ┌────────────────────────────────────────┐ │
│  │ 🥤  Bebidas                       ✓ 2/3│ │
│  │     Gaseosas, jugos, aguas             │ │ ← Card con descripción
│  └────────────────────────────────────────┘ │
│    ├─ 🥤 Gaseosas                      ☑   │
│    ├─ 🧃 Jugos                          ☐   │
│    └─ 💧 Aguas                          ☑   │
│                                              │
│  ┌────────────────────────────────────────┐ │
│  │ 🍫  Chocolates                      ☐   │ │
│  │     Barras, bombones, premium          │ │
│  └────────────────────────────────────────┘ │
│                                              │
│  ... más categorías ...                     │
│                                              │
│  ✨ FILTROS ACTIVOS                         │
│  ┌────────────────────────────────────────┐ │
│  │ 🥤 Gaseosas                         ✕   │ │ ← Gradient panel
│  │ 💧 Aguas                            ✕   │ │
│  └────────────────────────────────────────┘ │
├─────────────────────────────────────────────┤
│  [Ver 23 Productos →]                       │ ← Sticky footer
└─────────────────────────────────────────────┘
```

---

## ✅ CRITERIOS DE ACEPTACIÓN

### Funcionales
- ✅ Todas las funcionalidades actuales se mantienen
- ✅ Categorías jerárquicas funcionan correctamente
- ✅ Búsqueda de categorías operativa
- ✅ Filtros se reflejan en URL
- ✅ Contador de productos actualizado
- ✅ Estados checked/indeterminate correctos

### Visuales
- ✅ Header con gradiente implementado
- ✅ Cards de categorías con hover effects
- ✅ Emojis y colores únicos por categoría
- ✅ Descripciones visibles en contexto apropiado
- ✅ Panel de filtros activos con gradiente
- ✅ Animaciones suaves < 300ms
- ✅ Indicadores visuales de selección

### Responsive
- ✅ Mobile: Sheet 90vh, cards grandes, touch targets > 44px
- ✅ Tablet: 2 columnas opcionales, sheet 85vh
- ✅ Desktop: Sidebar fijo 320px, lista vertical
- ✅ Sin layout shifts al cargar
- ✅ Smooth scrolling

### Performance
- ✅ First paint < 1s
- ✅ Interactions < 100ms
- ✅ No jank en animaciones (60fps)
- ✅ Bundle size increase < 20kb

### Accesibilidad
- ✅ WCAG AA color contrast
- ✅ Touch targets > 44x44px
- ✅ Keyboard navigation
- ✅ Screen reader labels
- ✅ Focus visible

---

## 🎉 FIN DEL PLAN

**Próximo paso:** Obtener aprobación del usuario para proceder con la implementación.

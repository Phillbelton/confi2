# CRITERIOS DE ACEPTACIÓN UI/UX PREMIUM
**Confitería Quelita - Ecommerce**

**Fecha:** 8 de Noviembre, 2025
**Versión:** 1.0
**Filosofía:** Mobile-First | Premium | Intuitivo | Accesible

---

## 🎯 PRINCIPIOS FUNDAMENTALES

### 1. Mobile-First es SAGRADO
- ✅ Todas las interacciones probadas primero en móvil (375px - iPhone SE)
- ✅ Touch targets mínimo 44x44px (Apple HIG)
- ✅ Gestos nativos: swipe, pinch-to-zoom, pull-to-refresh
- ✅ Teclado virtual no oculta campos activos
- ✅ Performance: First Contentful Paint < 1.8s en 3G

### 2. Calidad Premium = Micro-detalles
- ✅ Cada interacción tiene feedback visual (< 100ms)
- ✅ Transiciones suaves (cubic-bezier easing)
- ✅ Estados intermedios visibles (loading, success, error)
- ✅ Animaciones respetan `prefers-reduced-motion`
- ✅ Imágenes con blur placeholder + fade-in progresivo

### 3. Guiado y Tolerante a Errores
- ✅ Validación inline en tiempo real
- ✅ Errores descriptivos (no técnicos)
- ✅ Sugerencias y ayudas contextuales
- ✅ Deshacer acciones destructivas (30s grace period)
- ✅ Confirmación en acciones críticas

---

## 📱 CATÁLOGO DE PRODUCTOS (Cliente)

### CA-001: ProductCard Premium
**Prioridad:** CRÍTICA | **Rol:** Cliente/Visita

#### Criterios Funcionales:
1. **Imagen Optimizada:**
   - [ ] Next/Image con blur placeholder
   - [ ] AspectRatio 1:1 consistente
   - [ ] Lazy loading + fade-in suave
   - [ ] Fallback genérico si falta imagen
   - [ ] Zoom in sutil al hover (scale 1.05)

2. **Información Clara:**
   - [ ] Nombre del producto (2 líneas max, truncate con "...")
   - [ ] Marca en badge sutil (si existe)
   - [ ] Precio destacado (tamaño 1.25rem, font-semibold)
   - [ ] Si tiene descuento fijo: precio original tachado + precio con descuento
   - [ ] Badge de descuento visible (ej: "15% OFF")

3. **Variantes Visuales (si aplica):**
   - [ ] Si hasVariants: mostrar selector de atributos compacto
   - [ ] Ejemplo: "Tamaño: 500ml ▼" (desplegable)
   - [ ] Al cambiar variante: precio se actualiza con animación
   - [ ] Mostrar stock de variante seleccionada

4. **Descuentos Escalonados:**
   - [ ] Badge adicional si tiene tieredDiscount activo
   - [ ] Texto: "Desde {minQty} un ${precioConDescuento} c/u"
   - [ ] Color accent (naranja/dorado)
   - [ ] Tooltip al hover: tabla de descuentos

5. **Estados Especiales:**
   - [ ] Badge "AGOTADO" semi-transparente si stock = 0
   - [ ] Badge "NUEVO" si createdAt < 7 días
   - [ ] Badge "DESTACADO" si featured = true
   - [ ] Opacidad 0.6 si no disponible

6. **Interacciones:**
   - [ ] Hover: card scale 1.02 + shadow-2xl (desktop)
   - [ ] Botón "Agregar": loading → checkmark → badge carrito pulse
   - [ ] Click en imagen: abrir detalle de producto
   - [ ] Click en nombre: abrir detalle de producto

#### Criterios de Performance:
- [ ] Render < 16ms (60fps)
- [ ] CLS (Cumulative Layout Shift) = 0
- [ ] Imagen optimizada: WebP < 50KB

---

### CA-002: Filtros Avanzados Mobile-First
**Prioridad:** ALTA | **Rol:** Cliente/Visita

#### Criterios Funcionales:
1. **Layout Responsive:**
   - [ ] Mobile: botón flotante "Filtros" → Sheet slide-up
   - [ ] Desktop: sidebar sticky izquierda (300px)
   - [ ] Contador de filtros activos en badge

2. **Filtros Disponibles:**
   - [ ] **Búsqueda:** input con debounce 300ms
   - [ ] **Categorías:** accordion jerárquico (padre → hijos)
   - [ ] **Marcas:** checkboxes múltiples (max 10 visibles, "Ver más...")
   - [ ] **Precio:** slider rango con inputs manuales
   - [ ] **Tags:** chips seleccionables (sin gluten, vegano, etc.)
   - [ ] **En oferta:** toggle switch

3. **Interacciones:**
   - [ ] Aplicar filtros: animación de productos (fade out → fade in)
   - [ ] Limpiar filtros: botón "Limpiar todo" visible si hay activos
   - [ ] Cada filtro muestra cantidad de resultados en tiempo real
   - [ ] Mobile: botón "Aplicar" sticky bottom

4. **Performance:**
   - [ ] Aplicar filtros sin full page reload
   - [ ] URL actualizada con query params (SEO + compartible)
   - [ ] Paginación se resetea a página 1 al filtrar

#### Criterios de UX:
- [ ] Filtros colapsados por defecto (mobile)
- [ ] Iconos claros en cada sección
- [ ] Animación suave al expandir/colapsar
- [ ] Loading skeleton mientras se filtran resultados

---

### CA-003: Detalle de Producto con Variantes
**Prioridad:** CRÍTICA | **Rol:** Cliente/Visita

#### Criterios Funcionales:
1. **Galería de Imágenes:**
   - [ ] Imagen principal grande (AspectRatio 1:1)
   - [ ] Thumbnails debajo/al lado (embla-carousel)
   - [ ] Click → modal fullscreen con swipe
   - [ ] Zoom on hover (desktop)
   - [ ] Swipe para cambiar (mobile)

2. **Selector de Variantes (si aplica):**
   - [ ] Cada atributo en sección separada
   - [ ] Ejemplo: "Tamaño" → botones radio visuales
   - [ ] Variante seleccionada: border accent + checkmark
   - [ ] Variantes sin stock: disabled + badge "Agotado"
   - [ ] Al cambiar: precio, stock y SKU se actualizan

3. **Precio Dinámico:**
   - [ ] Precio base destacado (tamaño grande)
   - [ ] Si hay descuento fijo: precio original tachado
   - [ ] Descuento escalonado: tabla expandible
   - [ ] Ejemplo tabla:
     ```
     Cantidad    Precio c/u    Ahorro
     6-11 un     $450         10%
     12+ un      $425         15%
     ```
   - [ ] Animación al cambiar precio (número counting)

4. **Selector de Cantidad:**
   - [ ] Botones grandes + / - (touch-friendly)
   - [ ] Input numérico editable
   - [ ] Validación: min 1, max = stock disponible
   - [ ] Mostrar stock restante: "Quedan {stock} disponibles"
   - [ ] Si quantity >= minQty descuento: badge "Descuento aplicado"

5. **Botón Agregar al Carrito:**
   - [ ] Grande, destacado (h-12 mínimo)
   - [ ] Estados:
     - Default: "Agregar al carrito"
     - Loading: spinner + texto "Agregando..."
     - Success: checkmark + "Agregado" (1s)
     - Disabled si stock = 0
   - [ ] Al agregar: animación flyToCart + pulse en badge carrito

6. **Información Detallada:**
   - [ ] Tabs: Descripción | Especificaciones
   - [ ] Descripción con formato rich text
   - [ ] Tags visibles (chips pequeños)
   - [ ] Marca con logo (si existe)
   - [ ] Categorías como breadcrumbs clickeables

7. **Productos Relacionados:**
   - [ ] Carrusel horizontal (4 productos)
   - [ ] Mismo ProductCard del catálogo
   - [ ] "También te puede interesar" como título

#### Criterios de Performance:
- [ ] Largest Contentful Paint < 2.5s
- [ ] Time to Interactive < 3s
- [ ] Imágenes lazy load (excepto principal)

---

## 🛒 CARRITO DE COMPRAS

### CA-004: Carrito Sheet Premium
**Prioridad:** CRÍTICA | **Rol:** Cliente/Visita

#### Criterios Funcionales:
1. **Layout:**
   - [ ] Sheet slide-in desde derecha (desktop: 420px)
   - [ ] Sheet slide-up desde abajo (mobile: full height)
   - [ ] Header: "Carrito ({cantidad} items)" + botón cerrar
   - [ ] Body: ScrollArea con items
   - [ ] Footer: subtotal + botón checkout (sticky)

2. **Item del Carrito:**
   - [ ] Imagen thumbnail (80x80px)
   - [ ] Nombre del producto (1 línea)
   - [ ] Variante seleccionada (si aplica, pequeño)
   - [ ] Selector cantidad inline (+ / -)
   - [ ] Precio unitario
   - [ ] Subtotal del item
   - [ ] Botón eliminar (icono trash, confirmación)

3. **Cálculo Automático Descuentos:**
   - [ ] Por cada ProductParent, agrupar variantes por atributo
   - [ ] Si quantity >= minQty: aplicar descuento tier
   - [ ] Mostrar en UI: "Descuento 10% aplicado (6+ unidades)"
   - [ ] Color accent para descuentos

4. **Totales:**
   - [ ] Subtotal (suma items)
   - [ ] Descuentos totales (color verde, negativo)
   - [ ] Envío (si aplica, Fase 2)
   - [ ] Total final (destacado, grande)
   - [ ] Animación número counting al cambiar

5. **Interacciones:**
   - [ ] Agregar item: slide-in desde arriba + auto-scroll
   - [ ] Cambiar cantidad: actualización instantánea totales
   - [ ] Eliminar: animación slide-out + confirmación si > 3 items
   - [ ] Carrito vacío: ilustración + CTA "Ver productos"

6. **Persistencia:**
   - [ ] Guardar en localStorage cada cambio
   - [ ] Recuperar al recargar página
   - [ ] Mostrar badge con cantidad en header (siempre visible)

#### Criterios de Performance:
- [ ] Actualizar totales < 50ms
- [ ] Animaciones suaves 60fps

---

## 💬 CHECKOUT CON WHATSAPP

### CA-005: Flujo de Checkout Simplificado
**Prioridad:** CRÍTICA | **Rol:** Cliente/Visita

#### Criterios Funcionales:
1. **Step 1: Información de Contacto:**
   - [ ] Form con validación inline (react-hook-form + zod)
   - [ ] Campos:
     - Nombre completo *
     - WhatsApp * (input tel con formato)
     - Email (opcional)
     - Dirección completa *
     - Notas adicionales (textarea)
   - [ ] Errores inline con icono + mensaje claro
   - [ ] Auto-save en localStorage (cada 2s)

2. **Step 2: Método de Entrega:**
   - [ ] Radio group visual (cards grandes)
   - [ ] Opción 1: "Retiro en tienda" (gratis, badge)
   - [ ] Opción 2: "Envío a domicilio" (costo TBD)
   - [ ] Icono descriptivo en cada opción
   - [ ] Selección: border accent + checkmark

3. **Step 3: Resumen y Confirmación:**
   - [ ] Sidebar sticky (desktop) / Accordion (mobile)
   - [ ] Lista completa de productos
   - [ ] Subtotal, descuentos, envío, total
   - [ ] Datos ingresados en card resumido
   - [ ] Botón editar cada sección

4. **Botón "Enviar por WhatsApp":**
   - [ ] Verde (color WhatsApp oficial)
   - [ ] Icono WhatsApp
   - [ ] Loading state al generar mensaje
   - [ ] Al click:
     1. Crear orden en DB (status: pending_whatsapp)
     2. Generar mensaje pre-formateado
     3. Abrir WhatsApp Web/App con mensaje
     4. Mostrar pantalla confirmación

5. **Mensaje WhatsApp Pre-formateado:**
   ```
   ¡Hola! Quiero realizar el siguiente pedido:

   📦 PRODUCTOS:
   - 6× Coca-Cola 500ml - $450 c/u = $2.700
   - 2× Galletas Oreo - $800 c/u = $1.600

   💰 RESUMEN:
   Subtotal: $4.300
   Descuento: -$270 (10% por 6+ unidades)
   Envío: Gratis (Retiro en tienda)
   TOTAL: $4.030

   📍 DATOS:
   Nombre: Juan Pérez
   WhatsApp: +56 9 8123 4567
   Dirección: Calle 123, Santiago

   Número de orden: #QUE-20251108-001

   ¿Pueden confirmar disponibilidad?
   ```

6. **Pantalla de Confirmación:**
   - [ ] Checkmark animado grande
   - [ ] Confetti animation (canvas-confetti)
   - [ ] Mensaje: "¡Pedido enviado por WhatsApp!"
   - [ ] Número de orden destacado
   - [ ] Botón: "Ver mi pedido" (tracking)
   - [ ] Botón: "Seguir comprando"
   - [ ] Limpiar carrito

#### Criterios de UX:
- [ ] Progress bar arriba (3 steps)
- [ ] Navegación: botones Next/Prev
- [ ] No permitir avanzar si hay errores
- [ ] Resumen siempre visible (sticky)
- [ ] Confirmar antes de salir si hay datos ingresados

---

## 🎨 COMPONENTES BASE PREMIUM

### CA-006: Sistema de Diseño Base
**Prioridad:** CRÍTICA | **Rol:** Global

#### Criterios Visuales:
1. **Paleta de Colores:**
   ```css
   --primary: 25 95% 53%;        /* Naranja cálido #F97316 */
   --secondary: 340 82% 52%;     /* Rosa #E11D48 */
   --accent: 45 93% 58%;         /* Dorado #FBBF24 */
   --success: 142 76% 36%;       /* Verde */
   --error: 0 84% 60%;           /* Rojo */
   ```

2. **Tipografía:**
   - [ ] Font principal: DM Sans (body)
   - [ ] Font display: Comfortaa (headings, logo)
   - [ ] Escala modular: 1rem base
   - [ ] Headings: font-semibold, Comfortaa
   - [ ] Body: font-normal, DM Sans

3. **Espaciado:**
   - [ ] Sistema 4px base (0.25rem)
   - [ ] Componentes: padding múltiplos de 4
   - [ ] Márgenes consistentes
   - [ ] Container max-width: 1280px

4. **Sombras:**
   ```css
   shadow-sm: suave (cards)
   shadow-md: media (hover)
   shadow-lg: grande (modals)
   shadow-2xl: extra (pop-ups)
   ```

5. **Border Radius:**
   - [ ] sm: 0.375rem (6px) - badges, inputs
   - [ ] md: 0.5rem (8px) - buttons, cards
   - [ ] lg: 0.75rem (12px) - sheets, dialogs
   - [ ] full: rounded-full - avatars, floating buttons

#### Criterios de Accesibilidad:
- [ ] Contrast ratio ≥ 4.5:1 (texto normal)
- [ ] Contrast ratio ≥ 3:1 (texto grande, iconos)
- [ ] Focus visible en todos los interactivos
- [ ] Keyboard navigation completa
- [ ] Screen reader friendly (ARIA labels)

---

### CA-007: Loading States Profesionales
**Prioridad:** ALTA | **Rol:** Global

#### Criterios Funcionales:
1. **Skeleton Screens:**
   - [ ] ProductCard: shimmer animation
   - [ ] Lista: múltiples skeletons
   - [ ] No usar spinners genéricos

2. **Progress Indicators:**
   - [ ] Top loading bar (nprogress)
   - [ ] Buttons: spinner inline
   - [ ] Forms: disabled state visual

3. **Optimistic UI:**
   - [ ] Agregar al carrito: actualizar UI inmediato
   - [ ] Revertir si falla
   - [ ] Toast de error si falla

#### Criterios de Performance:
- [ ] Mostrar skeleton < 100ms
- [ ] Timeout máximo: 10s → error graceful

---

## 🔐 PANEL ADMIN (Super-Guiado)

### CA-008: Dashboard Intuitivo
**Prioridad:** ALTA | **Rol:** Admin/Funcionario

#### Criterios Funcionales:
1. **Métricas en Cards:**
   - [ ] Total productos (activos/inactivos)
   - [ ] Órdenes pendientes (badge pulsante si > 0)
   - [ ] Ventas del mes (simple)
   - [ ] Stock bajo (alerta si > 0)
   - [ ] Iconos grandes y claros
   - [ ] Números con animación counting

2. **Accesos Rápidos:**
   - [ ] "Nueva orden" (botón destacado)
   - [ ] "Agregar producto" (botón secundario)
   - [ ] "Órdenes pendientes" (link directo)
   - [ ] "Productos sin stock" (link directo)

3. **Tabla de Órdenes Recientes:**
   - [ ] 10 últimas órdenes
   - [ ] Columnas: Número, Cliente, Total, Estado
   - [ ] Click → ver detalle
   - [ ] Estados con badges de colores

#### Criterios de UX:
- [ ] Layout limpio, sin saturación
- [ ] Ayudas contextuales (tooltips)
- [ ] Acciones más usadas destacadas

---

### CA-009: Gestión de Productos con Wizard
**Prioridad:** CRÍTICA | **Rol:** Admin/Funcionario

#### Criterios Funcionales:
1. **Wizard de Creación (si tiene variantes):**
   - [ ] Step 1: Información básica
     - Nombre, descripción, categorías, marca
     - ¿Tiene variantes? (toggle grande y claro)
   - [ ] Step 2: Definir Variantes (solo si toggle = true)
     - Agregar atributo: nombre + valores
     - Preview en tabla
     - Validación: no duplicados
   - [ ] Step 3: Crear Variantes
     - Tabla con todas las combinaciones
     - Completar: SKU, precio, stock para cada una
     - Permitir desactivar combinaciones
   - [ ] Step 4: Imágenes
     - Drag & drop (react-dropzone)
     - Preview con reordenar
     - Máximo 5 imágenes
   - [ ] Step 5: Descuentos (opcional)
     - Descuento fijo: toggle + form
     - Descuento escalonado: agregar tiers

2. **Formulario Producto Simple (si no tiene variantes):**
   - [ ] Form directo (sin wizard)
   - [ ] Campos: nombre, descripción, precio, stock, categorías, marca, imágenes
   - [ ] Sección descuentos opcional

3. **Tabla de Productos:**
   - [ ] Búsqueda en tiempo real
   - [ ] Filtros: categoría, marca, activo/inactivo
   - [ ] Columnas: Imagen, Nombre, Precio, Stock, Estado
   - [ ] Acciones: Editar, Duplicar, Desactivar/Activar
   - [ ] Paginación
   - [ ] Ordenar por columna

4. **Validaciones y Ayudas:**
   - [ ] Tooltips en cada campo
   - [ ] Ejemplos en placeholders
   - [ ] Errores inline descriptivos
   - [ ] Modal de confirmación antes de eliminar
   - [ ] Detectar cambios no guardados

#### Criterios de UX:
- [ ] Wizard con progress bar visual
- [ ] Botones grandes y claros
- [ ] Colores: verde para confirmar, rojo para cancelar
- [ ] Auto-save draft cada 30s (opcional)
- [ ] Cargar datos existentes si es edición

---

### CA-010: Gestión de Órdenes
**Prioridad:** CRÍTICA | **Rol:** Admin/Funcionario

#### Criterios Funcionales:
1. **Tabla de Órdenes:**
   - [ ] Filtros: estado, fecha, método entrega
   - [ ] Búsqueda: por número de orden o cliente
   - [ ] Columnas: Número, Fecha, Cliente, Total, Estado
   - [ ] Estados con badges de colores:
     - pending_whatsapp: naranja
     - confirmed: azul
     - preparing: morado
     - shipped: verde claro
     - completed: verde
     - cancelled: rojo
   - [ ] Click → ver detalle

2. **Detalle de Orden:**
   - [ ] Número de orden grande
   - [ ] Timeline visual de estados
   - [ ] Información del cliente (card)
   - [ ] Lista de productos (tabla)
   - [ ] Totales (card destacado)
   - [ ] Selector de estado (dropdown)
   - [ ] Botón "Actualizar estado" (con confirmación)
   - [ ] Botón "Enviar WhatsApp" (si no enviado)
   - [ ] Campo "Notas admin" (textarea)

3. **Acciones Rápidas:**
   - [ ] Marcar como "Confirmada" (1 click)
   - [ ] Marcar como "Enviada" (1 click)
   - [ ] Cancelar orden (con motivo obligatorio)
   - [ ] Imprimir orden (window.print)

4. **Notificaciones:**
   - [ ] Sonido + badge si nueva orden
   - [ ] Toast cuando cambia estado
   - [ ] Confirmación antes de cancelar

#### Criterios de UX:
- [ ] Timeline de estados visualmente claro
- [ ] Colores consistentes con badges
- [ ] Acciones destructivas con confirmación
- [ ] Histórico de cambios visible (audit trail)

---

## ⚡ PERFORMANCE Y OPTIMIZACIONES

### CA-011: Métricas Core Web Vitals
**Prioridad:** ALTA | **Rol:** Global

#### Criterios Medibles:
1. **Largest Contentful Paint (LCP):**
   - [ ] < 2.5s (good)
   - [ ] Optimizar imágenes hero
   - [ ] Preload critical resources

2. **First Input Delay (FID):**
   - [ ] < 100ms (good)
   - [ ] Code splitting
   - [ ] Defer non-critical JS

3. **Cumulative Layout Shift (CLS):**
   - [ ] < 0.1 (good)
   - [ ] AspectRatio en todas las imágenes
   - [ ] Skeletons con dimensiones fijas

4. **Time to Interactive (TTI):**
   - [ ] < 3.5s (mobile 3G)
   - [ ] Lazy load below the fold
   - [ ] Optimize third-party scripts

#### Herramientas de Medición:
- [ ] Lighthouse CI en cada PR
- [ ] WebPageTest mobile
- [ ] Real User Monitoring (Vercel Analytics)

---

## ♿ ACCESIBILIDAD (WCAG 2.1 AA)

### CA-012: Criterios de Accesibilidad
**Prioridad:** MEDIA | **Rol:** Global

#### Criterios Funcionales:
1. **Teclado:**
   - [ ] Navegación completa con Tab
   - [ ] Focus visible en todos los elementos
   - [ ] Shortcuts documentados (ej: Ctrl+K para buscar)
   - [ ] Skip to main content

2. **Screen Readers:**
   - [ ] ARIA labels en iconos
   - [ ] Alt text descriptivo en imágenes
   - [ ] Live regions para cambios dinámicos
   - [ ] Landmark roles (nav, main, aside)

3. **Visual:**
   - [ ] Contrast ratio mínimo 4.5:1
   - [ ] Textos redimensionables hasta 200%
   - [ ] No información solo por color

4. **Formularios:**
   - [ ] Labels asociados a inputs
   - [ ] Errores descriptivos
   - [ ] Campos requeridos marcados visualmente

---

## 📊 CRITERIOS DE ACEPTACIÓN GENERAL

### Definición de "DONE" para cada historia:

✅ **Funcional:**
- Todos los criterios marcados
- Happy path + casos edge probados
- Validaciones frontend + backend

✅ **Visual:**
- Diseño match con mockups
- Responsive en 3 breakpoints (mobile, tablet, desktop)
- Animaciones suaves 60fps

✅ **Performance:**
- Lighthouse score > 90
- No errores en consola
- Bundle size razonable

✅ **Accesibilidad:**
- Focus visible
- Keyboard navigation
- ARIA labels correctos

✅ **Calidad de Código:**
- TypeScript sin errores
- ESLint sin warnings
- Componentes reutilizables

---

## 🚀 PRIORIZACIÓN

### MUST HAVE (MVP - 3 semanas):
- CA-001: ProductCard Premium
- CA-002: Filtros Avanzados
- CA-003: Detalle de Producto
- CA-004: Carrito Sheet
- CA-005: Checkout WhatsApp
- CA-006: Sistema de Diseño
- CA-009: Gestión de Productos
- CA-010: Gestión de Órdenes

### SHOULD HAVE (Post-MVP):
- CA-007: Loading States Avanzados
- CA-008: Dashboard Completo
- CA-011: Optimizaciones Performance
- CA-012: Accesibilidad Avanzada

### NICE TO HAVE (Fase 2):
- Wishlist/Favoritos
- Comparador de productos
- Reviews y calificaciones
- Notificaciones push

---

## 📝 NOTAS FINALES

**Filosofía del diseño:**
> "Mobile-first no es solo responsive design. Es pensar primero en el contexto de uso real: un cliente en la calle, con una mano ocupada, con sol en la pantalla, con datos limitados. El desktop es el bonus, no al revés."

**Sobre los descuentos escalonados:**
> "El usuario no debe hacer cuentas. El sistema debe mostrar claramente: 'Agregá 2 más y pagás $X menos por unidad'. Proactivo, no pasivo."

**Sobre el admin:**
> "Si tu hermano no puede crear un producto en 2 minutos sin llamarte, fallamos. La guía debe ser tan clara que un nuevo empleado pueda usarlo el primer día."

---

**Última actualización:** 8 de Noviembre, 2025
**Aprobado por:** Usuario + Claude
**Estado:** Listo para desarrollo frontend

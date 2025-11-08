# CONFITERÍA QUELITA - MVP SCOPE DEFINITION

## 1. OBJETIVO DEL MVP
Crear un ecommerce funcional mínimo que permita:
- Mostrar productos a clientes
- Realizar compras básicas
- Gestionar inventario y pedidos desde panel admin

**Plazo estimado:** 2-3 semanas
**Deploy:** VPS con Nginx + PM2

---

## 2. ARQUITECTURA TÉCNICA

### Stack Tecnológico

#### Frontend - EXPERIENCIA PREMIUM
```
Core:
- Next.js 14 (App Router - mejor para SEO y performance)
- TypeScript
- React 18 (Server Components + Client Components)

Estilos y UI:
- Tailwind CSS 3.4+ (utility-first)
- shadcn/ui (componentes premium, accesibles, customizables)
  * Basado en Radix UI (primitivos accesibles)
  * Headless UI con estilos Tailwind
  * Componentes copiables, no dependencia
- class-variance-authority (CVA) - variantes de componentes
- tailwind-merge + clsx - manejo de clases dinámicas

Animaciones y Microinteracciones:
- Framer Motion (animaciones fluidas, page transitions)
- Auto Animate (animaciones automáticas en listas)
- React Spring (opcional, para efectos físicos)

Formularios y Validación:
- React Hook Form (performance optimizado)
- Zod (validación type-safe)
- @hookform/resolvers (integración RHF + Zod)

Estado Global:
- Zustand (simple, sin boilerplate)
- Zustand middleware (persist, devtools)

Imágenes y Media:
- next/image (optimización automática)
- react-dropzone (upload de imágenes drag & drop)
- sharp (procesamiento de imágenes en backend)

Iconos:
- Lucide React (iconos modernos, tree-shakeable)
- Heroicons (alternativamente)

Utilidades:
- date-fns (manejo de fechas, más ligero que moment)
- react-hot-toast (notificaciones elegantes)
- sonner (toast notifications premium)
- vaul (drawer/modal mobile-first)

Carrusel/Sliders:
- embla-carousel-react (moderno, accesible, touch-friendly)
- Swiper (alternativa robusta)

Data Fetching:
- TanStack Query (React Query v5) - cache, optimistic updates
- Axios (cliente HTTP)

SEO y Analytics:
- next-seo (meta tags optimizados)
- @vercel/analytics (preparado para analytics)
```

#### Backend
```
- Node.js 20+ LTS
- Express.js 5
- TypeScript
- MongoDB + Mongoose
- JWT (cookies httpOnly + refresh tokens)
- Bcrypt (hashing passwords)
- Multer (upload de archivos)
- Sharp (procesamiento de imágenes)
- Express Validator (validación de requests)
- Helmet (seguridad HTTP headers)
- Rate Limit (protección DDoS)
- Compression (compresión gzip)
```

#### Infraestructura VPS
```
- VPS Ubuntu 22.04 LTS
- Nginx (reverse proxy + static files)
- PM2 (process manager + auto-restart)
- MongoDB Atlas o MongoDB local
- Redis (opcional: cache y sessions)
- SSL Let's Encrypt (certbot)
- Cloudflare (opcional: CDN + DDoS protection)
```

### Estructura de Proyecto
```
nuevaConfi/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── styles/
│   │   ├── hooks/
│   │   ├── services/      # API calls
│   │   ├── store/         # Zustand
│   │   └── types/
│   └── public/
│
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── middleware/
│   │   ├── services/
│   │   └── types/
│   └── uploads/           # Imágenes de productos
│
└── docs/                  # Documentación
```

---

## 3. FUNCIONALIDADES DEL MVP

### 3.1 FRONTEND PÚBLICO (Cliente)

#### ✅ HOME PAGE
- [x] Header con logo y menú
- [x] Barra de búsqueda
- [x] Carrusel de categorías destacadas
- [x] Productos destacados (max 8)
- [ ] ~~Testimonios~~ (Fase 2)
- [x] Footer simple

#### ✅ CATÁLOGO DE PRODUCTOS
**Ruta:** `/productos`

**Funcionalidades:**
- [x] Listado de productos (grid responsive)
- [x] Paginación (20 productos por página)
- [x] Búsqueda por texto (nombre)
- [x] Filtros básicos:
  - Por categoría
  - Por rango de precio
  - Por disponibilidad (en stock)
- [x] Ordenamiento:
  - Más recientes
  - Precio: menor a mayor
  - Precio: mayor a menor

**Datos mostrados por producto:**
- Imagen principal
- Nombre
- Precio
- Precio con descuento (si aplica)
- Badge de descuento
- Botón "Agregar al carrito"
- Badge "Agotado" si no hay stock

#### ✅ DETALLE DE PRODUCTO
**Ruta:** `/productos/[id]`

**Funcionalidades:**
- [x] Galería de imágenes (si hay múltiples)
- [x] Información completa:
  - Nombre
  - Descripción
  - Precio original
  - Precio con descuento (si aplica)
  - Categoría
  - Marca
  - Stock disponible
- [x] Selector de cantidad
- [x] Botón "Agregar al carrito"
- [x] Productos relacionados (misma categoría, max 4)

#### ✅ CARRITO DE COMPRAS
**Componente:** Sidebar/Modal

**Funcionalidades:**
- [x] Ver productos agregados
- [x] Modificar cantidades
- [x] Eliminar productos
- [x] Ver subtotal
- [x] Ver descuentos aplicados (si existen)
- [x] Ver total
- [x] Botón "Proceder al checkout"
- [x] Persistencia en localStorage

#### ✅ CHECKOUT (NUEVO - SIMPLIFICADO CON WHATSAPP)
**Ruta:** `/checkout`

**FLUJO PERSONALIZADO:** El cierre de venta se realiza por WhatsApp

**Pasos:**

**Paso 1: Información de contacto**
- Nombre completo *
- Teléfono (WhatsApp) *
- Email
- Dirección de entrega (calle, número, ciudad, código postal)
- Notas adicionales (opcional)

**Paso 2: Método de entrega**
- [ ] Retiro en tienda (gratis)
- [ ] Envío a domicilio (pendiente: evaluar costo por zona)

**Paso 3: Resumen de orden**
- Productos (con imágenes, cantidades, precios)
- Subtotal
- Descuentos aplicados
- Envío (si aplica)
- Total
- Botón "Enviar pedido por WhatsApp"

**Resultado:**
- Al hacer clic en "Enviar pedido por WhatsApp":
  - Se genera un mensaje pre-formateado con todos los detalles:
    ```
    ¡Hola! Quiero realizar el siguiente pedido:

    📦 PRODUCTOS:
    - 2x Producto A - $1000
    - 1x Producto B - $500

    💰 RESUMEN:
    Subtotal: $1500
    Descuento: -$150
    Envío: $0 (Retiro en tienda)
    TOTAL: $1350

    📍 DATOS DE ENTREGA:
    Nombre: Juan Pérez
    Dirección: Calle 123, Ciudad

    ¿Pueden confirmar disponibilidad?
    ```
  - Se abre WhatsApp Web o App con el mensaje pre-cargado al número del negocio
  - Se guarda la orden en DB con estado "pending_whatsapp"
  - Pantalla de confirmación: "Tu pedido se envió por WhatsApp. En breve te contactaremos para confirmar."

**Configuración necesaria:**
- Número de WhatsApp del negocio (en variables de entorno)
- Formato del mensaje personalizable

#### ✅ AUTENTICACIÓN (OPCIONAL)
**Decisión:** Autenticación opcional - El usuario puede comprar con o sin cuenta

**Implementación:**
- Compra como invitado (por defecto)
- Opción de "Crear cuenta" durante o después del checkout
- Login con email/password para clientes registrados
- Ventajas de tener cuenta:
  - Ver historial de pedidos
  - Guardar dirección
  - Checkout más rápido (datos pre-llenados)
- Login obligatorio solo para admin

---

### 3.2 PANEL DE ADMINISTRACIÓN

#### ✅ LOGIN ADMIN
**Ruta:** `/admin/login`
- Email y password
- Solo usuarios con rol "admin"

#### ✅ DASHBOARD
**Ruta:** `/admin/dashboard`

**Métricas básicas:**
- Total de productos
- Total de órdenes
- Órdenes pendientes
- Ventas del mes (suma simple)

**Accesos rápidos:**
- Ver órdenes pendientes
- Agregar producto
- Ver productos con stock bajo

#### ✅ GESTIÓN DE PRODUCTOS
**Ruta:** `/admin/productos`

**Lista de productos:**
- Tabla con: imagen, nombre, precio, stock, categoría, estado (activo/inactivo)
- Búsqueda por nombre
- Filtro por categoría
- Paginación
- Acciones: Editar, Eliminar, Activar/Desactivar

**Crear/Editar producto:**
- Nombre *
- Descripción *
- Precio *
- Stock *
- Categoría *
- Marca
- Imágenes (1 principal + hasta 3 adicionales)
- Producto destacado (checkbox)
- Estado (activo/inactivo)

**Validaciones:**
- Precio > 0
- Stock >= 0
- Al menos 1 imagen

#### ✅ GESTIÓN DE CATEGORÍAS Y SUBCATEGORÍAS
**Ruta:** `/admin/categorias`

**CON SUBCATEGORÍAS (1 nivel):**

**Lista de categorías:**
- Vista jerárquica: Categoría principal → Subcategorías
- Expandir/colapsar subcategorías
- Acciones: Crear categoría, Crear subcategoría, Editar, Eliminar

**Crear/Editar Categoría Principal:**
- Nombre *
- Descripción
- Imagen (opcional)
- Color (hex, para badges)
- Orden (para ordenamiento en frontend)
- Activo/Inactivo

**Crear/Editar Subcategoría:**
- Categoría padre (selector) *
- Nombre *
- Descripción
- Imagen (opcional)
- Orden
- Activo/Inactivo

**Validaciones:**
- No eliminar categoría/subcategoría con productos asociados (mostrar alerta)
- Opción de reasignar productos antes de eliminar

#### ✅ GESTIÓN DE MARCAS
**Ruta:** `/admin/marcas`

**CRUD simple:**
- Nombre
- Logo
- Activo/Inactivo

#### ✅ GESTIÓN DE DESCUENTOS PERSONALIZADOS
**Ruta:** `/admin/descuentos`

**SISTEMA PERSONALIZADO - Descuentos a nivel de producto**

Los descuentos se configuran directamente en cada producto (no como entidades separadas).

**En el formulario de producto, agregar sección de descuentos:**

**Tipo 1: Descuento Fijo**
- Activar descuento fijo (checkbox)
- Tipo de descuento:
  - [ ] Porcentaje (ej: 15% off)
  - [ ] Monto fijo (ej: $200 off)
- Valor del descuento *
- Fecha inicio (opcional)
- Fecha fin (opcional)
- Mostrar badge en producto (ej: "15% OFF")

**Tipo 2: Descuento Escalonado (por cantidad)**
- Activar descuento escalonado (checkbox)
- Configuración de tiers (niveles):
  ```
  Ejemplo:
  - 2-5 unidades: 10% descuento
  - 6-10 unidades: 15% descuento
  - 11+ unidades: 20% descuento
  ```
- Interfaz para agregar/eliminar tiers:
  - Cantidad mínima *
  - Cantidad máxima (opcional, infinito si está vacío)
  - Tipo de descuento (porcentaje o monto fijo) *
  - Valor *

**Validaciones:**
- No puede haber solapamiento de rangos en tiers
- Cantidad mínima debe ser > 0
- Si hay descuento fijo y escalonado, aplicar el mejor para el cliente
- Descuento no puede hacer que precio sea negativo

**Mostrar en producto:**
- Badge de descuento activo
- Precio original tachado
- Precio con descuento destacado
- Mensaje de descuento escalonado: "Compra 6+ y obtén 15% descuento"

**Cálculo en carrito:**
- Aplicar descuento automáticamente según cantidad
- Mostrar ahorro total
- Desglose de descuentos aplicados

#### ✅ GESTIÓN DE ÓRDENES
**Ruta:** `/admin/ordenes`

**Lista de órdenes:**
- Tabla: Número, Fecha, Cliente, Total, Estado
- Filtros:
  - Por estado (pendiente, confirmada, enviada, completada, cancelada)
  - Por fecha
- Búsqueda por número de orden o email cliente
- Paginación

**Detalle de orden:**
- Número de orden
- Fecha y hora
- Estado (con selector para cambiar)
- Información del cliente:
  - Nombre
  - Email
  - Teléfono
  - Dirección de entrega
- Productos:
  - Lista con imagen, nombre, cantidad, precio unitario, subtotal
- Resumen:
  - Subtotal
  - Descuentos
  - Envío
  - Total
- Método de pago
- Método de entrega
- Notas del cliente
- Botón "Actualizar estado"
- Botón "Imprimir orden" (simple)

**Estados de orden:**
1. **Pending WhatsApp** (recién enviada por WhatsApp, esperando confirmación del negocio)
2. **Confirmada** (admin confirmó por WhatsApp y actualizó en sistema)
3. **Preparando** (armando el pedido)
4. **Enviada/Lista para retiro**
5. **Completada** (entregada y pagada)
6. **Cancelada**

**Notas sobre workflow:**
- El cliente envía pedido por WhatsApp desde el checkout
- La orden se crea automáticamente en DB con estado "pending_whatsapp"
- El admin ve las órdenes pendientes en el panel
- El admin confirma disponibilidad por WhatsApp con el cliente
- El admin actualiza el estado en el panel según avance la orden
- Funcionalidad de seguimiento para el cliente (opcional): consultar estado con número de orden

---

## 4. MODELOS DE BASE DE DATOS

### User
```typescript
{
  _id: ObjectId
  name: string
  email: string (unique)
  password: string (hashed)
  role: 'cliente' | 'admin'
  phone?: string
  createdAt: Date
  updatedAt: Date
}
```

### Product
```typescript
{
  _id: ObjectId
  name: string
  slug: string (unique, auto-generado)
  description: string
  price: number
  stock: number
  category: ObjectId (ref Category - puede ser categoría o subcategoría)
  brand?: ObjectId (ref Brand)
  images: string[] (URLs o paths)
  featured: boolean (default: false)
  active: boolean (default: true)

  // DESCUENTOS
  discount?: {
    // Descuento fijo
    fixed?: {
      enabled: boolean
      type: 'percentage' | 'amount'
      value: number
      startDate?: Date
      endDate?: Date
      badge?: string (ej: "15% OFF", "Oferta")
    }

    // Descuento escalonado por cantidad
    tiered?: {
      enabled: boolean
      tiers: [{
        minQuantity: number
        maxQuantity?: number (null = infinito)
        type: 'percentage' | 'amount'
        value: number
      }]
    }
  }

  createdAt: Date
  updatedAt: Date
}
```

### Category
```typescript
{
  _id: ObjectId
  name: string
  slug: string (unique)
  description?: string
  image?: string
  color?: string (hex, para badges)
  parent?: ObjectId (ref Category - null si es categoría principal)
  order: number (para ordenamiento, default: 0)
  active: boolean (default: true)
  createdAt: Date
  updatedAt: Date
}
```

**Nota:** Las subcategorías tienen `parent` apuntando a la categoría principal. Las categorías principales tienen `parent: null`.

### Brand
```typescript
{
  _id: ObjectId
  name: string
  slug: string (unique)
  logo?: string
  active: boolean (default: true)
  createdAt: Date
  updatedAt: Date
}
```

### ~~Discount~~ (NO USAR)
**Los descuentos están embebidos en el modelo Product, no como entidad separada.**

### Order
```typescript
{
  _id: ObjectId
  orderNumber: string (auto-generado único, ej: "QUE-20250102-001")

  // Cliente
  customer: {
    user?: ObjectId (ref User, si está autenticado)
    name: string
    email: string
    phone: string
    address: {
      street: string
      number: string
      city: string
      postalCode: string
    }
  }

  // Productos
  items: [{
    product: ObjectId (ref Product)
    name: string (snapshot)
    price: number (snapshot del precio al momento de compra)
    quantity: number
    discount: number (si aplica)
    subtotal: number
  }]

  // Montos
  subtotal: number
  totalDiscount: number
  shippingCost: number
  total: number

  // Entrega y pago
  deliveryMethod: 'pickup' | 'delivery'
  paymentMethod: 'cash' | 'transfer'
  paymentProof?: string (URL del comprobante si es transferencia)

  // Estado
  status: 'pending_whatsapp' | 'confirmed' | 'preparing' | 'shipped' | 'completed' | 'cancelled'

  // WhatsApp
  whatsappSent: boolean (true cuando se envió)
  whatsappSentAt?: Date

  // Notas
  customerNotes?: string
  adminNotes?: string

  // Timestamps
  createdAt: Date
  updatedAt: Date
  completedAt?: Date
  cancelledAt?: Date
}
```

---

## 5. ENDPOINTS API (Backend)

### Autenticación
```
POST   /api/auth/register      # Registrar usuario (si incluimos auth)
POST   /api/auth/login         # Login
POST   /api/auth/logout        # Logout
GET    /api/auth/me            # Obtener usuario actual
```

### Productos (Público)
```
GET    /api/products                    # Listar productos (con filtros, paginación)
GET    /api/products/:id                # Obtener producto por ID
GET    /api/products/slug/:slug         # Obtener producto por slug
GET    /api/products/featured           # Productos destacados
```

### Productos (Admin)
```
POST   /api/admin/products              # Crear producto
PUT    /api/admin/products/:id          # Actualizar producto
DELETE /api/admin/products/:id          # Eliminar producto
PATCH  /api/admin/products/:id/toggle   # Activar/desactivar
POST   /api/admin/products/:id/images   # Subir imágenes
```

### Categorías (Público)
```
GET    /api/categories                  # Listar categorías activas
GET    /api/categories/:id              # Obtener categoría
```

### Categorías (Admin)
```
POST   /api/admin/categories            # Crear
PUT    /api/admin/categories/:id        # Actualizar
DELETE /api/admin/categories/:id        # Eliminar
```

### Marcas (Público)
```
GET    /api/brands                      # Listar marcas activas
```

### Marcas (Admin)
```
POST   /api/admin/brands                # Crear
PUT    /api/admin/brands/:id            # Actualizar
DELETE /api/admin/brands/:id            # Eliminar
```

### ~~Descuentos~~ (NO NECESARIO)
**Los descuentos se manejan dentro de productos, no requieren endpoints separados.**
**El cálculo se hace en el frontend/backend al procesar el carrito.**

### Órdenes (Público)
```
POST   /api/orders                      # Crear orden (con datos para WhatsApp)
POST   /api/orders/whatsapp             # Generar mensaje de WhatsApp
GET    /api/orders/:orderNumber         # Consultar orden (tracking)
```

### Órdenes (Admin)
```
GET    /api/admin/orders                # Listar órdenes (con filtros)
GET    /api/admin/orders/:id            # Detalle de orden
PATCH  /api/admin/orders/:id/status     # Actualizar estado
PUT    /api/admin/orders/:id            # Actualizar orden completa
```

### Dashboard (Admin)
```
GET    /api/admin/dashboard/stats       # Estadísticas generales
```

---

## 6. DECISIONES CONFIRMADAS ✅

### Autenticación
✅ **Opcional** - Los clientes pueden comprar como invitados o crear cuenta para ver historial

### Sistema de Descuentos
✅ **Incluido en MVP** - Descuentos a nivel de producto:
- Descuento fijo (porcentaje o monto)
- Descuento escalonado por cantidad (tiers)

### Categorías
✅ **Con subcategorías** - 1 nivel de anidación (categoría → subcategoría)

### Checkout
✅ **Por WhatsApp** - El pedido se envía pre-formateado a WhatsApp del negocio

### Métodos de Pago
✅ **Efectivo y Transferencia** - Se coordinan por WhatsApp después

### Envío
⏳ **Evaluar durante desarrollo** - Inicialmente retiro en tienda (gratis), envío puede agregarse después con costo por zona

### Emails
✅ **Preparado para futuro** - Dejar infraestructura lista pero no enviar en MVP. Email de confirmación simple si hay tiempo.

### Configuraciones Adicionales
- **Límite de imágenes:** 1 principal + 4 adicionales (total 5 imágenes)
- **Tamaño máximo:** 3MB por imagen
- **Stock mínimo alerta:** 5 unidades
- **Productos por página:** 20
- **Número de WhatsApp:** Variable de entorno `WHATSAPP_BUSINESS_NUMBER`

---

## 7. COMPONENTES UI A REUTILIZAR DEL PROYECTO ACTUAL

### ✅ Copiar directamente:
- `/components/ui/*` (botones, inputs, cards, modals, etc.)
- `/components/Logo.tsx`
- `/components/Header.tsx` (adaptar)
- `/components/Footer.tsx` (simplificar)
- `/components/ProductCard.tsx`
- `/components/ProductGrid.tsx`
- `/components/CategoryCard.tsx`
- `/store/cartStore.ts` (adaptar para nueva estructura)
- Estilos de Tailwind y CSS globales

### ⚠️ Adaptar:
- `/components/Cart.tsx` (simplificar checkout)
- Filtros de productos (simplificar)

### ❌ NO copiar (rehacer):
- Todo el checkout actual
- Sistema de descuentos (si decides incluir, versión nueva simple)
- Componentes de órdenes admin

---

## 8. CRONOGRAMA ESTIMADO

### Semana 1: Setup + Backend
- Día 1-2: Estructura proyecto, configuración, modelos DB
- Día 3-4: APIs de productos, categorías, marcas
- Día 5: Sistema de autenticación
- Día 6-7: APIs de órdenes, descuentos (si aplica)

### Semana 2: Frontend
- Día 8-9: Setup frontend, copiar componentes UI, home page
- Día 10-11: Catálogo, detalle de producto, carrito
- Día 12-13: Checkout nuevo (simple)
- Día 14: Testing flujo completo cliente

### Semana 3: Admin + Deploy
- Día 15-16: Panel admin (productos, categorías, marcas)
- Día 17: Panel admin (órdenes, dashboard)
- Día 18-19: Testing completo, ajustes
- Día 20-21: Deploy VPS, configuración Nginx/PM2

---

## 9. VARIABLES DE ENTORNO NECESARIAS

### Backend (.env)
```env
# Base de datos
MONGODB_URI=mongodb+srv://...
DB_NAME=confiteria_quelita

# JWT
JWT_SECRET=tu_secreto_super_seguro_aqui
JWT_EXPIRES_IN=7d

# Server
PORT=5000
NODE_ENV=development

# WhatsApp Business
WHATSAPP_BUSINESS_NUMBER=5491234567890

# Frontend URL (para CORS)
FRONTEND_URL=http://localhost:3000

# Uploads
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=3145728

# Email (preparado para futuro)
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=
# SMTP_PASS=
# EMAIL_FROM=noreply@confiteriaquelita.com
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_WHATSAPP_NUMBER=5491234567890
NEXT_PUBLIC_SITE_NAME=Confitería Quelita
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

---

## 10. PRÓXIMOS PASOS - LISTO PARA EMPEZAR 🚀

**Todas las decisiones están tomadas. Procederemos con:**

1. ✅ Crear estructura de carpetas (frontend + backend)
2. ✅ Configurar package.json y dependencias
3. ✅ Configurar TypeScript en ambos proyectos
4. ✅ Crear modelos de Mongoose
5. ✅ Configurar Express con middleware básico
6. ✅ Crear APIs del backend
7. ✅ Configurar Next.js con Tailwind
8. ✅ Copiar componentes UI del proyecto anterior
9. ✅ Implementar páginas del frontend
10. ✅ Testing y ajustes finales

**COMENZAMOS AHORA CON LA ESTRUCTURA DEL PROYECTO.**

# Backend - Confitería Quelita

API REST para el sistema de ecommerce de Confitería Quelita.

## Stack Tecnológico

- **Runtime**: Node.js 20+ LTS
- **Framework**: Express.js 4.18+
- **Lenguaje**: TypeScript
- **Base de datos**: MongoDB con Mongoose
- **Autenticación**: JWT con cookies httpOnly
- **Validación**: Zod (runtime type validation)
- **Seguridad**: Helmet, Rate Limiting, CORS
- **Upload**: Multer + Sharp
- **Logging**: Winston

## Requisitos Previos

- Node.js 20+ LTS
- MongoDB (local o Atlas)
- NPM o Yarn

## Instalación

1. Instalar dependencias:
```bash
npm install
```

2. Configurar variables de entorno:
```bash
cp .env.example .env
```

Edita `.env` con tus valores:
- `MONGODB_URI`: URI de conexión a MongoDB
- `JWT_SECRET`: Secret para firmar tokens JWT (cambiar en producción)
- `WHATSAPP_BUSINESS_NUMBER`: Número de WhatsApp del negocio

3. Iniciar servidor de desarrollo:
```bash
npm run dev
```

El servidor estará disponible en `http://localhost:5000`

## Scripts Disponibles

```bash
npm run dev        # Desarrollo con hot-reload
npm run build      # Compilar TypeScript a JavaScript
npm start          # Producción (requiere build previo)
npm run lint       # Ejecutar ESLint
npm run lint:fix   # Corregir errores de ESLint automáticamente
```

## Estructura del Proyecto

```
backend/
├── src/
│   ├── config/           # Configuración (DB, env, logger)
│   ├── controllers/      # Lógica de negocio (sin validación)
│   ├── middleware/       # Middlewares (auth, validate, errors)
│   ├── models/           # Modelos de Mongoose
│   ├── routes/           # Definición de rutas + validación
│   ├── schemas/          # Schemas de validación Zod
│   ├── services/         # Servicios auxiliares
│   ├── types/            # Tipos TypeScript
│   ├── utils/            # Utilidades
│   └── server.ts         # Punto de entrada
├── uploads/              # Archivos subidos
├── dist/                 # Build output
├── package.json
├── tsconfig.json
└── .env.example
```

## Modelos de Base de Datos

### User
- `name`: string (nombre del usuario)
- `email`: string (único, índice)
- `password`: string (hasheado con bcrypt)
- `role`: 'cliente' | 'admin'
- `phone`: string (opcional)
- `address`: objeto (opcional)

### Product
- `name`: string
- `slug`: string (único, auto-generado)
- `description`: string
- `price`: number
- `stock`: number
- `category`: ObjectId (ref Category)
- `brand`: ObjectId (ref Brand, opcional)
- `images`: string[] (1-5 imágenes)
- `featured`: boolean
- `active`: boolean
- `discount`: objeto (descuentos fijo y escalonado)

### Category
- `name`: string
- `slug`: string (único)
- `description`: string (opcional)
- `image`: string (opcional)
- `color`: string (hex color)
- `parent`: ObjectId (ref Category, null si es principal)
- `order`: number (para ordenamiento)
- `active`: boolean

### Brand
- `name`: string (único)
- `slug`: string (único)
- `logo`: string (opcional)
- `active`: boolean

### Order
- `orderNumber`: string (único, auto-generado)
- `customer`: objeto (datos del cliente)
- `items`: array (productos con cantidades)
- `subtotal, totalDiscount, shippingCost, total`: number
- `deliveryMethod`: 'pickup' | 'delivery'
- `paymentMethod`: 'cash' | 'transfer'
- `status`: 'pending_whatsapp' | 'confirmed' | 'preparing' | 'shipped' | 'completed' | 'cancelled'
- `whatsappSent`: boolean
- `customerNotes, adminNotes`: string (opcional)

## Sistema de Descuentos

El modelo `Product` soporta dos tipos de descuentos:

### Descuento Fijo
```typescript
discount: {
  fixed: {
    enabled: true,
    type: 'percentage', // o 'amount'
    value: 15,          // 15% o $15
    startDate: Date,    // opcional
    endDate: Date,      // opcional
    badge: '15% OFF'
  }
}
```

### Descuento Escalonado
```typescript
discount: {
  tiered: {
    enabled: true,
    tiers: [
      { minQuantity: 2, maxQuantity: 5, type: 'percentage', value: 10 },
      { minQuantity: 6, maxQuantity: 10, type: 'percentage', value: 15 },
      { minQuantity: 11, maxQuantity: null, type: 'percentage', value: 20 }
    ]
  }
}
```

El método `product.calculateDiscount(quantity)` calcula automáticamente el mejor descuento aplicable.

## API Endpoints

### Autenticación
- `POST /api/auth/register` - Registrar usuario
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Obtener usuario actual

### Productos
- `GET /api/products` - Listar productos (con filtros y paginación)
- `GET /api/products/:id` - Obtener producto por ID
- `GET /api/products/slug/:slug` - Obtener producto por slug

### Categorías
- `GET /api/categories` - Listar categorías
- `GET /api/categories/:id` - Obtener categoría

### Marcas
- `GET /api/brands` - Listar marcas
- `GET /api/brands/:id` - Obtener marca

### Órdenes
- `POST /api/orders` - Crear orden
- `POST /api/orders/whatsapp` - Generar mensaje WhatsApp
- `GET /api/orders/:orderNumber` - Consultar orden

### Admin (requiere autenticación admin)
- CRUD completo para productos, categorías, marcas
- Gestión de órdenes
- Estadísticas del dashboard

## Arquitectura y Validación

### Flujo de Request

```
1. Request →
2. Rate Limiting →
3. Validación Zod (middleware) →
4. Autenticación JWT →
5. Autorización (roles) →
6. Controller (lógica de negocio) →
7. Response
```

### Validación con Zod

Todos los endpoints están protegidos con validación Zod en la capa de routing:

```typescript
// Ejemplo: routes/userRoutes.ts
router.post('/',
  validate(userSchemas.createUserSchema),  // ← Validación aquí
  authenticate,
  authorize('admin'),
  userController.createUser                 // ← Solo lógica de negocio
);
```

**Beneficios**:
- ✅ Validación ejecutándose antes de auth (mejor performance)
- ✅ Type-safety automático con TypeScript
- ✅ Controllers enfocados solo en lógica de negocio
- ✅ Errores de validación consistentes y descriptivos
- ✅ Schemas reutilizables y fáciles de mantener

Todos los schemas están en `src/schemas/` y siguen la convención `{recurso}Schemas.ts`.

## Seguridad

- **Helmet**: Headers de seguridad HTTP
- **CORS**: Configurado solo para frontend
- **Rate Limiting**: 100 requests / 15 minutos por IP (configurable por ruta)
- **JWT**: Tokens firmados con secret, almacenados en cookies httpOnly
- **Bcrypt**: Hash de contraseñas con salt rounds 10
- **Validación Zod**: Runtime type validation en todos los endpoints
- **AsyncHandler**: Manejo automático de errores asíncronos

## Deploy en VPS

### Con PM2

1. Build del proyecto:
```bash
npm run build
```

2. Instalar PM2 globalmente:
```bash
npm install -g pm2
```

3. Iniciar con PM2:
```bash
pm2 start dist/server.js --name confiteria-api
pm2 save
pm2 startup
```

4. Configurar Nginx como reverse proxy (ver guía de deploy)

### Variables de Entorno en Producción

Asegúrate de configurar en producción:
- `NODE_ENV=production`
- `JWT_SECRET` (diferente al de desarrollo)
- `MONGODB_URI` (apuntando a MongoDB Atlas o instancia productiva)
- `FRONTEND_URL` (URL del frontend en producción)

## Monitoreo

```bash
pm2 logs confiteria-api     # Ver logs
pm2 status                  # Ver estado
pm2 restart confiteria-api  # Reiniciar
pm2 stop confiteria-api     # Detener
```

## Health Check

```bash
curl http://localhost:5000/health
```

Respuesta:
```json
{
  "success": true,
  "message": "Server is running",
  "env": "development",
  "timestamp": "2025-01-02T..."
}
```

## Licencia

MIT

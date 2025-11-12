# Confitería Quelita - Ecommerce Platform

Sistema completo de ecommerce para Confitería Quelita con checkout personalizado por WhatsApp.

## 🚀 Stack Tecnológico

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Lenguaje**: TypeScript
- **Estilos**: Tailwind CSS + shadcn/ui
- **Estado**: Zustand
- **Data Fetching**: TanStack Query (React Query)
- **Formularios**: React Hook Form + Zod
- **Animaciones**: Framer Motion
- **UI Components**: shadcn/ui (Radix UI + Tailwind)

### Backend
- **Framework**: Express.js
- **Lenguaje**: TypeScript
- **Base de Datos**: MongoDB + Mongoose
- **Autenticación**: JWT (httpOnly cookies)
- **Seguridad**: Helmet, CORS, Rate Limiting
- **Upload**: Multer + Sharp

### Infraestructura
- **Deploy**: VPS con Ubuntu 22.04
- **Web Server**: Nginx (reverse proxy)
- **Process Manager**: PM2
- **SSL**: Let's Encrypt

## 📁 Estructura del Proyecto

```
nuevaConfi/
├── backend/              # API Express
│   ├── src/
│   │   ├── config/      # Configuración DB, env
│   │   ├── controllers/ # Lógica de negocio
│   │   ├── middleware/  # Auth, errors
│   │   ├── models/      # Mongoose models
│   │   ├── routes/      # Express routes
│   │   ├── services/    # Servicios auxiliares
│   │   ├── types/       # TypeScript types
│   │   ├── utils/       # Utilidades
│   │   └── server.ts    # Entry point
│   ├── uploads/         # Archivos subidos
│   └── package.json
│
├── frontend/            # Next.js App (crear con setup)
│   ├── app/            # App Router
│   ├── components/     # React components
│   ├── lib/            # Utilities, API clients
│   ├── hooks/          # Custom hooks
│   ├── store/          # Zustand stores
│   └── public/         # Static files
│
├── docs/               # Documentación
│   ├── MVP-SCOPE.md    # Alcance del MVP
│   └── UI-UX-PREMIUM.md # Guía UI/UX
│
└── README.md
```

## 🎯 Características Principales

### MVP Funcionalidades

#### Cliente (Público)
- ✅ Catálogo de productos con filtros avanzados
- ✅ Búsqueda de productos
- ✅ Carrito de compras persistente
- ✅ Sistema de descuentos (fijo y escalonado)
- ✅ Checkout simplificado con envío a WhatsApp
- ✅ Autenticación opcional (compra como invitado)
- ✅ Tracking de órdenes

#### Admin (Panel)
- ✅ Dashboard con estadísticas
- ✅ Gestión de productos (CRUD completo)
- ✅ Gestión de categorías y subcategorías
- ✅ Gestión de marcas
- ✅ Gestión de órdenes con estados
- ✅ Actualización de estado de órdenes

### Sistema de Descuentos Personalizado

**Descuento Fijo:**
- Por porcentaje o monto fijo
- Con fechas de inicio/fin opcionales
- Badge personalizable

**Descuento Escalonado:**
- Por cantidad (tiers configurables)
- Ejemplo: 2-5 unidades: 10% | 6-10: 15% | 11+: 20%
- Cálculo automático del mejor descuento

### Flujo de Checkout Único

1. Cliente llena datos (nombre, teléfono WhatsApp, dirección)
2. Selecciona método de entrega (retiro/envío)
3. Revisa resumen de orden
4. Click "Enviar por WhatsApp"
5. Se abre WhatsApp con mensaje pre-formateado:
   - Lista de productos
   - Totales y descuentos
   - Datos del cliente
6. Se guarda orden en DB con estado `pending_whatsapp`
7. Admin gestiona confirmación por WhatsApp

## 🚀 Setup e Instalación

### Requisitos Previos

- Node.js 20+ LTS
- MongoDB (local o Atlas)
- NPM

### 1. Clonar repositorio (si aplica)

```bash
git clone <url>
cd nuevaConfi
```

### 2. Setup Backend

```bash
cd backend
npm install
cp .env.example .env
# Editar .env con tus valores
npm run dev
```

El backend estará en: `http://localhost:5000`

Ver [backend/README.md](./backend/README.md) para más detalles.

### 3. Setup Frontend

```bash
# Desde la raíz del proyecto (nuevaConfi)
npx create-next-app@latest frontend
# Seguir los pasos interactivos (ver SETUP-FRONTEND.md)

cd frontend
npm install <dependencias adicionales>
npx shadcn@latest init
# Configurar shadcn/ui
npm run dev
```

El frontend estará en: `http://localhost:3000`

Ver [SETUP-FRONTEND.md](./SETUP-FRONTEND.md) para guía completa.

## 📚 Documentación

- [MVP-SCOPE.md](./MVP-SCOPE.md) - Alcance detallado del MVP
- [UI-UX-PREMIUM.md](./UI-UX-PREMIUM.md) - Guía de diseño UI/UX
- [backend/README.md](./backend/README.md) - Documentación del backend

## 🔐 Variables de Entorno

### Backend (.env)

```env
MONGODB_URI=mongodb+srv://...
DB_NAME=confiteria_quelita
JWT_SECRET=tu_secreto_seguro
PORT=5000
NODE_ENV=development
WHATSAPP_BUSINESS_NUMBER=5491234567890
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_WHATSAPP_NUMBER=5491234567890
NEXT_PUBLIC_SITE_NAME=Confitería Quelita
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## 🛠️ Scripts Disponibles

### Backend

```bash
npm run dev       # Desarrollo con hot-reload
npm run build     # Build para producción
npm start         # Iniciar en producción
npm run lint      # Linter
```

### Frontend

```bash
npm run dev       # Desarrollo
npm run build     # Build para producción
npm start         # Iniciar en producción
npm run lint      # Linter
```

## 📦 Deploy en VPS

### Preparación

1. VPS con Ubuntu 22.04
2. Instalar Node.js 20+
3. Instalar MongoDB (o usar Atlas)
4. Instalar Nginx
5. Instalar PM2 globalmente: `npm install -g pm2`

### Deploy Backend

```bash
cd backend
npm install
npm run build
pm2 start dist/server.js --name confiteria-api
pm2 save
pm2 startup
```

### Deploy Frontend

```bash
cd frontend
npm install
npm run build
pm2 start npm --name confiteria-web -- start
pm2 save
```

### Configurar Nginx

```nginx
server {
    listen 80;
    server_name tudominio.com;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Host $host;
    }

    # Archivos estáticos (uploads)
    location /uploads {
        proxy_pass http://localhost:5000/uploads;
    }
}
```

### SSL con Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d tudominio.com
```

## 🔍 Testing

### Scripts de Testing Automatizado

El proyecto incluye scripts automatizados de testing completo:

```bash
# Ejecutar todos los tests con reporte visual
npm run test:all

# Solo ejecutar tests en consola
npm test

# Generar reporte HTML
npm run test:report

# Crear usuario admin para testing
npm run create-admin
```

### Tests Incluidos

**✅ Service Health Checks**
- Backend running (http://localhost:5000)
- Frontend running (http://localhost:3000)
- MongoDB connection

**✅ API Endpoints**
- Categories (GET /api/categories)
- Brands (GET /api/brands)
- Products (GET /api/products/parents)
- Orders (GET /api/orders/*)
- Auth (POST /api/auth/login)

**✅ Frontend Pages**
- Home page (/)
- Products catalog (/productos)
- Checkout (/checkout)
- Admin panel (/admin/*)

**✅ Integration Tests**
- Product variants fetching
- Category filtering
- Full order flow

### Preparar Testing

```bash
# 1. Instalar dependencias en ambos proyectos
npm run install:all

# 2. Iniciar servicios (en terminales separadas)
npm run dev:backend    # Terminal 1
npm run dev:frontend   # Terminal 2

# 3. Crear usuario admin
npm run create-admin
# Luego cambiar rol a "admin" en MongoDB

# 4. Ejecutar tests
npm run test:all
```

### Ver Resultados

Los tests generan:
- **Consola**: Resultados coloridos en tiempo real
- **test-report.html**: Reporte visual completo

El reporte HTML se abre automáticamente e incluye:
- Dashboard con estadísticas
- Tests agrupados por categoría
- Tiempos de ejecución
- Mensajes de error detallados

### Documentación Completa

Ver [scripts/README-TESTING.md](./scripts/README-TESTING.md) para:
- Guía completa de uso
- Agregar nuevos tests
- Troubleshooting
- Integración continua (CI/CD)

## 📊 Monitoreo (PM2)

```bash
pm2 status                     # Ver estado de procesos
pm2 logs                       # Ver logs de todos los procesos
pm2 logs confiteria-api        # Ver logs del backend
pm2 logs confiteria-web        # Ver logs del frontend
pm2 restart all                # Reiniciar todos
pm2 stop all                   # Detener todos
```

## 🤝 Contribuir

1. Fork del proyecto
2. Crear rama feature: `git checkout -b feature/nueva-funcionalidad`
3. Commit cambios: `git commit -am 'Agregar nueva funcionalidad'`
4. Push a la rama: `git push origin feature/nueva-funcionalidad`
5. Abrir Pull Request

## 📝 Roadmap

### Fase 1 - MVP (2-3 semanas) ✅ En Progreso
- [x] Setup del proyecto
- [x] Modelos de base de datos
- [x] Backend API básico
- [ ] Frontend con shadcn/ui
- [ ] Sistema de descuentos
- [ ] Checkout con WhatsApp
- [ ] Panel admin
- [ ] Deploy en VPS

### Fase 2 - Mejoras Post-MVP
- [ ] Sistema de favoritos/wishlist
- [ ] Reviews y calificaciones
- [ ] Newsletter
- [ ] Sistema de cupones avanzado
- [ ] Notificaciones por email
- [ ] Analytics y reportes avanzados
- [ ] App móvil (React Native)

### Fase 3 - Optimizaciones
- [ ] CDN para imágenes (Cloudflare)
- [ ] Cache con Redis
- [ ] Elasticsearch para búsqueda
- [ ] Web push notifications
- [ ] PWA

## 📄 Licencia

MIT

## 👥 Equipo

Desarrollado para Confitería Quelita

---

**Estado Actual**: 🚧 En desarrollo (MVP - Fase 1)

Para más información, consulta la documentación en `/docs`

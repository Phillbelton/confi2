# 🚀 Guía de Deployment - Seenode

Esta guía te ayudará a desplegar **Confitería Quelita** como MVP en Seenode.

## 📋 Tabla de Contenidos

- [Requisitos Previos](#requisitos-previos)
- [Preparación del Proyecto](#preparación-del-proyecto)
- [Configuración de MongoDB Atlas](#configuración-de-mongodb-atlas)
- [Configuración de Variables de Entorno](#configuración-de-variables-de-entorno)
- [Deployment en Seenode](#deployment-en-seenode)
- [Verificación Post-Deployment](#verificación-post-deployment)
- [Troubleshooting](#troubleshooting)

---

## 📦 Requisitos Previos

### 1. Cuentas Necesarias

- ✅ **GitHub** - Para conectar repositorio
- ✅ **Seenode** - Cuenta activa
- ✅ **MongoDB Atlas** - Base de datos en la nube (gratuito)
- ✅ **Gmail** - Para configurar SMTP
- ✅ **Cloudinary** (opcional) - Para CDN de imágenes

### 2. Información que Necesitas Tener Lista

- [ ] Credenciales de Gmail (email + contraseña de aplicación)
- [ ] Número de WhatsApp Business
- [ ] String de conexión de MongoDB Atlas
- [ ] Credenciales de Cloudinary (opcional)

---

## 🔧 Preparación del Proyecto

### Paso 1: Remover Código de Testing/Development

#### 1.1 Remover Email Hardcoded de Prueba

**Archivo:** `backend/src/services/emailService.ts`

**Cambiar:**
```typescript
// HARDCODED: Enviar copia a email de prueba
const testEmail = 'fei.correaj@gmail.com';
const recipients = `${options.to}, ${testEmail}`;

const info = await this.transporter.sendMail({
  from: `"Confitería Quelita" <${ENV.EMAIL_FROM}>`,
  to: recipients,
  // ...
});
```

**Por:**
```typescript
const info = await this.transporter.sendMail({
  from: `"Confitería Quelita" <${ENV.EMAIL_FROM}>`,
  to: options.to,
  subject: options.subject,
  html: options.html,
  text: options.text || options.html.replace(/<[^>]*>/g, ''),
});
```

### Paso 2: Verificar Scripts de Build

Los scripts ya están configurados correctamente:

**Backend:**
```json
{
  "scripts": {
    "build": "tsc",
    "start": "node dist/server.js"
  }
}
```

**Frontend:**
```json
{
  "scripts": {
    "build": "next build",
    "start": "next start"
  }
}
```

### Paso 3: Crear Script de Post-Install (Backend)

Agrega al `package.json` del backend:

```json
{
  "scripts": {
    "build": "tsc",
    "start": "node dist/server.js",
    "postinstall": "npm run build"
  }
}
```

---

## 🗄️ Configuración de MongoDB Atlas

### Paso 1: Crear Cluster Gratuito

1. Ve a https://www.mongodb.com/cloud/atlas
2. Inicia sesión o crea cuenta
3. Click en **"Build a Database"**
4. Selecciona **FREE tier** (M0 Sandbox)
5. Elige región más cercana (ej: São Paulo o US East)
6. Click en **"Create Cluster"**

### Paso 2: Crear Usuario de Base de Datos

1. En el menú izquierdo, ve a **"Database Access"**
2. Click en **"Add New Database User"**
3. Método: **Password**
4. Username: `quelita-admin`
5. Password: Genera una contraseña segura (guárdala!)
6. Database User Privileges: **Atlas admin**
7. Click en **"Add User"**

### Paso 3: Configurar Network Access

1. En el menú izquierdo, ve a **"Network Access"**
2. Click en **"Add IP Address"**
3. Selecciona **"Allow Access from Anywhere"** (0.0.0.0/0)
4. Click en **"Confirm"**

⚠️ **Nota:** Para producción real, restringe IPs específicas.

### Paso 4: Obtener Connection String

1. Ve a **"Database"** → **"Connect"**
2. Selecciona **"Connect your application"**
3. Driver: **Node.js** version **5.5 or later**
4. Copia el connection string:

```
mongodb+srv://quelita-admin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

5. Reemplaza `<password>` con tu contraseña
6. Agrega el nombre de la base de datos:

```
mongodb+srv://quelita-admin:TU_PASSWORD@cluster0.xxxxx.mongodb.net/confiteria-quelita?retryWrites=true&w=majority
```

---

## 🔐 Configuración de Variables de Entorno

### Variables de Entorno para Seenode

Crea estas variables en el panel de Seenode:

#### **Backend (Node.js Application)**

```env
# Entorno
NODE_ENV=production

# Puerto (Seenode asigna automáticamente)
PORT=5000

# Backend URL (ajusta según tu dominio de Seenode)
BACKEND_URL=https://tu-backend.seenode.app

# MongoDB Atlas
MONGODB_URI=mongodb+srv://quelita-admin:TU_PASSWORD@cluster0.xxxxx.mongodb.net/confiteria-quelita?retryWrites=true&w=majority

# JWT Secrets (genera strings aleatorios seguros)
JWT_SECRET=TU_SECRET_SUPER_SEGURO_AQUI_64_CARACTERES_MINIMO
JWT_REFRESH_SECRET=TU_REFRESH_SECRET_SUPER_SEGURO_AQUI_64_CARACTERES
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# Frontend URL (ajusta según tu dominio de Seenode)
FRONTEND_URL=https://tu-frontend.seenode.app

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Uploads (Seenode provee filesystem temporal)
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760

# Cloudinary (RECOMENDADO para producción)
CLOUDINARY_CLOUD_NAME=tu-cloud-name
CLOUDINARY_API_KEY=tu-api-key
CLOUDINARY_API_SECRET=tu-api-secret
USE_CLOUDINARY=true

# WhatsApp Business
WHATSAPP_BUSINESS_PHONE=56920178216
WHATSAPP_DEFAULT_MESSAGE=Hola, me gustaría hacer una consulta sobre

# Email / SMTP (Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-contraseña-de-app-de-16-caracteres
SMTP_FROM_NAME=Confitería Quelita
SMTP_FROM_EMAIL=noreply@quelita.com

# Admin por defecto
DEFAULT_ADMIN_EMAIL=admin@quelita.com
DEFAULT_ADMIN_PASSWORD=CambiaEsto123!Seguro
DEFAULT_ADMIN_NAME=Administrador Quelita
```

#### **Frontend (Next.js Application)**

```env
# API Backend
NEXT_PUBLIC_API_URL=https://tu-backend.seenode.app/api

# Site URL
NEXT_PUBLIC_SITE_URL=https://tu-frontend.seenode.app

# WhatsApp (para componente del frontend)
NEXT_PUBLIC_WHATSAPP_PHONE=56920178216
```

---

## 🚀 Deployment en Seenode

### Opción A: Deployment desde GitHub (Recomendado)

#### Paso 1: Preparar Repositorio

1. Asegúrate de que todo esté committeado:
   ```bash
   git add .
   git commit -m "chore: Preparar para deployment en producción"
   git push origin main
   ```

2. Si usas rama `nifty-mclaren`, mergea a `main`:
   ```bash
   git checkout main
   git merge nifty-mclaren
   git push origin main
   ```

#### Paso 2: Crear Aplicación Backend en Seenode

1. Inicia sesión en **Seenode**
2. Click en **"New Project"** o **"Create Application"**
3. Selecciona **"Import from GitHub"**
4. Conecta tu repositorio
5. Configuración:
   - **Name:** `confiteria-quelita-backend`
   - **Framework:** Node.js
   - **Root Directory:** `backend/`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Node Version:** 18.x o superior

6. Agrega todas las variables de entorno (ver sección anterior)
7. Click en **"Deploy"**

#### Paso 3: Crear Aplicación Frontend en Seenode

1. Click en **"New Project"**
2. Selecciona **"Import from GitHub"**
3. Mismo repositorio
4. Configuración:
   - **Name:** `confiteria-quelita-frontend`
   - **Framework:** Next.js
   - **Root Directory:** `frontend/`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Node Version:** 18.x o superior

5. Agrega las variables de entorno del frontend
6. Click en **"Deploy"**

#### Paso 4: Obtener URLs de Deployment

Seenode te asignará URLs como:
- Backend: `https://confiteria-quelita-backend-xxx.seenode.app`
- Frontend: `https://confiteria-quelita-frontend-xxx.seenode.app`

#### Paso 5: Actualizar Variables de Entorno con URLs Reales

Ve a la configuración de cada aplicación y actualiza:

**Backend:**
```env
BACKEND_URL=https://confiteria-quelita-backend-xxx.seenode.app
FRONTEND_URL=https://confiteria-quelita-frontend-xxx.seenode.app
```

**Frontend:**
```env
NEXT_PUBLIC_API_URL=https://confiteria-quelita-backend-xxx.seenode.app/api
NEXT_PUBLIC_SITE_URL=https://confiteria-quelita-frontend-xxx.seenode.app
```

Redeploy ambas aplicaciones después de actualizar.

---

## ✅ Verificación Post-Deployment

### Checklist de Verificación

- [ ] **Backend responde:**
  ```bash
  curl https://tu-backend.seenode.app/api/health
  ```
  Debería retornar: `{"status":"ok"}`

- [ ] **Frontend carga:**
  Abre `https://tu-frontend.seenode.app` en navegador

- [ ] **MongoDB conectado:**
  Revisa logs del backend en Seenode

- [ ] **Crear usuario admin:**
  ```bash
  # SSH o terminal de Seenode
  cd backend
  npm run seed:admin
  ```

- [ ] **Login funciona:**
  Intenta hacer login en `/admin/login`

- [ ] **Email funciona:**
  Crea una orden de prueba y verifica que llegue el email

- [ ] **WhatsApp funciona:**
  Click en el botón flotante de WhatsApp

- [ ] **Imágenes funcionan:**
  Sube una imagen de producto (requiere Cloudinary en producción)

---

## 🐛 Troubleshooting

### Error: "Cannot connect to MongoDB"

**Solución:**
1. Verifica que el connection string sea correcto
2. Asegúrate de que la contraseña no tenga caracteres especiales sin escapar
3. Verifica que Network Access permita 0.0.0.0/0
4. Prueba la conexión localmente:
   ```bash
   mongosh "mongodb+srv://..."
   ```

### Error: "Email service not configured"

**Solución:**
1. Verifica variables SMTP_* en Seenode
2. Asegúrate de tener contraseña de aplicación de Gmail (no tu contraseña normal)
3. Revisa que `SMTP_SECURE=false` para puerto 587

### Error: "Build failed"

**Solución:**
1. Verifica que Root Directory esté correcto (`backend/` o `frontend/`)
2. Asegúrate de que `package.json` esté en el directorio correcto
3. Revisa logs de build en Seenode

### Error: "Module not found"

**Solución:**
1. Verifica que todas las dependencias estén en `package.json`
2. Asegúrate de que `npm install` se ejecute en el build command
3. Limpia cache y redeploy

### Frontend no se comunica con Backend

**Solución:**
1. Verifica CORS en backend:
   ```typescript
   // backend/src/server.ts
   app.use(cors({
     origin: process.env.FRONTEND_URL,
     credentials: true
   }));
   ```
2. Asegúrate de que `NEXT_PUBLIC_API_URL` sea correcta
3. Verifica que el backend esté respondiendo

---

## 📊 Monitoreo Post-Deployment

### Logs

Accede a los logs en el panel de Seenode:
- Backend logs: Para errores de API, base de datos
- Frontend logs: Para errores de build, runtime

### Métricas a Monitorear

- **Uptime** de ambas aplicaciones
- **Uso de memoria** (ajusta plan si es necesario)
- **Tiempos de respuesta**
- **Errores en logs**

---

## 🔄 Redeploy / Actualizaciones

Para actualizar el código:

1. Haz push a tu repositorio:
   ```bash
   git add .
   git commit -m "feat: Nueva funcionalidad"
   git push origin main
   ```

2. En Seenode, click en **"Redeploy"** en cada aplicación

O configura **Auto-deploy** en Seenode para deployments automáticos.

---

## 🔒 Seguridad en Producción

### Inmediatamente después del deployment:

- [ ] Cambia contraseña del admin por defecto
- [ ] Cambia JWT_SECRET y JWT_REFRESH_SECRET
- [ ] Configura HTTPS (Seenode lo provee automáticamente)
- [ ] Restringe Network Access en MongoDB a IPs específicas
- [ ] Habilita autenticación de 2 factores en todas las cuentas
- [ ] Configura backups automáticos en MongoDB Atlas
- [ ] Revisa y ajusta rate limits según tráfico

---

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs en Seenode
2. Verifica variables de entorno
3. Consulta documentación de Seenode
4. Contacta soporte de Seenode

---

## ✅ Checklist Final Pre-Deployment

Antes de hacer el deployment final:

- [ ] Código está en branch main/master
- [ ] Tests pasan (`./test-all.ps1`)
- [ ] Email hardcoded de prueba removido
- [ ] Variables de entorno documentadas
- [ ] MongoDB Atlas configurado
- [ ] Credenciales de Gmail preparadas
- [ ] Cloudinary configurado (recomendado)
- [ ] README actualizado
- [ ] Backup local del código
- [ ] Plan de rollback definido

---

**¡Listo para deployment!** 🚀

Sigue los pasos en orden y tu MVP estará en producción en menos de 1 hora.

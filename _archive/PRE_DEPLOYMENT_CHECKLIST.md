# ✅ Checklist Pre-Deployment - MVP Seenode

Usa esta lista para verificar que todo esté listo antes del deployment.

---

## 📋 PREPARACIÓN DEL CÓDIGO

### Código Limpio
- [ ] Email hardcoded de prueba removido (`fei.correaj@gmail.com`)
- [ ] Todos los `console.log` de debug removidos o apropiados para producción
- [ ] No hay TODOs críticos pendientes en el código
- [ ] Código está en branch `main` o `master`
- [ ] Último commit es descriptivo y claro

### Tests
- [ ] Todos los tests pasan (`./test-all.ps1`)
- [ ] Build del backend exitoso (`cd backend && npm run build`)
- [ ] Build del frontend exitoso (`cd frontend && npm run build`)
- [ ] No hay errores de TypeScript
- [ ] No hay warnings críticos de linting

---

## 🗄️ BASE DE DATOS

### MongoDB Atlas
- [ ] Cluster creado en MongoDB Atlas (M0 Free Tier)
- [ ] Usuario de base de datos creado
- [ ] Contraseña guardada en lugar seguro
- [ ] Network Access configurado (0.0.0.0/0 o IPs específicas)
- [ ] Connection string obtenido y probado
- [ ] Base de datos llamada `confiteria-quelita`

---

## 🔐 CREDENCIALES Y SECRETS

### Secrets Generados
- [ ] JWT_SECRET generado (`node generate-secrets.js`)
- [ ] JWT_REFRESH_SECRET generado
- [ ] DEFAULT_ADMIN_PASSWORD generado
- [ ] Todos los secrets guardados en lugar seguro

### Email (Gmail)
- [ ] Cuenta de Gmail preparada
- [ ] Verificación en 2 pasos habilitada
- [ ] Contraseña de aplicación generada (16 caracteres)
- [ ] Contraseña guardada en lugar seguro

### WhatsApp
- [ ] Número de WhatsApp Business confirmado: `56920178216`
- [ ] Número funcional y puede recibir mensajes

### Cloudinary (Opcional pero Recomendado)
- [ ] Cuenta de Cloudinary creada
- [ ] CLOUDINARY_CLOUD_NAME obtenido
- [ ] CLOUDINARY_API_KEY obtenido
- [ ] CLOUDINARY_API_SECRET obtenido

---

## 📦 REPOSITORIO

### GitHub
- [ ] Repositorio en GitHub actualizado
- [ ] Archivo `.gitignore` incluye `.env` y archivos sensibles
- [ ] README.md actualizado con información del proyecto
- [ ] Branch principal (main/master) está limpio

### Archivos de Configuración
- [ ] `.env.production.example` creado en backend
- [ ] `.env.production.example` creado en frontend
- [ ] `.gitignore` actualizado
- [ ] No hay archivos `.env` con valores reales committeados

---

## 🚀 SEENODE

### Cuenta y Configuración
- [ ] Cuenta de Seenode activa
- [ ] GitHub conectado a Seenode
- [ ] Permisos de acceso al repositorio configurados

### Variables de Entorno - Backend
Todas estas variables deben estar en el panel de Seenode:

- [ ] `NODE_ENV=production`
- [ ] `PORT=5000`
- [ ] `BACKEND_URL=https://tu-backend.seenode.app`
- [ ] `FRONTEND_URL=https://tu-frontend.seenode.app`
- [ ] `MONGODB_URI` (connection string completo)
- [ ] `JWT_SECRET` (generado)
- [ ] `JWT_REFRESH_SECRET` (generado)
- [ ] `JWT_EXPIRES_IN=7d`
- [ ] `JWT_REFRESH_EXPIRES_IN=30d`
- [ ] `WHATSAPP_BUSINESS_PHONE=56920178216`
- [ ] `SMTP_HOST=smtp.gmail.com`
- [ ] `SMTP_PORT=587`
- [ ] `SMTP_SECURE=false`
- [ ] `SMTP_USER` (tu email de Gmail)
- [ ] `SMTP_PASS` (contraseña de aplicación de 16 caracteres)
- [ ] `SMTP_FROM_NAME=Confitería Quelita`
- [ ] `SMTP_FROM_EMAIL=noreply@quelita.com`
- [ ] `DEFAULT_ADMIN_EMAIL=admin@quelita.com`
- [ ] `DEFAULT_ADMIN_PASSWORD` (generado)
- [ ] `CLOUDINARY_CLOUD_NAME` (si usas Cloudinary)
- [ ] `CLOUDINARY_API_KEY` (si usas Cloudinary)
- [ ] `CLOUDINARY_API_SECRET` (si usas Cloudinary)
- [ ] `USE_CLOUDINARY=true` (si usas Cloudinary)

### Variables de Entorno - Frontend
- [ ] `NEXT_PUBLIC_API_URL=https://tu-backend.seenode.app/api`
- [ ] `NEXT_PUBLIC_SITE_URL=https://tu-frontend.seenode.app`
- [ ] `NEXT_PUBLIC_WHATSAPP_PHONE=56920178216`

---

## 🔧 CONFIGURACIÓN DE DEPLOYMENT

### Backend Application (Seenode)
- [ ] Name: `confiteria-quelita-backend`
- [ ] Framework: Node.js
- [ ] Root Directory: `backend/`
- [ ] Build Command: `npm install && npm run build`
- [ ] Start Command: `npm start`
- [ ] Node Version: 18.x o superior
- [ ] Todas las variables de entorno configuradas

### Frontend Application (Seenode)
- [ ] Name: `confiteria-quelita-frontend`
- [ ] Framework: Next.js
- [ ] Root Directory: `frontend/`
- [ ] Build Command: `npm install && npm run build`
- [ ] Start Command: `npm start`
- [ ] Node Version: 18.x o superior
- [ ] Todas las variables de entorno configuradas

---

## ✅ POST-DEPLOYMENT

### Verificación Inmediata (Primeros 5 minutos)
- [ ] Backend responde: `curl https://tu-backend.seenode.app/api/health`
- [ ] Frontend carga en navegador
- [ ] No hay errores 500 en los logs
- [ ] MongoDB conectado (revisar logs del backend)

### Configuración Inicial (Primeros 15 minutos)
- [ ] Crear usuario admin: `npm run seed:admin` (si es necesario)
- [ ] Login como admin funciona (`/admin/login`)
- [ ] Panel de admin carga correctamente
- [ ] Cambiar contraseña del admin por una personal

### Funcionalidades Críticas (Primeros 30 minutos)
- [ ] Crear categoría de prueba
- [ ] Crear marca de prueba
- [ ] Subir producto de prueba con imagen
- [ ] Imagen se muestra correctamente (Cloudinary)
- [ ] Crear orden de prueba
- [ ] Email de confirmación llega
- [ ] Botón de WhatsApp funciona
- [ ] Link de WhatsApp abre correctamente

### Optimización y Monitoreo (Primera hora)
- [ ] Revisar logs de errores en Seenode
- [ ] Verificar tiempos de respuesta
- [ ] Probar en mobile
- [ ] Probar en desktop
- [ ] Verificar HTTPS funciona
- [ ] Verificar CORS está configurado correctamente

---

## 🔒 SEGURIDAD POST-DEPLOYMENT

### Acciones Inmediatas
- [ ] Cambiar contraseña del admin por defecto
- [ ] Habilitar 2FA en MongoDB Atlas
- [ ] Habilitar 2FA en Seenode
- [ ] Habilitar 2FA en GitHub
- [ ] Revisar logs de acceso

### Configuración de Seguridad
- [ ] HTTPS habilitado (Seenode lo hace automático)
- [ ] Cookies con `secure: true` y `httpOnly: true`
- [ ] CORS configurado con `FRONTEND_URL` específica
- [ ] Rate limiting activo
- [ ] MongoDB Network Access restringido (opcional)

---

## 📊 BACKUPS Y CONTINGENCIA

### Backups
- [ ] Backup local del código (antes de deployment)
- [ ] Backup de credenciales en lugar seguro
- [ ] Configurar backups automáticos en MongoDB Atlas
- [ ] Documentar proceso de rollback

### Plan de Contingencia
- [ ] Saber cómo hacer rollback en Seenode
- [ ] Tener backup de base de datos
- [ ] Contacto de soporte de Seenode
- [ ] Plan B si algo falla

---

## 📝 DOCUMENTACIÓN

### Documentos Actualizados
- [ ] README.md con información de producción
- [ ] DEPLOYMENT_SEENODE.md revisado
- [ ] CONFIGURACION_EMAIL_WHATSAPP.md revisado
- [ ] Credenciales documentadas en lugar seguro (NO en repo)

---

## 🎯 CRITERIOS DE ÉXITO

El MVP está exitosamente deployado cuando:

- ✅ Frontend carga sin errores
- ✅ Backend responde a las APIs
- ✅ MongoDB conectado y funcionando
- ✅ Login de admin funciona
- ✅ Se puede crear y ver productos
- ✅ Se puede crear órdenes
- ✅ Emails se envían correctamente
- ✅ WhatsApp funciona
- ✅ No hay errores críticos en logs
- ✅ HTTPS está activo

---

## 📞 CONTACTOS DE EMERGENCIA

- **Seenode Support:** [Support URL]
- **MongoDB Atlas Support:** https://support.mongodb.com/
- **Tu equipo de desarrollo:** [Contactos]

---

## ✨ NOTAS FINALES

- Este es un **MVP**, no producción final
- Monitorea constantemente los primeros días
- Recoge feedback de usuarios
- Itera y mejora basado en uso real
- Mantén este checklist actualizado

---

**¿Listo para deployment?** 🚀

Si todos los checkboxes están marcados, ¡adelante con el deployment!

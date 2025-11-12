# 🚀 Quick Start - Testing Automatizado

Guía rápida para ejecutar los tests del proyecto en **menos de 5 minutos**.

## ⚡ Inicio Rápido (Copy-Paste)

```bash
# 1. Asegúrate de estar en la raíz del proyecto
cd /home/user/confi2

# 2. Inicia MongoDB (si no está corriendo)
# sudo systemctl start mongodb
# O si usas Docker: docker start mongodb

# 3. Inicia Backend (Terminal 1)
cd backend && npm run dev

# 4. Inicia Frontend (Terminal 2 - nueva terminal)
cd frontend && npm run dev

# 5. Ejecuta tests (Terminal 3 - nueva terminal)
npm run test:all
```

¡Eso es todo! El reporte HTML se abrirá automáticamente.

---

## 📋 Comandos Disponibles

### Testing

```bash
# Ejecutar TODO: tests + generar reporte HTML
npm run test:all

# Solo tests en consola (más rápido)
npm test

# Solo generar reporte HTML
npm run test:report

# Crear usuario admin para probar panel
npm run create-admin
```

### Desarrollo

```bash
# Instalar todo de una vez
npm run install:all

# Iniciar backend
npm run dev:backend

# Iniciar frontend
npm run dev:frontend
```

---

## 🎯 Primera Vez - Setup Completo

### 1. Verificar Requisitos

```bash
# Verificar Node.js (debe ser >= 18)
node --version

# Verificar MongoDB está corriendo
mongosh  # O: mongo
# Si conecta, MongoDB está OK. Sal con: exit
```

### 2. Instalar Dependencias

```bash
# Desde la raíz del proyecto
npm run install:all

# Esto ejecuta:
# - npm install (raíz)
# - npm install en backend
# - npm install en frontend
```

### 3. Configurar Variables de Entorno

**Backend (.env):**
```bash
cd backend
cp .env.example .env
# Editar .env con tus valores
```

**Frontend (.env.local):**
```bash
cd frontend
# Crear .env.local con:
echo "NEXT_PUBLIC_API_URL=http://localhost:5000/api" > .env.local
```

### 4. Crear Usuario Admin

```bash
# Desde la raíz
npm run create-admin

# Output mostrará:
# Email: admin@confiteriaquelita.com
# Password: Admin123!@#

# IMPORTANTE: Cambiar rol en MongoDB
mongosh confiteria_quelita_dev
db.users.updateOne(
  { email: "admin@confiteriaquelita.com" },
  { $set: { role: "admin" } }
)
exit
```

### 5. Iniciar Servicios

**Opción A: Tres terminales separadas (recomendado)**
```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
cd frontend && npm run dev

# Terminal 3 - Tests
npm run test:all
```

**Opción B: Con tmux (avanzado)**
```bash
# Crear sesión
tmux new -s confiteria

# Split horizontal
Ctrl+b "

# Split vertical del panel superior
Ctrl+b :split-window -h

# Navegar entre paneles: Ctrl+b + flechas
# En cada panel ejecuta: backend, frontend, tests
```

### 6. Ejecutar Tests

```bash
# Tests completos con reporte
npm run test:all

# O solo consola
npm test
```

---

## 📊 Interpretar Resultados

### ✅ TODO OK (Esperado)

```
═══════════════════════════════════════════════════════════
TEST SUMMARY
═══════════════════════════════════════════════════════════
Total Tests:  22
Passed:       22
Failed:       0
Pass Rate:    100.0%

╔════════════════════════════════════════════════════════════╗
║  ✓ ALL TESTS PASSED!                                      ║
╚════════════════════════════════════════════════════════════╝
```

### ⚠️ Algunos Fallos (Común en primera vez)

Si ves errores, los más comunes son:

**1. Backend no está corriendo**
```
✗ Backend is running
  Error: ECONNREFUSED
```
**Solución:** Inicia backend con `npm run dev:backend`

**2. Frontend no está corriendo**
```
✗ Frontend is running
  Error: ECONNREFUSED
```
**Solución:** Inicia frontend con `npm run dev:frontend`

**3. MongoDB no conectado**
```
✗ GET /api/categories
  Error: MongooseServerSelectionError
```
**Solución:** Inicia MongoDB

**4. Sin datos de prueba (Normal)**
```
✗ GET /api/orders/number/ORD-00001
  Expected 200, got 404
```
**Esto es OK**: No hay pedidos aún. Crea uno desde el frontend.

---

## 🎨 Reporte HTML

El archivo `test-report.html` se genera en la raíz y contiene:

- 📊 **Dashboard** con stats visuales
- ✓ **Tests pasados** en verde
- ✗ **Tests fallidos** en rojo con detalles
- ⏱️ **Tiempos de ejecución**
- 📱 **Responsive** (se ve bien en móvil)

**Abrir manualmente:**
```bash
# Linux
xdg-open test-report.html

# macOS
open test-report.html

# Windows
start test-report.html

# O simplemente arrastra el archivo al navegador
```

---

## 🧪 Testing Manual Complementario

Después de los tests automatizados, verifica manualmente:

### Frontend Público

1. Abre http://localhost:3000
2. Navega a "Productos"
3. Click en un producto → Ver detalle con variantes
4. Agregar al carrito
5. Ir al checkout
6. Completar formulario
7. Click "Enviar por WhatsApp"
8. Verificar que WhatsApp se abre con mensaje

### Panel Admin

1. Abre http://localhost:3000/admin/login
2. Login:
   - Email: `admin@confiteriaquelita.com`
   - Password: `Admin123!@#`
3. Verifica dashboard con métricas
4. Ir a "Pedidos" → Ver el pedido que creaste
5. Cambiar estado del pedido
6. Ir a "Productos" → Ver lista
7. Ir a "Stock" → Ver alertas

---

## 🔧 Troubleshooting Rápido

### Backend no inicia
```bash
# Verificar puerto 5000 libre
lsof -i :5000
# Si hay proceso, matarlo:
kill -9 <PID>

# O cambiar puerto en backend/.env
PORT=5001
```

### Frontend no inicia
```bash
# Verificar puerto 3000 libre
lsof -i :3000

# Limpiar cache
cd frontend
rm -rf .next
npm run dev
```

### Tests fallan todos
```bash
# Verificar URLs correctas
echo $BACKEND_URL  # Debe ser vacío o http://localhost:5000
echo $FRONTEND_URL # Debe ser vacío o http://localhost:3000

# Probar manualmente
curl http://localhost:5000/health
curl http://localhost:3000
```

### MongoDB no conecta
```bash
# Verificar está corriendo
sudo systemctl status mongodb

# O
ps aux | grep mongo

# Iniciar
sudo systemctl start mongodb
```

---

## 📞 Ayuda

Si los tests siguen fallando:

1. **Revisa los logs**:
   ```bash
   # Backend logs
   cd backend && npm run dev
   # Ver errores en consola

   # Frontend logs
   cd frontend && npm run dev
   # Ver errores en consola
   ```

2. **Verifica dependencias instaladas**:
   ```bash
   npm run install:all
   ```

3. **Limpia y reinstala**:
   ```bash
   # Backend
   cd backend
   rm -rf node_modules package-lock.json
   npm install

   # Frontend
   cd frontend
   rm -rf node_modules package-lock.json .next
   npm install
   ```

---

## 🎯 Próximos Pasos

Una vez que todos los tests pasen:

1. **Personalización**: Ajustar colores, logo, contenido
2. **Datos reales**: Cargar productos reales desde admin panel
3. **Testing manual**: Hacer pedidos de prueba completos
4. **Deploy**: Preparar para producción

Ver [scripts/README-TESTING.md](./scripts/README-TESTING.md) para documentación completa.

---

**¿Listo para empezar?**

```bash
npm run test:all
```

🎉 ¡Buena suerte!

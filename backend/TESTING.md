# 🧪 Testing & Health Check Guide

## 📋 Tabla de Contenidos
- [Scripts de Testing](#scripts-de-testing)
- [Health Check del Sistema](#health-check-del-sistema)
- [Tests de Integración](#tests-de-integración)
- [Scripts de Debug](#scripts-de-debug)
- [Scripts de Seeding](#scripts-de-seeding)

---

## 🚀 Scripts de Testing

### Ejecutar Todos los Tests
```bash
npm test
```

### Tests en Modo Watch
```bash
npm run test:watch
```

### Tests con Cobertura
```bash
npm run test:coverage
```

### Tests Verbose
```bash
npm run test:verbose
```

---

## 🏥 Health Check del Sistema

### Ejecutar Health Check Completo
```bash
npm run health:check
```

Este script verifica:
- ✅ **Conexión a MongoDB** - Verifica conectividad y nombre de DB
- ✅ **Colecciones de DB** - Verifica que existan todas las colecciones requeridas
- ✅ **Integridad de Datos** - Cuenta documentos y verifica estructura
- ✅ **Endpoints Públicos** - GET /products, /categories, /brands, /tags
- ✅ **Autenticación** - POST /auth/login, GET /auth/me
- ✅ **Creación de Órdenes** - POST /orders (guest y autenticado)
- ✅ **Endpoints Protegidos** - Verifica que requieran autenticación
- ✅ **Seguridad** - Verifica que endpoints admin estén protegidos

**Output Ejemplo:**
```
🏥 SYSTEM HEALTH CHECK REPORT
============================================================

Total Checks: 15
✅ Passed: 14
❌ Failed: 0
⚠️  Warnings: 1

🏥 Overall System Status: HEALTHY
============================================================
```

---

## 🧪 Tests de Integración

Los tests están organizados en `/src/__tests__/integration/`:

### Auth Tests (`auth.test.ts`)
```bash
npm test auth.test.ts
```
- POST /auth/register
- POST /auth/login
- GET /auth/me
- PUT /auth/profile
- POST /auth/change-password

### Orders Tests (`orders.test.ts`)
```bash
npm test orders.test.ts
```
- POST /orders (guest)
- POST /orders (authenticated)
- GET /orders/my-orders
- GET /orders/number/:orderNumber
- PUT /orders/:id/status
- Verificación de `customer.user` field

### Products Tests (`products.test.ts`)
```bash
npm test products.test.ts
```
- CRUD de ProductParent
- CRUD de ProductVariant
- Gestión de imágenes
- Aplicación de descuentos

### Categories Tests (`categories.test.ts`)
```bash
npm test categories.test.ts
```
- CRUD de categorías
- Subcategorías
- Validación de jerarquía

### Addresses Tests (`addresses.test.ts`)
```bash
npm test addresses.test.ts
```
- GET /users/me/addresses
- POST /users/me/addresses
- PUT /users/me/addresses/:id
- DELETE /users/me/addresses/:id
- PATCH /users/me/addresses/:id/default

### Stock Tests (`stock.test.ts`)
```bash
npm test stock.test.ts
```
- Deducción de stock en órdenes
- StockMovements
- Ajustes manuales de stock

### Audit Tests (`audit.test.ts`)
```bash
npm test audit.test.ts
```
- GET /audit-logs
- GET /audit-logs/entity/:type/:id
- Registro de cambios

### Users Tests (`users.test.ts`)
```bash
npm test users.test.ts
```
- CRUD de usuarios (admin only)
- Roles y permisos
- Activación/Desactivación

---

## 🔍 Scripts de Debug

### Debug Orders
Verifica órdenes de un usuario por email:
```bash
npm run debug:orders <email>

# Ejemplo:
npm run debug:orders ddd@ddd.com
```

**Output:**
```
👤 User found:
   ID: 6923f4fe50d4d21728667b73
   Email: ddd@ddd.com
   Role: cliente

📦 Orders with email "ddd@ddd.com":
   Total: 9

   Order #1: QUE-20251126-009
      customer.user: ✅ 6923f4fe50d4d21728667b73
      Status: confirmed
      Total: $5945
```

### Debug Cloudinary
Verifica conexión a Cloudinary:
```bash
npm run debug:cloudinary
```

---

## 🌱 Scripts de Seeding

### Seed Individual
```bash
npm run seed:admin        # Crear admin
npm run seed:users        # Crear usuarios de prueba
npm run seed:categories   # Crear categorías
npm run seed:brands       # Crear marcas
npm run seed:tags         # Crear tags
npm run seed:products     # Crear productos
npm run seed:discounts    # Crear descuentos
npm run seed:orders       # Crear órdenes
```

### Seed Completo
```bash
# Seeds básicos (categorías + marcas + tags + productos)
npm run seed:all

# Seeds + data de prueba (todo lo anterior + descuentos + órdenes)
npm run seed:test-data
```

---

## 📊 Cobertura de Tests

Para generar reporte de cobertura:
```bash
npm run test:coverage
```

Esto genera:
- Reporte en consola
- Reporte HTML en `/coverage/`
- Reporte LCOV para CI/CD

**Métricas de Cobertura:**
- **Statements**: % de líneas ejecutadas
- **Branches**: % de ramas condicionales cubiertas
- **Functions**: % de funciones ejecutadas
- **Lines**: % de líneas de código cubiertas

---

## 🐛 Debugging Tests

### Ejecutar Test Específico
```bash
npm test -- orders.test.ts
```

### Ejecutar Suite Específica
```bash
npm test -- --testNamePattern="Orders API"
```

### Ejecutar Test con Debug
```bash
node --inspect-brk node_modules/.bin/jest --runInBand orders.test.ts
```

Luego abre Chrome y ve a `chrome://inspect`

---

## ✅ Checklist Pre-Deployment

Antes de hacer deploy, ejecuta:

1. **Tests**
   ```bash
   npm test
   ```

2. **Health Check**
   ```bash
   npm run health:check
   ```

3. **Linter**
   ```bash
   npm run lint
   ```

4. **Build**
   ```bash
   npm run build
   ```

5. **Verificar .env**
   - ✅ MONGODB_URI configurado
   - ✅ JWT_SECRET configurado
   - ✅ CLOUDINARY_* configurado
   - ✅ NODE_ENV=production

---

## 🔐 Variables de Entorno para Tests

Crea `.env.test` para tests:
```env
NODE_ENV=test
MONGODB_URI=mongodb://localhost:27017/confiteria_test
JWT_SECRET=test-secret-key
PORT=5001
```

Los tests usarán automáticamente estas variables.

---

## 📝 Agregar Nuevos Tests

### 1. Crear archivo test
```typescript
// src/__tests__/integration/myfeature.test.ts
import request from 'supertest';
import app from '../../server';
import { createTestUser, generateAuthToken } from '../setup/testUtils';

describe('My Feature API', () => {
  it('should do something', async () => {
    const response = await request(app).get('/api/myfeature');
    expect(response.status).toBe(200);
  });
});
```

### 2. Ejecutar
```bash
npm test myfeature.test.ts
```

---

## 🚨 CI/CD Integration

### GitHub Actions
```yaml
- name: Run Tests
  run: npm test

- name: Health Check
  run: npm run health:check

- name: Coverage Report
  run: npm run test:coverage
```

---

## 📚 Recursos Adicionales

- **Jest Docs**: https://jestjs.io/
- **Supertest Docs**: https://github.com/visionmedia/supertest
- **Testing Best Practices**: https://testingjavascript.com/

---

## 🆘 Troubleshooting

### Tests Fallan con Error de MongoDB
```bash
# Verificar que MongoDB esté corriendo
mongod --version

# O usar MongoDB en memoria (jest-mongodb)
npm install --save-dev @shelf/jest-mongodb
```

### Tests Fallan con Error de Timeout
```javascript
// Aumentar timeout en test específico
it('slow test', async () => {
  // ...
}, 10000); // 10 segundos
```

### Limpiar Base de Datos de Test
```bash
# Conectar a mongo y eliminar
mongo confiteria_test --eval "db.dropDatabase()"
```

---

**Última actualización**: 2025-11-27
**Mantenido por**: Claude (AI Assistant)

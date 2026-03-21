# 🧪 Guía de Testing - Confitería Quelita

Esta guía explica cómo ejecutar todos los tests de la aplicación.

## 📋 Tabla de Contenidos

- [Requisitos Previos](#requisitos-previos)
- [Scripts de Testing](#scripts-de-testing)
- [Tests del Backend](#tests-del-backend)
- [Tests del Frontend](#tests-del-frontend)
- [Tests de Email y WhatsApp](#tests-de-email-y-whatsapp)
- [Cobertura de Código](#cobertura-de-código)
- [CI/CD](#cicd)

---

## 📦 Requisitos Previos

1. **Node.js** v18+ instalado
2. **npm** v9+ instalado
3. **MongoDB** corriendo (local o remoto)
4. **Variables de entorno** configuradas (ver `.env.example`)

### Configuración Inicial

```bash
# Instalar dependencias del backend
cd backend
npm install

# Instalar dependencias del frontend
cd ../frontend
npm install
```

---

## 🚀 Scripts de Testing

### Ejecutar TODOS los Tests (Recomendado)

**Windows (PowerShell):**
```powershell
.\test-all.ps1
```

**Linux/Mac (Bash):**
```bash
chmod +x test-all.sh
./test-all.sh
```

Este script ejecuta:
- ✅ Linting de código
- ✅ Tests unitarios e integración del backend
- ✅ Build del frontend
- ✅ Verificación de conexión a BD
- ✅ Tests de servicios (Email, WhatsApp)
- ✅ Genera reportes de cobertura

---

## 🔧 Tests del Backend

### Ejecutar Todos los Tests

```bash
cd backend
npm test
```

### Tests con Cobertura

```bash
cd backend
npm run test:coverage
```

Esto genera un reporte HTML en `backend/coverage/lcov-report/index.html`

### Tests en Modo Watch (Desarrollo)

```bash
cd backend
npm run test:watch
```

### Tests Verbose (Debug)

```bash
cd backend
npm run test:verbose
```

### Ejecutar Tests Específicos

```bash
# Solo tests de orders
npm test -- orders.test.ts

# Solo tests de email/whatsapp
npm test -- email-whatsapp.test.ts

# Con patrón
npm test -- --testNamePattern="should create order"
```

---

## 🎨 Tests del Frontend

### Linting

```bash
cd frontend
npm run lint
```

### Build de Producción

```bash
cd frontend
npm run build
```

Esto verifica que no haya errores de TypeScript y que el build sea exitoso.

### Tests E2E (Si están configurados)

```bash
cd frontend
npm run test:e2e
```

---

## 📧 Tests de Email y WhatsApp

### Tests Incluidos

Los tests de email y WhatsApp están en:
```
backend/src/__tests__/integration/email-whatsapp.test.ts
```

**Funcionalidades testeadas:**

1. **Envío de Email de Confirmación**
   - ✅ Al crear una orden
   - ✅ Para usuarios autenticados
   - ✅ Para invitados (guest checkout)

2. **Envío de Email de Actualización**
   - ✅ Al cambiar estado de orden
   - ✅ Para diferentes estados (confirmado, preparando, enviado)

3. **Envío de Email de Cancelación**
   - ✅ Al cancelar una orden
   - ✅ Con motivo de cancelación

4. **Generación de URLs de WhatsApp**
   - ✅ Formato correcto de URL
   - ✅ Mensaje personalizado según contexto
   - ✅ Tracking de mensajes enviados

5. **Configuración de Servicios**
   - ✅ Email de prueba configurado
   - ✅ Número de WhatsApp válido

### Ejecutar Solo Tests de Email/WhatsApp

```bash
cd backend
npm test -- email-whatsapp.test.ts
```

### Mock de Emails en Tests

Los tests usan **mocks** para no enviar emails reales:

```typescript
jest.mock('../../services/emailService', () => ({
  emailService: {
    sendOrderConfirmationEmail: jest.fn().mockResolvedValue(true),
    sendOrderStatusUpdateEmail: jest.fn().mockResolvedValue(true),
    sendOrderCancellationEmail: jest.fn().mockResolvedValue(true),
  },
}));
```

### Probar Envío Real de Emails (Manual)

Para probar el envío real de emails:

1. Configura las credenciales de Gmail en `.env`:
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=tu-email@gmail.com
   SMTP_PASS=tu-contraseña-de-app
   ```

2. Crea una orden desde el frontend o API

3. Verifica que llegue el email a:
   - Email del cliente
   - `fei.correaj@gmail.com` (hardcoded para pruebas)

4. Revisa los logs del backend:
   ```
   ✅ Email service configurado correctamente
   📧 Email enviado: <message-id> a cliente@example.com (copia a fei.correaj@gmail.com)
   ```

---

## 📊 Cobertura de Código

### Ver Reporte de Cobertura

Después de ejecutar `npm run test:coverage`:

**Abrir reporte HTML:**
```bash
# Windows
start backend/coverage/lcov-report/index.html

# Linux/Mac
open backend/coverage/lcov-report/index.html
```

**Ver resumen en terminal:**
```bash
cd backend
npm run test:coverage
```

### Objetivos de Cobertura

| Tipo | Objetivo | Actual |
|------|----------|--------|
| Statements | 80%+ | - |
| Branches | 75%+ | - |
| Functions | 80%+ | - |
| Lines | 80%+ | - |

---

## 🔍 Tests por Módulo

### Tests de Autenticación
```bash
npm test -- auth.test.ts
```
- Login
- Registro
- Refresh token
- Recuperación de contraseña

### Tests de Productos
```bash
npm test -- products.test.ts
```
- CRUD de productos
- Variantes
- Búsqueda
- Filtros

### Tests de Órdenes
```bash
npm test -- orders.test.ts
```
- Creación de órdenes
- Descuentos automáticos
- Gestión de stock
- Estados de orden

### Tests de Stock
```bash
npm test -- stock.test.ts
```
- Movimientos de stock
- Validaciones
- Backorder

### Tests de Categorías y Marcas
```bash
npm test -- categories.test.ts brands.test.ts
```
- CRUD de categorías
- Jerarquías
- Marcas

---

## 🐛 Debugging de Tests

### Ver Output Detallado

```bash
npm test -- --verbose
```

### Ejecutar un Solo Test

```bash
npm test -- --testNamePattern="should create order as authenticated user"
```

### Logs de Base de Datos

Los tests usan una BD de prueba. Para ver las queries:

```bash
DEBUG=mongoose npm test
```

### Detener en Breakpoints

Usa `debugger;` en tu código y ejecuta:

```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

Luego abre Chrome DevTools: `chrome://inspect`

---

## 🔄 CI/CD

### GitHub Actions (Ejemplo)

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      mongodb:
        image: mongo:7
        ports:
          - 27017:27017

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: |
          cd backend && npm install
          cd ../frontend && npm install

      - name: Run backend tests
        run: cd backend && npm run test:coverage

      - name: Build frontend
        run: cd frontend && npm run build

      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

---

## 📝 Mejores Prácticas

1. **Ejecuta tests antes de cada commit**
   ```bash
   npm test
   ```

2. **Mantén cobertura alta** (>80%)
   ```bash
   npm run test:coverage
   ```

3. **Usa el script completo** antes de PR
   ```bash
   ./test-all.ps1  # Windows
   ./test-all.sh   # Linux/Mac
   ```

4. **Revisa los logs** generados:
   - `test-results-backend.log`
   - `test-results-frontend-build.log`
   - `test-results-db.log`
   - `test-results-services.log`

5. **Mock servicios externos** (email, WhatsApp, APIs)

6. **Usa datos de prueba** consistentes

---

## 🆘 Solución de Problemas

### Error: MongoDB connection failed

```bash
# Verifica que MongoDB esté corriendo
mongosh

# O usa MongoDB Cloud (Atlas)
# Actualiza MONGODB_URI en .env.test
```

### Error: Cannot find module

```bash
# Reinstala dependencias
cd backend
rm -rf node_modules package-lock.json
npm install
```

### Tests fallan aleatoriamente

```bash
# Ejecuta en modo secuencial (no paralelo)
npm test -- --runInBand
```

### Email service not configured

```bash
# Es normal en tests - los emails están mockeados
# Para tests reales, configura SMTP en .env
```

---

## 📚 Recursos

- [Jest Documentation](https://jestjs.io/)
- [Supertest](https://github.com/visionmedia/supertest)
- [MongoDB Memory Server](https://github.com/nodkz/mongodb-memory-server)
- [Testing Library](https://testing-library.com/)

---

## ✅ Checklist Pre-Deploy

Antes de hacer deploy a producción:

- [ ] Todos los tests pasan (`./test-all.ps1`)
- [ ] Cobertura >80% (`npm run test:coverage`)
- [ ] Frontend builds sin errores (`npm run build`)
- [ ] Variables de entorno configuradas
- [ ] Email service configurado (SMTP)
- [ ] WhatsApp configurado
- [ ] Logs revisados
- [ ] Base de datos respaldada

---

**¡Happy Testing!** 🎉

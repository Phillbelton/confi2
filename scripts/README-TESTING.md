# 🧪 Testing Scripts - Confitería Quelita

Scripts automatizados para testing completo del proyecto.

## 📋 Scripts Disponibles

### 1. **test-all.js** - Suite Completa de Tests
Ejecuta todos los tests automatizados y muestra resultados en consola.

```bash
node scripts/test-all.js
```

**Tests incluidos:**
- ✅ Verificación de servicios (Backend + Frontend)
- ✅ Endpoints del API (Categories, Brands, Products, Orders, Auth)
- ✅ Páginas del Frontend (Home, Productos, Admin)
- ✅ Tests de integración (Products con Variants, Categories con Products)

**Output:**
- Resultados coloridos en consola
- Resumen con tasa de aprobación
- Lista de tests fallidos
- Exit code 0 si todos pasan, 1 si hay fallos

---

### 2. **test-report.js** - Generador de Reportes HTML
Ejecuta tests y genera un reporte HTML visual.

```bash
node scripts/test-report.js
```

**Genera:**
- `test-report.html` en la raíz del proyecto
- Dashboard con estadísticas visuales
- Lista detallada de todos los tests
- Tiempos de ejecución
- Errores específicos

**Visualización:**
```bash
# Generar reporte
node scripts/test-report.js

# Abrir en navegador
open test-report.html  # macOS
xdg-open test-report.html  # Linux
start test-report.html  # Windows
```

---

### 3. **create-admin.js** - Crear Usuario Admin
Crea un usuario administrador para testing.

```bash
node scripts/create-admin.js
```

**Credenciales creadas:**
- Email: `admin@confiteriaquelita.com`
- Password: `Admin123!@#`

**⚠️ IMPORTANTE:**
El script crea el usuario como "cliente". Debes cambiar el rol manualmente en MongoDB:

```javascript
db.users.updateOne(
  { email: "admin@confiteriaquelita.com" },
  { $set: { role: "admin" } }
)
```

---

## 🚀 Guía de Uso Completa

### Paso 1: Preparar el Entorno

```bash
# 1. Asegúrate de que MongoDB esté corriendo
# MongoDB debe estar en: mongodb://localhost:27017

# 2. Inicia el Backend
cd backend
npm install
npm run dev
# Backend corriendo en: http://localhost:5000

# 3. Inicia el Frontend (en otra terminal)
cd frontend
npm install
npm run dev
# Frontend corriendo en: http://localhost:3000
```

### Paso 2: Crear Usuario Admin (si es necesario)

```bash
# En la raíz del proyecto
node scripts/create-admin.js

# Luego actualiza el rol en MongoDB
```

### Paso 3: Ejecutar Tests

```bash
# Test completo en consola
node scripts/test-all.js

# O generar reporte HTML
node scripts/test-report.js
```

---

## 📊 Interpretando Resultados

### Consola (test-all.js)

```
✓ Test pasado (verde)
✗ Test fallido (rojo)

Pass Rate: 95.5% (verde si >= 80%, amarillo si < 80%)
```

### Reporte HTML (test-report.js)

- **Cards superiores**: Total, Passed, Failed, Pass Rate
- **Secciones**: Agrupadas por categoría
- **Íconos**: ✓ para pasado, ✗ para fallido
- **Duración**: Tiempo de cada test en ms
- **Errores**: Mensajes detallados en rojo

---

## 🔧 Configuración

Los scripts usan variables de entorno con valores por defecto:

```bash
# Backend URL (default: http://localhost:5000)
export BACKEND_URL=http://localhost:5000

# Frontend URL (default: http://localhost:3000)
export FRONTEND_URL=http://localhost:3000
```

Para cambiar URLs:

```bash
BACKEND_URL=http://localhost:4000 FRONTEND_URL=http://localhost:3001 node scripts/test-all.js
```

---

## ⚠️ Problemas Comunes

### 1. "Backend is not running"
**Solución:**
```bash
cd backend
npm run dev
```

### 2. "Frontend is not running"
**Solución:**
```bash
cd frontend
npm run dev
```

### 3. "ECONNREFUSED"
**Causa:** Servicio no está corriendo o puerto incorrecto
**Solución:** Verifica que Backend (5000) y Frontend (3000) estén corriendo

### 4. "Timeout"
**Causa:** Servicio tarda mucho en responder
**Solución:** Verifica que MongoDB esté corriendo y conectado

### 5. "404 Not Found en /api/orders/number/ORD-00001"
**Esto es normal:** El test espera 404 si no hay pedidos. Crea un pedido desde el frontend para que pase.

---

## 📝 Agregar Nuevos Tests

### En test-all.js:

```javascript
// Agregar test de endpoint
await testEndpoint('Descripción del test', `${API_URL}/tu-endpoint`, {
  method: 'POST',
  body: { data: 'valor' },
  expectedStatus: 200,
});

// Agregar test de página
await testPage('Nombre de página', `${FRONTEND_URL}/ruta`);
```

### En test-report.js:

```javascript
const miSeccion = section('Mi Nueva Sección');
miSeccion.tests.push(
  await test('Mi Test', async () => {
    const res = await request(`${API_URL}/endpoint`);
    if (res.status !== 200) throw new Error('Fallo');
  })
);
```

---

## 🎯 Checklist de Testing Manual

Después de ejecutar los scripts, verifica manualmente:

### Frontend Público
- [ ] Página de inicio carga correctamente
- [ ] Catálogo muestra productos
- [ ] Detalle de producto con variantes funciona
- [ ] Agregar al carrito funciona
- [ ] Descuentos se calculan correctamente
- [ ] Checkout completa y genera pedido
- [ ] WhatsApp se abre con mensaje correcto

### Panel Admin
- [ ] Login funciona con credenciales correctas
- [ ] Dashboard muestra métricas
- [ ] Lista de pedidos carga
- [ ] Detalle de pedido muestra info completa
- [ ] Cambiar estado de pedido funciona
- [ ] Lista de productos carga
- [ ] Stock muestra alertas correctamente
- [ ] Categorías y marcas se listan

### Flujo Completo
- [ ] Cliente hace pedido desde frontend
- [ ] Pedido aparece en admin panel
- [ ] Admin cambia estado de pedido
- [ ] WhatsApp se puede enviar
- [ ] Stock se actualiza (si implementado)

---

## 📈 Métricas de Calidad

**Objetivo:** Pass Rate >= 95%

- **Excelente:** 95-100% ✅
- **Bueno:** 85-94% ⚠️
- **Necesita atención:** < 85% ❌

---

## 🔄 Integración Continua (CI)

Para usar en GitHub Actions u otro CI:

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: node scripts/test-all.js
```

---

## 📞 Soporte

Si los tests fallan consistentemente:

1. Verifica que todos los servicios estén corriendo
2. Revisa los logs de Backend y Frontend
3. Ejecuta tests individuales para aislar el problema
4. Verifica conexión a MongoDB
5. Limpia cache de npm: `npm cache clean --force`

---

**Última actualización:** 2025-01-12
**Versión:** 1.0.0

# Errores Comunes y Soluciones - Panel Admin

> Documento de referencia para desarrollo del panel de administración.
> Registra errores encontrados y solucionados durante la implementación del sistema de creación de productos.

---

## 📋 Índice

1. [Errores de TypeScript](#errores-de-typescript)
2. [Errores de Rutas/Endpoints](#errores-de-rutasendpoints)
3. [Errores de Validación](#errores-de-validación)
4. [Errores de Mongoose](#errores-de-mongoose)
5. [Errores de Autenticación](#errores-de-autenticación)
6. [Consideraciones para Futuras Implementaciones](#consideraciones-para-futuras-implementaciones)

---

## Errores de TypeScript

### ❌ Error 1: Type Inference en Respuestas de API

**Archivo:** `backend/src/controllers/productParentController.ts`

**Error:**
```
Type 'Document & IProductParent' is not assignable to type 'IProductParent'
```

**Causa:**
- Usar spread operator (`...productParent.toObject()`) en respuesta
- TypeScript no puede inferir correctamente el tipo resultante

**Solución:**
```typescript
// ❌ INCORRECTO
return res.status(201).json({
  data: {
    ...productParent.toObject(),
    defaultVariant: createdVariant
  }
});

// ✅ CORRECTO
return res.status(201).json({
  data: {
    productParent: productParent.toObject(),
    defaultVariant: createdVariant?.toObject(),
    imageUploadResult: imageUploadResult
  }
});
```

**Lección:**
- Estructura las respuestas de forma explícita
- Evita spread de documentos de Mongoose
- Usa `.toObject()` en documentos Mongoose antes de devolverlos

---

## Errores de Rutas/Endpoints

### ❌ Error 2: Duplicación de `/api` en URLs

**Archivo:** `frontend/app/admin/productos/nuevo/page.tsx`

**Error:**
```
404 Not Found: /api/api/products/parents
```

**Causa:**
- `NEXT_PUBLIC_API_URL` ya incluye `/api`
- El código agregaba `/api` nuevamente en fetch

**Configuración:**
```env
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

**Solución:**
```typescript
// ❌ INCORRECTO
fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products/parents`)

// ✅ CORRECTO
fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/parents`)
```

**Lección:**
- Si `NEXT_PUBLIC_API_URL` incluye `/api`, NO duplicarlo
- Revisar configuración de `axios` (lib/axios.ts) para consistencia
- Usar axios en lugar de fetch cuando sea posible (maneja auth automáticamente)

---

### ❌ Error 3: Nombre de Token en localStorage

**Archivo:** `frontend/app/admin/productos/nuevo/page.tsx`

**Error:**
```
401 Unauthorized - user: "anonymous"
```

**Causa:**
- Login guarda token como `'admin-token'`
- Código buscaba `'token'`

**Solución:**
```typescript
// ❌ INCORRECTO
const token = localStorage.getItem('token');

// ✅ CORRECTO
const token = localStorage.getItem('admin-token');
```

**Cómo Verificar:**
```javascript
// En consola del navegador
localStorage.getItem('admin-token') // Debe devolver token
localStorage.getItem('token')       // Devuelve null
```

**Lección:**
- Revisar `hooks/admin/useAdminAuth.ts` para ver cómo se guarda el token
- Usar nombres consistentes en todo el proyecto
- Considerar crear constante: `const TOKEN_KEY = 'admin-token'`

---

### ❌ Error 4: Ruta de Endpoint No Coincide

**Archivo:** `frontend/services/admin/dashboard.ts`

**Error:**
```
400 Bad Request: /api/products/variants/low-stock
Error: "params.id" - "ID inválido"
```

**Causa:**
- Frontend: `/products/variants/low-stock`
- Backend: `/products/variants/stock/low`
- Express matchea con `/variants/:id` en su lugar

**Solución:**
```typescript
// ❌ INCORRECTO
api.get('/products/variants/low-stock')

// ✅ CORRECTO
api.get('/products/variants/stock/low')
```

**Lección:**
- **SIEMPRE** verificar rutas en `backend/src/routes/*.ts`
- Orden de rutas importa en Express (más específicas primero)
- Rutas con parámetros (`:id`) deben ir DESPUÉS de rutas literales

**Ejemplo de Orden Correcto:**
```typescript
// ✅ CORRECTO - Literales primero
router.get('/variants/stock/low', ...)
router.get('/variants/stock/out', ...)
router.get('/variants/:id', ...)  // Al final

// ❌ INCORRECTO - Parámetro primero
router.get('/variants/:id', ...)        // Matchea todo
router.get('/variants/stock/low', ...)  // Nunca se alcanza
```

---

## Errores de Validación

### ❌ Error 5: FormData Convierte Todo a Strings

**Archivo:** `backend/src/routes/productRoutes.ts`

**Error:**
```json
{
  "field": "body.categories",
  "message": "Expected array, received string"
},
{
  "field": "body.featured",
  "message": "Expected boolean, received string"
}
```

**Causa:**
- `multipart/form-data` convierte todos los valores a strings
- Zod valida ANTES de que puedas parsear

**Solución:**
Crear middleware `parseFormData`:

```typescript
// backend/src/middleware/parseFormData.ts
export const parseProductFormData = (req, res, next) => {
  if (!req.files) return next();

  // Parsear JSON strings
  if (req.body.categories && typeof req.body.categories === 'string') {
    req.body.categories = JSON.parse(req.body.categories);
  }

  // Convertir boolean strings
  if (req.body.featured !== undefined) {
    req.body.featured = req.body.featured === 'true';
  }

  next();
};
```

**Orden de Middlewares:**
```typescript
router.post('/parents',
  authenticate,
  authorize('admin', 'funcionario'),
  uploadMultiple,           // 1. Parsea multipart
  handleMulterError,        // 2. Maneja errores de multer
  parseFormData,            // 3. Convierte strings a tipos
  validate(schema),         // 4. Valida con Zod
  controller                // 5. Ejecuta lógica
);
```

**Lección:**
- FormData SIEMPRE envía strings
- Crear middleware de parsing ANTES de validación
- Parsear: arrays JSON, booleans, números

---

## Errores de Mongoose

### ❌ Error 6: Validación Antes de Hooks Pre-Save

**Archivo:** `backend/src/models/ProductVariant.ts`

**Error:**
```
ProductVariant validation failed:
- name: El nombre de la variante es requerido
- sku: El SKU es requerido
```

**Causa:**
- Campos `required: true` en schema
- Hooks pre-save los generan
- Mongoose valida ANTES de ejecutar hooks

**Solución Incorrecta (Parche):**
```typescript
// ❌ PARCHE - Valores placeholder
createdVariant = await ProductVariant.create({
  name: 'temp',  // Placeholder
  sku: 'temp',   // Placeholder
  ...
});
```

**Solución Correcta:**
```typescript
// Schema
name: {
  type: String,
  required: false,  // Auto-generated in pre-save hook
  trim: true,
},
sku: {
  type: String,
  required: false,  // Auto-generated in pre-save hook
  unique: true,
},

// Hook con validación
productVariantSchema.pre('save', async function (next) {
  // Generar name
  this.name = `${parent.name} ${attributeValues}`;

  // Validar que se generó
  if (!this.name) {
    return next(new Error('CRITICAL: No se pudo generar el nombre'));
  }
  next();
});
```

**Lección:**
- Campos auto-generados deben ser `required: false`
- Validar DENTRO del hook después de generar
- Seguir patrón de `slug` (ya implementado correctamente)

**Patrón Correcto para Campos Auto-Generados:**
1. `required: false` en schema
2. Hook pre-save genera el valor
3. Hook valida que se generó exitosamente
4. Lanzar error si falló la generación

---

## Errores de Autenticación

### ❌ Error 7: Token No Se Envía en Fetch

**Causa:**
- `fetch` nativo no usa interceptores de axios
- Token debe agregarse manualmente

**Solución:**
```typescript
const token = localStorage.getItem('admin-token');
const response = await fetch(url, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,  // ✅ Agregar manualmente
  },
  body: formData
});
```

**Mejor Práctica:**
```typescript
// Usar axios cuando sea posible (tiene interceptores)
import api from '@/lib/axios';

// api.post automáticamente agrega el token
await api.post('/products/parents', data);
```

**Lección:**
- Usar `axios` por defecto (maneja auth automáticamente)
- Solo usar `fetch` para multipart/form-data complejos
- Si usas fetch, SIEMPRE agregar Authorization header

---

## Consideraciones para Futuras Implementaciones

### 🎯 Checklist Pre-Implementación

**Backend:**
- [ ] Verificar que las rutas NO tengan parámetros conflictivos
- [ ] Rutas específicas ANTES de rutas con parámetros (`:id`)
- [ ] Si usa multipart, crear middleware de parsing
- [ ] Campos auto-generados: `required: false` + validación en hook
- [ ] Usar `.toObject()` en respuestas de Mongoose
- [ ] Estructurar respuestas explícitamente (no spread)

**Frontend:**
- [ ] Verificar `NEXT_PUBLIC_API_URL` en `.env.local`
- [ ] NO duplicar `/api` en fetch URLs
- [ ] Usar `localStorage.getItem('admin-token')` para auth
- [ ] Preferir `axios` sobre `fetch` cuando sea posible
- [ ] Si usas fetch, agregar `Authorization` header manualmente
- [ ] Verificar rutas coincidan EXACTAMENTE con backend

**Validación:**
- [ ] FormData → Middleware de parsing ANTES de validación
- [ ] Parsear: `JSON.parse()` para arrays/objects
- [ ] Convertir strings a boolean: `=== 'true'`
- [ ] Middleware orden: multer → parse → validate → controller

**TypeScript:**
- [ ] Evitar spread de Mongoose documents
- [ ] Llamar `.toObject()` antes de devolver documents
- [ ] Estructurar respuestas de forma explícita
- [ ] Definir tipos de respuesta cuando sea necesario

---

## 🔍 Debugging Tips

### Verificar Rutas del Backend
```bash
# Buscar todas las rutas de productos
grep -r "router.get\|router.post" backend/src/routes/productRoutes.ts
```

### Verificar Token en Frontend
```javascript
// En consola del navegador (F12)
localStorage.getItem('admin-token')
```

### Verificar FormData en Network Tab
1. F12 → Network
2. Encuentra la request
3. Payload → Form Data
4. Verifica tipos: `"true"` (string) vs `true` (boolean)

### Verificar Orden de Middlewares
```typescript
// El orden IMPORTA
router.post('/path',
  middleware1,  // Se ejecuta primero
  middleware2,  // Luego este
  middleware3,  // Finalmente este
  controller
);
```

---

## 📝 Patrones Recomendados

### Patrón: Crear Recurso con Imágenes

**Backend Controller:**
```typescript
export const createResource = asyncHandler(async (req, res) => {
  // 1. Parsear body (ya parseado por middleware)
  const { name, description, categories } = req.body;

  // 2. Upload imágenes (si existen)
  const files = req.files as Express.Multer.File[];
  let imageUrls = [];
  if (files && files.length > 0) {
    const result = await uploadImagesHybrid(files, { folder: 'resources' });
    imageUrls = result.uploaded;
  }

  // 3. Crear recurso
  const resource = await Resource.create({
    name,
    description,
    categories,
    images: imageUrls,
  });

  // 4. Respuesta estructurada
  return res.status(201).json({
    success: true,
    data: {
      resource: resource.toObject(),
      imageUploadResult: result
    }
  });
});
```

**Backend Route:**
```typescript
router.post('/resources',
  authenticate,
  authorize('admin'),
  uploadMultiple,
  handleMulterError,
  parseFormData,  // ← Importante si usa FormData
  validate(schema),
  controller.createResource
);
```

**Frontend Service:**
```typescript
export const createResource = async (data, images) => {
  const formData = new FormData();

  // Strings directos
  formData.append('name', data.name);

  // Arrays/Objects como JSON string
  formData.append('categories', JSON.stringify(data.categories));

  // Booleans como string
  formData.append('active', String(data.active));

  // Archivos
  images.forEach(img => formData.append('images', img));

  // Fetch con auth manual
  const token = localStorage.getItem('admin-token');
  const response = await fetch(`${API_URL}/resources`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData
  });

  return response.json();
};
```

---

## 🚀 Próximos Módulos a Implementar

### Categorías
- CRUD básico (ya existe backend)
- Validar rutas coincidan
- Agregar imágenes si necesario

### Marcas
- Similar a categorías
- Incluir logo/imagen de marca

### Inventario
- Actualización de stock
- Historial de movimientos
- Alertas de stock bajo

### Órdenes
- Lista con filtros
- Cambio de estado
- Detalles de orden

### Usuarios
- Lista de clientes
- Permisos de funcionarios
- Historial de compras

### Reportes
- Ventas por período
- Productos más vendidos
- Análisis de inventario

---

## 📚 Referencias Útiles

**Archivos Clave:**
- Backend Routes: `backend/src/routes/`
- Backend Schemas: `backend/src/schemas/`
- Backend Controllers: `backend/src/controllers/`
- Frontend Services: `frontend/services/admin/`
- Frontend Types: `frontend/types/admin.ts`
- Axios Config: `frontend/lib/axios.ts`

**Comandos Útiles:**
```bash
# Ver estructura de rutas
grep -r "router\." backend/src/routes/

# Buscar un endpoint específico
grep -r "'/products/variants'" backend/

# Ver schemas de validación
cat backend/src/schemas/productSchemas.ts | grep "export const"
```

---

## 🔄 Última Actualización

**Fecha:** 2025-11-16
**Sesión:** Implementación de sistema de creación de productos
**Branch:** `claude/enhanced-product-creation-01TQvcF4jqgRTTvshHqEurkr`

**Errores Documentados:** 7
**Patrones Establecidos:** 3
**Módulos Pendientes:** 6

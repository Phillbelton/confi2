# Guía de Prueba Manual - Productos con Variantes y Productos Simples

Esta guía te ayudará a probar manualmente tanto productos con variantes como productos simples.

## 📋 Requisitos Previos

1. MongoDB corriendo
2. Variables de entorno configuradas (`.env`)
3. Dependencias instaladas (`npm install`)

---

## 🚀 Paso 1: Iniciar el Servidor

### Terminal 1 - Iniciar el servidor de desarrollo:

```bash
cd backend
npm run dev
```

El servidor debería iniciar en `http://localhost:5000` (o el puerto configurado en tu `.env`)

---

## 👤 Paso 2: Preparar Datos Iniciales

### Crear usuario admin:

```bash
cd backend
npm run seed:admin
```

**Credenciales del admin:**
- Email: `admin@quelita.com`
- Password: `Admin123!`

---

## 🔑 Paso 3: Obtener Token de Autenticación

### Opción A: Usando curl

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@quelita.com",
    "password": "Admin123!"
  }'
```

### Opción B: Usando Postman/Thunder Client

**POST** `http://localhost:5000/api/auth/login`

**Body (JSON):**
```json
{
  "email": "admin@quelita.com",
  "password": "Admin123!"
}
```

**Respuesta esperada:**
```json
{
  "success": true,
  "data": {
    "user": { ... },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**⚠️ IMPORTANTE:** Guarda el `token` de la respuesta. Lo necesitarás para todas las siguientes peticiones.

**Para las siguientes requests, usa este header:**
```
Authorization: Bearer TU_TOKEN_AQUI
```

---

## 🍫 PARTE 1: Probar Productos SIMPLES (sin variantes)

### Paso 4: Crear Productos Simples con Script

```bash
cd backend
npm run seed:simple-products
```

Este script creará 10 productos simples de chocolates artesanales.

### Paso 5: Verificar Productos Simples Creados

#### Listar todos los productos:

```bash
curl http://localhost:5000/api/products/parents
```

#### Obtener un producto específico:

```bash
curl http://localhost:5000/api/products/parents/PRODUCT_ID_AQUI
```

### Paso 6: Crear un Producto Simple Manualmente

#### Request para crear producto simple:

```bash
curl -X POST http://localhost:5000/api/products/parents \
  -H "Authorization: Bearer TU_TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Bombón de Prueba Manual",
    "description": "Delicioso bombón creado manualmente para testing",
    "categories": ["CATEGORY_ID_AQUI"],
    "brand": "BRAND_ID_AQUI",
    "images": ["/uploads/chocolates/test.jpg"],
    "variantAttributes": [],
    "featured": true
  }'
```

**Notas:**
- `variantAttributes: []` = Producto simple (sin variantes)
- Guarda el `productParent._id` de la respuesta

### Paso 7: Crear Variante Default para Producto Simple

```bash
curl -X POST http://localhost:5000/api/products/variants \
  -H "Authorization: Bearer TU_TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d '{
    "parentProduct": "PRODUCT_PARENT_ID_AQUI",
    "attributes": {},
    "price": 2500,
    "stock": 150,
    "images": ["/uploads/chocolates/test.jpg"],
    "lowStockThreshold": 20
  }'
```

**Notas:**
- `attributes: {}` = Sin atributos (variante default)
- El SKU y slug se generan automáticamente

### Paso 8: Probar Operaciones sobre Productos Simples

#### Actualizar stock:

```bash
curl -X PATCH http://localhost:5000/api/products/variants/VARIANT_ID_AQUI/stock \
  -H "Authorization: Bearer TU_TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d '{
    "stock": 100
  }'
```

#### Actualizar precio:

```bash
curl -X PUT http://localhost:5000/api/products/variants/VARIANT_ID_AQUI \
  -H "Authorization: Bearer TU_TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d '{
    "price": 3000
  }'
```

#### Aplicar descuento:

```bash
curl -X PUT http://localhost:5000/api/products/variants/VARIANT_ID_AQUI \
  -H "Authorization: Bearer TU_TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d '{
    "fixedDiscount": {
      "enabled": true,
      "type": "percentage",
      "value": 15,
      "badge": "15% OFF"
    }
  }'
```

#### Ver preview de descuento:

```bash
curl http://localhost:5000/api/products/variants/VARIANT_ID_AQUI/discount-preview
```

---

## 🎨 PARTE 2: Probar Productos CON VARIANTES

### Paso 9: Crear Categoría y Marca (si no existen)

#### Crear categoría:

```bash
curl -X POST http://localhost:5000/api/categories \
  -H "Authorization: Bearer TU_TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Chocolates Artesanales",
    "description": "Chocolates premium hechos a mano",
    "color": "#8B4513",
    "order": 1,
    "active": true
  }'
```

#### Crear marca:

```bash
curl -X POST http://localhost:5000/api/brands \
  -H "Authorization: Bearer TU_TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Cacao Noble",
    "logo": "/uploads/brands/cacao-noble.jpg",
    "active": true
  }'
```

### Paso 10: Crear Producto Padre con Atributos de Variación

```bash
curl -X POST http://localhost:5000/api/products/parents \
  -H "Authorization: Bearer TU_TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Chocolate Bitter Premium",
    "description": "El mejor chocolate bitter artesanal con alto contenido de cacao",
    "categories": ["CATEGORY_ID_AQUI"],
    "brand": "BRAND_ID_AQUI",
    "images": ["/uploads/chocolates/bitter-premium.jpg"],
    "variantAttributes": [
      {
        "name": "peso",
        "displayName": "Peso",
        "order": 1,
        "values": [
          { "value": "100g", "displayValue": "100 gramos", "order": 1 },
          { "value": "200g", "displayValue": "200 gramos", "order": 2 },
          { "value": "500g", "displayValue": "500 gramos", "order": 3 }
        ]
      },
      {
        "name": "cacao",
        "displayName": "% Cacao",
        "order": 2,
        "values": [
          { "value": "70%", "displayValue": "70% Cacao", "order": 1 },
          { "value": "85%", "displayValue": "85% Cacao", "order": 2 },
          { "value": "90%", "displayValue": "90% Cacao", "order": 3 }
        ]
      }
    ],
    "featured": true
  }'
```

**Notas:**
- `variantAttributes` define los atributos de variación
- Cada atributo debe tener al menos 2 valores
- Guarda el `productParent._id` de la respuesta

### Paso 11: Crear Variantes con Diferentes Combinaciones

#### Variante 1: 100g - 70% cacao

```bash
curl -X POST http://localhost:5000/api/products/variants \
  -H "Authorization: Bearer TU_TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d '{
    "parentProduct": "PRODUCT_PARENT_ID_AQUI",
    "attributes": {
      "peso": "100g",
      "cacao": "70%"
    },
    "price": 5000,
    "stock": 100,
    "images": ["/uploads/chocolates/bitter-100g-70.jpg"]
  }'
```

#### Variante 2: 200g - 85% cacao

```bash
curl -X POST http://localhost:5000/api/products/variants \
  -H "Authorization: Bearer TU_TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d '{
    "parentProduct": "PRODUCT_PARENT_ID_AQUI",
    "attributes": {
      "peso": "200g",
      "cacao": "85%"
    },
    "price": 9500,
    "stock": 80,
    "images": ["/uploads/chocolates/bitter-200g-85.jpg"]
  }'
```

#### Variante 3: 500g - 90% cacao

```bash
curl -X POST http://localhost:5000/api/products/variants \
  -H "Authorization: Bearer TU_TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d '{
    "parentProduct": "PRODUCT_PARENT_ID_AQUI",
    "attributes": {
      "peso": "500g",
      "cacao": "90%"
    },
    "price": 22000,
    "stock": 50,
    "images": ["/uploads/chocolates/bitter-500g-90.jpg"]
  }'
```

### Paso 12: Verificar Variantes Creadas

#### Listar todas las variantes de un producto:

```bash
curl http://localhost:5000/api/products/parents/PRODUCT_PARENT_ID_AQUI/variants
```

#### Obtener variante por ID:

```bash
curl http://localhost:5000/api/products/variants/VARIANT_ID_AQUI
```

#### Obtener variante por SKU:

```bash
curl http://localhost:5000/api/products/variants/sku/SKU_AQUI
```

### Paso 13: Probar Validaciones (Casos de Error)

#### ❌ Intentar crear variante con valor no válido:

```bash
curl -X POST http://localhost:5000/api/products/variants \
  -H "Authorization: Bearer TU_TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d '{
    "parentProduct": "PRODUCT_PARENT_ID_AQUI",
    "attributes": {
      "peso": "100g",
      "cacao": "95%"
    },
    "price": 5000,
    "stock": 100
  }'
```

**Respuesta esperada:** Error 500 - "95%" no es un valor válido para el atributo "cacao"

#### ❌ Intentar crear variante con atributo extra:

```bash
curl -X POST http://localhost:5000/api/products/variants \
  -H "Authorization: Bearer TU_TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d '{
    "parentProduct": "PRODUCT_PARENT_ID_AQUI",
    "attributes": {
      "peso": "100g",
      "cacao": "70%",
      "sabor": "naranja"
    },
    "price": 5000,
    "stock": 100
  }'
```

**Respuesta esperada:** Error 500 - "sabor" no está definido en el producto padre

#### ✅ Crear variante con atributos parciales (esto SÍ está permitido):

```bash
curl -X POST http://localhost:5000/api/products/variants \
  -H "Authorization: Bearer TU_TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d '{
    "parentProduct": "PRODUCT_PARENT_ID_AQUI",
    "attributes": {
      "peso": "100g"
    },
    "price": 4500,
    "stock": 120
  }'
```

**Respuesta esperada:** Success - El sistema permite atributos parciales

---

## 📊 Paso 14: Probar Gestión de Stock

### Ver variantes con bajo stock:

```bash
curl -H "Authorization: Bearer TU_TOKEN_AQUI" \
  http://localhost:5000/api/products/variants/stock/low
```

### Ver variantes sin stock:

```bash
curl -H "Authorization: Bearer TU_TOKEN_AQUI" \
  http://localhost:5000/api/products/variants/stock/out
```

---

## 🎁 Paso 15: Probar Productos Destacados

```bash
curl http://localhost:5000/api/products/parents/featured
```

---

## 🗑️ Paso 16: Probar Eliminación (Soft Delete)

### Intentar eliminar la única variante activa (debería fallar):

```bash
curl -X DELETE http://localhost:5000/api/products/variants/VARIANT_ID_AQUI \
  -H "Authorization: Bearer TU_TOKEN_AQUI"
```

**Respuesta esperada:** Error 400 - "No se puede eliminar la única variante activa"

### Eliminar producto padre (soft delete):

```bash
curl -X DELETE http://localhost:5000/api/products/parents/PRODUCT_PARENT_ID_AQUI \
  -H "Authorization: Bearer TU_TOKEN_AQUI"
```

**Respuesta esperada:** Success - El producto y sus variantes se marcan como `active: false`

---

## ✅ Checklist de Pruebas

### Productos Simples:
- [ ] Crear producto simple con script
- [ ] Crear producto simple manualmente
- [ ] Crear variante default (attributes vacío)
- [ ] Verificar auto-generación de SKU y slug
- [ ] Actualizar stock
- [ ] Actualizar precio
- [ ] Aplicar descuento
- [ ] Ver preview de descuento
- [ ] Soft delete

### Productos con Variantes:
- [ ] Crear producto padre con variantAttributes
- [ ] Crear múltiples variantes con diferentes combinaciones
- [ ] Verificar auto-generación de nombre (parent + attributes)
- [ ] Verificar auto-generación de SKU único
- [ ] Verificar auto-generación de slug único
- [ ] Validación: valor no válido (debe fallar)
- [ ] Validación: atributo extra (debe fallar)
- [ ] Validación: atributos parciales (debe funcionar)
- [ ] Listar variantes de un producto
- [ ] Stock management (low/out)
- [ ] Descuentos
- [ ] Soft delete

---

## 📝 Notas Importantes

1. **IDs Dinámicos**: Reemplaza todos los `*_ID_AQUI` con los IDs reales de tu base de datos

2. **Tokens**: El token JWT expira después de 7 días. Si obtienes errores 401, genera un nuevo token

3. **Soft Delete**: Las eliminaciones marcan `active: false`, no borran registros

4. **Validaciones**:
   - Productos simples: `variantAttributes` vacío o ausente
   - Variantes simples: `attributes` vacío
   - Productos con variantes: `variantAttributes` con al menos 1 atributo y 2 valores por atributo

5. **Auto-generación**:
   - SKU: Se genera automáticamente si no se proporciona
   - Slug: Se genera a partir del nombre
   - Name (variante): Se genera combinando nombre del padre + valores de atributos

---

## 🛠️ Troubleshooting

### Error: "Cannot connect to MongoDB"
- Verifica que MongoDB esté corriendo
- Revisa la variable `MONGO_URI` en tu `.env`

### Error: 401 Unauthorized
- Verifica que el token esté incluido en el header `Authorization`
- Genera un nuevo token si expiró

### Error: 500 Internal Server Error
- Revisa los logs del servidor para más detalles
- Verifica que los IDs existan en la base de datos

### No veo los productos creados
- Verifica que `active: true` en los filtros
- Usa MongoDB Compass o mongosh para verificar la base de datos directamente

---

## 📚 Recursos Adicionales

- **Documentación de API**: Revisa `/backend/src/routes/productRoutes.ts`
- **Schemas de validación**: `/backend/src/schemas/productSchemas.ts`
- **Modelos**:
  - `/backend/src/models/ProductParent.ts`
  - `/backend/src/models/ProductVariant.ts`
- **Tests**:
  - `/backend/src/__tests__/integration/chocolate-products.test.ts` (26 tests)
  - `/backend/src/__tests__/integration/simple-products.test.ts` (21 tests)

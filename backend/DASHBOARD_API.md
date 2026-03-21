# Dashboard API Endpoints

Documentación de los endpoints del dashboard administrativo.

## Autenticación Requerida

Todos los endpoints requieren autenticación y rol de **admin** o **funcionario**.

**Headers necesarios:**
```
Cookie: token=<jwt_token>
```

O alternativamente:
```
Authorization: Bearer <jwt_token>
```

---

## Endpoints

### 1. Estadísticas del Dashboard

Obtiene estadísticas generales para el dashboard principal.

**Endpoint:**
```
GET /api/admin/dashboard/stats
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "todaySales": 125000,
    "todayOrders": 15,
    "weekSales": 850000,
    "monthSales": 3200000,
    "pendingOrders": 8,
    "lowStockProducts": 12,
    "totalProducts": 150,
    "totalCustomers": 450
  }
}
```

**Campos:**
- `todaySales`: Total de ventas del día actual (desde las 00:00)
- `todayOrders`: Número de órdenes del día (excluye canceladas)
- `weekSales`: Ventas de los últimos 7 días
- `monthSales`: Ventas de los últimos 30 días
- `pendingOrders`: Órdenes en estado `pending_whatsapp` o `confirmed`
- `lowStockProducts`: Variantes con stock <= lowStockThreshold
- `totalProducts`: Total de ProductParent activos
- `totalCustomers`: Usuarios con rol `cliente` y activos

---

### 2. Datos para Gráfico de Ventas

Obtiene datos de ventas diarias para el gráfico de líneas.

**Endpoint:**
```
GET /api/admin/dashboard/sales-chart?days=30
```

**Query Parameters:**
- `days` (opcional): Número de días hacia atrás. Default: 30

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "date": "2024-11-01",
      "sales": 45000,
      "orders": 6
    },
    {
      "date": "2024-11-02",
      "sales": 52000,
      "orders": 8
    },
    {
      "date": "2024-11-03",
      "sales": 0,
      "orders": 0
    }
  ]
}
```

**Notas:**
- Incluye todos los días en el rango, incluso si no hay ventas (con valores 0)
- Excluye órdenes canceladas
- Datos ordenados por fecha ascendente

---

### 3. Top Productos Más Vendidos

Obtiene los productos más vendidos por revenue total.

**Endpoint:**
```
GET /api/admin/dashboard/top-products?limit=10
```

**Query Parameters:**
- `limit` (opcional): Número de productos a retornar. Default: 10

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "name": "Chocolate Premium 500g",
      "totalSold": 125,
      "revenue": 625000,
      "image": "https://..."
    },
    {
      "name": "Alfajores Surtidos x12",
      "totalSold": 89,
      "revenue": 534000,
      "image": "https://..."
    }
  ]
}
```

**Campos:**
- `name`: Nombre del producto (de variantSnapshot)
- `totalSold`: Total de unidades vendidas
- `revenue`: Ingresos totales generados
- `image`: URL de la imagen del producto

**Notas:**
- Ordenados por revenue (mayor a menor)
- Excluye órdenes canceladas
- Agrega todos los items de todas las órdenes

---

### 4. Órdenes Recientes

Obtiene las órdenes más recientes.

**Endpoint:**
```
GET /api/admin/dashboard/recent-orders?limit=10
```

**Query Parameters:**
- `limit` (opcional): Número de órdenes a retornar. Default: 10

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "6543210abcdef...",
      "orderNumber": "ORD-20241115-001",
      "customer": {
        "name": "Juan Pérez",
        "email": "juan@example.com",
        "phone": "+595981234567"
      },
      "total": 125000,
      "status": "pending_whatsapp",
      "createdAt": "2024-11-15T10:30:00.000Z"
    }
  ]
}
```

**Notas:**
- Ordenadas por fecha de creación (más reciente primero)
- Incluye todos los estados (incluso canceladas)
- Solo retorna campos esenciales para la vista de dashboard

---

## Estados de Órdenes

Los posibles estados de órdenes son:
- `pending_whatsapp`: Pendiente de envío de WhatsApp
- `confirmed`: Confirmada por el cliente
- `preparing`: En preparación
- `shipped`: Enviada
- `completed`: Completada
- `cancelled`: Cancelada

---

## Ejemplos de Uso

### Con cURL

```bash
# Login primero para obtener el token
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password123"}' \
  -c cookies.txt

# Luego usar el token en las peticiones
curl -X GET http://localhost:5000/api/admin/dashboard/stats \
  -b cookies.txt

# O usar el token directamente
curl -X GET http://localhost:5000/api/admin/dashboard/sales-chart?days=7 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Con JavaScript/Fetch

```javascript
// Asumiendo que el token está en una httpOnly cookie
const response = await fetch('http://localhost:5000/api/admin/dashboard/stats', {
  credentials: 'include', // Importante para enviar cookies
});

const data = await response.json();
console.log(data);
```

---

## Códigos de Error

- `401 Unauthorized`: No autenticado o token inválido
- `403 Forbidden`: Usuario no tiene rol de admin o funcionario
- `500 Internal Server Error`: Error en el servidor

---

## Notas de Performance

- El endpoint `/stats` hace múltiples queries en paralelo usando `Promise.all()`
- Las agregaciones de MongoDB están optimizadas con índices en:
  - `createdAt` para filtros de fecha
  - `status` para filtros de estado
  - `active` para productos y usuarios activos

- Para grandes volúmenes de datos, considera usar caché (Redis) para estos endpoints

# LÓGICA DE NEGOCIO - Confitería Quelita

Documento de especificación completa de la lógica de negocio del sistema de ecommerce.

**Fecha:** 2025-01-03
**Versión:** 1.0
**Estado:** Aprobado

---

## 1. ROLES Y PERMISOS

### 1.1 Definición de Roles

El sistema maneja 4 roles principales:

#### **VISITA** (No autenticado)
Usuario que navega el sitio sin estar registrado.

**Permisos:**
- ✅ Ver catálogo de productos
- ✅ Ver detalle de productos con variantes
- ✅ Usar filtros y búsqueda
- ✅ Agregar productos al carrito
- ✅ Proceder al checkout
- ✅ Enviar pedido por WhatsApp (no se guarda en DB)
- ❌ Ver historial de órdenes
- ❌ Guardar favoritos
- ❌ Dejar reviews

#### **CLIENTE** (Autenticado - rol default)
Usuario registrado que puede comprar y ver su historial.

**Permisos:**
- ✅ Todo lo de VISITA +
- ✅ Ver historial de órdenes
- ✅ Consultar estado de órdenes
- ✅ Re-ordenar (volver a comprar pedido anterior)
- ✅ Cancelar orden en estado `pending_whatsapp`
- ✅ Guardar favoritos (Fase 2)
- ✅ Dejar reviews de productos (Fase 2)
- ❌ Acceso al panel admin

#### **FUNCIONARIO**
Empleado que gestiona órdenes entrantes y atiende clientes.

**Permisos:**
- ✅ Ver dashboard simplificado
- ✅ Ver todas las órdenes
- ✅ Filtrar órdenes (pendientes, confirmadas, etc.)
- ✅ Ver detalle de órdenes
- ✅ Cambiar estado de órdenes
- ✅ Agregar notas a órdenes
- ✅ Ver alertas de stock bajo
- ✅ Ver información de productos (solo lectura)
- ❌ Crear/editar/eliminar productos
- ❌ Modificar precios o descuentos
- ❌ Gestionar categorías o marcas
- ❌ Gestionar usuarios admin/funcionarios
- ❌ Cancelar órdenes en estado `preparing` o posterior

**Casos de uso:**
- Recibe notificación de nueva orden por WhatsApp
- Abre panel admin → ve orden pendiente
- Confirma disponibilidad con cliente por WhatsApp
- Cambia estado a "Confirmada"
- Prepara pedido → cambia estado a "Preparando"
- Entrega/envía → cambia estado a "Enviado" o "Listo para retiro"

#### **ADMIN**
Administrador con acceso total al sistema.

**Permisos:**
- ✅ **ACCESO TOTAL**
- ✅ CRUD de productos padre y variantes
- ✅ CRUD de categorías y marcas
- ✅ Configurar descuentos (fijos y escalonados)
- ✅ Gestión de órdenes (todos los estados)
- ✅ Cancelar órdenes en cualquier estado
- ✅ Gestión de usuarios (crear/editar/bloquear admin y funcionarios)
- ✅ Ver logs de auditoría
- ✅ Configuración general del sitio
- ✅ Ver reportes y estadísticas (Fase 2)

**Cantidad esperada:**
- 3 administradores
- 10 funcionarios (aprox)

### 1.2 Matriz de Permisos

| Funcionalidad | Visita | Cliente | Funcionario | Admin |
|---------------|--------|---------|-------------|-------|
| Ver productos | ✅ | ✅ | ✅ | ✅ |
| Agregar al carrito | ✅ | ✅ | ❌ | ❌ |
| Hacer pedido WhatsApp | ✅ | ✅ | ❌ | ❌ |
| Ver historial órdenes | ❌ | ✅ (propias) | ✅ (todas) | ✅ (todas) |
| Cancelar orden pending | ❌ | ✅ | ✅ | ✅ |
| Cambiar estado orden | ❌ | ❌ | ✅ | ✅ |
| Cancelar orden confirmed+ | ❌ | ❌ | ❌ | ✅ |
| Ver alertas stock | ❌ | ❌ | ✅ | ✅ |
| CRUD productos | ❌ | ❌ | ❌ | ✅ |
| Configurar descuentos | ❌ | ❌ | ❌ | ✅ |
| CRUD categorías/marcas | ❌ | ❌ | ❌ | ✅ |
| Gestionar usuarios | ❌ | ❌ | ❌ | ✅ |
| Ver auditoría | ❌ | ❌ | ❌ | ✅ |

---

## 2. SISTEMA DE VARIANTES DE PRODUCTOS

### 2.1 Concepto

Un **Producto Padre** agrupa múltiples **Variantes** que comparten características comunes pero difieren en atributos específicos (tamaño, sabor, color, etc.).

**Ejemplo Real:**
```
Producto Padre: "Bebida Cola"
├── Atributos de Variación:
│   ├── Tamaño: [350ml, 500ml, 1L]
│   └── Sabor: [Original, Zero, Light]
│
└── Variantes Generadas (9 SKUs):
    ├── COLA-350-ORIG  → 350ml × Original → $500, Stock: 100
    ├── COLA-350-ZERO  → 350ml × Zero → $550, Stock: 80
    ├── COLA-350-LIGHT → 350ml × Light → $520, Stock: 60
    ├── COLA-500-ORIG  → 500ml × Original → $700, Stock: 50
    ├── COLA-500-ZERO  → 500ml × Zero → $750, Stock: 40
    ├── COLA-500-LIGHT → 500ml × Light → $720, Stock: 30
    ├── COLA-1L-ORIG   → 1L × Original → $1200, Stock: 20
    ├── COLA-1L-ZERO   → 1L × Zero → $1300, Stock: 15
    └── COLA-1L-LIGHT  → 1L × Light → $1250, Stock: 10
```

### 2.2 Reglas de Negocio

1. **Producto Padre NO se vende directamente**
   - Es solo un contenedor/agrupador
   - Contiene información común (descripción, categorías, marca)

2. **Solo las Variantes se venden**
   - Cada variante tiene su propio precio y stock
   - Cada variante puede tener sus propias imágenes (hasta 5)
   - Cada variante tiene un SKU único

3. **Combinaciones de Atributos**
   - Sistema genera todas las combinaciones posibles
   - Admin puede desactivar combinaciones no deseadas
   - Ejemplo: Si "1L × Light" no existe, se desactiva esa variante

4. **Precio Independiente por Variante**
   - NO hay precio base + diferencial
   - Cada variante tiene su precio completo
   - Permite total flexibilidad de precios

5. **Stock Independiente por Variante**
   - Stock se maneja a nivel de variante, no de producto padre
   - Permite control granular de inventario

6. **Imágenes por Variante**
   - Cada variante puede tener imágenes específicas
   - Útil cuando el empaque cambia (ej: lata roja vs lata negra)
   - Hasta 5 imágenes por variante

### 2.3 Tipos de Atributos

Atributos comunes en confitería:

| Atributo | Valores Ejemplo | Uso |
|----------|----------------|-----|
| **Peso** | 100g, 200g, 500g, 1kg | Chocolates, caramelos a granel |
| **Tamaño** | Chico, Mediano, Grande | Tortas, cajas de bombones |
| **Sabor** | Chocolate, Fresa, Vainilla | Golosinas, bebidas |
| **Formato** | 350ml, 500ml, 1L, 2L | Bebidas |
| **Tipo** | Con leche, Amargo, Blanco | Chocolates |
| **Presentación** | Individual, Pack x6, Caja x12 | Diversos |

**Configuración flexible:**
- Admin define qué atributos usa cada producto padre
- No todos los productos necesitan variantes
- Productos simples (sin variantes) siguen funcionando igual

---

## 3. SISTEMA DE DESCUENTOS

### 3.1 Tipos de Descuentos

#### **3.1.1 Descuento Fijo por Variante**

Se aplica a UNA variante específica.

**Características:**
- Tipo: Porcentaje (%) o Monto fijo ($)
- Valor: Número positivo
- Fechas: Inicio y fin (opcional)
- Badge: Texto personalizable (ej: "15% OFF", "OFERTA")

**Ejemplo:**
```
Variante: Cola 350ml Original
Descuento Fijo: 15%
Precio normal: $500
Precio con descuento: $425
Badge: "15% OFF"
Vigencia: 01/01/2025 - 31/01/2025
```

**Regla:** Si tiene descuento fijo Y escalonado, se aplica el mejor para el cliente.

#### **3.1.2 Descuento Escalonado por Atributo**

Se aplica a TODAS las variantes que comparten un valor de atributo específico.

**Características clave:**
- Se configura a nivel de **Producto Padre**
- Aplica a variantes con **mismo valor de atributo**
- Requiere cantidad mínima para activarse
- Puede tener múltiples tiers (escalones)

**Ejemplo 1: Descuento por Tamaño**
```
Producto Padre: Bebida Cola
Descuento configurado:
  Atributo: "tamaño"
  Valor: "350ml"
  Tiers:
    - 6-11 unidades → 10% descuento
    - 12-23 unidades → 15% descuento
    - 24+ unidades → 20% descuento

Aplicación:
✅ Cliente compra: 4× Cola 350ml Original + 4× Cola 350ml Zero
   Total: 8 unidades de 350ml → 10% descuento aplica a TODAS

❌ Cliente compra: 4× Cola 350ml Original + 4× Cola 500ml Original
   Total: 8 unidades pero tamaños mezclados → SIN descuento
```

**Ejemplo 2: Múltiples Descuentos**
```
Producto Padre: Bebida Cola

Descuento A:
  Atributo: "tamaño", Valor: "350ml"
  Tiers: 6+ → 10%

Descuento B:
  Atributo: "tamaño", Valor: "500ml"
  Tiers: 6+ → 8%

Descuento C:
  Atributo: "sabor", Valor: "Zero"
  Tiers: 12+ → 5%

Aplicación:
Cliente compra 8× Cola 350ml Zero:
  - Cumple con Descuento A (8 unidades de 350ml) → 10%
  - NO cumple con Descuento C (solo 8, necesita 12 de Zero)
  - Resultado: 10% descuento
```

### 3.2 Reglas de Aplicación de Descuentos

1. **Solo el mejor descuento aplica** (no se acumulan)
2. **Comparación entre:**
   - Descuento fijo de la variante
   - Descuento escalonado aplicable (si cumple cantidad)
3. **Descuento nunca puede hacer precio negativo**
4. **Descuentos vencidos no se aplican** (check de fechas)

### 3.3 Cálculo de Descuento en Carrito

**Algoritmo:**
```
Para cada producto en el carrito:
  1. Identificar variante
  2. Agrupar variantes por atributo clave (ej: tamaño)

Para cada grupo:
  3. Calcular cantidad total del grupo
  4. Verificar si cumple con algún tier de descuento escalonado
  5. Si cumple, determinar % o monto de descuento

Para cada variante individual:
  6. Verificar si tiene descuento fijo activo
  7. Comparar descuento fijo vs escalonado
  8. Aplicar el mayor (mejor para cliente)
  9. Calcular precio final = precio base - descuento

Resumen del carrito:
  10. Subtotal (sin descuentos)
  11. Total de descuentos
  12. Total final
```

### 3.4 Badges Visuales de Descuentos

**En tarjeta de producto (catálogo):**
- Si tiene descuento fijo: Badge con texto del descuento ("15% OFF")
- Si tiene descuento escalonado: Badge "6+ unidades: 10% OFF"
- Precio tachado (original) + precio con descuento destacado

**En detalle de producto:**
- Tabla completa de tiers de descuento escalonado
- Calculadora de ahorro según cantidad seleccionada
- Preview de precio por unidad en cada tier

**En carrito:**
- Desglose de descuentos aplicados
- Total ahorrado destacado

---

## 4. GESTIÓN DE STOCK

### 4.1 Stock por Variante

- Cada variante tiene su propio stock independiente
- Stock se descuenta a nivel de variante, no de producto padre

### 4.2 Sobre-venta

**PERMITIDA:** El sistema permite vender con stock negativo.

**Casos de uso:**
- Productos bajo pedido
- Stock en tránsito
- Ventas anticipadas

**Configuración:**
- Flag `allowBackorder` en variante (default: true)
- Si `false`, no permite agregar al carrito si stock = 0

### 4.3 Productos sin Control de Stock

**Flag:** `trackStock: boolean` en ProductVariant

- Si `false`, stock siempre muestra "Disponible"
- Útil para: servicios, productos digitales, productos por encargo

### 4.4 Descuento de Stock al Crear Orden

**Momento:** Inmediatamente al crear la orden.

**Lógica:**
```
1. Cliente confirma checkout
2. Se valida disponibilidad (solo si trackStock = true)
3. Se crea orden en DB
4. Se descuenta stock de cada variante:
   - Variante.stock -= cantidad pedida
5. Se marca orden como pending_whatsapp
```

**Razón:** Reservar stock aunque esté pending, evita sobre-venta.

### 4.5 Devolución de Stock al Cancelar Orden

**Automática:** Sí, al cambiar estado a `cancelled`.

**Lógica:**
```
1. Admin o cliente cancela orden
2. Sistema itera items de la orden
3. Para cada item:
   - Variante.stock += cantidad devuelta
4. Se registra movimiento en StockMovement
5. Se marca orden.cancelledAt = now
```

### 4.6 Historial de Movimientos de Stock

**Modelo:** `StockMovement`

**Registra:**
- Tipo de movimiento (venta, cancelación, ajuste manual, devolución)
- Variante afectada
- Cantidad (+/-)
- Usuario que realizó el cambio (si aplica)
- Orden relacionada (si aplica)
- Fecha y hora
- Notas

**Uso:**
- Auditoría de cambios
- Reconciliación de inventario
- Detectar discrepancias

### 4.7 Alertas de Stock Bajo

**Configuración:**
- Umbral global: 5 unidades (configurable por admin)
- Umbral por variante: se puede especificar uno diferente

**Visualización:**
- Widget en dashboard de admin/funcionario
- Lista de variantes con stock bajo
- Filtro para ver solo alertas críticas
- Link directo para editar stock

**Notificación:** (Fase 2)
- Email diario al admin con resumen
- Notificación en plataforma

---

## 5. FLUJO DE ESTADOS DE ÓRDENES

### 5.1 Diagrama de Estados

```
[Cliente crea orden]
         ↓
   PENDING_WHATSAPP ──────┐
         ↓                 │
   [Funcionario confirma] │
         ↓                 │
     CONFIRMED ────────────┤
         ↓                 │
   [Funcionario prepara]  │
         ↓                 ├──→ CANCELLED
     PREPARING ────────────┤    (Cancelado)
         ↓                 │
   [Funcionario envía]    │
         ↓                 │
   SHIPPED / READY ───────┘
         ↓
   [Cliente recibe]
         ↓
     COMPLETED
```

### 5.2 Descripción de Estados

#### **PENDING_WHATSAPP**
- Orden recién creada
- Enviada por WhatsApp al negocio
- Esperando confirmación del funcionario
- Stock YA descontado

**Acciones permitidas:**
- Cliente: Ver detalle, Cancelar
- Funcionario: Ver detalle, Cambiar a Confirmed, Cancelar
- Admin: Todo

#### **CONFIRMED**
- Funcionario confirmó disponibilidad con cliente
- En espera de preparación
- Stock descontado

**Acciones permitidas:**
- Cliente: Ver detalle (NO puede cancelar)
- Funcionario: Ver detalle, Cambiar a Preparing, Cancelar
- Admin: Todo, Cancelar

#### **PREPARING**
- Funcionario está armando el pedido
- Stock descontado

**Acciones permitidas:**
- Cliente: Ver detalle
- Funcionario: Ver detalle, Cambiar a Shipped/Ready
- Admin: Todo, Cancelar

#### **SHIPPED / READY_FOR_PICKUP**
- Pedido enviado o listo para retirar
- Ya no se puede cancelar

**Acciones permitidas:**
- Cliente: Ver detalle
- Funcionario: Ver detalle, Cambiar a Completed
- Admin: Todo (incluso cancelar en casos excepcionales)

#### **COMPLETED**
- Pedido entregado y completado
- Estado final exitoso

**Acciones permitidas:**
- Cliente: Ver detalle, Re-ordenar, Dejar review (Fase 2)
- Funcionario: Ver detalle
- Admin: Todo

#### **CANCELLED**
- Pedido cancelado
- Stock devuelto automáticamente
- Estado final fallido

**Acciones permitidas:**
- Todos: Solo lectura

### 5.3 Reglas de Cancelación

| Estado | Cliente | Funcionario | Admin |
|--------|---------|-------------|-------|
| pending_whatsapp | ✅ Sí | ✅ Sí | ✅ Sí |
| confirmed | ❌ No | ✅ Sí | ✅ Sí |
| preparing | ❌ No | ❌ No | ✅ Sí |
| shipped/ready | ❌ No | ❌ No | ✅ Sí (excepcional) |
| completed | ❌ No | ❌ No | ❌ No |

**Al cancelar:**
1. Stock se devuelve automáticamente
2. Se registra en StockMovement
3. Campo `cancelledBy` guarda quién canceló
4. Campo `cancelledAt` guarda fecha/hora
5. Campo `adminNotes` puede tener motivo

---

## 6. CATEGORÍAS MÚLTIPLES

### 6.1 Concepto

Un producto puede pertenecer a múltiples categorías sin jerarquía de principal/secundaria.

**Ejemplo:**
```
Producto: "Chocolate Sin TACC 100g"
Categorías:
  - Chocolates
  - Sin TACC
  - Productos Artesanales
```

**Comportamiento:**
- Aparece en el listado de las 3 categorías
- En filtros, se muestra en todas
- Orden alfabético en menú de categorías

### 6.2 Modelo de Datos

**Eliminado:** Campo `parent` en Category

**Nuevo:** Campo `categories: ObjectId[]` en ProductParent

**Subcategorías:**
- Sistema anterior con parent/child se elimina
- Todas las categorías son "flat" (mismo nivel)
- Si necesitas "Chocolates - Artesanales", creas categoría "Chocolates Artesanales"

### 6.3 Filtros

**Filtro "Nuevos":**
- No es categoría
- Es filtro por fecha: `createdAt >= hace30días`

**Filtro "Ofertas":**
- No es categoría
- Es filtro por descuento activo: `hasActiveDiscount = true`

---

## 7. GESTIÓN DE USUARIOS ADMIN/FUNCIONARIOS

### 7.1 Creación de Usuarios

**Solo Admin puede crear:**
- Otros admins
- Funcionarios

**Datos requeridos:**
- Nombre
- Email (único)
- Contraseña (mínimo 6 caracteres)
- Rol (admin / funcionario)
- Estado (activo / bloqueado)

### 7.2 Activar/Desactivar

**No se eliminan físicamente:**
- Campo `active: boolean`
- Usuario bloqueado no puede hacer login
- Datos se preservan para auditoría

### 7.3 Auditoría de Acciones Críticas

**Se registra en modelo `AuditLog`:**

**Acciones auditadas:**
- Creación/edición/eliminación de productos
- Cambios en precios o descuentos
- Cancelación de órdenes
- Creación/bloqueo de usuarios admin/funcionario
- Cambios masivos de stock

**Datos registrados:**
- Usuario que realizó la acción
- Tipo de acción
- Entidad afectada (producto, orden, usuario)
- Valores antes/después (JSON)
- Timestamp
- IP address

**NO se audita:**
- Cambios de estado de orden normales (pending → confirmed)
- Login/logout
- Consultas de lectura

---

## 8. RESUMEN DE REGLAS DE NEGOCIO

### 8.1 Productos y Variantes
1. Producto padre agrupa variantes pero no se vende
2. Cada variante tiene precio y stock independiente
3. Variantes se crean combinando atributos (tamaño × sabor)
4. Imágenes son por variante (hasta 5)
5. Admin puede desactivar variantes no deseadas

### 8.2 Descuentos
1. Solo el mejor descuento aplica (no acumulan)
2. Descuento fijo es por variante individual
3. Descuento escalonado es por grupo de variantes con mismo atributo
4. Se requiere cantidad mínima para activar descuento escalonado
5. Descuentos tienen fechas de vigencia

### 8.3 Stock
1. Stock es por variante
2. Se permite sobre-venta (configurable)
3. Stock se descuenta al crear orden
4. Stock se devuelve al cancelar orden
5. Productos sin trackStock siempre disponibles
6. Alertas cuando stock < 5 (o umbral custom)

### 8.4 Órdenes
1. Cliente/visita puede hacer pedido por WhatsApp
2. Orden se crea en DB con estado pending_whatsapp
3. Solo cliente puede cancelar en pending_whatsapp
4. Funcionario gestiona órdenes pero no puede cancelar después de confirmed
5. Admin puede cancelar en cualquier estado
6. Cancelación devuelve stock automáticamente

### 8.5 Roles
1. Visita: puede ver y comprar
2. Cliente: + historial y cancelación temprana
3. Funcionario: gestiona órdenes, ve alertas, sin CRUD productos
4. Admin: acceso total

---

**Documento aprobado y listo para implementación.**

**Próximo paso:** Implementar modelos de base de datos según esta especificación.

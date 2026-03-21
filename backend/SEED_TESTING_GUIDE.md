# Guía de Scripts de Seeding y Testing

Esta guía explica cómo usar los scripts de seeding para poblar la base de datos con datos de prueba y testear las diferentes funcionalidades del sistema.

## Índice
- [Comandos Disponibles](#comandos-disponibles)
- [Flujo Recomendado](#flujo-recomendado)
- [Scripts Básicos](#scripts-básicos)
- [Scripts de Testing](#scripts-de-testing)
- [Ejemplos de Uso](#ejemplos-de-uso)

---

## Comandos Disponibles

### Scripts Básicos de Datos

```bash
# Crear usuario administrador
npm run seed:admin

# Crear usuarios de prueba
npm run seed:users

# Crear categorías de productos
npm run seed:categories

# Crear marcas de productos
npm run seed:brands

# Crear tags/etiquetas
npm run seed:tags

# Crear productos (variantes)
npm run seed:products

# Crear productos simples
npm run seed:simple-products
```

### Scripts de Testing de Funcionalidades

```bash
# Aplicar descuentos a productos existentes
npm run seed:discounts

# Crear órdenes de prueba en diferentes estados
npm run seed:orders

# Crear movimientos de inventario de prueba
npm run seed:stock-movements
```

### Comandos Combinados

```bash
# Poblar datos básicos (categorías, marcas, tags y productos)
npm run seed:all

# Poblar TODO (datos básicos + descuentos + órdenes + movimientos de stock)
npm run seed:test-data
```

---

## Flujo Recomendado

### Primera Vez (Base de Datos Vacía)

1. **Crear administrador** (obligatorio):
   ```bash
   npm run seed:admin
   ```

2. **Poblar datos básicos**:
   ```bash
   npm run seed:all
   ```
   Esto creará: categorías → marcas → tags → productos

3. **Poblar datos de testing**:
   ```bash
   npm run seed:test-data
   ```
   Esto agregará: descuentos → órdenes → movimientos de stock

### Testing de Funcionalidades Específicas

Si ya tienes productos en la base de datos y solo quieres testear una funcionalidad específica:

```bash
# Solo testear sistema de descuentos
npm run seed:discounts

# Solo testear sistema de órdenes
npm run seed:orders

# Solo testear sistema de inventario
npm run seed:stock-movements
```

---

## Scripts Básicos

### 1. seed:admin
**Propósito**: Crear usuario administrador inicial

**Qué hace**:
- Crea un usuario con rol `admin`
- Email: `admin@quelita.com`
- Password: `admin123`

**Cuándo usarlo**: La primera vez que configuras el sistema.

---

### 2. seed:categories
**Propósito**: Crear categorías y subcategorías de productos

**Qué hace**:
- Crea categorías principales (ej: Cosmética, Alimentos, Bebidas)
- Crea subcategorías bajo cada categoría principal
- Genera slugs automáticamente

**Opciones interactivas**:
- Pregunta si deseas eliminar categorías existentes

---

### 3. seed:brands
**Propósito**: Crear marcas de productos

**Qué hace**:
- Crea 20 marcas de prueba (Marca-A hasta Marca-T)
- Genera slugs automáticamente
- Todas las marcas se crean como activas

**Opciones interactivas**:
- Pregunta si deseas eliminar marcas existentes

---

### 4. seed:products
**Propósito**: Crear productos con variantes

**Qué hace**:
- Crea productos con múltiples variantes
- Asigna categorías, marcas y tags aleatorios
- Configura precios y stock

**Dependencias**:
- Requiere categorías existentes
- Requiere marcas existentes
- Requiere tags existentes

---

## Scripts de Testing

### 1. seed:discounts ✨ NUEVO

**Propósito**: Testear el sistema completo de descuentos

**Qué hace**:
- Aplica **descuentos fijos** (porcentuales y en monto)
- Aplica **descuentos escalonados** (tiered discounts)
- Prueba el **stacking** (combinación de ambos tipos)
- Crea descuentos con fechas de vigencia
- Crea descuentos con badges personalizados

**Escenarios de prueba**:
1. Descuento fijo 15%
2. Descuento fijo $500
3. Descuento temporal (20% por 30 días)
4. Descuento escalonado básico (2+: 10%, 5+: 20%)
5. Descuento escalonado con montos ($200, $500)
6. **STACKING**: Fijo 10% + Escalonado (5%, 10%)
7. **STACKING**: Fijo $300 + Escalonado (5%, 15%)
8. Descuento escalonado complejo (4 niveles)
9. Descuento escalonado temporal
10. Descuento deshabilitado (testing)

**Dependencias**:
- Requiere productos existentes
- Mínimo 10 variantes de productos

**Salida**:
```
📊 RESUMEN DE DESCUENTOS APLICADOS
═══════════════════════════════════
✅ Variantes actualizadas: 10
═══════════════════════════════════

💰 DESCUENTOS CONFIGURADOS
[Tabla detallada con nombre, precio y descuentos aplicados]
```

---

### 2. seed:orders ✨ NUEVO

**Propósito**: Testear el sistema de órdenes en todos sus estados

**Qué hace**:
- Crea órdenes en diferentes estados
- Prueba diferentes métodos de entrega
- Prueba diferentes métodos de pago
- Genera órdenes con diferentes cantidades de items

**Estados de órdenes creadas**:
- ✅ **PENDING**: Orden recién creada, esperando confirmación
- ✅ **CONFIRMED**: Orden confirmada por el cliente
- ✅ **PROCESSING**: Orden en preparación
- ✅ **COMPLETED**: Orden entregada y completada
- ❌ **CANCELLED**: Orden cancelada

**Métodos de entrega**:
- 🚚 Envío a domicilio
- 🏪 Retiro en tienda

**Métodos de pago**:
- Transferencia bancaria
- Pago móvil
- Efectivo
- Tarjeta de crédito

**Dependencias**:
- Requiere productos existentes
- Opcional: usuarios con rol `cliente`

**Salida**:
```
📊 RESUMEN DE ÓRDENES CREADAS
═══════════════════════════════════
✅ Órdenes creadas: 6
═══════════════════════════════════

📈 ESTADÍSTICAS POR ESTADO:
   Pendientes: 2
   Confirmadas: 1
   En proceso: 1
   Completadas: 1
   Canceladas: 1
```

---

### 3. seed:stock-movements ✨ NUEVO

**Propósito**: Testear el sistema de gestión de inventario

**Qué hace**:
- Crea movimientos de todos los tipos
- Actualiza el stock de las variantes automáticamente
- Genera historial de movimientos para auditoría

**Tipos de movimientos**:
- 📈 **RESTOCK**: Reabastecimiento de inventario
- 💰 **SALE**: Venta de productos (reduce stock)
- 🔧 **ADJUSTMENT**: Ajustes manuales (+ o -)
- ↩️  **RETURN**: Devoluciones de clientes
- ❌ **CANCELLATION**: Cancelaciones de ventas

**Escenarios de prueba**:
1. Restock inicial (+100 unidades)
2. Restock mensual (+50 unidades)
3. Restock de urgencia (+75 unidades)
4. Ventas normales (-5, -3 unidades)
5. Venta mayorista (-10 unidades)
6. Ajuste positivo por conteo (+20)
7. Ajuste negativo por daños (-8)
8. Corrección de inventario (+15)
9. Devoluciones (+2, +1)
10. Cancelaciones (+3)
11. Serie completa de movimientos en productos específicos

**Dependencias**:
- Requiere productos existentes
- Opcional: usuarios administradores

**Salida**:
```
📈 ESTADÍSTICAS POR TIPO:
   📦 Restock: 5
   💰 Ventas: 6
   🔧 Ajustes: 3
   ↩️  Devoluciones: 2
   ❌ Cancelaciones: 1

📦 STOCK ACTUAL DE PRODUCTOS CON MOVIMIENTOS
[Tabla con nombre, stock actual y cantidad de movimientos]
```

---

## Ejemplos de Uso

### Escenario 1: Setup Inicial Completo

```bash
# Paso 1: Crear administrador
npm run seed:admin

# Paso 2: Poblar datos básicos
npm run seed:all
# Esto ejecuta: categories → brands → tags → products

# Paso 3: Agregar datos de testing
npm run seed:discounts
npm run seed:orders
npm run seed:stock-movements
```

O todo en un solo comando:
```bash
npm run seed:admin
npm run seed:test-data
```

---

### Escenario 2: Testear Solo Descuentos

```bash
# Ya tengo productos, solo quiero probar descuentos
npm run seed:discounts
```

Resultado esperado:
- 10 productos con diferentes tipos de descuentos
- Podrás ver en el frontend:
  - Badges de descuento
  - Precios con descuento
  - Calculadora de descuentos escalonados
  - Stacking de descuentos

---

### Escenario 3: Testear Flujo de Órdenes

```bash
# Crear órdenes de prueba
npm run seed:orders
```

Resultado esperado:
- 6 órdenes en diferentes estados
- Podrás testear en el admin:
  - Vista de lista de órdenes
  - Filtros por estado
  - Acciones (confirmar, procesar, completar, cancelar)
  - Notificaciones por WhatsApp

---

### Escenario 4: Testear Gestión de Inventario

```bash
# Crear movimientos de stock
npm run seed:stock-movements
```

Resultado esperado:
- Múltiples movimientos de diferentes tipos
- Podrás testear en el admin:
  - Historial de movimientos
  - Alertas de stock bajo
  - Ajustes de inventario
  - Filtros y búsqueda

---

### Escenario 5: Resetear y Empezar de Nuevo

```bash
# Los scripts preguntarán si deseas eliminar datos existentes

# Categorías
npm run seed:categories
# Responde 's' para eliminar las existentes

# Marcas
npm run seed:brands
# Responde 's' para eliminar las existentes

# Descuentos
npm run seed:discounts
# Responde 's' para limpiar descuentos existentes

# Órdenes
npm run seed:orders
# Responde 's' para eliminar órdenes existentes

# Movimientos de stock
npm run seed:stock-movements
# Responde 's' para eliminar movimientos existentes
```

---

## Verificación de Datos

Después de ejecutar los scripts, puedes verificar los datos:

### En MongoDB:
```javascript
// Verificar descuentos
db.productvariants.find({ "fixedDiscount.enabled": true })
db.productvariants.find({ "tieredDiscount.active": true })

// Verificar órdenes
db.orders.find()
db.orders.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }])

// Verificar movimientos de stock
db.stockmovements.find()
db.stockmovements.aggregate([{ $group: { _id: "$type", count: { $sum: 1 } } }])
```

### En el Frontend:
1. **Catálogo de Productos**: Ver productos con descuentos y badges
2. **Admin → Productos**: Editar productos y ver configuración de descuentos
3. **Admin → Órdenes**: Ver todas las órdenes en diferentes estados
4. **Admin → Inventario**: Ver alertas y movimientos de stock

---

## Troubleshooting

### Error: "No hay variantes de productos"
**Solución**: Ejecuta primero `npm run seed:products`

### Error: "MONGODB_URI no está configurada"
**Solución**: Verifica que tu archivo `.env` tenga la variable `MONGODB_URI`

### Los descuentos no se muestran
**Solución**:
- Verifica que `fixedDiscount.enabled: true` o `tieredDiscount.active: true`
- Revisa las fechas de vigencia (startDate/endDate)

### Las órdenes no aparecen
**Solución**: Verifica que los productos existan y tengan stock

---

## Notas Importantes

1. **Orden de ejecución**: Siempre ejecuta los scripts básicos antes que los de testing
2. **Dependencias**: Los scripts de testing requieren datos básicos existentes
3. **Interactividad**: Todos los scripts preguntan si deseas limpiar datos existentes
4. **Stock**: Los movimientos de stock actualizan el campo `stock` de las variantes
5. **Auditoría**: Todos los movimientos quedan registrados con timestamp y usuario

---

## Comandos Útiles de MongoDB

```bash
# Ver todos los comandos seed disponibles
npm run | grep seed

# Contar documentos
mongo --eval "db.productvariants.count()"
mongo --eval "db.orders.count()"
mongo --eval "db.stockmovements.count()"

# Limpiar colecciones específicas
mongo --eval "db.orders.deleteMany({})"
mongo --eval "db.stockmovements.deleteMany({})"
```

---

## Conclusión

Esta suite de scripts de seeding te permite:

✅ Poblar rápidamente la base de datos con datos de prueba
✅ Testear todas las funcionalidades del sistema
✅ Reproducir escenarios específicos de negocio
✅ Validar flujos completos de trabajo
✅ Detectar bugs antes de producción

Para cualquier duda, revisa el código fuente de cada script en `/backend/src/scripts/`

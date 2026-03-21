# ROADMAP DE IMPLEMENTACIÓN - MVP 3 SEMANAS

Plan de desarrollo secuencial del MVP con sistema de variantes.

**Duración Total:** 3 semanas (15 días hábiles)
**Fecha inicio:** 2025-01-06
**Fecha objetivo:** 2025-01-24

---

## SEMANA 1: BACKEND + SISTEMA DE VARIANTES

### Día 1-2: Modelos y Base de Datos

**Tareas:**
- ✅ Crear modelo `ProductParent`
- ✅ Crear modelo `ProductVariant`
- ✅ Actualizar modelo `User` (agregar rol `funcionario`, campo `active`)
- ✅ Actualizar modelo `Order` (campos de cancelación, WhatsApp)
- ✅ Actualizar modelo `Category` (eliminar `parent`, mantener flat)
- ✅ Crear modelo `StockMovement`
- ✅ Crear modelo `AuditLog`
- ✅ Configurar índices de MongoDB
- ✅ Scripts de migración (opcional si hay datos previos)

**Entregables:**
- Archivos `/backend/src/models/ProductParent.ts`
- Archivos `/backend/src/models/ProductVariant.ts`
- Modelos actualizados
- Tests unitarios de modelos

**Tiempo estimado:** 2 días

---

### Día 3-4: Controllers de Variantes

**Tareas:**
- ✅ `productParentController.ts`
  - createProductParent (con variantes)
  - getProductParents (listar con filtros)
  - getProductParentById
  - updateProductParent
  - deleteProductParent (soft delete)

- ✅ `productVariantController.ts`
  - getVariantsByParent
  - getVariantById
  - updateVariant (precio, stock, imágenes)
  - bulkUpdateVariants (actualizar múltiples)
  - calculateDiscount (para cantidad específica)

- ✅ Actualizar `orderController.ts`
  - Soporte para variantes en items
  - Lógica de descuentos escalonados
  - Descuento de stock por variante
  - Devolución de stock al cancelar

**Entregables:**
- Controllers completos
- Lógica de descuentos implementada
- Validaciones completas

**Tiempo estimado:** 2 días

---

### Día 5: Services y Utilities

**Tareas:**
- ✅ `discountService.ts`
  - Calculadora de descuentos (fijos + escalonados)
  - Agrupación de variantes por atributo
  - Aplicación del mejor descuento

- ✅ `stockService.ts`
  - Descuento de stock
  - Devolución de stock
  - Registro en StockMovement
  - Verificación de disponibilidad

- ✅ `uploadService.ts`
  - Upload de imágenes con Multer
  - Procesamiento con Sharp (4 tamaños)
  - Validaciones de formato y tamaño

- ✅ `whatsappService.ts`
  - Generador de mensaje formateado
  - URL de WhatsApp con texto encoded

**Entregables:**
- Servicios auxiliares completos
- Utils para generación de SKU, slugs

**Tiempo estimado:** 1 día

---

### Día 6-7: Routes y Middleware

**Tareas:**
- ✅ Crear todas las routes:
  - `/api/products` (public)
  - `/api/admin/products` (admin only)
  - `/api/admin/variants` (admin only)
  - `/api/categories` (public)
  - `/api/brands` (public)
  - `/api/orders` (public/authenticated)
  - `/api/admin/orders` (admin/funcionario)
  - `/api/admin/users` (admin only)
  - `/api/admin/audit-logs` (admin only)

- ✅ Middleware de permisos por rol
  - `isAdmin`, `isFuncionario`, `isAdminOrFuncionario`
  - Validación de rol en cada ruta protegida

- ✅ Testing de endpoints
  - Postman collection
  - Tests de integración

**Entregables:**
- Routes completas y montadas
- Middleware de autorización funcional
- Documentación de API (README o Postman)

**Tiempo estimado:** 2 días

---

## SEMANA 2: FRONTEND - ADMIN PANEL

### Día 8-9: Setup Frontend + UI Base

**Tareas:**
- ✅ Inicializar proyecto Next.js
- ✅ Configurar shadcn/ui
- ✅ Instalar dependencias (React Query, Zustand, etc.)
- ✅ Configurar Tailwind con paleta de colores
- ✅ Crear componentes UI base:
  - Button, Input, Select, Textarea
  - Card, Badge, Separator
  - Sheet, Dialog, Alert
  - Table, Tabs, Accordion

- ✅ Layout de admin:
  - Sidebar con navegación
  - Header con usuario y logout
  - Breadcrumbs

**Entregables:**
- Proyecto frontend configurado
- Sistema de diseño base implementado
- Layout admin funcional

**Tiempo estimado:** 2 días

---

### Día 10-11: CRUD de Productos con Variantes (Admin)

**Tareas:**
- ✅ Página: `/admin/productos`
  - Lista de productos padre
  - Búsqueda y filtros
  - Tabla con acciones (editar, eliminar, ver variantes)

- ✅ Página: `/admin/productos/nuevo`
  - Paso 1: Información general
  - Paso 2: Definir atributos de variación
  - Paso 3: Configurar variantes (tabla inline)
  - Paso 4: Configurar descuentos escalonados
  - Validaciones en cada paso

- ✅ Página: `/admin/productos/[id]/editar`
  - Misma UI que crear
  - Pre-cargado con datos existentes

- ✅ Componentes:
  - `VariantAttributeBuilder` (crear atributos)
  - `VariantTable` (tabla editable de variantes)
  - `TieredDiscountConfig` (configurar descuentos)
  - `ImageUploader` (upload con preview)

**Entregables:**
- CRUD completo de productos con variantes
- UI intuitiva y validada
- Upload de imágenes funcional

**Tiempo estimado:** 2 días

---

### Día 12: Admin - Categorías, Marcas, Usuarios

**Tareas:**
- ✅ Página: `/admin/categorias`
  - CRUD de categorías (flat, sin parent)
  - Tabla con nombre, color, activo
  - Modal para crear/editar

- ✅ Página: `/admin/marcas`
  - CRUD de marcas
  - Upload de logo

- ✅ Página: `/admin/usuarios`
  - Lista de admins y funcionarios
  - Crear nuevo usuario (admin/funcionario)
  - Activar/desactivar usuarios
  - NO se elimina físicamente

**Entregables:**
- CRUDs auxiliares completos
- Gestión de usuarios funcional

**Tiempo estimado:** 1 día

---

### Día 13-14: Admin - Gestión de Órdenes

**Tareas:**
- ✅ Página: `/admin/ordenes`
  - Lista de órdenes con filtros (estado, fecha, búsqueda)
  - Tabla con: número, cliente, total, estado, fecha
  - Badges de color por estado
  - Paginación

- ✅ Página: `/admin/ordenes/[orderNumber]`
  - Detalle completo de orden
  - Items con variantes
  - Información del cliente
  - Selector de estado (dropdown)
  - Agregar notas de admin
  - Botón cancelar (con confirmación)

- ✅ Widget: Alertas de Stock Bajo
  - Lista de variantes con stock < threshold
  - Link directo para editar stock
  - Filtro para ver solo críticas

**Entregables:**
- Gestión completa de órdenes
- Alertas de stock funcionales
- UI responsiva y clara

**Tiempo estimado:** 2 días

---

## SEMANA 3: FRONTEND - CLIENTE + TESTING

### Día 15-16: Catálogo Público con Variantes

**Tareas:**
- ✅ Página: `/` (Home)
  - Hero section
  - Productos destacados
  - Carrusel de categorías

- ✅ Página: `/productos`
  - Grid de productos padre
  - Filtros: categorías, marca, precio, atributos
  - Búsqueda con autocompletado
  - Ordenamiento
  - Paginación
  - Badges de descuento en cards

- ✅ Página: `/productos/[slug]`
  - Galería de imágenes (cambia según variante)
  - Selectores de atributos (ej: tamaño, sabor)
  - Precio actualizado según variante seleccionada
  - Stock disponible
  - Tabla de descuentos escalonados
  - Calculadora de ahorro según cantidad
  - Selector de cantidad
  - Botón "Agregar al carrito"
  - Productos relacionados

**Entregables:**
- Catálogo funcional con variantes
- Selectores intuitivos
- Cálculo de descuentos en tiempo real

**Tiempo estimado:** 2 días

---

### Día 17: Carrito y Checkout

**Tareas:**
- ✅ Componente: `Cart` (Sheet lateral)
  - Lista de items con variantes
  - Modificar cantidad
  - Eliminar items
  - Desglose de descuentos
  - Subtotal, descuentos, total

- ✅ Store Zustand: `cartStore`
  - Agregar al carrito
  - Actualizar cantidad
  - Remover item
  - Calcular descuentos automáticamente
  - Persistencia en localStorage

- ✅ Página: `/checkout`
  - Paso 1: Información de contacto (nombre, email, teléfono, dirección)
  - Paso 2: Método de entrega (retiro/envío)
  - Paso 3: Resumen con botón "Enviar por WhatsApp"
  - Generación de mensaje pre-formateado
  - Apertura de WhatsApp
  - Página de confirmación

**Entregables:**
- Carrito funcional con descuentos
- Checkout completo con WhatsApp
- Persistencia de carrito

**Tiempo estimado:** 1 día

---

### Día 18: Autenticación y Perfil de Usuario

**Tareas:**
- ✅ Página: `/login`
  - Formulario de login
  - Validación con React Hook Form + Zod

- ✅ Página: `/register`
  - Formulario de registro
  - Validación

- ✅ Página: `/perfil`
  - Ver datos del usuario
  - Editar perfil
  - Cambiar contraseña

- ✅ Página: `/mis-ordenes`
  - Lista de órdenes del usuario
  - Ver detalle de cada orden
  - Tracking de estado
  - Botón "Volver a comprar"
  - Cancelar orden (si está en pending_whatsapp)

**Entregables:**
- Autenticación completa
- Perfil de usuario funcional
- Historial de órdenes

**Tiempo estimado:** 1 día

---

### Día 19: Testing y Ajustes

**Tareas:**
- ✅ Testing funcional:
  - Flujo completo: navegar → seleccionar variante → agregar carrito → checkout → WhatsApp
  - Flujo admin: crear producto con variantes → configurar descuentos
  - Flujo funcionario: ver órdenes → cambiar estado
  - Autenticación y permisos

- ✅ Testing de descuentos:
  - Descuento fijo por variante
  - Descuento escalonado (varios tiers)
  - Combinación de variantes del mismo atributo
  - Mejor descuento se aplica

- ✅ Testing de stock:
  - Descuento al crear orden
  - Devolución al cancelar
  - Alertas de stock bajo

- ✅ Ajustes de UI/UX:
  - Responsividad mobile
  - Loading states
  - Error handling
  - Validaciones

**Entregables:**
- Sistema completamente testeado
- Bugs críticos resueltos
- UI pulida

**Tiempo estimado:** 1 día

---

### Día 20-21: Documentación y Preparación para Deploy

**Tareas:**
- ✅ Documentación:
  - README.md actualizado
  - Guía de instalación
  - Variables de entorno
  - Guía de uso para admin

- ✅ Preparación para deploy:
  - Build de producción (frontend)
  - Build de producción (backend)
  - Scripts de PM2
  - Configuración de Nginx
  - Guía de deploy en VPS

- ✅ Datos de prueba:
  - Script de seed
  - Productos de ejemplo con variantes
  - Categorías y marcas
  - Usuario admin inicial

**Entregables:**
- Documentación completa
- Sistema listo para deploy
- Datos de prueba cargados

**Tiempo estimado:** 2 días

---

## RESUMEN POR SEMANA

### Semana 1: Backend Completo
- Modelos de DB con variantes
- Controllers y services
- Routes y middleware
- Sistema de descuentos funcionando
- API completa

### Semana 2: Admin Panel
- Setup frontend
- CRUD de productos con variantes
- CRUD auxiliares (categorías, marcas, usuarios)
- Gestión de órdenes
- Alertas de stock

### Semana 3: Cliente + Deploy
- Catálogo público con variantes
- Carrito y checkout con WhatsApp
- Autenticación y perfil
- Testing completo
- Documentación y deploy

---

## HITOS IMPORTANTES

- ✅ **Día 7:** Backend API completa y funcional
- ✅ **Día 14:** Admin panel completo
- ✅ **Día 18:** Cliente funcional con checkout
- ✅ **Día 21:** MVP listo para producción

---

## FEATURES POSPUESTAS A FASE 2

**No incluidas en MVP (3 semanas):**
- Reviews y calificaciones
- Notificaciones en tiempo real
- Dashboard con estadísticas
- Reportes avanzados
- Sistema de favoritos/wishlist
- Editor de imágenes avanzado (solo básico en MVP)
- Costos de envío por zona
- Productos relacionados inteligentes
- Newsletter

**Se implementan después del MVP:**
- Semanas 4-6: Features de Fase 2
- Optimizaciones de performance
- Analytics avanzado

---

**Roadmap aprobado y listo para ejecución.**

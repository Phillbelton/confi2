# Documentación del Proyecto - Confitería Quelita

## 📚 Documentos Importantes

### ⚠️ LEER ANTES DE DESARROLLAR

**[ERRORES_Y_SOLUCIONES.md](./ERRORES_Y_SOLUCIONES.md)** ⭐ **IMPORTANTE**
- **Cuándo leer:** Al inicio de CADA sesión de desarrollo del panel admin
- **Contiene:** Errores comunes, soluciones, y patrones recomendados
- **Cubre:** TypeScript, rutas, validación, Mongoose, autenticación
- **Checklist:** Pre-implementación para cada módulo nuevo

---

## 🎯 Desarrollo del Panel Admin

### Estado Actual

✅ **Completado:**
- Sistema de creación de productos (simple y con variantes)
- Upload de imágenes con Cloudinary
- SKU auto-generado descriptivo
- Validación FormData + Multipart
- Dashboard con métricas

🚧 **Pendiente:**
- [ ] Categorías (CRUD completo)
- [ ] Marcas (CRUD completo)
- [ ] Inventario (gestión de stock)
- [ ] Órdenes (lista, filtros, estados)
- [ ] Usuarios (clientes y funcionarios)
- [ ] Reportes (ventas, productos, análisis)

---

## 🔄 Workflow de Desarrollo

### Antes de Empezar
1. **Leer** `ERRORES_Y_SOLUCIONES.md`
2. **Revisar** checklist del módulo a desarrollar
3. **Verificar** patrones aplicables

### Durante el Desarrollo
1. **Backend primero:** Routes → Schema → Controller
2. **Verificar rutas:** Específicas antes de parametrizadas
3. **FormData:** Middleware de parsing si es necesario
4. **Mongoose:** Campos auto-generados `required: false`
5. **Frontend:** Verificar endpoint coincide con backend

### Antes de Commitear
1. Ejecutar `npm run build` (backend y frontend)
2. Verificar no hay errores TypeScript
3. Probar endpoint con datos reales
4. Verificar logs del backend

---

## 📂 Estructura de Archivos Clave

### Backend
```
backend/
├── src/
│   ├── routes/           # Rutas de API
│   ├── controllers/      # Lógica de negocio
│   ├── schemas/          # Validación con Zod
│   ├── models/           # Modelos de Mongoose
│   ├── middleware/       # Autenticación, validación, etc.
│   └── services/         # Servicios externos (Cloudinary, etc.)
```

### Frontend
```
frontend/
├── app/admin/            # Páginas del panel admin
├── components/admin/     # Componentes del admin
├── services/admin/       # Servicios API
├── hooks/admin/          # Hooks personalizados
├── types/admin.ts        # Tipos TypeScript
└── lib/axios.ts          # Configuración de axios
```

---

## 🛠️ Comandos Útiles

### Backend
```bash
cd backend
npm run dev          # Servidor de desarrollo
npm run build        # Compilar TypeScript
npm run seed:*       # Poblar datos de prueba
```

### Frontend
```bash
cd frontend
npm run dev          # Servidor de desarrollo
npm run build        # Build de producción
```

### Debugging
```bash
# Buscar rutas
grep -r "router\." backend/src/routes/

# Buscar endpoint
grep -r "'/products/'" backend/

# Ver schemas
cat backend/src/schemas/productSchemas.ts | grep "export const"
```

---

## 🔑 Variables de Entorno

### Backend (.env)
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/confiteria-quelita
JWT_SECRET=your-secret-key
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

⚠️ **Importante:** `NEXT_PUBLIC_API_URL` ya incluye `/api`

---

## 🐛 Troubleshooting

### Error 404 en endpoints
→ Leer sección "Errores de Rutas" en `ERRORES_Y_SOLUCIONES.md`

### Error 401 Unauthorized
→ Verificar `localStorage.getItem('admin-token')`

### Error 400 Validation
→ Revisar middleware `parseFormData` para FormData

### Error TypeScript en respuestas
→ Usar `.toObject()` en documentos Mongoose

---

## 📞 Contacto

Para reportar bugs o sugerencias, usar GitHub Issues o contactar al equipo de desarrollo.

---

**Última actualización:** 2025-11-16

# Configuración de Imágenes para Next.js

## Problema Resuelto

Las imágenes ahora se retornan con URLs absolutas desde el backend:
- **Antes:** `/uploads/products/imagen.webp`
- **Ahora:** `http://localhost:5000/uploads/products/imagen.webp`

Esto soluciona el error 400 en Next.js Image.

---

## Configuración Requerida en el Frontend (Next.js)

Para que Next.js Image pueda optimizar imágenes del backend, debes configurar `remotePatterns` en `next.config.js`:

### **next.config.js** (Next.js 13+)

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '5000',
        pathname: '/uploads/**',
      },
      // Para producción (agregar cuando despliegues):
      {
        protocol: 'https',
        hostname: 'tu-dominio-backend.com',
        pathname: '/uploads/**',
      },
    ],
  },
};

module.exports = nextConfig;
```

### **next.config.js** (Next.js 12 y anteriores)

```javascript
module.exports = {
  images: {
    domains: ['localhost'],
  },
};
```

---

## Variables de Entorno

### **Backend (.env)**

Asegúrate de tener configurado:

```bash
PORT=5000
BACKEND_URL=http://localhost:5000
```

### **Frontend (.env.local)**

```bash
NEXT_PUBLIC_API_URL=http://localhost:5000
```

---

## Uso en el Frontend

Ahora puedes usar las imágenes directamente sin concatenar URLs:

### ✅ Correcto (URLs absolutas del backend)

```jsx
import Image from 'next/image';

function ProductCard({ product }) {
  return (
    <Image
      src={product.images[0]}  // Ya viene como URL absoluta
      alt={product.name}
      width={300}
      height={300}
    />
  );
}
```

### ❌ Incorrecto (NO concatenar URLs)

```jsx
// NO HAGAS ESTO - Ya no es necesario
<Image
  src={`${process.env.NEXT_PUBLIC_API_URL}${product.images[0]}`}
  alt={product.name}
  width={300}
  height={300}
/>
```

---

## Producción

Para producción, actualiza:

1. **Backend .env:**
   ```bash
   BACKEND_URL=https://api.tu-dominio.com
   ```

2. **Frontend next.config.js:**
   ```javascript
   remotePatterns: [
     {
       protocol: 'https',
       hostname: 'api.tu-dominio.com',
       pathname: '/uploads/**',
     },
   ],
   ```

---

## Verificación

Después de configurar, verifica que funciona:

1. **Reinicia el servidor de Next.js**
   ```bash
   npm run dev
   ```

2. **Verifica las URLs en el navegador**
   - Inspecciona una imagen en la consola
   - Debería verse: `http://localhost:5000/uploads/products/...`

3. **Verifica que carga correctamente**
   - No debe haber errores 400 en la consola
   - Las imágenes deben mostrarse correctamente

---

## Troubleshooting

### Error: "Invalid src prop"

**Causa:** Next.js no tiene configurado el dominio del backend.

**Solución:** Agrega el hostname en `next.config.js` → `remotePatterns`

### Error: 400 Bad Request

**Causa:** El dominio no está permitido o la URL es incorrecta.

**Solución:**
1. Verifica `BACKEND_URL` en el backend (.env)
2. Verifica `remotePatterns` en next.config.js
3. Reinicia ambos servidores

### Las imágenes no se muestran en producción

**Causa:** `remotePatterns` solo tiene configurado localhost.

**Solución:** Agrega el dominio de producción en `remotePatterns`

---

## Notas Adicionales

- Las imágenes existentes con rutas relativas seguirán funcionando si usas un helper para construir URLs
- Para Cloudinary (USE_CLOUDINARY=true), las URLs ya son absolutas automáticamente
- El backend sirve archivos estáticos en `/uploads` con CORS habilitado

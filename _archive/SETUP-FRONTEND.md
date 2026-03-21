# SETUP DEL FRONTEND - Confitería Quelita

## 1. Crear proyecto Next.js

Ejecuta el siguiente comando EN LA CARPETA `nuevaConfi`:

```bash
npx create-next-app@latest frontend
```

Responde las siguientes opciones cuando te pregunte:

```
✔ Would you like to use TypeScript? › Yes
✔ Would you like to use ESLint? › Yes
✔ Would you like to use Tailwind CSS? › Yes
✔ Would you like to use `src/` directory? › No
✔ Would you like to use App Router? › Yes
✔ Would you like to customize the import alias? › No (usa @/* por defecto)
```

## 2. Instalar dependencias adicionales

```bash
cd frontend
npm install @tanstack/react-query axios zustand framer-motion embla-carousel-react react-hook-form zod @hookform/resolvers date-fns lucide-react sonner vaul clsx tailwind-merge class-variance-authority react-dropzone next-themes
```

## 3. Instalar shadcn/ui

```bash
npx shadcn@latest init
```

Responde:

```
✔ Would you like to use TypeScript? › yes
✔ Which style would you like to use? › Default
✔ Which color would you like to use as base color? › Orange
✔ Where is your global CSS file? › app/globals.css
✔ Would you like to use CSS variables for colors? › yes
✔ Are you using a custom tailwind prefix? › no
✔ Where is your tailwind.config.js located? › tailwind.config.ts
✔ Configure the import alias for components: › @/components
✔ Configure the import alias for utils: › @/lib/utils
✔ Are you using React Server Components? › yes
✔ Write configuration to components.json? › yes
```

## 4. Instalar componentes de shadcn/ui

```bash
npx shadcn@latest add button input card badge separator sheet navigation-menu breadcrumb form select textarea checkbox radio-group switch slider calendar popover toast alert alert-dialog dialog table tabs accordion avatar scroll-area aspect-ratio dropdown-menu tooltip command skeleton
```

## 5. Crear variables de entorno

Crea `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_WHATSAPP_NUMBER=5491234567890
NEXT_PUBLIC_SITE_NAME=Confitería Quelita
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## 6. Configurar fuentes (opcional - personalizar)

En `app/layout.tsx`, puedes cambiar las fuentes:

```typescript
import { DM_Sans, Comfortaa } from 'next/font/google'

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans'
})

const comfortaa = Comfortaa({
  subsets: ['latin'],
  variable: '--font-comfortaa',
  weight: ['400', '700']
})
```

## 7. Iniciar desarrollo

```bash
npm run dev
```

Frontend disponible en: `http://localhost:3000`

## Próximos pasos

Una vez completado el setup:
1. Crear estructura de carpetas (`components`, `lib`, `hooks`, `types`)
2. Configurar React Query
3. Crear servicios API (axios)
4. Implementar store de Zustand (carrito)
5. Copiar componentes UI del proyecto anterior
6. Crear páginas

---

**Nota**: Este archivo te guía en el setup manual. Una vez completado, puedo ayudarte a crear la estructura completa del frontend.

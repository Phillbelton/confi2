# Reporte de tiempos de carga (UX) — Quelita en la VM

**Fecha:** 2026-07-06 · **Objetivo:** `http://192.168.6.14` (VM, build de producción, Mongo local, Caddy) · **Herramientas:** Playwright (Web Vitals + captura de red, Chromium) + `curl`.

> Medido sobre el build de `main` (`b5269ec`, rediseño del storefront). Incluye
> un fix aplicado en esta sesión (ver "Fix aplicado").

> ⚠️ Mediciones desde la **LAN** → TTFB/transferencia irrealmente buenos. El
> dato portable es el **TAMAÑO del payload** y el **CLS**, que pegan fuerte en 4G.

## 🟢 Fix aplicado: fondo `candy-pattern` (−2.35 MB en TODAS las páginas)

**El hallazgo grande.** Cada página cargaba **`/brand/backgrounds/candy-pattern.png`
= 2.4 MB**. Es un patrón decorativo que se usa en el header y el footer (globales)
vía `.candy-bg::before`, **tileado a 350px con `background-repeat` y opacity 0.17**
— pero el archivo master era de **2343×453 px**. Se enviaban 2.4 MB para mostrarlo
como mosaico de 350px al 17% de opacidad.

> ⚠️ Corrección respecto a una nota previa: el "2.4 MB en todas las páginas" NO
> era del navbar ni de imágenes de categoría (eso se descartó midiendo las
> requests reales). Era **este único PNG de fondo**.

**Fix:** se generó `candy-pattern.webp` (700px = 2x del tile, WebP q72) → **11 KB**
(**224× más chico**, idéntico a la vista al 17% de opacidad) y se apuntó el CSS a
él (`app/globals.css`). **Verificado en vivo:**

| Página | Imágenes antes | Imágenes después | Payload total antes → después |
|--------|----------------|------------------|-------------------------------|
| Login | 2445 KB | **90 KB** | 4176 → **1821 KB** |
| Registro | ~2440 KB | ~90 KB | 4136 → **1781 KB** |
| Catálogo | 2366 KB (candy) + productos | candy 11 KB | 4236 → **1878 KB** |
| Home | 3590 KB | **1235 KB** | 8825 → **6472 KB** |

Cada página del sitio bajó **~2.35 MB**. Estado: aplicado a la VM y verificado;
el cambio de código (`globals.css` + `candy-pattern.webp`) está en el working
tree, **falta commitear** para que quede en el deploy formal.

## 🟢 Imágenes de producto en el catálogo: bien optimizadas

Para medir el catálogo **con** imágenes se subió una foto de prueba (1200×1200,
759 KB) a los 8 productos de la categoría **Alfajores** (categoría chica). El
pipeline de `sharp` generó variantes y el catálogo pide la que corresponde:

- Cada tarjeta carga `foto-**w400**.webp` = **54 KB** (no el master w800). El
  `srcSet` elige bien el ancho según el layout de grilla.
- Catálogo de Alfajores (8 productos con foto): **525 KB** de imágenes totales
  (8×54 KB + logo + candy 11 KB). Sano.

> ⚠️ Otra corrección: el reporte inicial atribuía "~800 KB por imagen" al
> catálogo/PDP. Eso también era el candy-pattern. Los productos **no tenían
> imágenes** (por eso no se veía el costo real). Con imágenes reales, **el
> pipeline + srcSet producen tarjetas de ~54 KB** — no hay problema de imágenes
> de producto.

## Web Vitals — Desktop (post-fix)

| Página | CLS | Requests | Payload |
|--------|-----|----------|---------|
| **Home** | **0.59** 🔴 | 135 | 6.5 MB 🔴 |
| **Catálogo** | **0.50** 🔴 | 78 | 1.9 MB 🟢 |
| Detalle producto | 0.11 🟠 | 60 | 1.8 MB 🟢 |
| Login | 0.003 🟢 | 59 | 1.8 MB 🟠 |
| Registro | 0.01 🟢 | 54 | 1.8 MB 🟠 |

(En mobile el CLS es ~0 en todas: el layout shift es solo de escritorio.)

## Lo que queda por mejorar (priorizado)

**P1 — CLS de desktop** (Home 0.59, Catálogo 0.50 → <0.1). Es ahora el peor
problema de UX ("la página salta al cargar"), solo en escritorio. Reservar
espacio con `aspect-ratio`/`width`+`height` para el hero de categoría, banners y
el navbar que se condensa al scroll.

**P2 — JS de la Home** (4.7 MB en 52 archivos; ~1.5 MB de base en todas). Es lo
que más pesa ahora que se fue el candy-pattern. Revisar con
`@next/bundle-analyzer` (ya instalado) y cargar con `next/dynamic` lo
below-the-fold (carruseles `embla`, `framer-motion`, `canvas-confetti`, gráficos).

**P3 — Limpieza de assets muertos.** `public/brand/backgrounds/hero-bg.png` pesa
**6.7 MB** y no se referencia en ningún lado; y el `candy-pattern.png` viejo
(2.4 MB) quedó sin uso tras el fix. Borrarlos aligera la imagen Docker.

**P4 — Cachear `/api/products/facets`** (~244 ms) si el catálogo escala.

## Cómo reproducir

```bash
cd frontend
BASE_URL=http://192.168.6.14 npx playwright test --project=perf-desktop vm-report
BASE_URL=http://192.168.6.14 npx playwright test --project=perf-mobile  vm-report
# Resultados: frontend/tests/performance/results-<host>-perf-{desktop,mobile}.json
# (correr un proyecto por vez; en paralelo puede dar timeouts por contención)
```

Umbrales 🟢🟠🔴 según Google Web Vitals (CLS<0.1 bueno). 🟠 en payload = >1.5 MB.

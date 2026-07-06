/**
 * Generador de imágenes de marca para los banners de categoría del catálogo.
 *
 * Mismo lenguaje visual que colecciones/banners (`genCollectionImages.mjs`):
 * gradiente por categoría (paleta de categoryVisualConfig del frontend),
 * círculos bokeh, chupetín concéntrico de esquina, confeti y onda crema.
 *
 * Por cada categoría raíz emite TRES tamaños:
 *   - <slug>-banner.png         2000×300 (20:3) — hero catálogo desktop.
 *     El texto (H1 + descripción) lo pone el frontend abajo-izquierda, así
 *     que las golosinas van a la derecha y la izquierda queda tranquila.
 *   - <slug>-banner-mobile.png  1000×400 (5:2)  — hero catálogo mobile.
 *   - <slug>-thumb.png           800×800 (1:1)  — miniatura (admin, mega-menú).
 *
 * Salida: backend/seed-assets/categories/  (SVG + PNG vía sharp)
 * Correr:  cd backend && node tools/genCategoryBanners.mjs
 * Luego:   npm run seed:category-banners  (los copia a /uploads y a la DB)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '..', 'seed-assets', 'categories');
fs.mkdirSync(OUT, { recursive: true });

const CREAM = '#FFFBF7', WHITE = '#FFFFFF';

/* ---------- utilidades deterministas ---------- */
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
const n = (v, d = 1) => Number(v.toFixed(d));

/* ============================================================
 * Golosinas — coordenadas RELATIVAS: (0,0) = centro del "piso"
 * del motivo. Cada escena se coloca con translate(x,y) scale(s).
 * ============================================================ */
function shadow(dx, rx, o = 0.12) {
  return `<ellipse cx="${dx}" cy="0" rx="${rx}" ry="${n(rx * 0.17)}" fill="#000000" opacity="${o}"/>`;
}
function wrapped(dx, dy, s, c, c2, rot = 0) {
  return `<g transform="translate(${dx} ${dy}) rotate(${rot})">
    <path d="M ${-44 * s} 0 L ${-17 * s} ${-26 * s} L ${-17 * s} ${26 * s} Z" fill="${c}"/>
    <path d="M ${44 * s} 0 L ${17 * s} ${-26 * s} L ${17 * s} ${26 * s} Z" fill="${c}"/>
    <ellipse rx="${30 * s}" ry="${23 * s}" fill="${c2}"/>
    <ellipse cx="${-10 * s}" cy="${-8 * s}" rx="${9 * s}" ry="${5 * s}" fill="${WHITE}" opacity="0.55"/>
  </g>`;
}
function lolly(dx, headDy, r, cols, stickH = 120) {
  let s = shadow(dx, r * 0.75, 0.1);
  s += `<rect x="${dx - 5}" y="${headDy}" width="10" height="${stickH}" rx="5" fill="${CREAM}"/>`;
  cols.forEach((c, i) => { s += `<circle cx="${dx}" cy="${headDy}" r="${n(r * (1 - i / cols.length))}" fill="${c}"/>`; });
  return s;
}
function chocBar(dx, dy, rot) {
  return `<g transform="translate(${dx} ${dy}) rotate(${rot})">
    <rect x="-46" y="-30" width="92" height="60" rx="6" fill="#6B3F2B"/>
    <rect x="-46" y="-30" width="92" height="14" rx="6" fill="#8A5638"/>
    <g stroke="#4F2E1F" stroke-width="3">${[-23, 0, 23].map((x) => `<line x1="${x}" y1="-30" x2="${x}" y2="30"/>`).join('')}<line x1="-46" y1="0" x2="46" y2="0"/></g>
  </g>`;
}
function truffle(dx, dy, base, top) {
  return `<g transform="translate(${dx} ${dy})">
    <path d="M -26 8 L 26 8 L 20 -14 Q 0 -22 -20 -14 Z" fill="${base}"/>
    <circle cy="-22" r="16" fill="${top}"/>
    <path d="M -8 -30 Q 0 -40 8 -30" stroke="${base}" stroke-width="5" fill="none"/>
    <ellipse cx="-5" cy="-26" rx="5" ry="3" fill="${WHITE}" opacity="0.4"/>
  </g>`;
}
function cocoaCup(dx, dy) {
  return `${shadow(dx, 50)}<g transform="translate(${dx} ${dy})">
    <path d="M 26 -6 q 26 0 26 24 q 0 24 -26 24" fill="none" stroke="${CREAM}" stroke-width="9"/>
    <path d="M -34 -18 L 34 -18 L 27 64 Q 0 72 -27 64 Z" fill="${WHITE}"/>
    <rect x="-40" y="-30" width="80" height="16" rx="6" fill="#D9C7B8"/>
    <g stroke="${WHITE}" stroke-width="5" stroke-linecap="round" opacity="0.7" fill="none">
      <path d="M -10 -44 q 8 -12 0 -24"/><path d="M 10 -44 q 8 -12 0 -24"/>
    </g>
  </g>`;
}
function cookie(dx, dy, rnd) {
  let chips = '';
  for (let i = 0; i < 7; i++) chips += `<circle cx="${n(dx - 30 + rnd() * 60)}" cy="${n(dy - 30 + rnd() * 60)}" r="${n(4 + rnd() * 4)}" fill="#5A3A22"/>`;
  return `${shadow(dx, 52)}<circle cx="${dx}" cy="${dy}" r="46" fill="#C98A4B"/><circle cx="${dx}" cy="${dy}" r="46" fill="none" stroke="#A06A33" stroke-width="3"/>${chips}`;
}
function alfajor(dx, dy) {
  return `${shadow(dx, 46)}<g transform="translate(${dx} ${dy})">
    <ellipse cy="20" rx="44" ry="16" fill="#E8C79A"/>
    <rect x="-44" y="4" width="88" height="20" fill="#C8924E"/>
    <ellipse cy="4" rx="44" ry="16" fill="#E8C79A"/>
    <path d="M -44 -12 a 44 16 0 0 1 88 0 q 0 16 -44 16 q -44 0 -44 -16 Z" fill="#6B4A30"/>
    <ellipse cy="-12" rx="44" ry="16" fill="#7A5538"/>
  </g>`;
}
function cupcake(dx, topDy) {
  return `${shadow(dx, 60)}<g transform="translate(${dx} 0)">
    <path d="M -34 ${topDy} L 34 ${topDy} L 24 ${topDy + 74} L -24 ${topDy + 74} Z" fill="#E98A2B"/>
    <path d="M -22 ${topDy} L -18 ${topDy + 74} M 0 ${topDy} L 0 ${topDy + 74} M 22 ${topDy} L 18 ${topDy + 74}" stroke="#C9731F" stroke-width="5"/>
    <g fill="${CREAM}"><circle cx="-22" cy="${topDy - 8}" r="22"/><circle cx="22" cy="${topDy - 8}" r="22"/><circle cy="${topDy - 16}" r="26"/><circle cx="-14" cy="${topDy - 34}" r="18"/><circle cx="14" cy="${topDy - 34}" r="18"/><circle cy="${topDy - 50}" r="15"/></g>
    <circle cy="${topDy - 66}" r="10" fill="#E2326F"/>
  </g>`;
}
function donut(dx, dy) {
  return `${shadow(dx, 52)}<g transform="translate(${dx} ${dy})">
    <circle r="44" fill="none" stroke="#EBA64C" stroke-width="32"/>
    <path d="M -44 -8 A44 44 0 0 1 44 -8" fill="none" stroke="${CREAM}" stroke-width="32" stroke-linecap="round"/>
    <g stroke-width="6" stroke-linecap="round">
      <line x1="-20" y1="-28" x2="-12" y2="-40" stroke="#F7409F"/><line y1="-36" y2="-50" stroke="#8E4D9E"/>
      <line x1="20" y1="-28" x2="12" y2="-40" stroke="#0ABDC6"/><line x1="-34" y1="-6" x2="-24" y2="-10" stroke="#8E4D9E"/>
      <line x1="34" y1="-6" x2="24" y2="-10" stroke="#F7409F"/>
    </g>
  </g>`;
}
function coneIceCream(dx, dy) {
  return `${shadow(dx, 50)}<g transform="translate(${dx} ${dy})">
    <path d="M -34 -60 L 34 -60 L 0 40 Z" fill="#E8B36B"/>
    <g stroke="#C98F45" stroke-width="3">
      <line x1="-24" y1="-52" x2="14" y2="8"/><line x1="-6" y1="-58" x2="22" y2="-14"/>
      <line x1="24" y1="-52" x2="-14" y2="8"/><line x1="6" y1="-58" x2="-22" y2="-14"/>
    </g>
    <circle cx="-16" cy="-76" r="30" fill="#F9A8D4"/>
    <circle cx="20" cy="-80" r="26" fill="${CREAM}"/>
    <circle cy="-104" r="28" fill="#A5F3FC"/>
    <circle cx="4" cy="-136" r="9" fill="#E2326F"/>
    <ellipse cx="-8" cy="-112" rx="8" ry="5" fill="${WHITE}" opacity="0.6"/>
  </g>`;
}
function popsicle(dx, dy, c, rot = 0) {
  return `${shadow(dx, 34, 0.1)}<g transform="translate(${dx} ${dy}) rotate(${rot})">
    <rect x="-4" y="30" width="8" height="44" rx="4" fill="#E8B36B"/>
    <rect x="-30" y="-74" width="60" height="110" rx="28" fill="${c}"/>
    <rect x="-18" y="-62" width="10" height="80" rx="5" fill="${WHITE}" opacity="0.45"/>
  </g>`;
}
function sodaCup(dx, topDy) {
  const bot = topDy + 120;
  return `${shadow(dx, 60)}<g transform="translate(${dx} 0)">
    <path d="M -50 ${topDy} L 50 ${topDy} L 38 ${bot} Q 0 ${bot + 10} -38 ${bot} Z" fill="${WHITE}" opacity="0.92"/>
    <path d="M -50 ${topDy} L 50 ${topDy} L 44 ${topDy + 30} L -44 ${topDy + 30} Z" fill="#CFE9EC"/>
    <rect x="-56" y="${topDy - 14}" width="112" height="16" rx="6" fill="#BFE2E6"/>
    <rect x="14" y="${topDy - 86}" width="12" height="80" rx="5" fill="#F23A9E" transform="rotate(10 20 ${topDy - 46})"/>
    <g fill="#9FD3D8" opacity="0.8"><circle cx="-14" cy="${topDy + 58}" r="6"/><circle cx="10" cy="${topDy + 78}" r="5"/><circle cx="-2" cy="${topDy + 96}" r="4"/></g>
  </g>`;
}
function sodaCan(dx, dy) {
  return `${shadow(dx, 40)}<g transform="translate(${dx} ${dy})">
    <rect x="-30" y="-54" width="60" height="118" rx="14" fill="#E1413F"/>
    <rect x="-30" y="-54" width="60" height="14" rx="10" fill="#C0302E"/>
    <rect x="-24" y="-10" width="48" height="22" rx="4" fill="${CREAM}" opacity="0.85"/>
    <ellipse cx="6" cy="-50" rx="6" ry="3" fill="#9A2422"/>
  </g>`;
}
function iceCubes(dx, dy) {
  const cube = (x, y, rot) => `<g transform="translate(${x} ${y}) rotate(${rot})"><rect x="-22" y="-22" width="44" height="44" rx="9" fill="#DDF3F5" opacity="0.92"/><path d="M -14 -14 L 6 -14 L -14 6 Z" fill="${WHITE}" opacity="0.7"/></g>`;
  return `${shadow(dx, 50)}<g transform="translate(${dx} ${dy})">${cube(-18, 6, -12)}${cube(20, -4, 14)}${cube(2, -30, 6)}</g>`;
}
function popcornBox(dx, topDy, rnd) {
  const x = -80, w = 160, h = 104;
  let stripes = '';
  for (let i = 0; i < 6; i++) stripes += `<rect x="${x + i * (w / 6)}" y="${topDy}" width="${w / 6}" height="${h}" fill="${i % 2 ? '#E23B3B' : WHITE}"/>`;
  let corn = '';
  for (let i = 0; i < 22; i++) {
    const a = rnd() * Math.PI * 2, d = rnd() * 70;
    corn += `<circle cx="${n(Math.cos(a) * d)}" cy="${n(topDy - 14 + Math.sin(a) * d * 0.4)}" r="${n(11 + rnd() * 8)}" fill="${[CREAM, '#FFE9B0', WHITE][(rnd() * 3) | 0]}"/>`;
  }
  return `${shadow(dx, 92)}<g transform="translate(${dx} 0)">${corn}<g>${stripes}</g></g>`;
}
function chipsBag(dx, dy, c1, c2) {
  return `${shadow(dx, 52, 0.1)}<g transform="translate(${dx} ${dy})">
    <path d="M -44 -66 L 44 -66 L 50 64 L -50 64 Z" fill="${c1}"/>
    <path d="M -44 -66 L 44 -66 L 40 -50 L -40 -50 Z" fill="${c2}"/>
    <path d="M -50 64 L 50 64 L 44 48 L -44 48 Z" fill="${c2}"/>
    <ellipse rx="30" ry="22" fill="${WHITE}" opacity="0.85"/>
    <ellipse rx="30" ry="22" fill="none" stroke="${c2}" stroke-width="4"/>
  </g>`;
}
function balloon(dx, dy, c) {
  return `<g transform="translate(${dx} ${dy})">
    <path d="M 0 34 Q -6 60 -2 96" stroke="${CREAM}" stroke-width="4" fill="none"/>
    <ellipse rx="34" ry="42" fill="${c}"/>
    <path d="M -6 28 L 6 28 L 0 40 Z" fill="${c}"/>
    <ellipse cx="-10" cy="-14" rx="10" ry="14" fill="${WHITE}" opacity="0.4"/>
  </g>`;
}
function giftBox(dx, dy, c1, c2) {
  return `${shadow(dx, 56, 0.12)}<g transform="translate(${dx} ${dy})">
    <rect x="-48" y="-40" width="96" height="72" rx="8" fill="${c1}"/>
    <rect x="-54" y="-58" width="108" height="22" rx="6" fill="${c1}"/>
    <rect x="-10" y="-58" width="20" height="90" fill="${c2}"/>
    <path d="M 0 -58 Q -26 -86 -8 -92 Q 4 -94 0 -58 Q 4 -94 16 -90 Q 30 -84 0 -58" fill="${c2}"/>
  </g>`;
}
function layerCake(dx, dy) {
  return `${shadow(dx, 78)}<g transform="translate(${dx} ${dy})">
    <path d="M -76 0 L 76 0 L 76 -44 L -76 -44 Z" fill="#F9A8D4"/>
    <path d="M -76 -44 Q -60 -24 -46 -44 Q -32 -24 -18 -44 Q -4 -24 10 -44 Q 24 -24 38 -44 Q 52 -24 66 -44 L 76 -44 L 76 -50 L -76 -50 Z" fill="${CREAM}"/>
    <path d="M -50 -50 L 50 -50 L 50 -88 L -50 -88 Z" fill="#E2326F"/>
    <path d="M -50 -88 Q -38 -72 -26 -88 Q -14 -72 -2 -88 Q 10 -72 22 -88 Q 34 -72 46 -88 L 50 -88 L 50 -94 L -50 -94 Z" fill="${CREAM}"/>
    <rect x="-4" y="-126" width="8" height="32" rx="3" fill="#0ABDC6"/>
    <ellipse cy="-130" rx="6" ry="9" fill="#FFC85C"/>
  </g>`;
}
function manjarJar(dx, dy) {
  return `${shadow(dx, 44)}<g transform="translate(${dx} ${dy})">
    <rect x="-36" y="-52" width="72" height="104" rx="16" fill="#D8A055"/>
    <rect x="-38" y="-70" width="76" height="22" rx="8" fill="#8A5638"/>
    <rect x="-26" y="-18" width="52" height="44" rx="6" fill="${CREAM}"/>
    <ellipse cx="-14" cy="-40" rx="8" ry="14" fill="${WHITE}" opacity="0.35"/>
  </g>`;
}
function candyPile(rnd, cols, count = 12, spread = 90) {
  let s = '';
  for (let i = 0; i < count; i++) {
    const a = rnd() * Math.PI * 2, d = rnd() * spread;
    s += `<circle cx="${n(Math.cos(a) * d)}" cy="${n(-6 - Math.abs(Math.sin(a)) * d * 0.28)}" r="${n(9 + rnd() * 9)}" fill="${cols[(rnd() * cols.length) | 0]}"/>`;
  }
  return `${shadow(0, spread * 0.9, 0.1)}<g>${s}</g>`;
}

/* ---------- piezas de fondo compartidas ---------- */
function bokeh(rnd, W, H) {
  let s = '<g fill="#FFFFFF">';
  for (let i = 0; i < 9; i++) {
    s += `<circle cx="${n(rnd() * W, 0)}" cy="${n(rnd() * H, 0)}" r="${n(H * 0.08 + rnd() * H * 0.16, 0)}" opacity="${n(0.05 + rnd() * 0.04, 3)}"/>`;
  }
  return s + '</g>';
}
function cornerLolly(accent, cx, cy, scale = 1) {
  const radii = [120, 100, 80, 60, 40, 20];
  let s = `<g opacity="0.85" transform="translate(${cx} ${cy}) scale(${scale})">`;
  radii.forEach((r, i) => { s += `<circle r="${r}" fill="${i % 2 ? accent : WHITE}"/>`; });
  return s + '</g>';
}
function wave(W, H) {
  const y = H * 0.94;
  return `<path d="M0 ${n(y, 0)} Q ${W * 0.25} ${n(y - H * 0.03, 0)} ${W * 0.5} ${n(y, 0)} T ${W} ${n(y - H * 0.01, 0)} L ${W} ${H} L 0 ${H} Z" fill="${CREAM}" opacity="0.9"/>`;
}
function confetti(rnd, palette, W, H, avoid) {
  let s = '<g opacity="0.5">', count = 0, tries = 0;
  while (count < 22 && tries < 600) {
    tries++;
    const x = rnd() * W, y = rnd() * H;
    if (avoid && avoid(x, y)) continue;
    const w = 12 + rnd() * 16, h = w * 0.32;
    s += `<rect x="${n(x - w / 2)}" y="${n(y - h / 2)}" width="${n(w)}" height="${n(h)}" rx="${n(h / 2)}" fill="${palette[(rnd() * palette.length) | 0]}" transform="rotate(${n(rnd() * 180, 0)} ${n(x)} ${n(y)})"/>`;
    count++;
  }
  return s + '</g>';
}

/* ============================================================
 * Definición por categoría raíz
 * Paletas alineadas con lib/categoryVisualConfig.ts del frontend.
 * `motif(rnd)` dibuja las golosinas en coordenadas relativas
 * ((0,0) = centro del piso del motivo).
 * ============================================================ */
const PALETTE = ['#F5A623', '#0ABDC6', '#F23A9E', CREAM, WHITE, '#FFD9EC'];

const CATEGORIES = [
  {
    slug: 'confiteria', name: 'Confitería',
    from: '#F472B6', to: '#E11D48', accent: '#FB7185',
    motif: (rnd) =>
      candyPile(rnd, ['#F23A9E', '#0ABDC6', '#F5A623', '#8E4D9E', CREAM], 16, 120) +
      lolly(0, -210, 72, [CREAM, '#F7409F', CREAM, '#0ABDC6', CREAM], 175) +
      wrapped(-165, -36, 1.05, '#0ABDC6', '#5FD6DC', -14) +
      wrapped(160, -32, 1.05, '#F5A623', '#FFC85C', 12) +
      wrapped(75, -16, 0.85, '#8E4D9E', '#B884C4', -8),
  },
  {
    slug: 'chocolateria', name: 'Chocolatería',
    from: '#CA8A04', to: '#78350F', accent: '#D97706',
    motif: (rnd) =>
      shadow(-120, 60) + chocBar(-120, -34, -14) + chocBar(-96, -56, -14) +
      cocoaCup(90, -66) +
      truffle(-6, -12, '#6B3F2B', '#8A5638') +
      truffle(40, -6, '#8A5638', '#F9A8D4') +
      wrapped(160, -20, 0.75, '#E2326F', '#FF7FA8', 16),
  },
  {
    slug: 'heladeria', name: 'Heladería',
    from: '#7DD3FC', to: '#2563EB', accent: '#38BDF8',
    motif: (rnd) =>
      popsicle(-140, -80, '#F9A8D4', -10) +
      coneIceCream(0, -40) +
      popsicle(130, -76, '#A5F3FC', 10) +
      iceCubes(220, -26) +
      `<g fill="${WHITE}" opacity="0.5"><circle cx="-210" cy="-160" r="8"/><circle cx="190" cy="-190" r="6"/></g>`,
  },
  {
    slug: 'bebidas-y-liquidos', name: 'Bebidas y líquidos',
    from: '#22D3EE', to: '#1B6B8A', accent: '#5FE0E6',
    motif: (rnd) =>
      sodaCan(-140, -62) + sodaCup(0, -130) + iceCubes(150, -30) +
      `<g fill="${WHITE}" opacity="0.5"><circle cx="100" cy="-200" r="9"/><circle cx="-80" cy="-180" r="7"/><circle cx="60" cy="-236" r="5"/></g>`,
  },
  {
    slug: 'cumpleanos', name: 'Cumpleaños',
    from: '#E879F9', to: '#9333EA', accent: '#F0ABFC',
    motif: (rnd) =>
      balloon(-170, -210, '#F23A9E') + balloon(180, -230, '#0ABDC6') +
      cupcake(-90, -78) + giftBox(90, -32, '#F5A623', CREAM) +
      lolly(180, -120, 36, ['#F23A9E', CREAM, '#0ABDC6', CREAM], 90),
  },
  {
    slug: 'reposteria', name: 'Repostería',
    from: '#A78BFA', to: '#9333EA', accent: '#C4B5FD',
    motif: (rnd) =>
      manjarJar(-160, -52) + layerCake(0, 0) + cupcake(140, -66) + donut(240, -44),
  },
  {
    slug: 'snacks-y-galletas', name: 'Snacks y Galletas',
    from: '#FBBF24', to: '#EA580C', accent: '#FCD34D',
    motif: (rnd) =>
      cookie(-150, -46, rnd) + popcornBox(0, -104, rnd) +
      chipsBag(150, -64, '#E23B3B', '#FFC85C') + alfajor(240, -22),
  },
];

/* ============================================================
 * Composición de las 3 escenas por categoría
 * ============================================================ */
function buildSVG(cat, mode) {
  const dims = { banner: [2000, 300], 'banner-mobile': [1000, 400], thumb: [800, 800] };
  const [W, H] = dims[mode];
  const rnd = mulberry32(hash(`${cat.slug}:${mode}`));
  const id = `${cat.slug}-${mode}`;

  // Colocación del motivo por modo:
  //  - banner: a la derecha (el frontend pone el texto abajo-izquierda)
  //  - banner-mobile: centro-derecha, más chico
  //  - thumb: centrado
  const place = {
    banner: { x: W * 0.78, y: H * 0.86, s: 0.78 },
    'banner-mobile': { x: W * 0.7, y: H * 0.87, s: 0.85 },
    thumb: { x: W * 0.5, y: H * 0.8, s: 1.4 },
  }[mode];

  // El confeti evita la zona del texto (izquierda) en banners y el centro en thumb.
  const avoid =
    mode === 'thumb'
      ? (x, y) => Math.hypot(x - W / 2, y - H * 0.62) < W * 0.33
      : (x, y) => (x < W * 0.45 && y > H * 0.3) || (Math.hypot(x - place.x, y - place.y * 0.8) < H * 0.5);

  const corner = {
    banner: cornerLolly(cat.accent, W - 78, 66, 0.55),
    'banner-mobile': cornerLolly(cat.accent, W - 70, 66, 0.55),
    thumb: cornerLolly(cat.accent, W - 92, 92, 0.75),
  }[mode];

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg-${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${cat.from}"/><stop offset="1" stop-color="${cat.to}"/></linearGradient>
    <radialGradient id="glow-${id}" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#FFFFFF" stop-opacity="0.26"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg-${id})"/>
  ${bokeh(rnd, W, H)}
  ${corner}
  <ellipse cx="${n(place.x, 0)}" cy="${n(place.y * 0.82, 0)}" rx="${n(H * 0.72, 0)}" ry="${n(H * 0.4, 0)}" fill="url(#glow-${id})"/>
  <g transform="translate(${n(place.x, 0)} ${n(place.y, 0)}) scale(${place.s})">
    ${cat.motif(rnd)}
  </g>
  ${wave(W, H)}
  ${confetti(rnd, PALETTE, W, H, avoid)}
</svg>`;
}

/* ---------- escribir + rasterizar ---------- */
let sharp = null;
try { sharp = (await import('sharp')).default; } catch { console.warn('⚠️  sharp no disponible — solo SVG'); }

const MODES = ['banner', 'banner-mobile', 'thumb'];
const DIMS = { banner: [2000, 300], 'banner-mobile': [1000, 400], thumb: [800, 800] };

for (const cat of CATEGORIES) {
  for (const mode of MODES) {
    const svg = buildSVG(cat, mode);
    const base = `${cat.slug}-${mode}`;
    fs.writeFileSync(path.join(OUT, `${base}.svg`), svg, 'utf8');
    let png = '—';
    if (sharp) {
      try {
        const [W, H] = DIMS[mode];
        await sharp(Buffer.from(svg), { density: 144 })
          .resize(W, H, { fit: 'fill' })
          .png({ quality: 90 })
          .toFile(path.join(OUT, `${base}.png`));
        png = `${base}.png`;
      } catch (e) { png = `error: ${e.message}`; }
    }
    console.log(`✅ ${base}.svg  ·  ${png}`);
  }
}
console.log(`\n📂 ${OUT}`);

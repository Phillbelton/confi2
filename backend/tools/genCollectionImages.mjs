/**
 * Generador de imágenes de marca para los packs de colección de la home.
 *
 * Mismo lenguaje visual que los banners (`quelita-banners/`): gradiente,
 * círculos bokeh, chupetín concéntrico de esquina, confeti y onda crema.
 * Cada pack agrega un "escenario" con golosinas dibujadas, dejando el tercio
 * inferior tranquilo para el overlay/título que pone la tarjeta (CollectionCard).
 *
 * Salida: backend/seed-assets/collections/<slug>.svg  (+ .png vía sharp)
 * Formato 5:3 (1200×720) = el aspect de la tarjeta landscape de la home.
 *
 * Correr:  cd backend && node tools/genCollectionImages.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '..', 'seed-assets', 'collections');
fs.mkdirSync(OUT, { recursive: true });

const W = 1200, H = 720;
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

/* ---------- piezas compartidas ---------- */
function shadow(cx, cy, rx, o = 0.12) {
  return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${n(rx * 0.17)}" fill="#000000" opacity="${o}"/>`;
}
function wrapped(cx, cy, s, c, c2, rot = 0) {
  return `<g transform="rotate(${rot} ${cx} ${cy})">
    <path d="M ${cx - 44 * s} ${cy} L ${cx - 17 * s} ${cy - 26 * s} L ${cx - 17 * s} ${cy + 26 * s} Z" fill="${c}"/>
    <path d="M ${cx + 44 * s} ${cy} L ${cx + 17 * s} ${cy - 26 * s} L ${cx + 17 * s} ${cy + 26 * s} Z" fill="${c}"/>
    <ellipse cx="${cx}" cy="${cy}" rx="${30 * s}" ry="${23 * s}" fill="${c2}"/>
    <ellipse cx="${cx - 10 * s}" cy="${cy - 8 * s}" rx="${9 * s}" ry="${5 * s}" fill="${WHITE}" opacity="0.55"/>
  </g>`;
}
function lolly(cx, cy, r, cols, stickH = 120) {
  let s = `<rect x="${cx - 5}" y="${cy}" width="10" height="${stickH}" rx="5" fill="${CREAM}"/>`;
  cols.forEach((c, i) => { s += `<circle cx="${cx}" cy="${cy}" r="${n(r * (1 - i / cols.length))}" fill="${c}"/>`; });
  return s;
}
function cluster(cx, cy, rnd, cols, count, spread, rMin, rMax) {
  let s = '';
  for (let i = 0; i < count; i++) {
    const a = rnd() * Math.PI * 2, d = rnd() * spread;
    const x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d * 0.7;
    const r = rMin + rnd() * (rMax - rMin);
    s += `<circle cx="${n(x)}" cy="${n(y)}" r="${n(r)}" fill="${cols[(rnd() * cols.length) | 0]}"/>`;
  }
  return s;
}
function bokeh(rnd) {
  let s = '<g fill="#FFFFFF">';
  for (let i = 0; i < 9; i++) {
    s += `<circle cx="${n(rnd() * W, 0)}" cy="${n(rnd() * H, 0)}" r="${n(30 + rnd() * 70, 0)}" opacity="${n(0.05 + rnd() * 0.04, 3)}"/>`;
  }
  return s + '</g>';
}
function cornerLolly(accent) {
  const cx = 1080, cy = 110, radii = [120, 100, 80, 60, 40, 20];
  let s = '<g opacity="0.85">';
  radii.forEach((r, i) => { s += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${i % 2 ? accent : WHITE}"/>`; });
  return s + '</g>';
}
function stageGlow(slug) {
  return `<ellipse cx="600" cy="330" rx="400" ry="200" fill="url(#glow-${slug})"/>`;
}
function wave() {
  return `<path d="M0 452 Q300 432 600 450 T1200 446 L1200 472 Q900 488 600 472 T0 476 Z" fill="${CREAM}" opacity="0.92"/>`;
}
function confetti(rnd, palette) {
  const inStage = (x, y) => x > 350 && x < 850 && y > 150 && y < 470;
  let s = '<g opacity="0.5">', count = 0, tries = 0;
  while (count < 26 && tries < 600) {
    tries++;
    const x = rnd() * W, y = rnd() * H;
    if (inStage(x, y) || y > 480) continue;
    const w = 14 + rnd() * 18, h = w * 0.32;
    s += `<rect x="${n(x - w / 2)}" y="${n(y - h / 2)}" width="${n(w)}" height="${n(h)}" rx="${n(h / 2)}" fill="${palette[(rnd() * palette.length) | 0]}" transform="rotate(${n(rnd() * 180, 0)} ${n(x)} ${n(y)})"/>`;
    count++;
  }
  return s + '</g>';
}

/* ---------- golosinas por pack ---------- */
function cupcake(cx, top) {
  return `<g>${shadow(cx, 452, 64)}
    <path d="M ${cx - 34} ${top} L ${cx + 34} ${top} L ${cx + 24} ${top + 74} L ${cx - 24} ${top + 74} Z" fill="#E98A2B"/>
    <path d="M ${cx - 22} ${top} L ${cx - 18} ${top + 74} M ${cx} ${top} L ${cx} ${top + 74} M ${cx + 22} ${top} L ${cx + 18} ${top + 74}" stroke="#C9731F" stroke-width="5"/>
    <g fill="${CREAM}"><circle cx="${cx - 22}" cy="${top - 8}" r="22"/><circle cx="${cx + 22}" cy="${top - 8}" r="22"/><circle cx="${cx}" cy="${top - 16}" r="26"/><circle cx="${cx - 14}" cy="${top - 34}" r="18"/><circle cx="${cx + 14}" cy="${top - 34}" r="18"/><circle cx="${cx}" cy="${top - 50}" r="15"/></g>
    <circle cx="${cx}" cy="${top - 66}" r="10" fill="#E2326F"/>
    <path d="M ${cx} ${top - 76} Q ${cx + 9} ${top - 90} ${cx + 18} ${top - 82}" stroke="#7A8B3A" stroke-width="5" fill="none"/></g>`;
}
function donut(cx, cy) {
  return `<g>${shadow(cx, 452, 52)}
    <circle cx="${cx}" cy="${cy}" r="44" fill="none" stroke="#EBA64C" stroke-width="32"/>
    <path d="M ${cx - 44} ${cy - 8} A44 44 0 0 1 ${cx + 44} ${cy - 8}" fill="none" stroke="${CREAM}" stroke-width="32" stroke-linecap="round"/>
    <g stroke-width="6" stroke-linecap="round"><line x1="${cx - 20}" y1="${cy - 28}" x2="${cx - 12}" y2="${cy - 40}" stroke="#F7409F"/><line x1="${cx}" y1="${cy - 36}" x2="${cx}" y2="${cy - 50}" stroke="#8E4D9E"/><line x1="${cx + 20}" y1="${cy - 28}" x2="${cx + 12}" y2="${cy - 40}" stroke="#0ABDC6"/><line x1="${cx - 34}" y1="${cy - 6}" x2="${cx - 24}" y2="${cy - 10}" stroke="#8E4D9E"/><line x1="${cx + 34}" y1="${cy - 6}" x2="${cx + 24}" y2="${cy - 10}" stroke="#F7409F"/></g></g>`;
}
function bowl(cx, base) {
  return `<path d="M ${cx - 130} ${base - 60} Q ${cx} ${base - 30} ${cx + 130} ${base - 60} L ${cx + 100} ${base} Q ${cx} ${base + 28} ${cx - 100} ${base} Z" fill="${CREAM}"/>
    <ellipse cx="${cx}" cy="${base - 60}" rx="130" ry="26" fill="${WHITE}"/>
    <ellipse cx="${cx}" cy="${base - 60}" rx="130" ry="26" fill="none" stroke="#E7D6C8" stroke-width="3"/>`;
}
function popcornBox(cx, top) {
  const x = cx - 80, w = 160, h = 104, bot = top + h;
  let stripes = '';
  for (let i = 0; i < 6; i++) stripes += `<rect x="${x + i * (w / 6)}" y="${top}" width="${w / 6}" height="${h}" fill="${i % 2 ? '#E23B3B' : WHITE}"/>`;
  return `<g>${shadow(cx, 452, 96)}<g>${stripes}</g><path d="M ${x} ${top} L ${x + w} ${top} L ${x + w - 16} ${bot} L ${x + 16} ${bot} Z" fill="none"/></g>`;
}
function chocBar(cx, cy, rot) {
  return `<g transform="rotate(${rot} ${cx} ${cy})"><rect x="${cx - 46}" y="${cy - 30}" width="92" height="60" rx="6" fill="#6B3F2B"/><rect x="${cx - 46}" y="${cy - 30}" width="92" height="14" rx="6" fill="#8A5638"/><g stroke="#4F2E1F" stroke-width="3">${[-23, 0, 23].map((dx) => `<line x1="${cx + dx}" y1="${cy - 30}" x2="${cx + dx}" y2="${cy + 30}"/>`).join('')}<line x1="${cx - 46}" y1="${cy}" x2="${cx + 46}" y2="${cy}"/></g></g>`;
}
function coffee(cx, cy) {
  return `<g>${shadow(cx, 452, 50)}
    <path d="M ${cx + 26} ${cy - 6} q 26 0 26 24 q 0 24 -26 24" fill="none" stroke="${CREAM}" stroke-width="9"/>
    <path d="M ${cx - 34} ${cy - 18} L ${cx + 34} ${cy - 18} L ${cx + 27} ${cy + 64} Q ${cx} ${cy + 72} ${cx - 27} ${cy + 64} Z" fill="${WHITE}"/>
    <rect x="${cx - 40}" y="${cy - 30}" width="80" height="16" rx="6" fill="#D9C7B8"/>
    <rect x="${cx - 20}" y="${cy - 44}" width="40" height="16" rx="5" fill="${CREAM}"/>
    <g stroke="${WHITE}" stroke-width="5" stroke-linecap="round" opacity="0.7" fill="none"><path d="M ${cx - 10} ${cy - 56} q 8 -12 0 -24"/><path d="M ${cx + 10} ${cy - 56} q 8 -12 0 -24"/></g></g>`;
}
function cookie(cx, cy, rnd) {
  let chips = '';
  for (let i = 0; i < 7; i++) chips += `<circle cx="${n(cx - 30 + rnd() * 60)}" cy="${n(cy - 30 + rnd() * 60)}" r="${n(4 + rnd() * 4)}" fill="#5A3A22"/>`;
  return `<g>${shadow(cx, 452, 52)}<circle cx="${cx}" cy="${cy}" r="46" fill="#C98A4B"/><circle cx="${cx}" cy="${cy}" r="46" fill="none" stroke="#A06A33" stroke-width="3"/>${chips}</g>`;
}
function alfajor(cx, cy) {
  return `<g>${shadow(cx, 452, 46)}
    <ellipse cx="${cx}" cy="${cy + 20}" rx="44" ry="16" fill="#E8C79A"/>
    <rect x="${cx - 44}" y="${cy + 4}" width="88" height="20" fill="#C8924E"/>
    <ellipse cx="${cx}" cy="${cy + 4}" rx="44" ry="16" fill="#E8C79A"/>
    <path d="M ${cx - 44} ${cy - 12} a 44 16 0 0 1 88 0 q 0 16 -44 16 q -44 0 -44 -16 Z" fill="#6B4A30"/>
    <ellipse cx="${cx}" cy="${cy - 12}" rx="44" ry="16" fill="#7A5538"/></g>`;
}
function moon(cx, cy, r) {
  return `<path d="M ${cx + r * 0.2} ${cy - r} A ${r} ${r} 0 1 0 ${cx + r * 0.2} ${cy + r} A ${r * 0.78} ${r * 0.78} 0 1 1 ${cx + r * 0.2} ${cy - r} Z" fill="${CREAM}"/>`;
}
function star(cx, cy, r, fill) {
  let p = '';
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2;
    p += `${i ? 'L' : 'M'} ${n(cx + Math.cos(a) * r)} ${n(cy + Math.sin(a) * r)} L ${n(cx + Math.cos(a + Math.PI / 4) * r * 0.38)} ${n(cy + Math.sin(a + Math.PI / 4) * r * 0.38)} `;
  }
  return `<path d="${p}Z" fill="${fill}"/>`;
}
function granolaBar(cx, cy, rot, rnd) {
  let seeds = '';
  for (let i = 0; i < 14; i++) seeds += `<circle cx="${n(cx - 60 + rnd() * 120)}" cy="${n(cy - 18 + rnd() * 36)}" r="${n(2 + rnd() * 2.5)}" fill="#9A6B3A"/>`;
  return `<g transform="rotate(${rot} ${cx} ${cy})">${shadow(cx, 452, 70)}<rect x="${cx - 66}" y="${cy - 24}" width="132" height="48" rx="10" fill="#D7A968"/><rect x="${cx - 66}" y="${cy - 24}" width="132" height="48" rx="10" fill="none" stroke="#B5853F" stroke-width="3"/>${seeds}</g>`;
}
function peanuts(cx, cy, rnd) {
  let s = `<g>${shadow(cx, 452, 48)}`;
  const spots = [[0, 0, -10], [-26, 10, 18], [24, 12, -16], [-6, -16, 8]];
  for (const [dx, dy, rot] of spots) {
    const x = cx + dx, y = cy + dy;
    s += `<g transform="rotate(${rot} ${x} ${y})"><circle cx="${x - 13}" cy="${y}" r="16" fill="#D8A867"/><circle cx="${x + 13}" cy="${y}" r="18" fill="#D8A867"/><circle cx="${x}" cy="${y}" r="11" fill="#CB9A56"/></g>`;
  }
  return s + '</g>';
}
function sodaCup(cx, top) {
  const bot = top + 120;
  return `<g>${shadow(cx, 452, 64)}
    <path d="M ${cx - 50} ${top} L ${cx + 50} ${top} L ${cx + 38} ${bot} Q ${cx} ${bot + 10} ${cx - 38} ${bot} Z" fill="${WHITE}" opacity="0.92"/>
    <path d="M ${cx - 50} ${top} L ${cx + 50} ${top} L ${cx + 44} ${top + 30} L ${cx - 44} ${top + 30} Z" fill="#CFE9EC"/>
    <rect x="${cx - 56}" y="${top - 14}" width="112" height="16" rx="6" fill="#BFE2E6"/>
    <rect x="${cx + 14}" y="${top - 86}" width="12" height="80" rx="5" fill="#F23A9E" transform="rotate(10 ${cx + 20} ${top - 46})"/>
    <g fill="#9FD3D8" opacity="0.8"><circle cx="${cx - 14}" cy="${top + 58}" r="6"/><circle cx="${cx + 10}" cy="${top + 78}" r="5"/><circle cx="${cx - 2}" cy="${top + 96}" r="4"/></g></g>`;
}
function sodaCan(cx, cy) {
  return `<g>${shadow(cx, 452, 40)}<rect x="${cx - 30}" y="${cy - 54}" width="60" height="118" rx="14" fill="#E1413F"/><rect x="${cx - 30}" y="${cy - 54}" width="60" height="14" rx="10" fill="#C0302E"/><rect x="${cx - 24}" y="${cy - 10}" width="48" height="22" rx="4" fill="${CREAM}" opacity="0.85"/><ellipse cx="${cx + 6}" cy="${cy - 50}" rx="6" ry="3" fill="#9A2422"/></g>`;
}
function iceCubes(cx, cy) {
  const cube = (x, y, rot) => `<g transform="rotate(${rot} ${x} ${y})"><rect x="${x - 22}" y="${y - 22}" width="44" height="44" rx="9" fill="#DDF3F5" opacity="0.92"/><path d="M ${x - 14} ${y - 14} L ${x + 6} ${y - 14} L ${x - 14} ${y + 6} Z" fill="${WHITE}" opacity="0.7"/></g>`;
  return `<g>${shadow(cx, 452, 50)}${cube(cx - 18, cy + 6, -12)}${cube(cx + 20, cy - 4, 14)}${cube(cx + 2, cy - 30, 6)}</g>`;
}

/* ---------- definición de los 6 packs ---------- */
const PALETTE = ['#F5A623', '#0ABDC6', '#F23A9E', CREAM, WHITE, '#FFD9EC'];
const packs = [
  {
    slug: 'combo-cumpleanos', from: '#F7409F', to: '#B8005F', accent: '#F23A9E',
    treats: (rnd) => donut(440, 378) + cupcake(600, 366) + lolly(760, 326, 52, [CREAM, '#F7409F', CREAM, '#0ABDC6', CREAM], 122) + shadow(760, 452, 38) + wrapped(600, 430, 0.78, '#0ABDC6', '#46D2DA', -10),
  },
  {
    slug: 'para-compartir', from: '#FF6F52', to: '#C2261C', accent: '#FF8E73',
    treats: (rnd) =>
      wrapped(516, 352, 1.0, '#F5A623', '#FFC85C', -14) + wrapped(688, 352, 1.0, '#8E4D9E', '#B884C4', 12) +
      lolly(602, 322, 34, ['#F23A9E', CREAM, '#0ABDC6', CREAM], 70) +
      wrapped(556, 392, 0.86, '#0ABDC6', '#5FD6DC', 16) + wrapped(652, 394, 0.86, '#F23A9E', '#FF7FC0', -18) +
      bowl(600, 452),
  },
  {
    slug: 'snacks-cinefilos', from: '#FBB034', to: '#C2710B', accent: '#FFC76B',
    treats: (rnd) =>
      chocBar(452, 392, -14) +
      cluster(600, 332, rnd, [CREAM, '#FFE9B0', WHITE], 26, 64, 12, 20) + popcornBox(600, 348) +
      wrapped(762, 396, 0.86, '#E2326F', '#FF7FA8', 12) + wrapped(742, 360, 0.7, '#0ABDC6', '#5FD6DC', -16),
  },
  {
    slug: 'antojo-nocturno', from: '#6E4B9E', to: '#34215C', accent: '#9B79C4',
    treats: (rnd) =>
      moon(806, 250, 60) + star(700, 150, 16, CREAM) + star(540, 168, 11, '#FFD9EC') + star(880, 360, 12, CREAM) +
      cookie(540, 372, rnd) + alfajor(672, 386),
  },
  {
    slug: 'picoteo-oficina', from: '#2E8BE6', to: '#15487F', accent: '#6BB0F0',
    treats: (rnd) =>
      peanuts(470, 404, rnd) + granolaBar(572, 372, -10, rnd) + coffee(742, 332),
  },
  {
    slug: 'bebidas-frias', from: '#12C2CC', to: '#1B6B8A', accent: '#5FE0E6',
    treats: (rnd) =>
      sodaCan(462, 372) + sodaCup(610, 322) + iceCubes(752, 386) +
      `<g fill="${WHITE}" opacity="0.5"><circle cx="700" cy="250" r="9"/><circle cx="520" cy="270" r="7"/><circle cx="666" cy="214" r="5"/></g>`,
  },
];

function buildSVG(pack) {
  const rnd = mulberry32(hash(pack.slug));
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg-${pack.slug}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${pack.from}"/><stop offset="1" stop-color="${pack.to}"/></linearGradient>
    <radialGradient id="glow-${pack.slug}" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#FFFFFF" stop-opacity="0.28"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg-${pack.slug})"/>
  ${bokeh(rnd)}
  ${cornerLolly(pack.accent)}
  ${stageGlow(pack.slug)}
  ${pack.treats(rnd)}
  ${wave()}
  ${confetti(rnd, PALETTE)}
</svg>`;
}

/* ---------- escribir + rasterizar ---------- */
let sharp = null;
try { sharp = (await import('sharp')).default; } catch { console.warn('⚠️  sharp no disponible — solo SVG'); }

for (const pack of packs) {
  const svg = buildSVG(pack);
  const svgPath = path.join(OUT, `${pack.slug}.svg`);
  fs.writeFileSync(svgPath, svg, 'utf8');
  let png = '—';
  if (sharp) {
    try {
      await sharp(Buffer.from(svg), { density: 144 }).resize(W, H, { fit: 'fill' }).png({ quality: 90 }).toFile(path.join(OUT, `${pack.slug}.png`));
      png = `${pack.slug}.png`;
    } catch (e) { png = `error: ${e.message}`; }
  }
  console.log(`✅ ${pack.slug}.svg  ·  ${png}`);
}
console.log(`\n📂 ${OUT}`);

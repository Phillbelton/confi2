/**
 * Completa las presentaciones "imaginadas" de la plantilla poblada.
 *
 * Toma el Excel que ya tiene UNA fila por producto y, según una repartición
 * determinista por sku (estable, reproducible):
 *    60% → 3 presentaciones · 15% → 2 · 25% queda con 1 (como está).
 *
 * Las fórmulas replican EXACTAMENTE los 15 productos ya curados del archivo:
 *
 *   Base `unidad` (precio U):
 *     display  f=12  precio round(U*12*0.92)  "Display de 12 un."  tramo1 3→ round(*0.95)
 *     embalaje f=72  precio round(U*72*0.85)  "Caja de 72 un."     tramo1 2→ round(*0.97)
 *   Base `display` (factor F, precio D):
 *     unidad   f=1     precio round(D/F)         (sin tramos)
 *     embalaje f=F*6   precio round(D*6*0.85)  "Caja de {F*6} un." tramo1 2→ round(*0.97)
 *
 * NO toca ninguna fila existente ni los productos ya curados (multi-presentación).
 * Reusa buildTemplate() → salen idénticos los dropdowns/estilos/hojas.
 *
 * Uso: npm run complete:presentations  [origen.xlsx] [destino.xlsx]
 * Default in-place sobre C:/Users/sk/Downloads/quelita_template_presentacion.xlsx
 */

import * as XLSX from 'xlsx';
import * as fs from 'fs';
import { buildTemplate, MEDIDAS, TIPOS, type Listas } from './generateQuelitaTemplate';

const args = process.argv.slice(2);
const SRC = args[0] || 'C:/Users/sk/Downloads/quelita_template_presentacion.xlsx';
const DST = args[1] || SRC; // in-place por defecto

type Row = Record<string, unknown>;

const s = (v: unknown): string => (v === null || v === undefined ? '' : String(v).trim());
const num = (v: unknown): number => {
  if (v === null || v === undefined || v === '') return 0;
  const n = typeof v === 'number' ? v : parseFloat(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
};
const R = (n: number): number => Math.round(n);

/** Hash estable (djb2) del sku → entero no negativo. Reparto reproducible. */
function hash(str: string): number {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) >>> 0;
  return h;
}

/** Fila de presentación vacía salvo sku + los campos que se pasen. */
function presRow(sku: string, extra: Row): Row {
  return {
    sku,
    nombre: '', marca: '', categoria: '', gramaje: '', medida: '', sabor: '',
    descripcion: '', imagen_url: '', etiquetas: '', colecciones: '', destacado: '', activo: '',
    presentacion_tipo: '', presentacion_factor: '', presentacion_precio: '',
    presentacion_principal: 'FALSE', presentacion_barcode: '', presentacion_etiqueta: '',
    tramo1_desde: '', tramo1_precio: '', tramo2_desde: '', tramo2_precio: '',
    ...extra,
  };
}

/** Presentación `display` derivada de una base `unidad` de precio U. */
function displayFromUnidad(sku: string, U: number): Row {
  const precio = R(U * 12 * 0.92);
  return presRow(sku, {
    presentacion_tipo: 'display', presentacion_factor: 12, presentacion_precio: precio,
    presentacion_etiqueta: 'Display de 12 un.',
    tramo1_desde: 3, tramo1_precio: R(precio * 0.95),
  });
}
/** Presentación `embalaje` derivada de una base `unidad` de precio U. */
function embalajeFromUnidad(sku: string, U: number): Row {
  const precio = R(U * 72 * 0.85);
  return presRow(sku, {
    presentacion_tipo: 'embalaje', presentacion_factor: 72, presentacion_precio: precio,
    presentacion_etiqueta: 'Caja de 72 un.',
    tramo1_desde: 2, tramo1_precio: R(precio * 0.97),
  });
}
/** Presentación `unidad` derivada de una base `display` (factor F, precio D). */
function unidadFromDisplay(sku: string, D: number, F: number): Row {
  return presRow(sku, {
    presentacion_tipo: 'unidad', presentacion_factor: 1, presentacion_precio: R(D / F),
  });
}
/** Presentación `embalaje` derivada de una base `display` (factor F, precio D). */
function embalajeFromDisplay(sku: string, D: number, F: number): Row {
  const factor = F * 6;
  const precio = R(D * 6 * 0.85);
  return presRow(sku, {
    presentacion_tipo: 'embalaje', presentacion_factor: factor, presentacion_precio: precio,
    presentacion_etiqueta: `Caja de ${factor} un.`,
    tramo1_desde: 2, tramo1_precio: R(precio * 0.97),
  });
}

async function main(): Promise<void> {
  const wb = XLSX.readFile(SRC);
  const sheet = wb.Sheets['Productos'];
  if (!sheet) throw new Error('No se encontró la hoja "Productos".');
  const raw = XLSX.utils.sheet_to_json<Row>(sheet, { defval: '' });

  // Agrupar por sku conservando el orden de aparición.
  const groups = new Map<string, Row[]>();
  const order: string[] = [];
  for (const r of raw) {
    const sku = s(r.sku);
    if (!sku) continue;
    if (!groups.has(sku)) { groups.set(sku, []); order.push(sku); }
    groups.get(sku)!.push(r);
  }

  // Singles = candidatos a completar (los multi ya están curados: no se tocan).
  const singles = order.filter((sku) => groups.get(sku)!.length === 1);

  // Reparto 60/15/25 EXACTO: ordenar por hash y cortar.
  const ranked = [...singles].sort((a, b) => hash(a) - hash(b) || a.localeCompare(b));
  const n = ranked.length;
  const n3 = Math.round(n * 0.6);
  const n2 = Math.round(n * 0.15);
  const bucket = new Map<string, 1 | 2 | 3>();
  ranked.forEach((sku, i) => bucket.set(sku, i < n3 ? 3 : i < n3 + n2 ? 2 : 1));

  const stats = { p3: 0, p2: 0, p1: 0, added: 0, skippedNoBase: 0 };
  const out: Row[] = [];

  for (const sku of order) {
    const rows = groups.get(sku)!;
    // Multi-presentación (curado) → intacto.
    if (rows.length > 1) { out.push(...rows); continue; }

    const base = rows[0];
    out.push(base); // la fila original NUNCA se modifica

    const target = bucket.get(sku) ?? 1;
    if (target === 1) { stats.p1++; continue; }

    const tipo = s(base.presentacion_tipo);
    const precio = num(base.presentacion_precio);
    const factor = num(base.presentacion_factor);
    const extras: Row[] = [];

    if (tipo === 'unidad') {
      // base unidad: +display (+embalaje si target=3)
      extras.push(displayFromUnidad(sku, precio));
      if (target === 3) extras.push(embalajeFromUnidad(sku, precio));
    } else if (tipo === 'display' && factor >= 2) {
      // base display: 3p → +unidad +embalaje · 2p → +embalaje (espeja los curados)
      if (target === 3) extras.push(unidadFromDisplay(sku, precio, factor));
      extras.push(embalajeFromDisplay(sku, precio, factor));
    } else {
      // base rara (sin factor usable) → se deja como single
      stats.skippedNoBase++;
      stats.p1++;
      continue;
    }

    out.push(...extras);
    stats.added += extras.length;
    if (target === 3) stats.p3++; else stats.p2++;
  }

  // Listas (dropdowns) desde la taxonomía real de los productos.
  const uniqSorted = (vals: string[]) =>
    [...new Set(vals.map((v) => v.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es'));
  const prodRows = out.filter((r) => s(r.nombre)); // filas que llevan datos de producto
  const listas: Listas = {
    categorias: uniqSorted(prodRows.map((p) => s(p.categoria))),
    marcas: uniqSorted(prodRows.map((p) => s(p.marca))),
    sabores: uniqSorted(prodRows.flatMap((p) => s(p.sabor).split(',').map((x) => x.trim()))),
    medidas: MEDIDAS,
    tipos: TIPOS,
  };

  if (DST === SRC && fs.existsSync(SRC)) {
    const bak = SRC.replace(/\.xlsx$/i, `.backup-${Date.now()}.xlsx`);
    fs.copyFileSync(SRC, bak);
    console.log(`  Backup: ${bak}`);
  }

  await buildTemplate(DST, out, listas);

  console.log(`✓ Presentaciones completadas: ${DST}`);
  console.log(`  Productos (skus): ${order.length}  ·  filas totales: ${out.length}`);
  console.log(`  Singles procesados: ${n}  →  3p: ${stats.p3}  ·  2p: ${stats.p2}  ·  1p: ${stats.p1}`);
  console.log(`  Filas de presentación agregadas: ${stats.added}  (base sin factor usable: ${stats.skippedNoBase})`);
}

main().catch((err) => {
  console.error('✗ Error:', err);
  process.exit(1);
});

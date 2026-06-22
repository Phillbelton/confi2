/**
 * Puebla la plantilla Quelita a partir de un catálogo en el formato VIEJO
 * (una fila por producto: precio + mayorista_* + caja_*).
 *
 * Mapea cada producto a una fila del nuevo esquema:
 *   - su presentación (modo_venta / unidades_por_paquete / precio) = la principal.
 *   - mayorista_* y caja_* → tramo1 / tramo2 de esa presentación.
 * Arma la hoja "Listas" con la taxonomía REAL del catálogo (categorías, marcas,
 * sabores), y normaliza argentinismos → es-CL (dulce de leche → manjar).
 *
 * Uso:   npm run fill:template  [origen.xlsx] [destino.xlsx]
 * Default: origen  C:/Users/sk/Downloads/quelita_catalogo_curado.xlsx
 *          destino C:/Users/sk/Downloads/quelita_template_poblado.xlsx
 */

import * as XLSX from 'xlsx';
import { buildTemplate, MEDIDAS, TIPOS, type Listas } from './generateQuelitaTemplate';

const args = process.argv.slice(2);
const SRC = args[0] || 'C:/Users/sk/Downloads/quelita_catalogo_curado.xlsx';
const DST = args[1] || 'C:/Users/sk/Downloads/quelita_template_poblado.xlsx';

function num(v: unknown): number {
  if (v === null || v === undefined || v === '') return 0;
  const n = typeof v === 'number' ? v : parseFloat(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}
const s = (v: unknown): string => (v === null || v === undefined ? '' : String(v).trim());

/** Argentinismos → es-CL. Por ahora solo el claro: dulce de leche → manjar. */
function aCL(text: string): string {
  return text.replace(/dulce de leche/gi, 'manjar');
}

function mapRow(r: Record<string, unknown>): Record<string, unknown> {
  const tiers: [number, number][] = [];
  const mMin = num(r.mayorista_min);
  const mPre = num(r.mayorista_precio);
  if (mMin >= 1 && mPre > 0) tiers.push([mMin, mPre]);
  const cMin = num(r.caja_min);
  const cPre = num(r.caja_precio);
  if (cMin >= 1 && cPre > 0) tiers.push([cMin, cPre]);

  const tamano = r['tamaño'] ?? r['tamano'];

  return {
    sku: s(r.sku),
    nombre: s(r.nombre),
    marca: s(r.marca),
    categoria: s(r.categoria),
    gramaje: tamano === '' || tamano == null ? '' : num(tamano),
    medida: s(r.medida),
    sabor: aCL(s(r.sabor)),
    descripcion: aCL(s(r.descripcion)),
    imagen_url: s(r.imagen_url),
    etiquetas: s(r.etiquetas),
    colecciones: s(r.colecciones),
    destacado: s(r.destacado) || 'FALSE',
    activo: s(r.activo) || 'TRUE',
    presentacion_tipo: s(r.modo_venta) || 'unidad',
    presentacion_factor: num(r.unidades_por_paquete) || 1,
    presentacion_precio: num(r.precio),
    presentacion_principal: 'TRUE',
    presentacion_barcode: s(r.codigo_barras),
    presentacion_etiqueta: '',
    tramo1_desde: tiers[0]?.[0] ?? '',
    tramo1_precio: tiers[0]?.[1] ?? '',
    tramo2_desde: tiers[1]?.[0] ?? '',
    tramo2_precio: tiers[1]?.[1] ?? '',
  };
}

function uniqSorted(values: string[]): string[] {
  return [...new Set(values.map((v) => v.trim()).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, 'es')
  );
}

async function main(): Promise<void> {
  const wb = XLSX.readFile(SRC);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
  const productos = raw.map(mapRow).filter((p) => p.sku && p.nombre);

  const listas: Listas = {
    categorias: uniqSorted(productos.map((p) => String(p.categoria))),
    marcas: uniqSorted(productos.map((p) => String(p.marca))),
    sabores: uniqSorted(
      productos.flatMap((p) => String(p.sabor).split(',').map((x) => x.trim()))
    ),
    medidas: MEDIDAS,
    tipos: TIPOS,
  };

  await buildTemplate(DST, productos, listas);

  console.log(`✓ Plantilla poblada: ${DST}`);
  console.log(`  Productos: ${productos.length}`);
  console.log(
    `  Listas → categorías: ${listas.categorias.length} · marcas: ${listas.marcas.length} · sabores: ${listas.sabores.length}`
  );
}

main().catch((err) => {
  console.error('✗ Error:', err);
  process.exit(1);
});

/**
 * Convierte el Excel de Bicom (BASE DATOS_YYYY_MM_MES.xlsx) al formato
 * Quelita-nativo (quelita_catalogo.xlsx), con todas las filas pre-llenadas
 * y curadas para que el admin solo tenga que pulir.
 *
 * Uso:
 *   npm run convert:bicom -- "C:/path/to/BASE DATOS.xlsx" "C:/output/dir"
 *
 * Sin args usa rutas default: C:/Users/sk/Downloads/BASE DATOS_2026_04_ABRIL.xlsx
 *
 * Decisiones de diseño:
 *   - No incluye columna `provider` (descartada por el usuario).
 *   - `active = TRUE` por default — admin desactiva manualmente lo que no quiera mostrar.
 *   - Descripción auto-curada por templates de GRUPO + marca + sabor + formato.
 *   - SKU propio Quelita (QU-XXXXXX) generado secuencialmente.
 *   - Sort por barcode asc para facilitar paste de precios desde Bicom siguiente mes.
 *   - Si el archivo destino existe, agrega timestamp al nombre (no pisa curación).
 */

import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

const args = process.argv.slice(2);
const SRC = args[0] || 'C:/Users/sk/Downloads/BASE DATOS_2026_04_ABRIL.xlsx';
const DST_DIR = args[1] || 'C:/Users/sk/Downloads';
const DST_BASE = 'quelita_catalogo';

// Columnas del Bicom (índice 0-based)
const COL = {
  BARCODE: 2, GRUPO: 3, MARCA: 5, NAME: 6, DESC_EMBALAJE: 7,
  CAJAS: 8, UNI: 9,
  PRECIO_EMBALAJE: 17, PRECIO_DISPLAY_MAYOR: 19,
  PRECIO_DISPLAY_DETALLE: 21, PRECIO_UNITARIO: 23,
};

const FLAVORS = [
  'frutilla','limon','limón','naranja','frambuesa','mora','manzana','piña','pera',
  'durazno','uva','sandia','sandía','menta','mentol','chocolate','vainilla','caramelo',
  'mango','tutti-frutti','tutti frutti','cereza','cherry','coco','almendra','avellana',
  'mani','maní','platano','plátano','melon','melón','tropical','frutal','acido','ácido',
  'queso','sal','crema y cebolla','picante','barbacoa','ranch','jamon','jamón',
  'leche condensada','manjar','dulce de leche','bitter','blanco','marrón',
  'granada','citrus','bilz','pap','cola','soda',
];

const GROUP_TEMPLATES: Record<string, string> = {
  CONFITE: 'Confites',
  CHOCOLATE: 'Chocolate', GALLETA: 'Galletas', LIQUIDO: 'Bebida',
  HELADO: 'Helado', HELADOS: 'Helado', SNACK: 'Snack',
  PASCUA: 'Producto de Pascua',
  'HALLOWEEN 2025': 'Producto de Halloween',
  'CONFITE PASCUA': 'Confite de Pascua',
  'CONFITE HALLOWEEN': 'Confite de Halloween',
  REPOSTERIA: 'Producto de repostería',
  ARTESANAL: 'Producto artesanal',
  'CUMPLEAÑOS': 'Producto para cumpleaños',
  GROW: 'Producto grow', CHICHE: 'Chiche',
  CONFITERIA: 'Confites', OTRO: 'Producto', OTROS: 'Producto',
};

function norm(v: unknown): string {
  if (v === null || v === undefined) return '';
  return String(v).trim().replace(/\s+/g, ' ');
}

function num(v: unknown): number {
  if (v === null || v === undefined || v === '') return 0;
  const n = typeof v === 'number' ? v : parseFloat(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}

function toTitleCase(s: string): string {
  return s.toLowerCase().split(' ').map((w) => w ? w[0].toUpperCase() + w.slice(1) : w).join(' ');
}

function detectFlavor(name: string): string {
  const lower = name.toLowerCase();
  const sorted = [...FLAVORS].sort((a, b) => b.length - a.length);
  for (const f of sorted) {
    if (lower.includes(f)) {
      return f
        .replace('limon', 'limón').replace('mani', 'maní')
        .replace('platano', 'plátano').replace('melon', 'melón')
        .replace('sandia', 'sandía').replace('acido', 'ácido')
        .replace('jamon', 'jamón').replace('tutti frutti', 'tutti-frutti');
    }
  }
  return '';
}

interface Format { value: number; unit: 'g' | 'kg' | 'ml' | 'l' | 'cc' | 'oz'; }

function detectFormat(name: string): Format | null {
  const lower = name.toLowerCase().replace(/\s+/g, ' ');
  const mGr = lower.match(/\d+\s*x\s*(\d+(?:[.,]\d+)?)\s*gr?\b/);
  if (mGr) return { value: parseFloat(mGr[1].replace(',', '.')), unit: 'g' };
  const mGr2 = lower.match(/(\d+(?:[.,]\d+)?)\s*gr?\b/);
  if (mGr2) return { value: parseFloat(mGr2[1].replace(',', '.')), unit: 'g' };
  const mLt = lower.match(/(\d+(?:[.,]\d+)?)\s*(?:lt|l)\b/);
  if (mLt) return { value: parseFloat(mLt[1].replace(',', '.')), unit: 'l' };
  const mMl = lower.match(/(\d+(?:[.,]\d+)?)\s*(?:ml|cc)\b/);
  if (mMl) return { value: parseFloat(mMl[1].replace(',', '.')), unit: 'ml' };
  const mKg = lower.match(/(\d+(?:[.,]\d+)?)\s*kg\b/);
  if (mKg) return { value: parseFloat(mKg[1].replace(',', '.')), unit: 'kg' };
  return null;
}

function formatLabel(fmt: Format | null): string {
  if (!fmt) return '';
  const unitLabel: Record<string, string> = { g: 'g', kg: 'kg', ml: 'ml', l: 'L', cc: 'cc', oz: 'oz' };
  return `${fmt.value}${unitLabel[fmt.unit] || fmt.unit}`;
}

interface SaleUnit { type: 'unidad' | 'display' | 'embalaje'; quantity: number; }

function generateDescription(params: {
  grupo: string; brand: string; flavor: string; format: Format | null; saleUnit: SaleUnit;
}): string {
  const { grupo, brand, flavor, format, saleUnit } = params;
  const groupKey = grupo.toUpperCase().trim();
  const productType = GROUP_TEMPLATES[groupKey] || 'Producto';
  const brandTitle = brand ? toTitleCase(brand) : '';
  const skipBrand = !!(brandTitle && productType.toLowerCase().includes(brandTitle.toLowerCase()));
  const brandTxt = (brandTitle && !skipBrand) ? brandTitle : '';
  const flavorTxt = flavor ? ` sabor ${flavor}` : '';
  const fmtTxt = format ? ` de ${formatLabel(format)}` : '';

  let presentacion = '';
  if (saleUnit.type === 'display' && saleUnit.quantity > 1) {
    presentacion = ` Pack con ${saleUnit.quantity} unidades${fmtTxt}.`;
  } else if (saleUnit.type === 'embalaje' && saleUnit.quantity > 1) {
    presentacion = ` Caja con ${saleUnit.quantity} unidades${fmtTxt}.`;
  } else if (saleUnit.type === 'unidad' && format) {
    presentacion = ` Unidad${fmtTxt}.`;
  }

  const base = `${productType}${brandTxt ? ' ' + brandTxt : ''}${flavorTxt}.${presentacion}`;
  return base.length >= 10 ? base : base.padEnd(10, ' ');
}

function main(): void {
  if (!fs.existsSync(SRC)) {
    console.error(`Archivo no encontrado: ${SRC}`);
    process.exit(1);
  }

  const buf = fs.readFileSync(SRC);
  const wb = XLSX.read(buf, { type: 'buffer' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1, defval: '' });

  console.log(`Filas en Bicom: ${rows.length}`);

  const dataRows = rows.slice(2);

  const HEADER = [
    'sku','barcode','name','description','category','brand','flavor',
    'format_value','format_unit',
    'unitPrice','saleUnit_type','saleUnit_quantity',
    'tier1_minQty','tier1_price','tier1_label',
    'tier2_minQty','tier2_price','tier2_label',
    'tags','featured','active','image_url',
  ];

  let skuSeed = 1;
  const makeSku = (): string => `QU-${String(skuSeed++).padStart(6, '0')}`;

  const outRows: any[][] = [HEADER];
  let skipped = 0;
  let processed = 0;

  for (const r of dataRows) {
    const barcode = norm(r[COL.BARCODE]);
    if (!barcode || !/^\d{8,14}$/.test(barcode)) { skipped++; continue; }
    const name = norm(r[COL.NAME]);
    if (!name) { skipped++; continue; }

    const grupo = norm(r[COL.GRUPO]);
    const marca = norm(r[COL.MARCA]);
    const cajas = Math.max(1, Math.round(num(r[COL.CAJAS])));
    const uni = Math.max(1, Math.round(num(r[COL.UNI])));
    const pEmb = num(r[COL.PRECIO_EMBALAJE]);
    const pMay = num(r[COL.PRECIO_DISPLAY_MAYOR]);
    const pDet = num(r[COL.PRECIO_DISPLAY_DETALLE]);
    const pUni = num(r[COL.PRECIO_UNITARIO]);

    const isDisplay = uni > 1;
    let saleUnitType: 'unidad' | 'display' | 'embalaje';
    let saleUnitQty: number;
    let unitPrice: number;
    if (isDisplay) {
      saleUnitType = 'display';
      saleUnitQty = uni;
      unitPrice = pDet > 0 ? pDet : pMay > 0 ? pMay : (pEmb > 0 ? Math.round(pEmb / cajas) : 0);
    } else {
      saleUnitType = 'unidad';
      saleUnitQty = 1;
      unitPrice = pUni > 0 ? pUni : pDet > 0 ? pDet : pMay > 0 ? pMay : (pEmb > 0 ? Math.round(pEmb / cajas) : 0);
    }
    if (unitPrice <= 0) { skipped++; continue; }

    const format = detectFormat(name);
    const flavor = detectFlavor(name);

    let tier1: [number | '', number | '', string] = ['', '', ''];
    let tier2: [number | '', number | '', string] = ['', '', ''];
    if (saleUnitType === 'display') {
      if (pMay > 0 && pMay < unitPrice) tier1 = [2, Math.round(pMay), 'Mayorista (2+)'];
      if (pEmb > 0 && cajas > 1) {
        const ppu = Math.round(pEmb / cajas);
        if (ppu < unitPrice) tier2 = [cajas, ppu, `Caja completa (${cajas})`];
      }
    } else {
      if (pDet > 0 && pDet < unitPrice) tier1 = [6, Math.round(pDet), 'Pack 6+'];
      if (pEmb > 0 && cajas > 1) {
        const ppu = Math.round(pEmb / cajas);
        if (ppu < unitPrice) tier2 = [cajas, ppu, `Caja × ${cajas}`];
      }
    }

    const description = generateDescription({
      grupo, brand: marca, flavor, format,
      saleUnit: { type: saleUnitType, quantity: saleUnitQty },
    });
    const category = toTitleCase(grupo.replace(/\s+/g, ' ').trim()) || 'Sin categoría';

    outRows.push([
      makeSku(), barcode, name, description, category,
      marca ? toTitleCase(marca) : '',
      flavor || '',
      format ? format.value : '',
      format ? format.unit : '',
      unitPrice, saleUnitType, saleUnitQty,
      ...tier1, ...tier2,
      '', 'FALSE', 'TRUE', '',
    ]);
    processed++;
  }

  // Sort por barcode (col 1) para facilitar paste de precios desde Bicom siguiente mes
  const header = outRows[0];
  const body = outRows.slice(1).sort((a, b) => String(a[1]).localeCompare(String(b[1])));
  const finalRows = [header, ...body];

  const outWs = XLSX.utils.aoa_to_sheet(finalRows);
  outWs['!cols'] = [
    { wch: 12 }, { wch: 16 }, { wch: 40 }, { wch: 60 }, { wch: 24 },
    { wch: 18 }, { wch: 16 }, { wch: 12 }, { wch: 12 },
    { wch: 12 }, { wch: 14 }, { wch: 14 },
    { wch: 14 }, { wch: 12 }, { wch: 22 },
    { wch: 14 }, { wch: 12 }, { wch: 22 },
    { wch: 16 }, { wch: 10 }, { wch: 10 }, { wch: 30 },
  ];
  const outWb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(outWb, outWs, 'Productos');

  let outPath = path.join(DST_DIR, `${DST_BASE}.xlsx`);
  if (fs.existsSync(outPath)) {
    const ts = new Date().toISOString().replace(/[:T-]/g, '').slice(0, 14);
    outPath = path.join(DST_DIR, `${DST_BASE}_${ts}.xlsx`);
  }
  XLSX.writeFile(outWb, outPath);

  console.log(`\n✓ Generado: ${outPath}`);
  console.log(`  Productos procesados: ${processed}`);
  console.log(`  Filas omitidas: ${skipped}`);
}

main();

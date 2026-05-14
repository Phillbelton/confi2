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

// Sabores reales (no marcas/tipos de producto). Conservador: ante la duda, vacío.
// EXCLUIDOS deliberadamente: bilz, pap, cola, soda, citrus, blanco, marrón
// (son tipos de producto o colores, no sabores).
const FLAVORS = [
  'frutilla','limon','limón','naranja','frambuesa','mora','manzana','piña','pera',
  'durazno','uva','sandia','sandía','menta','mentol','chocolate','vainilla','caramelo',
  'mango','tutti-frutti','tutti frutti','cereza','cherry','coco','almendra','avellana',
  'mani','maní','platano','plátano','melon','melón','tropical','frutal','ácido','acido',
  'queso','sal','crema y cebolla','picante','barbacoa','ranch','jamon','jamón',
  'leche condensada','manjar','dulce de leche','bitter','granada',
  'chocolate blanco','chocolate bitter','chocolate amargo',
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

/**
 * Mapea el GRUPO del Bicom al nombre de categoría raíz (nivel 1) del storefront.
 */
const ROOT_CATEGORY: Record<string, string> = {
  CONFITE: 'Confitería',
  'CONFITE PASCUA': 'Pascua',
  'CONFITE HALLOWEEN': 'Halloween',
  CHOCOLATE: 'Chocolates',
  GALLETA: 'Galletas',
  LIQUIDO: 'Bebidas',
  HELADO: 'Heladería',
  HELADOS: 'Heladería',
  SNACK: 'Snacks',
  PASCUA: 'Pascua',
  'HALLOWEEN 2025': 'Halloween',
  REPOSTERIA: 'Repostería',
  ARTESANAL: 'Artesanía',
  'CUMPLEAÑOS': 'Cumpleaños',
  GROW: 'Grow',
  CHICHE: 'Cumpleaños', // re-clasificar a Cumpleaños (chiches son típicos de fiestas)
  CONFITERIA: 'Confitería',
  OTRO: 'Otros', OTROS: 'Otros',
};

/**
 * Heurística de clasificación: dado el GRUPO del Bicom y el nombre del producto,
 * devuelve el path de categoría con notación "A > B > C" (1 a 3 niveles).
 * Los subniveles se asignan por keywords en el nombre.
 */
function classifyCategory(grupo: string, name: string): string {
  const lower = name.toLowerCase();
  const g = grupo.toUpperCase().trim();
  const root = ROOT_CATEGORY[g] || 'Otros';

  // Helados
  if (g === 'HELADO' || g === 'HELADOS') {
    if (/cassata|torta\s*helado/.test(lower)) {
      if (/crema\s*chocolate|chocolate/.test(lower)) return `${root} > Cassatas > Crema chocolate`;
      if (/aguacrema|agua\s*crema/.test(lower)) return `${root} > Cassatas > Aguacrema`;
      if (/\bagua\b/.test(lower)) return `${root} > Cassatas > Agua`;
      if (/\bcrema\b/.test(lower)) return `${root} > Cassatas > Crema`;
      return `${root} > Cassatas`;
    }
    if (/sandwich|sandw/.test(lower)) return `${root} > Sándwiches`;
    if (/palito|trito|chinito|chamy|crazy|bilz|magnum/.test(lower)) return `${root} > Palitos`;
    if (/litro|\b1l\b|\b2l\b|\bgranel\b/.test(lower)) return `${root} > Por litro`;
    if (/cono|cucurucho/.test(lower)) return `${root} > Conos`;
    if (/vasito|copa/.test(lower)) return `${root} > Vasitos`;
    return root;
  }

  // Confites
  if (g === 'CONFITE' || g === 'CONFITERIA') {
    if (/alfajor/.test(lower)) return 'Galletas > Alfajores';
    if (/bombon/.test(lower)) return `${root} > Bombones`;
    if (/chicle|topline|bazooka/.test(lower)) return `${root} > Chicles`;
    if (/chupon|chupete|lollipop|chupa/.test(lower)) return `${root} > Chupetes`;
    if (/gomita|jelly|gummi|aros|ositos|len[gü]ueta/.test(lower)) return `${root} > Gomitas`;
    if (/caramelo|toffee|butter|mogul|sapito/.test(lower)) return `${root} > Caramelos`;
    if (/pastilla|halls/.test(lower)) return `${root} > Pastillas`;
    if (/marshmallow|malvavisco/.test(lower)) return `${root} > Marshmallows`;
    return root;
  }

  // Chocolates
  if (g === 'CHOCOLATE') {
    if (/bombon|ferrero/.test(lower)) return `${root} > Bombones`;
    if (/bolsa|x\d+\s*g/.test(lower)) return `${root} > Bolsas`;
    if (/barra/.test(lower)) return `${root} > Barras`;
    return `${root} > Barras`;
  }

  // Galletas
  if (g === 'GALLETA') {
    if (/alfajor/.test(lower)) return `${root} > Alfajores`;
    if (/soda|agua|cracker|salada/.test(lower)) return `${root} > Saladas`;
    if (/oblea|wafer/.test(lower)) return `${root} > Obleas`;
    if (/champa[gn]a/.test(lower)) return `${root} > Champaña`;
    if (/triton|vienesa|doblon|negrita|frac/.test(lower)) return `${root} > Dulces > Con relleno`;
    return `${root} > Dulces`;
  }

  // Bebidas
  if (g === 'LIQUIDO') {
    if (/\bagua\b/.test(lower) && !/sabor|mas\b|fresc/.test(lower)) return `${root} > Aguas`;
    if (/agua.*sabor|agua\s*mas|cachantun\s*mas/.test(lower)) return `${root} > Aguas saborizadas`;
    if (/jugo|del valle|andina|nestea/.test(lower)) return `${root} > Jugos`;
    if (/cerveza|escudo|cristal|austral|kunstmann/.test(lower)) return `${root} > Cervezas`;
    if (/energ[ée]tica|red bull|monster|score/.test(lower)) return `${root} > Energéticas`;
    if (/yogur|yogh/.test(lower)) return `${root} > Yogures`;
    if (/leche/.test(lower)) return `${root} > Lácteos`;
    if (/coca.?cola|sprite|fanta|bilz|pap|kem|lim[oó]n\s*soda|gaseosa/.test(lower)) {
      return `${root} > Gaseosas`;
    }
    return root;
  }

  // Snacks
  if (g === 'SNACK') {
    if (/papas|lay|doritos|chips/.test(lower)) return `${root} > Papas fritas`;
    if (/mani|maní/.test(lower)) return `${root} > Maní`;
    if (/palomita|cabrita|popcorn/.test(lower)) return `${root} > Cabritas`;
    if (/ramita|cheeto|chizito/.test(lower)) return `${root} > Salados`;
    if (/galletas?\s*sal|cracker/.test(lower)) return `${root} > Crackers`;
    if (/frutos\s*secos|nuez|nueces|almendra/.test(lower)) return `${root} > Frutos secos`;
    return root;
  }

  // Pascua / Halloween / Cumpleaños — categorías de temporada, suelen quedar en nivel 1
  if (root === 'Pascua' || root === 'Halloween' || root === 'Cumpleaños') {
    if (/bandeja/.test(lower)) return `${root} > Bandejas`;
    if (/huevo/.test(lower)) return `${root} > Huevitos`;
    if (/conejo/.test(lower)) return `${root} > Figuras de conejo`;
    if (/vela/.test(lower)) return `${root} > Velas`;
    if (/globo/.test(lower)) return `${root} > Globos`;
    if (/pi[ñn]ata/.test(lower)) return `${root} > Piñatas`;
    return root;
  }

  // Repostería
  if (g === 'REPOSTERIA') {
    if (/manjar/.test(lower)) return `${root} > Manjar`;
    if (/galleta/.test(lower)) return `${root} > Galletas`;
    if (/mostacilla|chispa|granillo|decora/.test(lower)) return `${root} > Decoración`;
    if (/molde|capacillo/.test(lower)) return `${root} > Moldes`;
    return root;
  }

  return root;
}

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
  name: string;
}): string {
  const { grupo, brand, flavor, format, saleUnit, name } = params;
  const groupKey = grupo.toUpperCase().trim();
  const productType = GROUP_TEMPLATES[groupKey] || 'Producto';
  const brandTitle = brand ? toTitleCase(brand) : '';
  const skipBrand = !!(brandTitle && productType.toLowerCase().includes(brandTitle.toLowerCase()));
  const brandTxt = (brandTitle && !skipBrand) ? ` ${brandTitle}` : '';
  const flavorTxt = flavor ? ` sabor ${flavor}` : '';
  const fmtTxt = format ? ` de ${formatLabel(format)}` : '';

  // Frase principal: tono comercial sutil
  const lead = `${productType}${brandTxt}${flavorTxt}.`;

  // Presentación según tipo de packaging
  let presentacion = '';
  const lowerName = name.toLowerCase();
  if (saleUnit.type === 'display' && saleUnit.quantity > 1) {
    const container =
      /bolsa/.test(lowerName) ? 'Bolsa' :
      /bandeja/.test(lowerName) ? 'Bandeja' :
      /caja/.test(lowerName) ? 'Caja' :
      /pack/.test(lowerName) ? 'Pack' :
      /display/.test(lowerName) ? 'Display' :
      'Pack';
    presentacion = ` ${container} con ${saleUnit.quantity} unidades${fmtTxt}.`;
  } else if (saleUnit.type === 'embalaje' && saleUnit.quantity > 1) {
    presentacion = ` Caja con ${saleUnit.quantity} unidades${fmtTxt}.`;
  } else if (saleUnit.type === 'unidad' && format) {
    presentacion = ` Presentación${fmtTxt}.`;
  }

  const base = `${lead}${presentacion}`.replace(/\s+/g, ' ').trim();
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
    'sku','codigo_barras','nombre','marca','categoria',
    'tamaño','medida','sabor',
    'modo_venta','unidades_por_paquete','precio',
    'mayorista_min','mayorista_precio',
    'caja_min','caja_precio',
    'descripcion','imagen_url','etiquetas','colecciones',
    'destacado','activo',
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
      grupo, brand: marca, flavor, format, name,
      saleUnit: { type: saleUnitType, quantity: saleUnitQty },
    });
    // Categoría con path 3 niveles inferida por keywords del nombre.
    // El admin la afina después en el Excel donde el classifier no acertó.
    const category = classifyCategory(grupo, name);

    // Tiers ya están en formato [minQty, price, label]. Solo necesitamos los 2 primeros campos.
    outRows.push([
      makeSku(),                            // sku
      barcode,                              // codigo_barras
      name,                                 // nombre
      marca ? toTitleCase(marca) : '',      // marca
      category,                             // categoria
      format ? format.value : '',           // tamaño
      format ? format.unit : '',            // medida
      flavor || '',                         // sabor
      saleUnitType,                         // modo_venta
      saleUnitQty,                          // unidades_por_paquete
      unitPrice,                            // precio
      tier1[0],                             // mayorista_min
      tier1[1],                             // mayorista_precio
      tier2[0],                             // caja_min
      tier2[1],                             // caja_precio
      description,                          // descripcion
      '',                                   // imagen_url
      '',                                   // etiquetas
      '',                                   // colecciones (admin las llena luego)
      'FALSE',                              // destacado
      'TRUE',                               // activo
    ]);
    processed++;
  }

  // Sort por codigo_barras (col 1) para facilitar paste de precios desde Bicom siguiente mes
  const header = outRows[0];
  const body = outRows.slice(1).sort((a, b) => String(a[1]).localeCompare(String(b[1])));
  const finalRows = [header, ...body];

  const outWs = XLSX.utils.aoa_to_sheet(finalRows);
  outWs['!cols'] = [
    { wch: 12 },  // sku
    { wch: 16 },  // codigo_barras
    { wch: 42 },  // nombre
    { wch: 18 },  // marca
    { wch: 36 },  // categoria
    { wch: 10 },  // tamaño
    { wch: 10 },  // medida
    { wch: 16 },  // sabor
    { wch: 14 },  // modo_venta
    { wch: 14 },  // unidades_por_paquete
    { wch: 12 },  // precio
    { wch: 14 },  // mayorista_min
    { wch: 16 },  // mayorista_precio
    { wch: 12 },  // caja_min
    { wch: 14 },  // caja_precio
    { wch: 60 },  // descripcion
    { wch: 30 },  // imagen_url
    { wch: 22 },  // etiquetas
    { wch: 28 },  // colecciones
    { wch: 10 },  // destacado
    { wch: 10 },  // activo
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

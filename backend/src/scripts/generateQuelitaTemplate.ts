/**
 * Genera la plantilla Excel oficial de Quelita (es-CL) para la carga masiva de
 * productos multi-presentación.
 *
 * DISEÑO: una FILA POR PRESENTACIÓN, agrupadas por `sku` (estilo Shopify).
 * Los datos del producto van en la 1ª fila de cada `sku`; las filas siguientes
 * repiten `sku` + las columnas de presentación/tramos.
 *
 * 4 hojas: Instrucciones · Productos (con dropdowns) · Listas · Ejemplos.
 *
 * Los dropdowns usan `exceljs` (SheetJS no escribe data validation):
 *   - enums cerrados (medida, tipo, TRUE/FALSE) → bloqueantes.
 *   - taxonomía (categoria, marca, sabor)       → con aviso (permite valores nuevos,
 *     que el importer crea solo).
 *
 * Uso:   npm run gen:template  [carpeta_destino]
 * Salida: <carpeta>/quelita_template.xlsx   (default C:/Users/sk/Downloads)
 *
 * `buildTemplate()` se exporta para reusar desde otros scripts (ej. poblar la
 * plantilla con un catálogo real, ver fillTemplateFromCurado.ts).
 */

import ExcelJS from 'exceljs';
import * as path from 'path';
import * as fs from 'fs';

const args = process.argv.slice(2);
const DST_DIR = args[0] || 'C:/Users/sk/Downloads';
const DST_PATH = path.join(DST_DIR, 'quelita_template.xlsx');

type Grupo = 'producto' | 'presentacion' | 'tramos';

interface ColDef {
  key: string;
  header: string;
  width: number;
  grupo: Grupo;
}

/** Conjuntos de valores que alimentan los dropdowns y la hoja "Listas". */
export interface Listas {
  categorias: string[];
  marcas: string[];
  sabores: string[];
  medidas: string[];
  tipos: string[];
}

// Columnas en orden. `key` = nombre técnico que lee el importer.
const COLS: ColDef[] = [
  { key: 'sku', header: 'sku', width: 12, grupo: 'producto' },
  { key: 'nombre', header: 'nombre', width: 34, grupo: 'producto' },
  { key: 'marca', header: 'marca', width: 16, grupo: 'producto' },
  { key: 'categoria', header: 'categoria', width: 30, grupo: 'producto' },
  { key: 'gramaje', header: 'gramaje', width: 9, grupo: 'producto' },
  { key: 'medida', header: 'medida', width: 9, grupo: 'producto' },
  { key: 'sabor', header: 'sabor', width: 18, grupo: 'producto' },
  { key: 'descripcion', header: 'descripcion', width: 40, grupo: 'producto' },
  { key: 'imagen_url', header: 'imagen_url', width: 24, grupo: 'producto' },
  { key: 'etiquetas', header: 'etiquetas', width: 18, grupo: 'producto' },
  { key: 'colecciones', header: 'colecciones', width: 20, grupo: 'producto' },
  { key: 'destacado', header: 'destacado', width: 10, grupo: 'producto' },
  { key: 'activo', header: 'activo', width: 8, grupo: 'producto' },
  { key: 'presentacion_tipo', header: 'presentacion_tipo', width: 17, grupo: 'presentacion' },
  { key: 'presentacion_factor', header: 'presentacion_factor', width: 12, grupo: 'presentacion' },
  { key: 'presentacion_precio', header: 'presentacion_precio', width: 14, grupo: 'presentacion' },
  { key: 'presentacion_principal', header: 'presentacion_principal', width: 14, grupo: 'presentacion' },
  { key: 'presentacion_barcode', header: 'presentacion_barcode', width: 16, grupo: 'presentacion' },
  { key: 'presentacion_etiqueta', header: 'presentacion_etiqueta', width: 16, grupo: 'presentacion' },
  { key: 'tramo1_desde', header: 'tramo1_desde', width: 12, grupo: 'tramos' },
  { key: 'tramo1_precio', header: 'tramo1_precio', width: 12, grupo: 'tramos' },
  { key: 'tramo2_desde', header: 'tramo2_desde', width: 12, grupo: 'tramos' },
  { key: 'tramo2_precio', header: 'tramo2_precio', width: 12, grupo: 'tramos' },
];

// Relleno de encabezado por grupo (50 de cada ramo).
const FILL: Record<Grupo, string> = {
  producto: 'FFF1EFE8', // gris 50
  presentacion: 'FFE1F5EE', // teal 50
  tramos: 'FFFAEEDA', // ámbar 50
};

export const MEDIDAS = ['g', 'kg', 'ml', 'l', 'cc', 'oz'];
export const TIPOS = ['unidad', 'display', 'embalaje', 'cantidad_minima'];

// Listas iniciales curadas (es-CL), para la plantilla en blanco. Cuando se
// puebla desde un catálogo real, se reemplazan por la taxonomía de ese catálogo.
const STARTER_CATEGORIAS = [
  'Confitería > Caramelos', 'Confitería > Chicles', 'Confitería > Chupetes',
  'Chocolates > Barras', 'Chocolates > Bombones',
  'Galletas > Dulces', 'Galletas > Saladas',
  'Snacks > Cabritas', 'Snacks > Papas fritas', 'Snacks > Maní y frutos secos',
  'Bebidas > Gaseosas', 'Bebidas > Aguas', 'Bebidas > Jugos',
  'Heladería > Paletas', 'Heladería > Vasitos',
  'Despensa > Endulzantes',
];
const STARTER_MARCAS = [
  'Fruna', 'Ambrosoli', 'Costa', 'Nestlé', 'Carozzi', 'Arcor', 'CCU',
  'Colombina', 'Spak', 'Halls', 'Calaf', 'Serrano', 'Evercrisp', 'Marco Polo',
];
const STARTER_SABORES = [
  'chocolate', 'frutilla', 'frambuesa', 'naranja', 'limón', 'menta', 'piña',
  'mora', 'manzana', 'tutti frutti', 'vainilla', 'caramelo', 'coco', 'durazno',
  'uva', 'plátano',
];

// ===== Ejemplos: 3 productos. Datos de producto solo en la 1ª fila del sku. =====
const EJEMPLOS: Record<string, string | number>[] = [
  // 1) Cabrita — 3 presentaciones (con venta unitaria). Los tramos de la fila
  //    `unidad` espejan el $/u de los packs (12+→900 ≈ display, 48+→850 ≈ caja).
  {
    sku: 'QU-EJ0001', nombre: 'Cabritas Caramelo Fruna', marca: 'Fruna',
    categoria: 'Snacks > Cabritas', gramaje: 200, medida: 'g', sabor: 'caramelo',
    descripcion: 'Cabritas dulces cubiertas de caramelo Fruna, bolsa de 200 g.',
    imagen_url: '', etiquetas: '', colecciones: '', destacado: 'FALSE', activo: 'TRUE',
    presentacion_tipo: 'unidad', presentacion_factor: 1, presentacion_precio: 1000,
    presentacion_principal: 'TRUE', presentacion_barcode: '7800000000011', presentacion_etiqueta: '',
    tramo1_desde: 12, tramo1_precio: 900, tramo2_desde: 48, tramo2_precio: 850,
  },
  {
    sku: 'QU-EJ0001', presentacion_tipo: 'display', presentacion_factor: 12,
    presentacion_precio: 10800, presentacion_principal: 'FALSE',
    presentacion_barcode: '7800000000028', presentacion_etiqueta: 'Display',
    tramo1_desde: 5, tramo1_precio: 10200,
  },
  {
    sku: 'QU-EJ0001', presentacion_tipo: 'embalaje', presentacion_factor: 48,
    presentacion_precio: 40800, presentacion_principal: 'FALSE',
    presentacion_barcode: '7800000000035', presentacion_etiqueta: 'Caja master',
    tramo1_desde: 3, tramo1_precio: 38400,
  },

  // 2) Chicle — SOLO display + embalaje (sin unidad) y MULTI-SABOR (comas).
  {
    sku: 'QU-EJ0002', nombre: 'Chicle Globo Fruna', marca: 'Fruna',
    categoria: 'Confitería > Chicles', gramaje: 4, medida: 'g', sabor: 'tutti frutti,menta',
    descripcion: 'Chicle globo Fruna surtido. Venta por mayor: display y caja master.',
    imagen_url: '', etiquetas: '', colecciones: '', destacado: 'FALSE', activo: 'TRUE',
    presentacion_tipo: 'display', presentacion_factor: 24, presentacion_precio: 4800,
    presentacion_principal: 'TRUE', presentacion_barcode: '7800000000226', presentacion_etiqueta: 'Display 24 u.',
    tramo1_desde: 6, tramo1_precio: 4500,
  },
  {
    sku: 'QU-EJ0002', presentacion_tipo: 'embalaje', presentacion_factor: 144,
    presentacion_precio: 26400, presentacion_principal: 'FALSE',
    presentacion_barcode: '7800000000233', presentacion_etiqueta: 'Caja master 144 u.',
    tramo1_desde: 4, tramo1_precio: 25000,
  },

  // 3) Bebida — caso simple: 1 presentación, 1 fila.
  {
    sku: 'QU-EJ0003', nombre: 'Bebida 7Up Zero 2L', marca: 'CCU',
    categoria: 'Bebidas > Gaseosas', gramaje: 2, medida: 'l', sabor: '',
    descripcion: 'Bebida 7Up Zero sin azúcar, formato 2 litros.',
    imagen_url: '', etiquetas: '', colecciones: '', destacado: 'FALSE', activo: 'TRUE',
    presentacion_tipo: 'unidad', presentacion_factor: 1, presentacion_precio: 1560,
    presentacion_principal: 'TRUE', presentacion_barcode: '7801620855161', presentacion_etiqueta: '',
    tramo1_desde: 6, tramo1_precio: 1450,
  },
];

// ===== Texto de la hoja Instrucciones (es-CL) =====
const INSTRUCCIONES: { t: string; h?: boolean }[] = [
  { t: 'PLANTILLA DE PRODUCTOS — QUELITA', h: true },
  { t: '' },
  { t: 'Esta planilla carga el catálogo de la tienda. Llená la hoja "Productos" y avisá para importarla.' },
  { t: 'Mirá la hoja "Ejemplos" para ver 3 productos bien armados, y "Listas" para los valores disponibles.' },
  { t: '' },
  { t: 'REGLA DE ORO — una fila por PRESENTACIÓN, agrupadas por sku', h: true },
  { t: 'Un producto puede venderse de varias formas (unidad, display, caja). Cada forma va en SU PROPIA FILA.' },
  { t: 'Todas las filas de un mismo producto llevan el MISMO sku. Ej.: una cabrita con unidad + display + caja = 3 filas con el mismo sku.' },
  { t: 'Los datos del producto (nombre, marca, categoria, gramaje, sabor, descripcion, imagen, etc.) van SOLO en la 1ª fila del sku.' },
  { t: 'Las filas siguientes del mismo producto repiten el sku y solo llenan las columnas de presentación y tramos.' },
  { t: 'Un producto que se vende de una sola forma = una sola fila. Lo simple sigue simple.' },
  { t: '' },
  { t: 'COLUMNAS DE PRODUCTO (1ª fila del sku)', h: true },
  { t: 'sku            Obligatorio. Código interno (QU-XXXXXX). Es la clave que agrupa las filas; repetilo en cada fila del producto.' },
  { t: 'nombre         Obligatorio. Nombre comercial. NO le pongas el gramaje (eso va en su columna).' },
  { t: 'marca          Obligatorio. Si no existe, se crea sola al importar.' },
  { t: 'categoria      Obligatorio. Ruta con ">", hasta 3 niveles. Ej: "Snacks > Cabritas".' },
  { t: 'gramaje        Tamaño de UNA unidad (número). Ej: 200. (Campo propio: ya no se saca del nombre.)' },
  { t: 'medida         Unidad del gramaje: g, kg, ml, l, cc, oz.' },
  { t: 'sabor          Opcional. Para VARIOS sabores, separá con comas: "chocolate,frutilla".' },
  { t: 'descripcion    Texto que ve el cliente en la ficha.' },
  { t: 'imagen_url     Opcional. URL de la imagen principal.' },
  { t: 'etiquetas      Opcional. Separadas por comas. Ej: "promo,temporada".' },
  { t: 'colecciones    Opcional. Separadas por comas. Asigna el producto a colecciones.' },
  { t: 'destacado      TRUE / FALSE. Si TRUE, aparece en "Destacados" del home.' },
  { t: 'activo         TRUE / FALSE (por defecto TRUE). Si FALSE, no se muestra en la tienda.' },
  { t: '' },
  { t: 'COLUMNAS DE PRESENTACIÓN (una fila por cada forma de venta)', h: true },
  { t: 'presentacion_tipo       Obligatorio: unidad / display / embalaje / cantidad_minima.' },
  { t: 'presentacion_factor     Obligatorio. Unidades que contiene: 1 (unidad), 12 (display), 48 (caja). En cantidad_minima = mínimo a comprar.' },
  { t: 'presentacion_precio     Obligatorio. Precio en pesos de UNA de esta presentación (la caja entera, no la unidad suelta).' },
  { t: 'presentacion_principal  TRUE en la presentación por defecto. EXACTAMENTE UNA por producto (es el "desde $" de la card).' },
  { t: 'presentacion_barcode    Opcional. Código de barras de ese pack puntual.' },
  { t: 'presentacion_etiqueta   Opcional. Nombre visible alternativo. Ej: "Display 24 u.".' },
  { t: '' },
  { t: 'COLUMNAS DE TRAMOS POR MAYOR (descuento por cantidad, opcionales)', h: true },
  { t: 'tramo1_desde / tramo1_precio   A partir de cuántas de ESA presentación baja el precio, y a cuánto. Ej: 12 → 900.' },
  { t: 'tramo2_desde / tramo2_precio   Segundo escalón. Ej: 48 → 850.' },
  { t: '(Dos tramos cubren casi todo. Si necesitás un tercero, se ajusta después en el panel de administración.)' },
  { t: '' },
  { t: 'LISTAS DESPLEGABLES (los menús de las celdas)', h: true },
  { t: 'Valores fijos (medida, presentacion_tipo, destacado, activo): SOLO podés elegir de la lista.' },
  { t: 'Taxonomía (categoria, marca, sabor): el menú sugiere lo que ya existe, PERO podés escribir uno nuevo.' },
  { t: '   → Si escribís un valor nuevo, Excel avisa "no está en la lista"; aceptá y seguí. Al importar se crea solo.' },
  { t: 'Después de importar, revisá el resumen: te dice cuántas categorías/marcas/sabores NUEVOS se crearon.' },
  { t: '   Si esperabas 0 nuevos y aparecen varios, es señal de un error de tipeo. Así los cazás al toque.' },
];

function styleHeader(ws: ExcelJS.Worksheet): void {
  const row = ws.getRow(1);
  row.height = 18;
  COLS.forEach((c, i) => {
    const cell = row.getCell(i + 1);
    cell.font = { bold: true, size: 10 };
    cell.alignment = { vertical: 'middle' };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: FILL[c.grupo] } };
    cell.border = { bottom: { style: 'thin', color: { argb: 'FFB4B2A9' } } };
  });
}

function addValidations(ws: ExcelJS.Worksheet, listas: Listas, N: number): void {
  const col = (key: string) => {
    const idx = COLS.findIndex((c) => c.key === key);
    return ws.getColumn(idx + 1).letter;
  };
  const range = (key: string) => `${col(key)}2:${col(key)}${N}`;
  const lista = (c: string, n: number) => [`Listas!$${c}$2:$${c}$${n + 1}`];
  // `dataValidations` existe en runtime pero exceljs no lo expone en sus tipos.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dv = (ws as any).dataValidations;

  // Enums cerrados → bloqueantes
  dv.add(range('medida'), {
    type: 'list', allowBlank: true, formulae: lista('D', listas.medidas.length),
    showErrorMessage: true, errorStyle: 'stop', errorTitle: 'Valor inválido',
    error: 'Elegí una medida de la lista: g, kg, ml, l, cc, oz.',
  });
  dv.add(range('presentacion_tipo'), {
    type: 'list', allowBlank: true, formulae: lista('E', listas.tipos.length),
    showErrorMessage: true, errorStyle: 'stop', errorTitle: 'Valor inválido',
    error: 'Elegí: unidad, display, embalaje o cantidad_minima.',
  });
  for (const k of ['destacado', 'activo', 'presentacion_principal']) {
    dv.add(range(k), {
      type: 'list', allowBlank: true, formulae: ['"TRUE,FALSE"'],
      showErrorMessage: true, errorStyle: 'stop', errorTitle: 'Valor inválido',
      error: 'Solo TRUE o FALSE.',
    });
  }

  // Taxonomía → con aviso (errorStyle: 'warning' permite escribir valores nuevos)
  dv.add(range('categoria'), {
    type: 'list', allowBlank: true, formulae: lista('A', listas.categorias.length),
    showErrorMessage: true, errorStyle: 'warning', errorTitle: 'Categoría nueva',
    error: 'No está en la lista. Si es una categoría nueva, aceptá: se creará al importar. Usá la ruta con ">".',
  });
  dv.add(range('marca'), {
    type: 'list', allowBlank: true, formulae: lista('B', listas.marcas.length),
    showErrorMessage: true, errorStyle: 'warning', errorTitle: 'Marca nueva',
    error: 'No está en la lista. Si es una marca nueva, aceptá: se creará al importar.',
  });
  dv.add(range('sabor'), {
    type: 'list', allowBlank: true, formulae: lista('C', listas.sabores.length),
    showErrorMessage: true, errorStyle: 'warning', errorTitle: 'Sabor nuevo',
    error: 'No está en la lista. Si es un sabor nuevo, aceptá: se creará al importar. Para varios, separá con comas.',
  });
}

function buildProductosSheet(wb: ExcelJS.Workbook, productos: Record<string, unknown>[], listas: Listas): void {
  const ws = wb.addWorksheet('Productos', {
    views: [{ state: 'frozen', xSplit: 1, ySplit: 1 }],
  });
  ws.columns = COLS.map((c) => ({ header: c.header, key: c.key, width: c.width }));
  styleHeader(ws);
  productos.forEach((p) => ws.addRow(p));
  const N = Math.max(productos.length + 50, 600);
  addValidations(ws, listas, N);
}

function buildEjemplosSheet(wb: ExcelJS.Workbook): void {
  const ws = wb.addWorksheet('Ejemplos', {
    views: [{ state: 'frozen', xSplit: 1, ySplit: 1 }],
  });
  ws.columns = COLS.map((c) => ({ header: c.header, key: c.key, width: c.width }));
  styleHeader(ws);
  EJEMPLOS.forEach((e) => ws.addRow(e));
  let prevSku = '';
  ws.eachRow((row, n) => {
    if (n === 1) return;
    const sku = String(row.getCell(1).value ?? '');
    if (sku && sku !== prevSku) {
      row.eachCell({ includeEmpty: true }, (cell) => {
        cell.border = { top: { style: 'thin', color: { argb: 'FFB4B2A9' } } };
      });
      prevSku = sku;
    }
  });
}

function buildListasSheet(wb: ExcelJS.Workbook, listas: Listas): void {
  const ws = wb.addWorksheet('Listas');
  ws.columns = [
    { header: 'Categorías', key: 'cat', width: 32 },
    { header: 'Marcas', key: 'mar', width: 20 },
    { header: 'Sabores', key: 'sab', width: 18 },
    { header: 'Medidas', key: 'med', width: 10 },
    { header: 'Tipos de presentación', key: 'tip', width: 20 },
  ];
  const max = Math.max(
    listas.categorias.length, listas.marcas.length, listas.sabores.length,
    listas.medidas.length, listas.tipos.length
  );
  for (let i = 0; i < max; i++) {
    ws.addRow({
      cat: listas.categorias[i] ?? '', mar: listas.marcas[i] ?? '', sab: listas.sabores[i] ?? '',
      med: listas.medidas[i] ?? '', tip: listas.tipos[i] ?? '',
    });
  }
  ws.getRow(1).font = { bold: true, size: 10 };
  ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1EFE8' } };
}

function buildInstruccionesSheet(wb: ExcelJS.Workbook): void {
  const ws = wb.addWorksheet('Instrucciones');
  ws.getColumn(1).width = 120;
  INSTRUCCIONES.forEach((line) => {
    const row = ws.addRow([line.t]);
    const cell = row.getCell(1);
    cell.alignment = { wrapText: false, vertical: 'middle' };
    if (line.h) {
      cell.font = { bold: true, size: 11 };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE1F5EE' } };
    } else {
      cell.font = { size: 10 };
    }
  });
}

/**
 * Construye el libro completo (4 hojas) y lo escribe en `dstPath`.
 * `productos` puede venir vacío (plantilla en blanco) o lleno (catálogo real).
 */
export async function buildTemplate(
  dstPath: string,
  productos: Record<string, unknown>[],
  listas: Listas
): Promise<void> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Quelita';
  wb.created = new Date();

  buildInstruccionesSheet(wb);
  buildProductosSheet(wb, productos, listas);
  buildListasSheet(wb, listas);
  buildEjemplosSheet(wb);

  const dir = path.dirname(dstPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  await wb.xlsx.writeFile(dstPath);
}

function main(): void {
  const listas: Listas = {
    categorias: STARTER_CATEGORIAS,
    marcas: STARTER_MARCAS,
    sabores: STARTER_SABORES,
    medidas: MEDIDAS,
    tipos: TIPOS,
  };
  buildTemplate(DST_PATH, [], listas)
    .then(() => {
      console.log(`✓ Plantilla generada: ${DST_PATH}`);
      console.log('  Hojas: Instrucciones · Productos (con dropdowns) · Listas · Ejemplos');
      console.log(`  Columnas: ${COLS.length}  ·  Ejemplos: ${EJEMPLOS.length} filas`);
    })
    .catch((err) => {
      console.error('✗ Error generando la plantilla:', err);
      process.exit(1);
    });
}

if (require.main === module) main();

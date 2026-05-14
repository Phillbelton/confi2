/**
 * Genera la plantilla Excel Quelita oficial (vacía + instrucciones + ejemplos).
 *
 * El archivo de salida (`quelita_template.xlsx`) tiene 3 hojas:
 *   1. "Productos"     — vacía con headers en español, para que llenes
 *   2. "Instrucciones" — explicación de cada columna con ejemplos
 *   3. "Ejemplos"      — 10 productos reales del Bicom cubriendo todos los casos
 *
 * Uso:
 *   npm run gen:template
 *
 * Output default: C:/Users/sk/Downloads/quelita_template.xlsx
 */

import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

const args = process.argv.slice(2);
const DST_DIR = args[0] || 'C:/Users/sk/Downloads';
const DST_PATH = path.join(DST_DIR, 'quelita_template.xlsx');

const HEADER = [
  'sku', 'codigo_barras', 'nombre', 'marca', 'categoria',
  'tamaño', 'medida', 'sabor',
  'modo_venta', 'unidades_por_paquete', 'precio',
  'mayorista_min', 'mayorista_precio',
  'caja_min', 'caja_precio',
  'descripcion', 'imagen_url', 'etiquetas', 'colecciones',
  'destacado', 'activo',
];

const COL_WIDTHS = [
  12, 16, 42, 18, 36, 10, 10, 16,
  14, 14, 12, 14, 16, 12, 14, 60,
  30, 22, 28, 10, 10,
];

// ---- 10 ejemplos reales con datos del Bicom 2026-04 ----
// Cada fila cubre un caso distinto del sistema.
const EXAMPLES = [
  // 1. Unidad simple sin descuento — 7UP ZERO 2L (CCU)
  [
    'QU-EJ0001', '7801620855161', '7Up Zero 2L', 'CCU', 'Bebidas > Gaseosas',
    2, 'l', '',
    'unidad', 1, 1560,
    6, 1450,
    '', '',
    'Bebida gaseosa 7Up Zero, formato 2 litros. Sin azúcar.',
    '', '', '', 'FALSE', 'TRUE',
  ],
  // 2. Unidad con descuento por volumen + sabor — Cachantun Mas Granada
  [
    'QU-EJ0002', '7802910001049', 'Cachantun Mas Granada 1.6L', 'CCU', 'Bebidas > Aguas saborizadas',
    1.6, 'l', 'granada',
    'unidad', 1, 1390,
    3, 1290,
    '', '',
    'Agua saborizada Cachantun Mas, sabor granada, formato 1.6 litros.',
    '', 'sin-azucar', 'Aguas Cachantun', 'FALSE', 'TRUE',
  ],
  // 3. Display puro con descuento mayorista y caja — Galleta 303 24x14g
  [
    'QU-EJ0003', '7802408003446', 'Galleta 303 Bolsa', 'Fruna', 'Galletas > Dulces > Con relleno',
    14, 'g', '',
    'display', 24, 2300,
    3, 2100,
    14, 2100,
    'Galletas Fruna 303 con relleno. Bolsa con 24 unidades de 14g.',
    '', '', '', 'FALSE', 'TRUE',
  ],
  // 4. Display grande con descuento caja — Krapulito 50x13g
  [
    'QU-EJ0004', '7804688200010', 'Krapulito Bolsa Grande', 'Spak', 'Confitería > Caramelos',
    13, 'g', '',
    'display', 50, 7500,
    2, 6900,
    2, 6900,
    'Caramelos Krapulito Spak. Bolsa con 50 unidades de 13g.',
    '', '', '', 'FALSE', 'TRUE',
  ],
  // 5. Unidad con 2 niveles de descuento — Galleta Agua Costa
  [
    'QU-EJ0005', '7802215501838', 'Galleta de Agua Costa 175g', 'Costa', 'Galletas > Saladas',
    175, 'g', '',
    'unidad', 1, 1050,
    3, 950,
    25, 920,
    'Galletas saladas de agua marca Costa. Paquete de 175g.',
    '', '', '', 'FALSE', 'TRUE',
  ],
  // 6. Unidad con un solo nivel de descuento — Ambrosito 90g
  [
    'QU-EJ0006', '7802200134010', 'Ambrosito 90g', 'Ambrosoli', 'Confitería > Caramelos',
    90, 'g', '',
    'unidad', 1, 1000,
    3, 850,
    '', '',
    'Bolsa Ambrosito Ambrosoli, surtido de caramelos clásicos.',
    '', '', '', 'FALSE', 'TRUE',
  ],
  // 7. Helado con sabor + descuento por caja — Chomp Frambuesa
  [
    'QU-EJ0007', '10000186', 'Helado Chomp Frambuesa 225ml', 'Nestle', 'Heladería > Vasitos',
    225, 'ml', 'frambuesa',
    'unidad', 1, 4200,
    3, 3850,
    8, 3850,
    'Helado Chomp sabor frambuesa, presentación 225ml. Nestlé.',
    '', '', 'Heladería Nestle', 'TRUE', 'TRUE',
  ],
  // 8. Snack con caja como único descuento — Cabritas Caramelo Fruna
  [
    'QU-EJ0008', '10000002', 'Cabritas Caramelo Fruna 200g', 'Fruna', 'Snacks > Cabritas',
    200, 'g', 'caramelo',
    'unidad', 1, 1000,
    '', '',
    50, 900,
    'Cabritas con caramelo Fruna, bolsa de 200g. Snack dulce.',
    '', '', '', 'FALSE', 'TRUE',
  ],
  // 9. Producto temporal (Halloween) display — Bon Bon Bum Surtido
  [
    'QU-EJ0009', '7702011024053', 'Bon Bon Bum Surtido', 'Colombina', 'Halloween > Chupetes',
    19, 'g', '',
    'display', 24, 1950,
    3, 1800,
    15, 1800,
    'Chupetes Bon Bon Bum surtidos, display Halloween con 24 unidades de 19g.',
    '', 'halloween,temporada', '', 'TRUE', 'TRUE',
  ],
  // 10. Cantidad mínima (invención plausible — caramelos sueltos)
  [
    'QU-EJ0010', '', 'Caramelo Halls Mentol Suelto', 'Halls', 'Confitería > Pastillas',
    5, 'g', 'menta',
    'cantidad_minima', 5, 100,
    12, 80,
    '', '',
    'Caramelo Halls sabor menta vendido suelto. Pedido mínimo 5 unidades.',
    '', '', '', 'FALSE', 'TRUE',
  ],
];

// ---- Hoja Instrucciones (filas de texto plano) ----
const INSTRUCTIONS: any[][] = [
  ['PLANTILLA QUELITA — INSTRUCCIONES DE USO'],
  [''],
  ['Cada fila de la hoja "Productos" representa UN producto del catálogo de la tienda.'],
  ['Las columnas obligatorias son: nombre, marca, categoria, modo_venta, unidades_por_paquete, precio.'],
  ['El resto es opcional pero recomendado para enriquecer el storefront.'],
  [''],
  ['Mirá la hoja "Ejemplos" para ver 10 productos reales formateados correctamente.'],
  [''],
  ['---------------------------------------'],
  ['CAMPO',                  'DESCRIPCIÓN'],
  ['---------------------------------------'],
  ['sku',                    'Código interno Quelita (QU-XXXXXX). Si lo dejás vacío, el sistema lo auto-genera.'],
  ['codigo_barras',          'EAN/código del fabricante. Opcional. Puede duplicarse entre productos.'],
  ['nombre',                 'OBLIGATORIO. Nombre comercial visible al cliente. Ej: "Galleta Tritón Costa".'],
  ['marca',                  'OBLIGATORIO. Auto-crea la marca si no existe.'],
  ['categoria',              'OBLIGATORIO. Path con ">", hasta 3 niveles. Ej: "Galletas > Dulces > Con relleno".'],
  ['tamaño',                 'Peso o volumen de UNA unidad física (no del pack). Número. Ej: 14, 350, 2, 1.6.'],
  ['medida',                 'Unidad del tamaño. Valores válidos: g, kg, ml, l, cc, oz.'],
  ['sabor',                  'Solo cuando aplica (ej. limón, chocolate, frambuesa). Auto-crea el sabor.'],
  ['modo_venta',             'OBLIGATORIO. Valores: unidad | display | cantidad_minima | embalaje. Ver tabla abajo.'],
  ['unidades_por_paquete',   'OBLIGATORIO. Si modo_venta=unidad, 1. Si display, N (ej. 24). Si cantidad_minima, N (ej. 5).'],
  ['precio',                 'OBLIGATORIO. CLP. Precio de UNA presentación que el cliente agrega al carrito.'],
  ['mayorista_min',          'Cantidad mínima para precio mayorista. Vacío si no aplica.'],
  ['mayorista_precio',       'Precio por presentación al alcanzar mayorista_min.'],
  ['caja_min',               'Cantidad mínima para precio caja completa.'],
  ['caja_precio',            'Precio por presentación al alcanzar caja_min.'],
  ['descripcion',            'Texto comercial breve. Aparece en la página de detalle del producto.'],
  ['imagen_url',             'URL Cloudinary de la imagen principal. Opcional.'],
  ['etiquetas',              'Comma-separated. Ej: "promo,verano,sin-gluten".'],
  ['colecciones',            'Comma-separated. Ej: "Bebidas Fruna 500ml, Promo Navidad". Auto-crea colecciones.'],
  ['destacado',              'TRUE/FALSE. Si TRUE aparece en carrusel "Destacados" del home.'],
  ['activo',                 'TRUE/FALSE. Si FALSE no aparece en el storefront público.'],
  [''],
  ['---------------------------------------'],
  ['TABLA: CÓMO ELEGIR modo_venta'],
  ['---------------------------------------'],
  ['Tipo de producto',                       'modo_venta',         'unidades_por_paquete'],
  ['Bebida individual (botella, lata)',       'unidad',             '1'],
  ['Producto vendido solo en pack/bolsa',     'display',            'N (= unidades por bolsa)'],
  ['Producto con pedido mínimo (ej. 5+)',     'cantidad_minima',    'N (= cantidad mínima)'],
  ['Caja proveedor (rara vez retail)',        'embalaje',           'N (= unidades en caja)'],
  [''],
  ['Si querés ofrecer descuento por volumen (mayorista), llená mayorista_min + mayorista_precio.'],
  ['Si querés un segundo nivel (caja completa), llená caja_min + caja_precio.'],
  [''],
  ['---------------------------------------'],
  ['SOBRE COLECCIONES (familias de pricing)'],
  ['---------------------------------------'],
  ['Las colecciones agrupan productos para descuento por volumen mezclado.'],
  ['Ejemplo: "Bebidas Fruna 500ml" agrupa todos los sabores Fruna. Al comprar 12 unidades en total,'],
  ['(sumando todos los sabores) cada unidad pasa al precio mayorista de la colección.'],
  ['La regla de pricing de la colección se configura DESPUÉS en /admin/colecciones, no en este Excel.'],
  ['Acá solo asignás productos a colecciones por nombre.'],
];

// ---- Generación ----
function main(): void {
  const wb = XLSX.utils.book_new();

  // Hoja 1: Productos (solo header)
  const wsProductos = XLSX.utils.aoa_to_sheet([HEADER]);
  wsProductos['!cols'] = COL_WIDTHS.map((w) => ({ wch: w }));
  // Congelar primera fila
  wsProductos['!freeze'] = { xSplit: 0, ySplit: 1 };
  XLSX.utils.book_append_sheet(wb, wsProductos, 'Productos');

  // Hoja 2: Instrucciones
  const wsInstrucciones = XLSX.utils.aoa_to_sheet(INSTRUCTIONS);
  wsInstrucciones['!cols'] = [{ wch: 28 }, { wch: 80 }, { wch: 28 }];
  XLSX.utils.book_append_sheet(wb, wsInstrucciones, 'Instrucciones');

  // Hoja 3: Ejemplos
  const wsEjemplos = XLSX.utils.aoa_to_sheet([HEADER, ...EXAMPLES]);
  wsEjemplos['!cols'] = COL_WIDTHS.map((w) => ({ wch: w }));
  wsEjemplos['!freeze'] = { xSplit: 0, ySplit: 1 };
  XLSX.utils.book_append_sheet(wb, wsEjemplos, 'Ejemplos');

  if (!fs.existsSync(DST_DIR)) fs.mkdirSync(DST_DIR, { recursive: true });
  XLSX.writeFile(wb, DST_PATH);

  console.log(`✓ Plantilla generada: ${DST_PATH}`);
  console.log(`  Hoja 1 "Productos":      vacía, lista para llenar (${HEADER.length} columnas)`);
  console.log(`  Hoja 2 "Instrucciones":  ${INSTRUCTIONS.length} filas de doc`);
  console.log(`  Hoja 3 "Ejemplos":       ${EXAMPLES.length} productos reales del Bicom`);
}

main();

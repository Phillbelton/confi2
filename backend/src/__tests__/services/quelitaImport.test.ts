import * as XLSX from 'xlsx';
import { runQuelitaProductImport } from '../../services/quelitaProductImportService';
import Product from '../../models/Product';
import { Flavor } from '../../models/Flavor';

/**
 * Tests del importer Quelita-nativo con el esquema multi-presentación:
 *   - una fila por presentación agrupada por `sku` → `presentaciones[]`
 *   - `sabor` coma-separado → `flavors[]`
 *   - `tramoN_*` → tramos de la presentación
 *   - back-compat con el formato viejo (1 fila/producto, precio + mayorista/caja)
 */

function buildXlsx(rows: Record<string, unknown>[]): Buffer {
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Productos');
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
}

const ROWS: Record<string, unknown>[] = [
  // QU-T001 — multi-presentación (unidad principal + display + embalaje) y multi-sabor.
  {
    sku: 'QU-T001', nombre: 'Cabritas Test', marca: 'Fruna', categoria: 'Snacks > Cabritas',
    gramaje: 200, medida: 'g', sabor: 'caramelo,chocolate',
    descripcion: 'Cabritas de prueba para el importer.', destacado: 'FALSE', activo: 'TRUE',
    presentacion_tipo: 'unidad', presentacion_factor: 1, presentacion_precio: 1000,
    presentacion_principal: 'TRUE', presentacion_barcode: '7800000000011',
    tramo1_desde: 12, tramo1_precio: 900, tramo2_desde: 48, tramo2_precio: 850,
  },
  {
    sku: 'QU-T001', presentacion_tipo: 'display', presentacion_factor: 12, presentacion_precio: 10800,
    presentacion_principal: 'FALSE', presentacion_etiqueta: 'Display',
    tramo1_desde: 5, tramo1_precio: 10200,
  },
  {
    sku: 'QU-T001', presentacion_tipo: 'embalaje', presentacion_factor: 48, presentacion_precio: 40800,
    presentacion_principal: 'FALSE', tramo1_desde: 3, tramo1_precio: 38400,
  },
  // QU-T002 — simple: 1 presentación.
  {
    sku: 'QU-T002', nombre: 'Bebida Test 2L', marca: 'CCU', categoria: 'Bebidas > Gaseosas',
    gramaje: 2, medida: 'l', descripcion: 'Bebida de prueba 2 litros.', destacado: 'FALSE', activo: 'TRUE',
    presentacion_tipo: 'unidad', presentacion_factor: 1, presentacion_precio: 1560,
    presentacion_principal: 'TRUE', tramo1_desde: 6, tramo1_precio: 1450,
  },
  // QU-T003 — formato VIEJO (modo_venta/precio/mayorista/caja, tamaño).
  {
    sku: 'QU-T003', nombre: 'Galleta Legacy', marca: 'Costa', categoria: 'Galletas > Dulces',
    tamaño: 120, medida: 'g', sabor: 'vainilla', descripcion: 'Galleta formato viejo de prueba.',
    modo_venta: 'display', unidades_por_paquete: 6, precio: 3000,
    mayorista_min: 2, mayorista_precio: 2700, caja_min: 10, caja_precio: 2500,
    destacado: 'FALSE', activo: 'TRUE',
  },
];

describe('runQuelitaProductImport — esquema multi-presentación', () => {
  it('agrupa por sku en presentaciones[], mapea tramos y sabores, y soporta el formato viejo', async () => {
    const report = await runQuelitaProductImport(buildXlsx(ROWS), {});

    expect(report.errors).toEqual([]);
    expect(report.productsCreated).toBe(3);
    expect(report.flavorsCreated).toBe(3); // caramelo, chocolate, vainilla

    // --- QU-T001: 3 presentaciones, principal = unidad, tramos por presentación ---
    const cabrita = await Product.findOne({ sku: 'QU-T001' });
    expect(cabrita).toBeTruthy();
    expect(cabrita!.presentaciones).toHaveLength(3);
    expect(cabrita!.presentaciones.map((p) => p.type)).toEqual(['unidad', 'display', 'embalaje']);

    const principal = cabrita!.presentaciones.find((p) => p.principal);
    expect(principal?.type).toBe('unidad');
    // Exactamente una principal.
    expect(cabrita!.presentaciones.filter((p) => p.principal)).toHaveLength(1);

    // Campos legacy denormalizados desde la principal.
    expect(cabrita!.unitPrice).toBe(1000);
    expect(cabrita!.saleUnit.type).toBe('unidad');

    // Tramos de la unidad (12+→900, 48+→850), ordenados asc.
    const unidad = cabrita!.presentaciones.find((p) => p.type === 'unidad')!;
    expect(unidad.tiers.map((t) => [t.minQuantity, t.pricePerUnit])).toEqual([[12, 900], [48, 850]]);
    const display = cabrita!.presentaciones.find((p) => p.type === 'display')!;
    expect(display.quantity).toBe(12);
    expect(display.unitPrice).toBe(10800);
    expect(display.tiers.map((t) => [t.minQuantity, t.pricePerUnit])).toEqual([[5, 10200]]);

    // Multi-sabor: flavors[] (2) + flavor denormalizado = flavors[0] = caramelo.
    expect(cabrita!.flavors).toHaveLength(2);
    expect(String(cabrita!.flavor)).toBe(String(cabrita!.flavors[0]));
    const primary = await Flavor.findById(cabrita!.flavor);
    expect(primary?.name).toBe('caramelo');

    // --- QU-T002: simple, 1 presentación ---
    const bebida = await Product.findOne({ sku: 'QU-T002' });
    expect(bebida!.presentaciones).toHaveLength(1);
    expect(bebida!.presentaciones[0].type).toBe('unidad');
    expect(bebida!.presentaciones[0].tiers.map((t) => [t.minQuantity, t.pricePerUnit])).toEqual([[6, 1450]]);

    // --- QU-T003: formato viejo → 1 presentación display con 2 tramos ---
    const legacy = await Product.findOne({ sku: 'QU-T003' });
    expect(legacy!.presentaciones).toHaveLength(1);
    const lpres = legacy!.presentaciones[0];
    expect(lpres.type).toBe('display');
    expect(lpres.quantity).toBe(6);
    expect(lpres.unitPrice).toBe(3000);
    expect(lpres.tiers.map((t) => [t.minQuantity, t.pricePerUnit])).toEqual([[2, 2700], [10, 2500]]);
    expect(legacy!.flavors).toHaveLength(1);
  });

  it('re-importar el mismo sku actualiza (idempotente, no duplica)', async () => {
    await runQuelitaProductImport(buildXlsx(ROWS), {});
    const report2 = await runQuelitaProductImport(buildXlsx(ROWS), {});
    expect(report2.productsCreated).toBe(0);
    expect(report2.productsUpdated).toBe(3);
    expect(await Product.countDocuments({})).toBe(3);
  });
});

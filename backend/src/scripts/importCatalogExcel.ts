/**
 * Importa un catálogo desde un .xlsx (formato Quelita-nativo) vía CLI — sin el
 * timeout HTTP del admin. Ideal para cargas grandes (1000+ productos).
 *
 * Reusa el mismo servicio que el endpoint /import-quelita-excel.
 *
 * Uso:
 *   npm run import:catalog -- <ruta.xlsx> [--limit=N] [--mode=replace|upsert|insertNew]
 * Modos (default insertNew):
 *   insertNew → solo inserta los productos que NO existen (saltea los demás)
 *   upsert    → actualiza los existentes + crea nuevos
 *   replace   → BORRA todo y recrea (alias: --wipe)
 * Ejemplos:
 *   npm run import:catalog -- C:/Users/sk/Downloads/quelita_template_poblado.xlsx --mode=replace
 *   npm run import:catalog -- ./cat.xlsx --limit=20
 *   npm run import:catalog -- ./cat.xlsx --wipe        (= --mode=replace; BORRA todo — peligroso)
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import * as fs from 'fs';
import { runQuelitaProductImport, QuelitaImportMode } from '../services/quelitaProductImportService';

dotenv.config();

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const file = args.find((a) => !a.startsWith('--'));
  if (!file) {
    throw new Error('Falta la ruta del .xlsx. Uso: npm run import:catalog -- <archivo> [--limit=N] [--mode=replace|upsert|insertNew]');
  }
  if (!fs.existsSync(file)) throw new Error(`No existe el archivo: ${file}`);

  const limitArg = args.find((a) => a.startsWith('--limit='));
  const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) || 0 : 0;
  const modeArg = args.find((a) => a.startsWith('--mode='));
  const modeVal = modeArg ? modeArg.split('=')[1] : '';
  const mode: QuelitaImportMode = ['replace', 'upsert', 'insertNew'].includes(modeVal)
    ? (modeVal as QuelitaImportMode)
    : args.includes('--wipe')
    ? 'replace'
    : 'insertNew';

  const uri = process.env.MONGODB_URI || '';
  if (!uri) throw new Error('MONGODB_URI no está configurada');

  const buffer = fs.readFileSync(file);
  await mongoose.connect(uri);
  console.log(`✅ Conectado. Importando "${file}" (limit=${limit || 'todos'}, modo=${mode})...\n`);

  const report = await runQuelitaProductImport(buffer, { mode, limit });

  console.log('--- Reporte ---');
  console.log(`  Productos creados:      ${report.productsCreated}`);
  console.log(`  Productos actualizados: ${report.productsUpdated}`);
  console.log(`  Productos salteados:    ${report.productsSkipped}`);
  console.log(`  Categorías creadas:     ${report.categoriesCreated}`);
  console.log(`  Marcas creadas:         ${report.brandsCreated}`);
  console.log(`  Sabores creados:        ${report.flavorsCreated}`);
  console.log(`  Formatos creados:       ${report.formatsCreated}`);
  console.log(`  Colecciones creadas:    ${report.collectionsCreated}`);
  console.log(`  Errores:                ${report.errors.length}`);
  if (report.errors.length) {
    console.log('  Primeros errores:');
    report.errors.slice(0, 15).forEach((e) => console.log(`    fila ${e.row}: ${e.message}`));
  }
  console.log(`  Tiempo: ${(report.durationMs / 1000).toFixed(1)}s`);

  await mongoose.disconnect();
}

main().catch((e: unknown) => {
  console.error('✗', e instanceof Error ? e.message : e);
  process.exit(1);
});

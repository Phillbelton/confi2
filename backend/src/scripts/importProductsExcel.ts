import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { runProductImport } from '../services/productImportService';

dotenv.config();

/**
 * CLI wrapper para runProductImport.
 *
 * Usos:
 *   npm run import:products -- --wipe-taxonomy
 *     → 500 productos por default, wipe inicial.
 *   npm run import:products -- --limit=0 --wipe-taxonomy
 *     → todos los productos (~1431).
 *   npm run import:products -- --file="/ruta/al/excel.xlsx" --limit=100
 *     → 100 productos sin wipe.
 */

interface CliArgs {
  file?: string;
  limit?: number;
  wipeTaxonomy?: boolean;
}

function parseArgs(): CliArgs {
  const args: CliArgs = {};
  for (const arg of process.argv.slice(2)) {
    if (arg === '--wipe-taxonomy') {
      args.wipeTaxonomy = true;
    } else if (arg.startsWith('--file=')) {
      args.file = arg.slice('--file='.length);
    } else if (arg.startsWith('--limit=')) {
      args.limit = parseInt(arg.slice('--limit='.length), 10);
    }
  }
  return args;
}

async function main() {
  const args = parseArgs();

  // Path por defecto: ~/Downloads/BASE DATOS_2026_04_ABRIL.xlsx
  const filePath =
    args.file ||
    path.join(os.homedir(), 'Downloads', 'BASE DATOS_2026_04_ABRIL.xlsx');

  if (!fs.existsSync(filePath)) {
    console.error(`❌ Archivo no encontrado: ${filePath}`);
    console.error('   Pasá --file=/ruta/al/excel.xlsx');
    process.exit(1);
  }

  const limit = args.limit !== undefined ? args.limit : 500;

  console.log('🚀 Importer de productos Quelita');
  console.log(`   Archivo: ${filePath}`);
  if (args.wipeTaxonomy) {
    console.log('   Wipe: Collection + Product + Brand + Category + Format + Flavor + Tag');
  } else {
    console.log('   Wipe: no (incremental — upsert por barcode)');
  }
  console.log(`   Limit: ${limit === 0 ? 'todos' : limit}`);
  console.log();

  const uri = process.env.MONGODB_URI || '';
  if (!uri) {
    console.error('❌ MONGODB_URI no configurada en .env');
    process.exit(1);
  }
  await mongoose.connect(uri);
  console.log('✅ Conectado a MongoDB\n');

  const buffer = fs.readFileSync(filePath);

  try {
    const report = await runProductImport(buffer, {
      wipeTaxonomy: args.wipeTaxonomy,
      limit,
    });

    console.log('\n📊 Reporte');
    console.log(`   Categorías creadas: ${report.categoriesCreated}`);
    console.log(`   Marcas creadas:     ${report.brandsCreated}`);
    console.log(`   Productos creados:  ${report.productsCreated}`);
    console.log(`   Productos actualizados: ${report.productsUpdated}`);
    console.log(`   Errores:            ${report.errors.length}`);
    console.log(`   Duración: ${(report.durationMs / 1000).toFixed(1)}s`);

    if (report.errors.length > 0) {
      console.log('\n⚠️  Primeros 10 errores:');
      for (const e of report.errors.slice(0, 10)) {
        console.log(`   row ${e.row} (${e.barcode || '—'}): ${e.message}`);
      }
      if (report.errors.length > 10) {
        console.log(`   …y ${report.errors.length - 10} más`);
      }
    }
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((err) => {
  console.error('❌ Error fatal:', err);
  process.exit(1);
});

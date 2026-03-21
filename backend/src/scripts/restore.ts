import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';
import { ENV } from '../config/env';
import logger from '../config/logger';

const execAsync = promisify(exec);

/**
 * Script de Restore de MongoDB
 *
 * Restaura backups de la base de datos usando mongorestore
 */

class RestoreManager {
  private backupDir: string;
  private dbName: string;
  private mongoUri: string;

  constructor() {
    this.backupDir = path.join(process.cwd(), 'backups');
    this.dbName = ENV.DB_NAME;
    this.mongoUri = ENV.MONGODB_URI;
  }

  /**
   * Listar backups disponibles
   */
  async listAvailableBackups(): Promise<string[]> {
    try {
      const files = await fs.readdir(this.backupDir);
      const backupFiles = files
        .filter(f => f.startsWith('backup-'))
        .sort()
        .reverse(); // Más recientes primero

      return backupFiles;
    } catch (error: any) {
      logger.error('Error listando backups', { error: error.message });
      return [];
    }
  }

  /**
   * Obtener el backup más reciente
   */
  async getLatestBackup(): Promise<string | null> {
    const backups = await this.listAvailableBackups();
    return backups.length > 0 ? backups[0] : null;
  }

  /**
   * Restaurar desde un backup específico
   */
  async restoreBackup(backupName: string, options: { drop?: boolean } = {}): Promise<void> {
    try {
      const backupPath = path.join(this.backupDir, backupName);

      // Verificar si el backup existe
      try {
        await fs.access(backupPath);
      } catch {
        throw new Error(`Backup no encontrado: ${backupName}`);
      }

      logger.info('Iniciando restore de MongoDB', {
        backup: backupName,
        database: this.dbName,
        drop: options.drop || false,
      });

      // Determinar si es archivo o directorio
      const stats = await fs.stat(backupPath);
      const isArchive = !stats.isDirectory();

      // Construir comando mongorestore
      let command: string;

      if (isArchive) {
        // Restaurar desde archivo
        command = `mongorestore --uri="${this.mongoUri}" --archive="${backupPath}" ${backupPath.endsWith('.gz') ? '--gzip' : ''} ${options.drop ? '--drop' : ''}`;
      } else {
        // Restaurar desde directorio
        command = `mongorestore --uri="${this.mongoUri}" --db=${this.dbName} "${path.join(backupPath, this.dbName)}" ${options.drop ? '--drop' : ''}`;
      }

      // Confirmar antes de proceder si se van a eliminar datos
      if (options.drop) {
        logger.warn('⚠️  ADVERTENCIA: Se eliminarán todos los datos existentes antes de restaurar');
      }

      // Ejecutar mongorestore
      const startTime = Date.now();
      const { stdout, stderr } = await execAsync(command);

      const duration = Date.now() - startTime;

      if (stderr && !stderr.includes('done')) {
        logger.warn('Advertencias durante restore', { stderr });
      }

      logger.info('Restore completado exitosamente', {
        backup: backupName,
        duration: `${duration}ms`,
      });

      // Log del stdout para ver detalles
      if (stdout) {
        logger.debug('Detalles del restore', { stdout });
      }
    } catch (error: any) {
      logger.error('Error restaurando backup', {
        backup: backupName,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Restaurar el backup más reciente
   */
  async restoreLatest(options: { drop?: boolean } = {}): Promise<void> {
    const latestBackup = await this.getLatestBackup();

    if (!latestBackup) {
      throw new Error('No hay backups disponibles para restaurar');
    }

    logger.info('Restaurando el backup más reciente', { backup: latestBackup });
    await this.restoreBackup(latestBackup, options);
  }

  /**
   * Crear backup antes de restaurar (por seguridad)
   */
  async createSafetyBackup(): Promise<string> {
    logger.info('Creando backup de seguridad antes de restaurar');

    const { BackupManager } = await import('./backup');
    const backupManager = new BackupManager();

    return await backupManager.createBackup({
      compress: true,
      archive: true,
    });
  }
}

/**
 * Ejecutar restore interactivo
 */
async function runRestore() {
  const manager = new RestoreManager();

  try {
    logger.info('═══════════════════════════════════════════════════════════');
    logger.info('Iniciando proceso de restore de MongoDB');
    logger.info('═══════════════════════════════════════════════════════════');

    // Listar backups disponibles
    const backups = await manager.listAvailableBackups();

    if (backups.length === 0) {
      logger.error('No hay backups disponibles para restaurar');
      process.exit(1);
    }

    logger.info('Backups disponibles:', { count: backups.length });
    backups.forEach((backup, index) => {
      logger.info(`  ${index + 1}. ${backup}`);
    });

    // Obtener nombre del backup desde argumentos o usar el más reciente
    const backupName = process.argv[2] || backups[0];

    if (!backups.includes(backupName)) {
      logger.error('Backup no encontrado', { backup: backupName });
      logger.info('Usa: npm run restore <nombre-del-backup>');
      process.exit(1);
    }

    logger.info('Backup seleccionado', { backup: backupName });

    // Crear backup de seguridad antes de restaurar
    logger.warn('⚠️  Creando backup de seguridad antes de restaurar...');
    const safetyBackup = await manager.createSafetyBackup();
    logger.info('Backup de seguridad creado', { backup: safetyBackup });

    // Restaurar
    const drop = process.argv.includes('--drop') || process.argv.includes('-d');

    if (drop) {
      logger.warn('⚠️  Se eliminarán todos los datos existentes antes de restaurar');
    }

    await manager.restoreBackup(backupName, { drop });

    logger.info('═══════════════════════════════════════════════════════════');
    logger.info('Proceso de restore completado exitosamente');
    logger.info('═══════════════════════════════════════════════════════════');

    process.exit(0);
  } catch (error: any) {
    logger.error('Error fatal en proceso de restore', {
      error: error.message,
      stack: error.stack,
    });
    process.exit(1);
  }
}

// Si se ejecuta directamente (no importado)
if (require.main === module) {
  runRestore();
}

export { RestoreManager, runRestore };

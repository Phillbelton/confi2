import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';
import { ENV } from '../config/env';
import logger from '../config/logger';

const execAsync = promisify(exec);

/**
 * Script de Backup de MongoDB
 *
 * Crea backups diarios de la base de datos usando mongodump
 * Mantiene un sistema de rotación de backups (7 diarios, 4 semanales, 3 mensuales)
 */

interface BackupOptions {
  outputDir?: string;
  compress?: boolean;
  archive?: boolean;
}

class BackupManager {
  private backupDir: string;
  private dbName: string;
  private mongoUri: string;

  constructor() {
    this.backupDir = path.join(process.cwd(), 'backups');
    this.dbName = ENV.DB_NAME;
    this.mongoUri = ENV.MONGODB_URI;
  }

  /**
   * Crear directorio de backups si no existe
   */
  private async ensureBackupDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.backupDir, { recursive: true });
      logger.info('Directorio de backups verificado', { path: this.backupDir });
    } catch (error: any) {
      logger.error('Error creando directorio de backups', { error: error.message });
      throw error;
    }
  }

  /**
   * Generar nombre de backup con timestamp
   */
  private generateBackupName(): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    return `backup-${this.dbName}-${timestamp}`;
  }

  /**
   * Ejecutar mongodump
   */
  async createBackup(options: BackupOptions = {}): Promise<string> {
    try {
      await this.ensureBackupDirectory();

      const backupName = this.generateBackupName();
      const backupPath = path.join(this.backupDir, backupName);

      logger.info('Iniciando backup de MongoDB', {
        database: this.dbName,
        backupPath,
      });

      // Construir comando mongodump
      const compress = options.compress !== false; // Comprimir por defecto
      const archive = options.archive !== false; // Archivar por defecto

      let command: string;

      if (archive) {
        // Crear archivo único comprimido
        command = `mongodump --uri="${this.mongoUri}" --db=${this.dbName} --archive="${backupPath}.archive" ${compress ? '--gzip' : ''}`;
      } else {
        // Crear backup en directorio
        command = `mongodump --uri="${this.mongoUri}" --db=${this.dbName} --out="${backupPath}" ${compress ? '--gzip' : ''}`;
      }

      // Ejecutar mongodump
      const startTime = Date.now();
      const { stdout, stderr } = await execAsync(command);

      const duration = Date.now() - startTime;

      if (stderr && !stderr.includes('done dumping')) {
        logger.warn('Advertencias durante backup', { stderr });
      }

      logger.info('Backup completado exitosamente', {
        backupName,
        duration: `${duration}ms`,
        path: backupPath,
      });

      // Obtener tamaño del backup
      await this.logBackupSize(archive ? `${backupPath}.archive` : backupPath);

      return archive ? `${backupPath}.archive` : backupPath;
    } catch (error: any) {
      logger.error('Error creando backup', {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Registrar tamaño del backup
   */
  private async logBackupSize(backupPath: string): Promise<void> {
    try {
      const stats = await fs.stat(backupPath);
      const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
      logger.info('Tamaño del backup', { size: `${sizeInMB} MB`, path: backupPath });
    } catch (error: any) {
      logger.warn('No se pudo obtener tamaño del backup', { error: error.message });
    }
  }

  /**
   * Limpiar backups antiguos según política de retención
   * - Diarios: últimos 7 días
   * - Semanales: últimas 4 semanas (los domingos)
   * - Mensuales: últimos 3 meses (el día 1)
   */
  async cleanOldBackups(): Promise<void> {
    try {
      logger.info('Iniciando limpieza de backups antiguos');

      const files = await fs.readdir(this.backupDir);
      const backupFiles = files.filter(f => f.startsWith('backup-'));

      if (backupFiles.length === 0) {
        logger.info('No hay backups para limpiar');
        return;
      }

      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const fourWeeksAgo = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);
      const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

      let deletedCount = 0;

      for (const file of backupFiles) {
        const filePath = path.join(this.backupDir, file);
        const stats = await fs.stat(filePath);
        const fileDate = stats.mtime;

        let shouldDelete = false;

        // Determinar si debe eliminarse
        if (fileDate < threeMonthsAgo) {
          // Eliminar si es más viejo que 3 meses
          shouldDelete = true;
        } else if (fileDate < fourWeeksAgo) {
          // Mantener solo los del día 1 de cada mes
          if (fileDate.getDate() !== 1) {
            shouldDelete = true;
          }
        } else if (fileDate < sevenDaysAgo) {
          // Mantener solo los domingos (día 0)
          if (fileDate.getDay() !== 0) {
            shouldDelete = true;
          }
        }

        if (shouldDelete) {
          try {
            // Si es directorio, eliminarlo recursivamente
            const isDirectory = (await fs.stat(filePath)).isDirectory();
            if (isDirectory) {
              await fs.rm(filePath, { recursive: true, force: true });
            } else {
              await fs.unlink(filePath);
            }
            deletedCount++;
            logger.info('Backup antiguo eliminado', { file, date: fileDate.toISOString() });
          } catch (error: any) {
            logger.warn('Error eliminando backup', { file, error: error.message });
          }
        }
      }

      logger.info('Limpieza de backups completada', {
        totalBackups: backupFiles.length,
        deleted: deletedCount,
        remaining: backupFiles.length - deletedCount,
      });
    } catch (error: any) {
      logger.error('Error limpiando backups antiguos', {
        error: error.message,
        stack: error.stack,
      });
    }
  }

  /**
   * Listar todos los backups disponibles
   */
  async listBackups(): Promise<Array<{ name: string; date: Date; size: string }>> {
    try {
      const files = await fs.readdir(this.backupDir);
      const backupFiles = files.filter(f => f.startsWith('backup-'));

      const backups = await Promise.all(
        backupFiles.map(async (file) => {
          const filePath = path.join(this.backupDir, file);
          const stats = await fs.stat(filePath);
          const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);

          return {
            name: file,
            date: stats.mtime,
            size: `${sizeInMB} MB`,
          };
        })
      );

      // Ordenar por fecha descendente
      backups.sort((a, b) => b.date.getTime() - a.date.getTime());

      return backups;
    } catch (error: any) {
      logger.error('Error listando backups', { error: error.message });
      return [];
    }
  }
}

/**
 * Ejecutar backup manual
 */
async function runBackup() {
  const manager = new BackupManager();

  try {
    logger.info('═══════════════════════════════════════════════════════════');
    logger.info('Iniciando proceso de backup de MongoDB');
    logger.info('═══════════════════════════════════════════════════════════');

    // Crear backup
    const backupPath = await manager.createBackup({
      compress: true,
      archive: true,
    });

    // Limpiar backups antiguos
    await manager.cleanOldBackups();

    // Listar backups disponibles
    const backups = await manager.listBackups();
    logger.info('Backups disponibles', { count: backups.length });
    backups.forEach((backup) => {
      logger.info(`  - ${backup.name} (${backup.size}) - ${backup.date.toISOString()}`);
    });

    logger.info('═══════════════════════════════════════════════════════════');
    logger.info('Proceso de backup completado exitosamente');
    logger.info('═══════════════════════════════════════════════════════════');

    process.exit(0);
  } catch (error: any) {
    logger.error('Error fatal en proceso de backup', {
      error: error.message,
      stack: error.stack,
    });
    process.exit(1);
  }
}

// Si se ejecuta directamente (no importado)
if (require.main === module) {
  runBackup();
}

export { BackupManager, runBackup };

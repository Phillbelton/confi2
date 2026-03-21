import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import { ENV } from './env';

/**
 * Winston Logger Configuration
 *
 * Log Levels:
 * - error: Errores críticos que requieren atención inmediata
 * - warn: Advertencias, situaciones anormales pero no críticas
 * - info: Información general del flujo de la aplicación
 * - http: Logs de requests HTTP
 * - debug: Información detallada para debugging
 */

// Definir colores para cada nivel
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

winston.addColors(colors);

// Formato personalizado para consola (desarrollo)
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf((info) => {
    const { timestamp, level, message, ...meta } = info;

    let msg = `${timestamp} [${level}]: ${message}`;

    // Agregar metadata si existe
    if (Object.keys(meta).length > 0) {
      msg += `\n${JSON.stringify(meta, null, 2)}`;
    }

    return msg;
  })
);

// Formato para archivos (JSON)
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Configurar directorio de logs
const logsDir = path.join(process.cwd(), 'logs');

// Transport para errores (archivo separado)
const errorFileTransport = new DailyRotateFile({
  filename: path.join(logsDir, 'error-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  level: 'error',
  format: fileFormat,
  maxSize: '20m', // Rotar cuando el archivo alcance 20MB
  maxFiles: '30d', // Mantener logs de los últimos 30 días
  zippedArchive: true, // Comprimir archivos antiguos
});

// Transport para todos los logs
const combinedFileTransport = new DailyRotateFile({
  filename: path.join(logsDir, 'combined-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  format: fileFormat,
  maxSize: '20m',
  maxFiles: '14d', // Mantener logs de los últimos 14 días
  zippedArchive: true,
});

// Transport para HTTP requests
const httpFileTransport = new DailyRotateFile({
  filename: path.join(logsDir, 'http-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  level: 'http',
  format: fileFormat,
  maxSize: '20m',
  maxFiles: '7d', // Mantener logs HTTP de los últimos 7 días
  zippedArchive: true,
});

// Crear el logger
const logger = winston.createLogger({
  level: ENV.NODE_ENV === 'production' ? 'info' : 'debug',
  levels: winston.config.npm.levels,
  transports: [
    // Errores en archivo separado
    errorFileTransport,

    // Todos los logs en archivo combinado
    combinedFileTransport,

    // HTTP requests en archivo separado
    httpFileTransport,
  ],
  // Manejar excepciones no capturadas
  exceptionHandlers: [
    new DailyRotateFile({
      filename: path.join(logsDir, 'exceptions-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      format: fileFormat,
      maxSize: '20m',
      maxFiles: '30d',
      zippedArchive: true,
    }),
  ],
  // Manejar promesas rechazadas no capturadas
  rejectionHandlers: [
    new DailyRotateFile({
      filename: path.join(logsDir, 'rejections-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      format: fileFormat,
      maxSize: '20m',
      maxFiles: '30d',
      zippedArchive: true,
    }),
  ],
});

// En desarrollo, también loguear a consola
if (ENV.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: consoleFormat,
    })
  );
}

// Stream para Morgan (HTTP request logging)
export const morganStream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};

// Helper functions para facilitar el uso
export const logError = (message: string, meta?: any) => {
  logger.error(message, meta);
};

export const logWarn = (message: string, meta?: any) => {
  logger.warn(message, meta);
};

export const logInfo = (message: string, meta?: any) => {
  logger.info(message, meta);
};

export const logHttp = (message: string, meta?: any) => {
  logger.http(message, meta);
};

export const logDebug = (message: string, meta?: any) => {
  logger.debug(message, meta);
};

// Exportar el logger por defecto
export default logger;

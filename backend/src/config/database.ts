import mongoose from 'mongoose';
import dotenv from 'dotenv';
import logger from './logger';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || '';
const DB_NAME = process.env.DB_NAME || 'confiteria_quelita';

export const connectDatabase = async (): Promise<void> => {
  try {
    const connectionOptions = {
      dbName: DB_NAME,
      maxPoolSize: 10, // Para VPS, no serverless
      minPoolSize: 2,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      autoIndex: false, // No crear índices automáticamente, los sincronizamos manualmente
    };

    await mongoose.connect(MONGODB_URI, connectionOptions);

    logger.info(`MongoDB conectado exitosamente a: ${DB_NAME}`);

    // Sincronizar índices manualmente con manejo de errores
    try {
      await mongoose.connection.syncIndexes();
      logger.info('Índices de MongoDB sincronizados correctamente');
    } catch (indexError: any) {
      logger.warn(`Error sincronizando índices: ${indexError.message}. Los índices se validarán a nivel de aplicación.`);
    }

    // Event listeners para debugging
    mongoose.connection.on('error', (err) => {
      logger.error('Error de MongoDB', { error: err.message, stack: err.stack });
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB desconectado');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconectado');
    });

  } catch (error: any) {
    logger.error('Error al conectar a MongoDB', { error: error.message, stack: error.stack });
    process.exit(1);
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    logger.info('MongoDB desconectado');
  } catch (error: any) {
    logger.error('Error al desconectar MongoDB', { error: error.message });
  }
};

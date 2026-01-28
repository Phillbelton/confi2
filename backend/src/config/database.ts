import mongoose from 'mongoose';
import dotenv from 'dotenv';
import logger from './logger';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || '';
const DB_NAME = process.env.DB_NAME || 'confiteria_quelita';

export const connectDatabase = async (): Promise<void> => {
  try {
    // Capturar errores de creación de índices ANTES de conectar (evitar unhandled rejections)
    for (const modelName of mongoose.modelNames()) {
      mongoose.model(modelName).on('index', (err) => {
        if (err) {
          logger.error(`Error al crear índices para ${modelName}`, { error: err.message });
        }
      });
    }

    const connectionOptions = {
      dbName: DB_NAME,
      maxPoolSize: 10, // Para VPS, no serverless
      minPoolSize: 2,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    };

    await mongoose.connect(MONGODB_URI, connectionOptions);

    logger.info(`MongoDB conectado exitosamente a: ${DB_NAME}`);

    // Limpiar índice único de phone si existe (legacy)
    try {
      const db = mongoose.connection.db;
      if (db) {
        const usersCollection = db.collection('users');
        const indexes = await usersCollection.indexes();
        const phoneIndex = indexes.find((idx: any) => idx.key?.phone && idx.unique);
        if (phoneIndex) {
          await usersCollection.dropIndex(phoneIndex.name!);
          logger.info('Índice único de phone eliminado (legacy)');
        }
      }
    } catch (cleanupError: any) {
      // No es crítico, ignorar
    }

    // Manejar errores de autoIndex en todos los modelos
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

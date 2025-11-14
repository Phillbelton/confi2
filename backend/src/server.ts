import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import { connectDatabase } from './config/database';
import { ENV, validateEnv } from './config/env';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { xssSanitize } from './middleware/xssSanitize';
import logger from './config/logger';
import { requestLogger } from './middleware/requestLogger';

// Crear app Express
const app = express();

// Validar variables de entorno
validateEnv();

// Conectar a base de datos (solo en desarrollo/producción, no en tests)
if (process.env.NODE_ENV !== 'test') {
  connectDatabase();
}

// Middlewares de seguridad
app.use(helmet());

// CORS - Allow multiple origins for development
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  ENV.FRONTEND_URL, // IP de red local (ej: http://192.168.5.2:3000)
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        logger.warn(`CORS blocked request from origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: ENV.RATE_LIMIT_WINDOW_MS,
  max: ENV.RATE_LIMIT_MAX_REQUESTS,
  message: 'Demasiadas peticiones desde esta IP, intenta de nuevo más tarde',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Sanitización de datos (IMPORTANTE: debe ir después de los parsers)
// 1. Sanitizar contra inyección NoSQL
app.use(
  mongoSanitize({
    replaceWith: '_', // Reemplazar caracteres prohibidos ($, .) con _
    onSanitize: ({ req, key }) => {
      logger.warn('Intento de inyección NoSQL detectado', {
        field: key,
        ip: req.ip,
        path: req.path,
        method: req.method,
      });
    },
  })
);

// 2. Sanitizar contra XSS (HTML/JavaScript malicioso)
app.use(xssSanitize);

// Request logger (debe ir después de parsers y sanitización)
app.use(requestLogger);

// Compresión
app.use(compression());

// Servir archivos estáticos (uploads)
app.use('/uploads', express.static(ENV.UPLOAD_DIR));

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    env: ENV.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// Routes
import apiRoutes from './routes';
app.use('/api', apiRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handler (debe ser el último middleware)
app.use(errorHandler);

// Iniciar servidor (solo en desarrollo/producción, no en tests)
const PORT = ENV.PORT;
const HOST = '0.0.0.0'; // Listen on all network interfaces

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, HOST, () => {
    logger.info('═══════════════════════════════════════════════════════════');
    logger.info(`🚀 Servidor corriendo en puerto ${PORT}`);
    logger.info(`📍 URL Local: http://localhost:${PORT}`);
    logger.info(`📡 URL Red: http://0.0.0.0:${PORT} (accesible desde red local)`);
    logger.info(`🌍 Entorno: ${ENV.NODE_ENV}`);
    logger.info(`🎯 Frontend URL: ${ENV.FRONTEND_URL}`);
    logger.info('═══════════════════════════════════════════════════════════');
  });
}

// Manejo de señales de terminación
process.on('SIGTERM', () => {
  logger.info('SIGTERM recibido. Cerrando servidor gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT recibido. Cerrando servidor gracefully...');
  process.exit(0);
});

// Manejo de errores no capturados
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', { reason, promise });
  process.exit(1);
});

export default app;

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import { connectDatabase } from './config/database';
import { ENV, validateEnv } from './config/env';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { xssSanitize } from './middleware/xssSanitize';
import logger from './config/logger';
import { requestLogger } from './middleware/requestLogger';
import { apiRateLimiter } from './middleware/rateLimiter';

// Crear app Express
const app = express();

// Validar variables de entorno
validateEnv();

// Conectar a base de datos (solo en desarrollo/producción, no en tests)
if (process.env.NODE_ENV !== 'test') {
  connectDatabase().catch((err) => {
    console.error('Error fatal al conectar a la base de datos:', err);
    process.exit(1);
  });
}

// Middlewares de seguridad
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allow images to load from different origins
  })
);

// CORS - Allow multiple origins
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  ENV.FRONTEND_URL,
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);

      // In production, be more flexible with CORS to handle Seenode dynamic URLs
      if (ENV.NODE_ENV === 'production') {
        // Allow any origin that includes seenode.com (Seenode platform)
        if (origin.includes('seenode.com') || allowedOrigins.indexOf(origin) !== -1) {
          return callback(null, true);
        }
      } else {
        // In development, use strict origin checking
        if (allowedOrigins.indexOf(origin) !== -1) {
          return callback(null, true);
        }
      }

      logger.warn(`CORS blocked request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Rate limiting - Diferenciado por rol (debe ir DESPUÉS de autenticación)
// NOTA: El rate limiter se aplica después de que las rutas identifiquen al usuario
// Por eso se mueve al final, justo antes de las rutas de API

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

// Servir archivos estáticos (uploads) con headers CORS explícitos
app.use('/uploads', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*'); // Allow all origins for static files
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(ENV.UPLOAD_DIR));

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    env: ENV.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// Rate limiting - Aplicar ANTES de las rutas
app.use('/api', apiRateLimiter);

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
  const server = app.listen(PORT, HOST, () => {
    logger.info('═══════════════════════════════════════════════════════════');
    logger.info(`🚀 Servidor corriendo en puerto ${PORT}`);
    logger.info(`📍 URL Local: http://localhost:${PORT}`);
    logger.info(`📡 URL Red: http://0.0.0.0:${PORT} (accesible desde red local)`);
    logger.info(`🌍 Entorno: ${ENV.NODE_ENV}`);
    logger.info(`🎯 Frontend URL: ${ENV.FRONTEND_URL}`);
    logger.info('═══════════════════════════════════════════════════════════');
  });

  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Puerto ${PORT} ya está en uso. Cierra la otra instancia o usa otro puerto.`);
    } else {
      console.error('Error al iniciar servidor:', err);
    }
    process.exit(1);
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
  console.error('=== UNCAUGHT EXCEPTION ===');
  console.error('Error:', error);
  logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('=== UNHANDLED REJECTION ===');
  console.error('Reason:', reason);
  console.error('Promise:', promise);
  logger.error('Unhandled Rejection', { reason, promise });
  process.exit(1);
});

export default app;

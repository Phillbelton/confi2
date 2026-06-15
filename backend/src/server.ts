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
import { startOrderExpirationScheduler } from './services/orderExpirationService';

// Crear app Express
const app = express();

// Detrás de Caddy (Docker) hay exactamente 1 proxy: sin esto, req.ip es la IP
// del contenedor proxy para TODOS los visitantes y el rate limiting por IP
// colapsa en un único bucket global (300 req/15min compartidos por todo el
// sitio). "1" confía solo en el primer salto de X-Forwarded-For.
app.set('trust proxy', 1);

// Validar variables de entorno
validateEnv();

// La conexión a DB y el arranque del servidor se secuencian en startServer() al final del archivo

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

// Sufijos de hostname permitidos en producción (plataformas de despliegue)
const ALLOWED_HOSTNAME_SUFFIXES = ['.seenode.com'];

const isOriginAllowed = (origin: string): boolean => {
  // Match exacto contra lista blanca
  if (allowedOrigins.indexOf(origin) !== -1) return true;

  // En producción, permitir subdominios de plataformas confiables.
  // Validar por hostname para evitar bypass tipo "https://seenode.com.evil.com".
  if (ENV.NODE_ENV === 'production') {
    try {
      const { hostname } = new URL(origin);
      return ALLOWED_HOSTNAME_SUFFIXES.some(
        (suffix) => hostname === suffix.slice(1) || hostname.endsWith(suffix)
      );
    } catch {
      return false;
    }
  }

  return false;
};

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);

      if (isOriginAllowed(origin)) {
        return callback(null, true);
      }

      logger.warn(`CORS blocked request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

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

// Iniciar servidor
const PORT = ENV.PORT;
const HOST = '0.0.0.0';

async function startServer() {
  // 1. Conectar a MongoDB primero
  if (process.env.NODE_ENV !== 'test') {
    await connectDatabase();
  }

  // 2. Luego levantar el servidor HTTP
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

    // 3. Iniciar schedulers
    startOrderExpirationScheduler();
  }
}

startServer().catch((err) => {
  logger.error('Error al iniciar el servidor', { error: err.message });
  process.exit(1);
});

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

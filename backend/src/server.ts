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

// Sufijos de hostname permitidos en producción: plataformas de despliegue
// y el túnel de demo de Cloudflare (URL efímera *.trycloudflare.com).
// Se valida por hostname para evitar bypass tipo "https://seenode.com.evil.com".
const ALLOWED_HOSTNAME_SUFFIXES = ['.seenode.com', '.trycloudflare.com'];

// IPs privadas RFC 1918 (deploy en LAN detrás de Caddy con IP DHCP).
// Permitirlas evita reconfigurar FRONTEND_URL cada vez que cambia la IP de la VM.
const isPrivateLanHost = (hostname: string): boolean => {
  const m = hostname.match(/^(\d{1,3})\.(\d{1,3})\.\d{1,3}\.\d{1,3}$/);
  if (!m) return false;
  const a = Number(m[1]);
  const b = Number(m[2]);
  if (a === 10) return true; // 10.0.0.0/8
  if (a === 192 && b === 168) return true; // 192.168.0.0/16
  if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
  return false;
};

const isOriginAllowed = (origin: string): boolean => {
  // Match exacto contra lista blanca
  if (allowedOrigins.indexOf(origin) !== -1) return true;

  let hostname: string;
  try {
    ({ hostname } = new URL(origin));
  } catch {
    return false;
  }

  // LAN privada: permite entrar por la IP de la VM sin tocar config al cambiar el DHCP.
  if (isPrivateLanHost(hostname)) return true;

  // En producción, permitir subdominios de plataformas/túneles confiables.
  if (ENV.NODE_ENV === 'production') {
    return ALLOWED_HOSTNAME_SUFFIXES.some(
      (suffix) => hostname === suffix.slice(1) || hostname.endsWith(suffix)
    );
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

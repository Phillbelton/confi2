import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as authController from '../controllers/authController';
import * as passwordController from '../controllers/passwordController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} from '../schemas/authSchemas';

const router = Router();

/**
 * Auth Routes
 *
 * Endpoints de autenticación y gestión de perfil de usuario
 */

// Rate limiters específicos para auth (protección contra ataques de fuerza bruta)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // Máximo 5 intentos
  message: {
    success: false,
    error: 'Demasiados intentos de login. Por favor, intenta de nuevo en 15 minutos.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Identificar por IP + email para evitar lockout global de IP
  keyGenerator: (req) => {
    const email = req.body?.email || 'unknown';
    return `${req.ip}-${email}`;
  },
  // Registrar intentos bloqueados
  handler: (req, res) => {
    console.warn(`⚠️  Rate limit excedido en /login`);
    console.warn(`   IP: ${req.ip}, Email: ${req.body?.email || 'N/A'}`);
    res.status(429).json({
      success: false,
      error: 'Demasiados intentos de login. Por favor, intenta de nuevo en 15 minutos.',
    });
  },
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3, // Máximo 3 registros por hora desde la misma IP
  message: {
    success: false,
    error: 'Demasiados intentos de registro. Por favor, intenta de nuevo más tarde.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.warn(`⚠️  Rate limit excedido en /register`);
    console.warn(`   IP: ${req.ip}, Email: ${req.body?.email || 'N/A'}`);
    res.status(429).json({
      success: false,
      error: 'Demasiados intentos de registro. Por favor, intenta de nuevo en 1 hora.',
    });
  },
});

const passwordChangeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 3, // Máximo 3 cambios de contraseña
  message: {
    success: false,
    error: 'Demasiados intentos de cambio de contraseña. Por favor, intenta de nuevo en 15 minutos.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3, // Máximo 3 solicitudes de reset
  message: {
    success: false,
    error: 'Demasiadas solicitudes de restablecimiento. Por favor, intenta de nuevo en 1 hora.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rutas públicas
router.post('/register', registerLimiter, validate(registerSchema), authController.register);
router.post('/login', loginLimiter, validate(loginSchema), authController.login);
router.post('/refresh', authController.refreshToken);
router.post('/forgot-password', passwordResetLimiter, validate(forgotPasswordSchema), passwordController.forgotPassword);
router.post('/reset-password/:token', validate(resetPasswordSchema), passwordController.resetPassword);

// Rutas protegidas (requieren autenticación)
router.use(authenticate);

router.post('/logout', authController.logout);
router.get('/me', authController.getMe);
router.put('/profile', validate(updateProfileSchema), authController.updateProfile);
router.put('/change-password', passwordChangeLimiter, validate(changePasswordSchema), passwordController.changePassword);

export default router;

import { Router } from 'express';
import * as auditController from '../controllers/auditController';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  getAuditLogsQuerySchema,
  getEntityHistorySchema,
  getUserActivitySchema,
  getRecentLogsQuerySchema,
  getAuditStatsQuerySchema,
} from '../schemas/auditSchemas';

const router = Router();

/**
 * Todas las rutas de auditoría requieren autenticación y rol de admin
 */
router.use(authenticate);
router.use(authorize('admin'));

/**
 * Rutas de auditoría
 */

// Obtener logs con filtros y paginación
router.get('/', validate(getAuditLogsQuerySchema), auditController.getAuditLogs);

// Obtener logs recientes (para dashboard)
router.get('/recent', validate(getRecentLogsQuerySchema), auditController.getRecentLogs);

// Obtener estadísticas de auditoría
router.get('/stats', validate(getAuditStatsQuerySchema), auditController.getAuditStats);

// Obtener historial de una entidad específica
router.get('/entity/:entityType/:entityId', validate(getEntityHistorySchema), auditController.getEntityHistory);

// Obtener actividad de un usuario específico
router.get('/user/:userId', validate(getUserActivitySchema), auditController.getUserActivity);

export default router;

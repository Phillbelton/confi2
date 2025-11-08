import { z } from 'zod';
import mongoose from 'mongoose';

/**
 * Schemas de validación para audit logs
 */

// Helper para validar ObjectId
const objectIdSchema = z
  .string()
  .refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: 'ID inválido',
  });

// Schema para obtener logs de auditoría
export const getAuditLogsQuerySchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).optional(),
    limit: z.string().regex(/^\d+$/).optional(),

    action: z
      .enum(['create', 'update', 'delete', 'login', 'logout', 'other'])
      .optional(),

    entityType: z
      .string()
      .max(50)
      .optional(),

    entityId: objectIdSchema.optional(),

    userId: objectIdSchema.optional(),

    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), // YYYY-MM-DD
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), // YYYY-MM-DD

    ip: z.string().max(45).optional(), // IPv6 max length
  }),
});

// Schema para obtener historial de una entidad
export const getEntityHistorySchema = z.object({
  params: z.object({
    entityType: z
      .string({
        required_error: 'El tipo de entidad es requerido',
      })
      .min(1, 'El tipo de entidad no puede estar vacío')
      .max(50),

    entityId: objectIdSchema,
  }),
  query: z.object({
    page: z.string().regex(/^\d+$/).optional(),
    limit: z.string().regex(/^\d+$/).optional(),
  }),
});

// Schema para obtener actividad de un usuario
export const getUserActivitySchema = z.object({
  params: z.object({
    userId: objectIdSchema,
  }),
  query: z.object({
    page: z.string().regex(/^\d+$/).optional(),
    limit: z.string().regex(/^\d+$/).optional(),
    action: z
      .enum(['create', 'update', 'delete', 'login', 'logout', 'other'])
      .optional(),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  }),
});

// Schema para obtener logs recientes
export const getRecentLogsQuerySchema = z.object({
  query: z.object({
    limit: z
      .string()
      .regex(/^\d+$/)
      .optional()
      .default('50')
      .refine((val) => parseInt(val) <= 100, {
        message: 'El límite no puede exceder 100',
      }),

    action: z
      .enum(['create', 'update', 'delete', 'login', 'logout', 'other'])
      .optional(),
  }),
});

// Schema para obtener estadísticas de auditoría
export const getAuditStatsQuerySchema = z.object({
  query: z.object({
    startDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)')
      .optional(),

    endDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)')
      .optional(),

    groupBy: z
      .enum(['action', 'entityType', 'user', 'day'])
      .optional()
      .default('action'),
  }),
});

// Tipos TypeScript inferidos
export type GetAuditLogsQueryInput = z.infer<typeof getAuditLogsQuerySchema>;
export type GetEntityHistoryInput = z.infer<typeof getEntityHistorySchema>;
export type GetUserActivityInput = z.infer<typeof getUserActivitySchema>;
export type GetRecentLogsQueryInput = z.infer<typeof getRecentLogsQuerySchema>;
export type GetAuditStatsQueryInput = z.infer<typeof getAuditStatsQuerySchema>;

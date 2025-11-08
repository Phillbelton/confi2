import { Response, NextFunction } from 'express';
import AuditLog, { AuditAction, AuditEntity } from '../models/AuditLog';
import { AuthRequest } from '../types';
import mongoose from 'mongoose';

/**
 * Middleware para registrar automáticamente acciones de auditoría
 *
 * Uso:
 * router.post('/categories', authenticate, authorize('admin'),
 *   auditLog('category', 'create'), categoryController.createCategory);
 */

interface AuditLogData {
  entity: AuditEntity;
  entityId: mongoose.Types.ObjectId;
  action: AuditAction;
  changes?: {
    before?: any;
    after?: any;
  };
}

// Middleware para registrar auditoría después de una operación exitosa
export const auditLog = (entity: AuditEntity, action: AuditAction) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    // Guardar el método send original
    const originalSend = res.send;

    // Override del método send para capturar la respuesta
    res.send = function (data: any): Response {
      // Restaurar el send original
      res.send = originalSend;

      // Intentar parsear la respuesta si es exitosa (status 200-299)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          const responseData = typeof data === 'string' ? JSON.parse(data) : data;

          // Si la respuesta incluye el documento creado/actualizado
          if (responseData.success && responseData.data) {
            const entityData = responseData.data;

            // Extraer el ID del documento (puede estar en diferentes ubicaciones)
            let entityId: mongoose.Types.ObjectId | undefined;

            if (entityData[entity]) {
              entityId = entityData[entity]._id;
            } else if (entityData._id) {
              entityId = entityData._id;
            } else if (entityData.id) {
              entityId = entityData.id;
            }

            // Si tenemos user ID y entity ID, registrar
            if (req.user?.id && entityId) {
              const auditData: AuditLogData = {
                entity,
                entityId,
                action,
                changes: {
                  after: entityData[entity] || entityData,
                },
              };

              // Registrar de forma asíncrona sin bloquear la respuesta
              setImmediate(async () => {
                try {
                  await AuditLog.log(
                    new mongoose.Types.ObjectId(req.user!.id),
                    auditData.action,
                    auditData.entity,
                    auditData.entityId,
                    auditData.changes || {},
                    {
                      ip: extractIP(req),
                      userAgent: req.headers['user-agent'] || 'Unknown',
                    }
                  );
                } catch (error) {
                  console.error('Error al registrar auditoría:', error);
                }
              });
            }
          }
        } catch (error) {
          // Si hay error al parsear, simplemente continuar
          console.error('Error al procesar auditoría:', error);
        }
      }

      // Enviar la respuesta original
      return originalSend.call(res, data);
    };

    next();
  };
};

/**
 * Función helper para registrar auditoría manualmente desde un controlador
 */
export const logAudit = async (
  userId: mongoose.Types.ObjectId | string,
  action: AuditAction,
  entity: AuditEntity,
  entityId: mongoose.Types.ObjectId | string,
  changes: { before?: any; after?: any },
  req: AuthRequest
): Promise<void> => {
  try {
    await AuditLog.log(
      typeof userId === 'string' ? new mongoose.Types.ObjectId(userId) : userId,
      action,
      entity,
      typeof entityId === 'string' ? new mongoose.Types.ObjectId(entityId) : entityId,
      changes,
      {
        ip: extractIP(req),
        userAgent: req.headers['user-agent'] || 'Unknown',
      }
    );
  } catch (error) {
    console.error('Error al registrar auditoría manual:', error);
    // No lanzar error para no interrumpir el flujo
  }
};

/**
 * Extraer IP real del request, considerando proxies y load balancers
 */
function extractIP(req: AuthRequest): string {
  // Intentar obtener la IP del header x-forwarded-for (común en proxies)
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const ips = typeof forwarded === 'string' ? forwarded.split(',') : forwarded;
    return ips[0].trim();
  }

  // Intentar obtener del header x-real-ip (usado por nginx)
  const realIp = req.headers['x-real-ip'];
  if (realIp && typeof realIp === 'string') {
    return realIp;
  }

  // Obtener de req.ip (Express)
  if (req.ip) {
    return req.ip;
  }

  // Fallback a connection.remoteAddress
  const remoteAddress = (req.connection as any)?.remoteAddress || (req.socket as any)?.remoteAddress;
  if (remoteAddress) {
    return remoteAddress;
  }

  return 'Unknown';
}

/**
 * Middleware para capturar el estado "antes" de una actualización o eliminación
 * Se debe usar ANTES del controlador
 */
export const captureBeforeState = (Model: any, paramName: string = 'id') => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const id = req.params[paramName];

      if (id && mongoose.Types.ObjectId.isValid(id)) {
        const document = await Model.findById(id).lean();
        if (document) {
          // Guardar el documento en el request para usarlo después
          (req as any).beforeState = document;
        }
      }
    } catch (error) {
      console.error('Error al capturar estado previo:', error);
    }

    next();
  };
};

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
    const originalJson = res.json;

    // Función helper para procesar el log
    const processAuditLog = async (data: any) => {
      // Solo procesar si es una respuesta exitosa
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          const responseData = typeof data === 'string' ? JSON.parse(data) : data;

          // Si no es una respuesta exitosa según el campo success, salir
          if (!responseData.success) return;

          // 1. INTENTAR OBTENER ENTITY ID DE req.params.id (para UPDATE/DELETE)
          let entityId: mongoose.Types.ObjectId | undefined;

          if (req.params.id && mongoose.Types.ObjectId.isValid(req.params.id)) {
            entityId = new mongoose.Types.ObjectId(req.params.id);
          }

          // 2. SI NO ESTÁ EN PARAMS, BUSCAR EN LA RESPUESTA (para CREATE)
          if (!entityId && responseData.data) {
            const entityData = responseData.data;

            // Mapeo de entidades a sus posibles nombres en la respuesta
            const entityFieldMap: Record<string, string[]> = {
              category: ['category', '_id', 'id'],
              brand: ['brand', '_id', 'id'],
              tag: ['tag', '_id', 'id'],
              product: ['productParent', 'product', '_id', 'id'],
              variant: ['variant', 'defaultVariant', '_id', 'id'],
              order: ['order', '_id', 'id'],
              user: ['user', '_id', 'id'],
            };

            const possibleFields = entityFieldMap[entity] || ['_id', 'id'];

            // Buscar en los campos posibles
            for (const field of possibleFields) {
              if (entityData[field]?._id) {
                entityId = entityData[field]._id;
                break;
              } else if (entityData[field] && mongoose.Types.ObjectId.isValid(entityData[field])) {
                entityId = new mongoose.Types.ObjectId(entityData[field]);
                break;
              }
            }

            // Último intento: si entityData mismo tiene _id
            if (!entityId && entityData._id) {
              entityId = entityData._id;
            }
          }

          // 3. SI TENEMOS USER Y ENTITY ID, REGISTRAR
          if (req.user?.id && entityId) {
            // Preparar changes
            const changes: any = {};

            // Para UPDATE/DELETE: usar beforeState si está disponible
            if ((action === 'update' || action === 'delete' || action === 'block') && (req as any).beforeState) {
              changes.before = (req as any).beforeState;
            }

            // Para CREATE/UPDATE: incluir after
            if (action === 'create' || action === 'update') {
              if (responseData.data) {
                // Buscar el documento completo en la respuesta
                const entityData = responseData.data;
                const entityFieldMap: Record<string, string> = {
                  category: 'category',
                  brand: 'brand',
                  tag: 'tag',
                  product: 'productParent',
                  variant: 'variant',
                  order: 'order',
                  user: 'user',
                };

                const fieldName = entityFieldMap[entity];
                changes.after = entityData[fieldName] || entityData;
              }
            }

            // Registrar de forma asíncrona sin bloquear la respuesta
            setImmediate(async () => {
              try {
                await AuditLog.log(
                  new mongoose.Types.ObjectId(req.user!.id),
                  action,
                  entity,
                  entityId!,
                  changes,
                  {
                    ip: extractIP(req),
                    userAgent: req.headers['user-agent'] || 'Unknown',
                  }
                );
                console.log(`✅ Audit log created: ${action} ${entity} ${entityId}`);
              } catch (error) {
                console.error('❌ Error al registrar auditoría:', error);
              }
            });
          } else {
            console.warn(`⚠️  Audit log skipped: ${action} ${entity} - Missing entityId or userId`);
          }
        } catch (error) {
          console.error('❌ Error al procesar auditoría:', error);
        }
      }
    };

    // Override del método send
    res.send = function (data: any): Response {
      res.send = originalSend;
      processAuditLog(data).catch(console.error);
      return originalSend.call(res, data);
    };

    // Override del método json (algunos controladores usan .json en lugar de .send)
    res.json = function (data: any): Response {
      res.json = originalJson;
      processAuditLog(data).catch(console.error);
      return originalJson.call(res, data);
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

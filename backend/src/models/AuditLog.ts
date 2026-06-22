import mongoose, { Document, Schema } from 'mongoose';

// Types
export type AuditAction = 'create' | 'update' | 'delete' | 'cancel' | 'block';
export type AuditEntity = 'product' | 'variant' | 'order' | 'user' | 'category' | 'brand' | 'tag' | 'collection' | 'banner' | 'homeLayout' | 'siteSettings';

// Interface
export interface IAuditLog extends Document {
  _id: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  action: AuditAction;
  entity: AuditEntity;
  entityId: mongoose.Types.ObjectId;
  changes: {
    before: any;
    after: any;
  };
  ipAddress: string;
  userAgent: string;
  createdAt: Date;
}

// Interface para métodos estáticos
export interface IAuditLogModel extends mongoose.Model<IAuditLog> {
  log(
    userId: mongoose.Types.ObjectId,
    action: AuditAction,
    entity: AuditEntity,
    entityId: mongoose.Types.ObjectId,
    changes: { before?: any; after?: any },
    request: { ip: string; userAgent: string }
  ): Promise<IAuditLog>;
  getEntityHistory(
    entity: AuditEntity,
    entityId: mongoose.Types.ObjectId,
    limit?: number
  ): Promise<IAuditLog[]>;
  getUserActivity(
    userId: mongoose.Types.ObjectId,
    limit?: number
  ): Promise<IAuditLog[]>;
  getRecentLogs(
    limit?: number,
    filters?: {
      action?: AuditAction;
      entity?: AuditEntity;
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<IAuditLog[]>;
}

// Schema
const auditLogSchema = new Schema<IAuditLog>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'El usuario es requerido'],
    },
    action: {
      type: String,
      enum: {
        values: ['create', 'update', 'delete', 'cancel', 'block'],
        message: 'Acción no válida',
      },
      required: [true, 'La acción es requerida'],
    },
    entity: {
      type: String,
      enum: {
        values: ['product', 'variant', 'order', 'user', 'category', 'brand', 'tag', 'collection', 'banner', 'homeLayout', 'siteSettings'],
        message: 'Entidad no válida',
      },
      required: [true, 'La entidad es requerida'],
    },
    entityId: {
      type: Schema.Types.ObjectId,
      required: [true, 'El ID de la entidad es requerido'],
    },
    changes: {
      before: {
        type: Schema.Types.Mixed,
        default: {},
      },
      after: {
        type: Schema.Types.Mixed,
        default: {},
      },
    },
    ipAddress: {
      type: String,
      required: [true, 'La dirección IP es requerida'],
    },
    userAgent: {
      type: String,
      required: [true, 'El User Agent es requerido'],
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Índices
auditLogSchema.index({ user: 1, createdAt: -1 });
auditLogSchema.index({ entity: 1, entityId: 1 });
auditLogSchema.index({ action: 1 });
// TTL — los audit logs se autoborran a los 180 días. La compliance estándar
// de retención de logs operacionales para e-commerce es 90-365 días (ISO
// 27001 sugiere ≥90); 180d es un balance entre traza forense y crecimiento
// de la colección. Estimado: ~200-1000 logs/día → 36K-180K docs en stock
// permanente, ~50MB max. Mantiene Atlas free tier (512MB) muy holgado.
// Si se rota antes del schema fix, ejecutar primero `npm run migrate:indexes`
// que dropea el índice {createdAt: -1} sin TTL que ya existía.
auditLogSchema.index(
  { createdAt: -1 },
  { expireAfterSeconds: 60 * 60 * 24 * 180 }
);

// Método estático: crear log de auditoría
auditLogSchema.statics.log = async function (
  userId: mongoose.Types.ObjectId,
  action: AuditAction,
  entity: AuditEntity,
  entityId: mongoose.Types.ObjectId,
  changes: { before?: any; after?: any },
  request: { ip: string; userAgent: string }
) {
  return this.create({
    user: userId,
    action,
    entity,
    entityId,
    changes: {
      before: changes.before || {},
      after: changes.after || {},
    },
    ipAddress: request.ip,
    userAgent: request.userAgent,
  });
};

// Método estático: obtener logs de una entidad
auditLogSchema.statics.getEntityHistory = async function (
  entity: AuditEntity,
  entityId: mongoose.Types.ObjectId,
  limit = 50
) {
  return this.find({ entity, entityId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('user', 'name email role');
};

// Método estático: obtener logs de un usuario
auditLogSchema.statics.getUserActivity = async function (
  userId: mongoose.Types.ObjectId,
  limit = 100
) {
  return this.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Método estático: obtener logs recientes (para dashboard admin)
auditLogSchema.statics.getRecentLogs = async function (
  limit = 50,
  filters?: {
    action?: AuditAction;
    entity?: AuditEntity;
    startDate?: Date;
    endDate?: Date;
  }
) {
  const query: any = {};

  if (filters?.action) query.action = filters.action;
  if (filters?.entity) query.entity = filters.entity;
  if (filters?.startDate || filters?.endDate) {
    query.createdAt = {};
    if (filters.startDate) query.createdAt.$gte = filters.startDate;
    if (filters.endDate) query.createdAt.$lte = filters.endDate;
  }

  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('user', 'name email role');
};

const AuditLog = mongoose.model<IAuditLog, IAuditLogModel>('AuditLog', auditLogSchema);

export default AuditLog;

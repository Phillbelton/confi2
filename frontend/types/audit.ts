// ============================================================================
// AUDIT TYPES
// ============================================================================

export type AuditAction = 'create' | 'update' | 'delete' | 'cancel' | 'block';
export type AuditEntity = 'product' | 'variant' | 'order' | 'user' | 'category' | 'brand' | 'tag';

export interface AuditLog {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  action: AuditAction;
  entity: AuditEntity;
  entityId: string;
  changes: {
    before: any;
    after: any;
  };
  ipAddress: string;
  userAgent: string;
  createdAt: string;
}

export interface AuditLogFilters {
  page?: number;
  limit?: number;
  action?: AuditAction;
  entityType?: AuditEntity;
  entityId?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
  ip?: string;
}

export interface AuditStats {
  totalLogs: number;
  actionStats: Array<{
    _id: AuditAction;
    count: number;
  }>;
  entityStats: Array<{
    _id: AuditEntity;
    count: number;
  }>;
  topUsers: Array<{
    userId: string;
    count: number;
    name: string;
    email: string;
    role: string;
  }>;
}

export interface AuditStatsFilters {
  startDate?: string;
  endDate?: string;
  groupBy?: 'action' | 'entity' | 'user';
}

export interface EntityHistory {
  entity: AuditEntity;
  entityId: string;
  history: AuditLog[];
}

export interface UserActivity {
  userId: string;
  activity: AuditLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// UI Helpers
export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  create: 'Crear',
  update: 'Actualizar',
  delete: 'Eliminar',
  cancel: 'Cancelar',
  block: 'Bloquear',
};

export const AUDIT_ACTION_COLORS: Record<AuditAction, string> = {
  create: 'text-green-600 bg-green-100',
  update: 'text-blue-600 bg-blue-100',
  delete: 'text-red-600 bg-red-100',
  cancel: 'text-yellow-600 bg-yellow-100',
  block: 'text-gray-600 bg-gray-100',
};

export const AUDIT_ENTITY_LABELS: Record<AuditEntity, string> = {
  product: 'Producto',
  variant: 'Variante',
  order: 'Orden',
  user: 'Usuario',
  category: 'Categoría',
  brand: 'Marca',
  tag: 'Etiqueta',
};

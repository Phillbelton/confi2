import { useQuery } from '@tanstack/react-query';
import { auditService } from '@/services/admin/audit';
import type { AuditLogFilters, AuditStatsFilters } from '@/types/audit';

/**
 * Hook para obtener logs de auditoría con filtros
 */
export function useAuditLogs(filters: AuditLogFilters) {
  return useQuery({
    queryKey: ['audit-logs', filters],
    queryFn: () => auditService.getLogs(filters),
    staleTime: 1000 * 30, // 30 segundos
  });
}

/**
 * Hook para obtener logs recientes
 */
export function useRecentAuditLogs(limit: number = 50, action?: string) {
  return useQuery({
    queryKey: ['audit-logs', 'recent', limit, action],
    queryFn: () => auditService.getRecentLogs(limit, action),
    staleTime: 1000 * 30, // 30 segundos
  });
}

/**
 * Hook para obtener estadísticas de auditoría
 */
export function useAuditStats(filters: AuditStatsFilters = {}) {
  return useQuery({
    queryKey: ['audit-stats', filters],
    queryFn: () => auditService.getStats(filters),
    staleTime: 1000 * 60, // 1 minuto
  });
}

/**
 * Hook para obtener historial de una entidad
 */
export function useEntityHistory(entityType: string, entityId: string, limit: number = 50) {
  return useQuery({
    queryKey: ['entity-history', entityType, entityId, limit],
    queryFn: () => auditService.getEntityHistory(entityType, entityId, limit),
    enabled: !!entityType && !!entityId,
    staleTime: 1000 * 60, // 1 minuto
  });
}

/**
 * Hook para obtener actividad de un usuario
 */
export function useUserActivity(
  userId: string,
  filters: {
    page?: number;
    limit?: number;
    action?: string;
    startDate?: string;
    endDate?: string;
  } = {}
) {
  return useQuery({
    queryKey: ['user-activity', userId, filters],
    queryFn: () => auditService.getUserActivity(userId, filters),
    enabled: !!userId,
    staleTime: 1000 * 30, // 30 segundos
  });
}

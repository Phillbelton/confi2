import api from '@/lib/axios';
import type { ApiResponse, ApiPaginatedResponse } from '@/types';
import type {
  AuditLog,
  AuditLogFilters,
  AuditStats,
  AuditStatsFilters,
  EntityHistory,
  UserActivity,
} from '@/types/audit';

/**
 * Audit Service
 * Handles all audit log related API calls
 */

export const auditService = {
  /**
   * Get audit logs with filters and pagination
   */
  getLogs: async (filters: AuditLogFilters = {}): Promise<ApiPaginatedResponse<AuditLog>> => {
    const params = new URLSearchParams();

    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.action) params.append('action', filters.action);
    if (filters.entityType) params.append('entityType', filters.entityType);
    if (filters.entityId) params.append('entityId', filters.entityId);
    if (filters.userId) params.append('userId', filters.userId);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.ip) params.append('ip', filters.ip);

    const { data } = await api.get<ApiResponse<ApiPaginatedResponse<AuditLog>>>(
      `/audit-logs?${params.toString()}`
    );
    return data.data;
  },

  /**
   * Get recent audit logs (for dashboard)
   */
  getRecentLogs: async (limit: number = 50, action?: string): Promise<AuditLog[]> => {
    const params = new URLSearchParams();
    params.append('limit', limit.toString());
    if (action) params.append('action', action);

    const { data } = await api.get<ApiResponse<{ logs: AuditLog[] }>>(
      `/audit-logs/recent?${params.toString()}`
    );
    return data.data.logs;
  },

  /**
   * Get audit statistics
   */
  getStats: async (filters: AuditStatsFilters = {}): Promise<AuditStats> => {
    const params = new URLSearchParams();

    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.groupBy) params.append('groupBy', filters.groupBy);

    const { data } = await api.get<ApiResponse<AuditStats>>(
      `/audit-logs/stats?${params.toString()}`
    );
    return data.data;
  },

  /**
   * Get entity history
   */
  getEntityHistory: async (
    entityType: string,
    entityId: string,
    limit: number = 50
  ): Promise<EntityHistory> => {
    const params = new URLSearchParams();
    params.append('limit', limit.toString());

    const { data } = await api.get<ApiResponse<EntityHistory>>(
      `/audit-logs/entity/${entityType}/${entityId}?${params.toString()}`
    );
    return data.data;
  },

  /**
   * Get user activity
   */
  getUserActivity: async (
    userId: string,
    filters: { page?: number; limit?: number; action?: string; startDate?: string; endDate?: string } = {}
  ): Promise<UserActivity> => {
    const params = new URLSearchParams();

    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.action) params.append('action', filters.action);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);

    const { data } = await api.get<ApiResponse<UserActivity>>(
      `/audit-logs/user/${userId}?${params.toString()}`
    );
    return data.data;
  },
};

export default auditService;

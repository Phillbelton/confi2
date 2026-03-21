'use client';

import { useState } from 'react';
import { Activity, BarChart3 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { AuditLogTable } from '@/components/admin/audit/AuditLogTable';
import { AuditFilters } from '@/components/admin/audit/AuditFilters';
import { AuditStatsCards } from '@/components/admin/audit/AuditStatsCards';
import { useAuditLogs, useAuditStats } from '@/hooks/admin/useAudit';
import type { AuditLogFilters } from '@/types/audit';

export default function AuditoriaPage() {
  const [filters, setFilters] = useState<AuditLogFilters>({
    page: 1,
    limit: 50,
  });

  const [statsFilters, setStatsFilters] = useState({});

  // Queries
  const { data: logsData, isLoading: logsLoading } = useAuditLogs(filters);
  const { data: statsData, isLoading: statsLoading } = useAuditStats(statsFilters);

  const handleClearFilters = () => {
    setFilters({
      page: 1,
      limit: 50,
    });
  };

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Auditoría</h1>
        <p className="text-muted-foreground">
          Historial completo de acciones administrativas del sistema
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="logs" className="space-y-6">
        <TabsList>
          <TabsTrigger value="logs" className="gap-2">
            <Activity className="h-4 w-4" />
            Registros de auditoría
          </TabsTrigger>
          <TabsTrigger value="stats" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Estadísticas
          </TabsTrigger>
        </TabsList>

        {/* Registros de auditoría */}
        <TabsContent value="logs" className="space-y-6">
          {/* Filtros */}
          <AuditFilters
            filters={filters}
            onFiltersChange={setFilters}
            onClear={handleClearFilters}
          />

          {/* Tabla de logs */}
          <AuditLogTable logs={logsData?.data || []} isLoading={logsLoading} />

          {/* Paginación */}
          {logsData && logsData.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Mostrando {logsData.data.length} de {logsData.pagination.totalItems} registros
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!logsData.pagination.hasPrevPage}
                  onClick={() => handlePageChange(filters.page! - 1)}
                >
                  Anterior
                </Button>
                <span className="text-sm">
                  Página {logsData.pagination.currentPage} de {logsData.pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!logsData.pagination.hasNextPage}
                  onClick={() => handlePageChange(filters.page! + 1)}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Estadísticas */}
        <TabsContent value="stats" className="space-y-6">
          {statsData && <AuditStatsCards stats={statsData} isLoading={statsLoading} />}
        </TabsContent>
      </Tabs>
    </div>
  );
}

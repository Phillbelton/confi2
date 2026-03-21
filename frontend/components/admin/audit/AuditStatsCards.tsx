'use client';

import { Activity, FileEdit, Trash2, Plus, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { AuditStats } from '@/types/audit';
import { AUDIT_ACTION_LABELS, AUDIT_ENTITY_LABELS } from '@/types/audit';

interface AuditStatsCardsProps {
  stats: AuditStats;
  isLoading?: boolean;
}

const ACTION_ICONS: Record<string, React.ReactNode> = {
  create: <Plus className="h-4 w-4" />,
  update: <FileEdit className="h-4 w-4" />,
  delete: <Trash2 className="h-4 w-4" />,
  cancel: <XCircle className="h-4 w-4" />,
  block: <XCircle className="h-4 w-4" />,
};

export function AuditStatsCards({ stats, isLoading }: AuditStatsCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="h-4 w-24 bg-muted animate-pulse rounded" />
              <div className="h-8 w-8 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Total de logs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total de Logs</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalLogs.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Registros de auditoría</p>
          </CardContent>
        </Card>

        {/* Top acciones */}
        {stats.actionStats.slice(0, 3).map((action) => (
          <Card key={action._id}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                {AUDIT_ACTION_LABELS[action._id]}
              </CardTitle>
              <div className="text-muted-foreground">{ACTION_ICONS[action._id]}</div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{action.count.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {((action.count / stats.totalLogs) * 100).toFixed(1)}% del total
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Estadísticas por tipo de acción */}
      <Card>
        <CardHeader>
          <CardTitle>Acciones por tipo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats.actionStats.map((action) => (
              <div key={action._id} className="flex items-center gap-4">
                <div className="w-32 flex items-center gap-2">
                  {ACTION_ICONS[action._id]}
                  <span className="text-sm font-medium">
                    {AUDIT_ACTION_LABELS[action._id]}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="h-4 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary"
                      style={{
                        width: `${(action.count / stats.totalLogs) * 100}%`,
                      }}
                    />
                  </div>
                </div>
                <div className="w-20 text-right">
                  <span className="text-sm font-semibold">{action.count}</span>
                  <span className="text-xs text-muted-foreground ml-1">
                    ({((action.count / stats.totalLogs) * 100).toFixed(1)}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Estadísticas por entidad */}
      <Card>
        <CardHeader>
          <CardTitle>Entidades más modificadas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats.entityStats.map((entity) => (
              <div key={entity._id} className="flex items-center gap-4">
                <div className="w-32">
                  <Badge variant="outline">{AUDIT_ENTITY_LABELS[entity._id]}</Badge>
                </div>
                <div className="flex-1">
                  <div className="h-4 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500"
                      style={{
                        width: `${(entity.count / stats.totalLogs) * 100}%`,
                      }}
                    />
                  </div>
                </div>
                <div className="w-20 text-right">
                  <span className="text-sm font-semibold">{entity.count}</span>
                  <span className="text-xs text-muted-foreground ml-1">
                    ({((entity.count / stats.totalLogs) * 100).toFixed(1)}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Usuarios más activos */}
      <Card>
        <CardHeader>
          <CardTitle>Usuarios más activos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.topUsers.map((user, index) => (
              <div key={user.userId} className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-bold text-primary">{index + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{user.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
                <Badge variant="outline">{user.role}</Badge>
                <div className="text-right">
                  <p className="font-semibold">{user.count}</p>
                  <p className="text-xs text-muted-foreground">acciones</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

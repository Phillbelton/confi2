'use client';

import { useState } from 'react';
import { Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AuditLogDetailModal } from './AuditLogDetailModal';
import type { AuditLog } from '@/types/audit';
import { AUDIT_ACTION_LABELS, AUDIT_ACTION_COLORS, AUDIT_ENTITY_LABELS } from '@/types/audit';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface AuditLogTableProps {
  logs: AuditLog[];
  isLoading?: boolean;
}

export function AuditLogTable({ logs, isLoading }: AuditLogTableProps) {
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  if (isLoading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuario</TableHead>
              <TableHead>Acción</TableHead>
              <TableHead>Entidad</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>IP</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, i) => (
              <TableRow key={i}>
                <TableCell>
                  <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                </TableCell>
                <TableCell>
                  <div className="h-6 w-20 bg-muted animate-pulse rounded" />
                </TableCell>
                <TableCell>
                  <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                </TableCell>
                <TableCell>
                  <div className="h-4 w-28 bg-muted animate-pulse rounded" />
                </TableCell>
                <TableCell>
                  <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                </TableCell>
                <TableCell>
                  <div className="h-8 w-16 bg-muted animate-pulse rounded ml-auto" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="rounded-md border p-8 text-center">
        <p className="text-muted-foreground">No se encontraron registros de auditoría</p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuario</TableHead>
              <TableHead>Acción</TableHead>
              <TableHead>Entidad</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>IP</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log._id}>
                <TableCell>
                  <div>
                    <p className="font-medium">{log.user.name}</p>
                    <p className="text-sm text-muted-foreground">{log.user.email}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={AUDIT_ACTION_COLORS[log.action]}>
                    {AUDIT_ACTION_LABELS[log.action]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">{AUDIT_ENTITY_LABELS[log.entity]}</p>
                    <p className="text-xs text-muted-foreground font-mono">{log.entityId}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="text-sm">
                      {formatDistanceToNow(new Date(log.createdAt), {
                        addSuffix: true,
                        locale: es,
                      })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(log.createdAt).toLocaleString('es-PY')}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <p className="text-sm font-mono">{log.ipAddress}</p>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedLog(log)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Ver detalles
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {selectedLog && (
        <AuditLogDetailModal
          log={selectedLog}
          open={!!selectedLog}
          onClose={() => setSelectedLog(null)}
        />
      )}
    </>
  );
}

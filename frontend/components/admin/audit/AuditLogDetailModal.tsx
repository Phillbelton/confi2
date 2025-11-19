'use client';

import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { AuditLog } from '@/types/audit';
import { AUDIT_ACTION_LABELS, AUDIT_ACTION_COLORS, AUDIT_ENTITY_LABELS } from '@/types/audit';

interface AuditLogDetailModalProps {
  log: AuditLog;
  open: boolean;
  onClose: () => void;
}

export function AuditLogDetailModal({ log, open, onClose }: AuditLogDetailModalProps) {
  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return 'null';
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  };

  const getChangedFields = () => {
    const before = log.changes.before || {};
    const after = log.changes.after || {};
    const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);

    return Array.from(allKeys).map((key) => ({
      field: key,
      before: before[key],
      after: after[key],
      changed: JSON.stringify(before[key]) !== JSON.stringify(after[key]),
    }));
  };

  const changedFields = getChangedFields();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Detalles del registro de auditoría
            <Badge className={AUDIT_ACTION_COLORS[log.action]}>
              {AUDIT_ACTION_LABELS[log.action]}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            {AUDIT_ENTITY_LABELS[log.entity]} · {new Date(log.createdAt).toLocaleString('es-PY')}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-200px)]">
          <div className="space-y-6">
            {/* Información general */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Usuario</p>
                <p className="font-medium">{log.user.name}</p>
                <p className="text-xs text-muted-foreground">{log.user.email}</p>
                <Badge variant="outline" className="mt-1">
                  {log.user.role}
                </Badge>
              </div>
              <div>
                <p className="text-muted-foreground">Entidad afectada</p>
                <p className="font-medium">{AUDIT_ENTITY_LABELS[log.entity]}</p>
                <p className="text-xs text-muted-foreground font-mono">{log.entityId}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Dirección IP</p>
                <p className="font-mono">{log.ipAddress}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Fecha y hora</p>
                <p>{new Date(log.createdAt).toLocaleString('es-PY')}</p>
              </div>
            </div>

            <Separator />

            {/* Navegador */}
            <div>
              <p className="text-sm text-muted-foreground mb-1">Navegador</p>
              <p className="text-xs font-mono bg-muted p-2 rounded">
                {log.userAgent}
              </p>
            </div>

            <Separator />

            {/* Cambios */}
            <div>
              <h3 className="font-semibold mb-4">Cambios realizados</h3>

              {changedFields.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay cambios registrados</p>
              ) : (
                <div className="space-y-4">
                  {changedFields.map(({ field, before, after, changed }) => (
                    <div key={field} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{field}</p>
                        {changed && (
                          <Badge variant="outline" className="text-xs">
                            Modificado
                          </Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        {/* Valor anterior */}
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Antes</p>
                          <pre className="text-xs bg-red-50 border border-red-200 p-3 rounded overflow-x-auto">
                            {formatValue(before)}
                          </pre>
                        </div>

                        {/* Valor nuevo */}
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Después</p>
                          <pre className="text-xs bg-green-50 border border-green-200 p-3 rounded overflow-x-auto">
                            {formatValue(after)}
                          </pre>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

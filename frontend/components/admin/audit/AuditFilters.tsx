'use client';

import { useState } from 'react';
import { Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { AuditLogFilters } from '@/types/audit';
import { AUDIT_ACTION_LABELS, AUDIT_ENTITY_LABELS } from '@/types/audit';

interface AuditFiltersProps {
  filters: AuditLogFilters;
  onFiltersChange: (filters: AuditLogFilters) => void;
  onClear: () => void;
}

export function AuditFilters({ filters, onFiltersChange, onClear }: AuditFiltersProps) {
  const [showFilters, setShowFilters] = useState(false);

  const hasActiveFilters = Object.keys(filters).some(
    (key) => key !== 'page' && key !== 'limit' && filters[key as keyof AuditLogFilters]
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button
          variant={showFilters ? 'default' : 'outline'}
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="h-4 w-4 mr-2" />
          Filtros
          {hasActiveFilters && (
            <span className="ml-2 bg-primary-foreground text-primary rounded-full px-2 py-0.5 text-xs">
              {Object.keys(filters).filter(
                (key) => key !== 'page' && key !== 'limit' && filters[key as keyof AuditLogFilters]
              ).length}
            </span>
          )}
        </Button>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={onClear}>
            <X className="h-4 w-4 mr-2" />
            Limpiar filtros
          </Button>
        )}
      </div>

      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle>Filtros de búsqueda</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Acción */}
              <div className="space-y-2">
                <Label>Acción</Label>
                <Select
                  value={filters.action || 'all'}
                  onValueChange={(value) =>
                    onFiltersChange({
                      ...filters,
                      action: value === 'all' ? undefined : (value as any),
                      page: 1,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas las acciones" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las acciones</SelectItem>
                    {Object.entries(AUDIT_ACTION_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Entidad */}
              <div className="space-y-2">
                <Label>Tipo de entidad</Label>
                <Select
                  value={filters.entityType || 'all'}
                  onValueChange={(value) =>
                    onFiltersChange({
                      ...filters,
                      entityType: value === 'all' ? undefined : (value as any),
                      page: 1,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas las entidades" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las entidades</SelectItem>
                    {Object.entries(AUDIT_ENTITY_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Dirección IP */}
              <div className="space-y-2">
                <Label>Dirección IP</Label>
                <Input
                  placeholder="Ej: 192.168.1.1"
                  value={filters.ip || ''}
                  onChange={(e) =>
                    onFiltersChange({
                      ...filters,
                      ip: e.target.value || undefined,
                      page: 1,
                    })
                  }
                />
              </div>

              {/* Fecha inicio */}
              <div className="space-y-2">
                <Label>Fecha inicio</Label>
                <Input
                  type="date"
                  value={filters.startDate || ''}
                  onChange={(e) =>
                    onFiltersChange({
                      ...filters,
                      startDate: e.target.value || undefined,
                      page: 1,
                    })
                  }
                />
              </div>

              {/* Fecha fin */}
              <div className="space-y-2">
                <Label>Fecha fin</Label>
                <Input
                  type="date"
                  value={filters.endDate || ''}
                  onChange={(e) =>
                    onFiltersChange({
                      ...filters,
                      endDate: e.target.value || undefined,
                      page: 1,
                    })
                  }
                />
              </div>

              {/* ID de entidad */}
              <div className="space-y-2">
                <Label>ID de entidad</Label>
                <Input
                  placeholder="ID específico"
                  value={filters.entityId || ''}
                  onChange={(e) =>
                    onFiltersChange({
                      ...filters,
                      entityId: e.target.value || undefined,
                      page: 1,
                    })
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

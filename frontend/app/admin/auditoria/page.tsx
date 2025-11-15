'use client';

import { Activity } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function AuditoriaPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Auditoría</h1>
        <p className="text-muted-foreground">
          Historial de acciones administrativas
        </p>
      </div>

      {/* Placeholder */}
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Activity className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Logs de Auditoría</h3>
          <p className="text-sm text-muted-foreground text-center max-w-md">
            Aquí podrás ver el historial completo de acciones realizadas por los
            administradores y funcionarios del sistema.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

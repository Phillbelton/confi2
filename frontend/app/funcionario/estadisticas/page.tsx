'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';

export default function EstadisticasPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Estadísticas</h1>
        <p className="text-slate-500 dark:text-slate-400">
          Métricas y análisis de rendimiento
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Estadísticas del Funcionario</CardTitle>
        </CardHeader>
        <CardContent className="py-12">
          <div className="text-center">
            <BarChart3 className="h-16 w-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Próximamente</h3>
            <p className="text-slate-500">
              Esta sección está en desarrollo y estará disponible pronto.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

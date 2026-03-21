'use client';

import { FileText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function ReportesPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reportes</h1>
        <p className="text-muted-foreground">
          Analiza las ventas y el rendimiento
        </p>
      </div>

      {/* Placeholder */}
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Reportes y Análisis</h3>
          <p className="text-sm text-muted-foreground text-center max-w-md">
            Aquí podrás ver reportes detallados de ventas, productos más
            vendidos, análisis por período y exportar datos.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

'use client';

import { Warehouse } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function InventarioPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Inventario</h1>
        <p className="text-muted-foreground">
          Control de stock y movimientos de inventario
        </p>
      </div>

      {/* Placeholder */}
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Warehouse className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Gestión de Inventario</h3>
          <p className="text-sm text-muted-foreground text-center max-w-md">
            Aquí podrás controlar el stock de tus productos, ver alertas de
            stock bajo, realizar ajustes y revisar el historial de movimientos.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

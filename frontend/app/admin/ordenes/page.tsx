'use client';

import { ShoppingCart } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function OrdenesPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Órdenes</h1>
        <p className="text-muted-foreground">
          Gestiona las órdenes de tus clientes
        </p>
      </div>

      {/* Placeholder */}
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Gestión de Órdenes</h3>
          <p className="text-sm text-muted-foreground text-center max-w-md">
            Aquí podrás ver todas las órdenes, cambiar su estado, enviar
            mensajes por WhatsApp y gestionar los pedidos de tus clientes.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

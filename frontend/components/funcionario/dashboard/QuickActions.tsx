'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, MessageCircle, FileText, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function QuickActions() {
  const router = useRouter();

  const actions = [
    {
      icon: Plus,
      label: 'Nueva Orden',
      description: 'Crear orden telefónica',
      onClick: () => {
        // TODO: Implementar modal de crear orden
        console.log('Crear orden');
      },
      variant: 'default' as const,
    },
    {
      icon: MessageCircle,
      label: 'WhatsApp Pendientes',
      description: 'Abrir órdenes por confirmar',
      onClick: () => {
        router.push('/funcionario/ordenes/pendientes');
      },
      variant: 'outline' as const,
    },
    {
      icon: FileText,
      label: 'Reporte Hoy',
      description: 'Exportar órdenes del día',
      onClick: () => {
        // TODO: Implementar exportación
        console.log('Exportar reporte');
      },
      variant: 'outline' as const,
    },
    {
      icon: Search,
      label: 'Buscar Orden',
      description: 'Por número o cliente',
      onClick: () => {
        // TODO: Implementar búsqueda rápida
        console.log('Buscar orden');
      },
      variant: 'outline' as const,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Acciones Rápidas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.label}
                variant={action.variant}
                className="h-auto flex-col items-start p-4 text-left"
                onClick={action.onClick}
              >
                <Icon className="h-5 w-5 mb-2" />
                <span className="font-semibold text-sm">{action.label}</span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">
                  {action.description}
                </span>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

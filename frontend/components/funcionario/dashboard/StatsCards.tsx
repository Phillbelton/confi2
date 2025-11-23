'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Bell, Clock, CheckCircle, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsData {
  nuevasOrdenes: number;
  porConfirmar: number;
  completadasHoy: number;
  ventasDelDia: number;
  cambioVentas?: number; // Porcentaje de cambio vs ayer
}

interface StatsCardsProps {
  stats: StatsData;
  isLoading?: boolean;
}

export function StatsCards({ stats, isLoading }: StatsCardsProps) {
  const cards = [
    {
      title: 'Nuevas Órdenes',
      value: stats.nuevasOrdenes,
      icon: Bell,
      iconColor: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20',
      description: 'Creadas hoy',
    },
    {
      title: 'Por Confirmar',
      value: stats.porConfirmar,
      icon: Clock,
      iconColor: 'text-yellow-600',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
      description: 'Pendientes WhatsApp',
    },
    {
      title: 'Completadas',
      value: stats.completadasHoy,
      icon: CheckCircle,
      iconColor: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/20',
      description: 'Hoy',
    },
    {
      title: 'Ventas del Día',
      value: formatCurrency(stats.ventasDelDia),
      icon: DollarSign,
      iconColor: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20',
      description: stats.cambioVentas !== undefined ? (
        <div className="flex items-center gap-1">
          {stats.cambioVentas > 0 ? (
            <>
              <TrendingUp className="h-3 w-3 text-green-600" />
              <span className="text-green-600">+{stats.cambioVentas}%</span>
            </>
          ) : stats.cambioVentas < 0 ? (
            <>
              <TrendingDown className="h-3 w-3 text-red-600" />
              <span className="text-red-600">{stats.cambioVentas}%</span>
            </>
          ) : (
            <span className="text-slate-500">0%</span>
          )}
          <span className="text-slate-500">vs ayer</span>
        </div>
      ) : 'Total del día',
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-20 bg-slate-200 dark:bg-slate-700 rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card
            key={card.title}
            className="hover:shadow-md transition-shadow cursor-pointer"
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    {card.title}
                  </p>
                  <p className="text-2xl font-bold mt-2">
                    {card.value}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {card.description}
                  </p>
                </div>
                <div className={cn('p-3 rounded-lg', card.bgColor)}>
                  <Icon className={cn('h-6 w-6', card.iconColor)} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function formatCurrency(value: number): string {
  return '$' + new Intl.NumberFormat('es-CL', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

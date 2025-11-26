'use client';

import { Package, Percent, Truck, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const features = [
  {
    icon: Package,
    title: 'Amplio catálogo',
    description: 'Miles de productos disponibles',
  },
  {
    icon: Percent,
    title: 'Descuentos',
    description: 'Mejores precios por cantidad',
  },
  {
    icon: Truck,
    title: 'Retiro o despacho',
    description: 'Tú eliges cómo recibir',
  },
  {
    icon: MessageCircle,
    title: 'Pedidos WhatsApp',
    description: 'Compra fácil y rápido',
  },
];

export function FeaturesSection() {
  return (
    <section className="py-8 sm:py-12 bg-muted/30">
      <div className="container px-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className={cn(
                'flex flex-col items-center text-center p-4 rounded-lg',
                'bg-background/50 backdrop-blur-sm',
                'border border-border/50'
              )}
            >
              <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-3">
                <feature.icon className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <h3 className="text-sm sm:text-base font-semibold">
                {feature.title}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

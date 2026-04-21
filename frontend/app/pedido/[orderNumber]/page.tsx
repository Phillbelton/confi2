'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, MessageCircle, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { orderService } from '@/services/orders';
import type { Order } from '@/types/order';

/**
 * Página de confirmación de pedido — fallback público.
 *
 * Se muestra cuando el backend no devolvió `whatsappURL` (p.ej. el entorno no tiene
 * WHATSAPP_BUSINESS_PHONE configurado). Accesible sin autenticación para que
 * los invitados también vean confirmación del número de orden.
 */
export default function PedidoConfirmacionPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = use(params);
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    orderService
      .getByOrderNumber(orderNumber)
      .then((data) => {
        if (active) setOrder(data);
      })
      .catch(() => {
        // Si falla la consulta (orden no encontrada, sin auth, etc.) igual
        // mostramos el número para que el cliente tenga referencia.
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [orderNumber]);

  const businessPhone = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '').replace(/\D/g, '');
  const whatsappHref = businessPhone
    ? `https://wa.me/${businessPhone}?text=${encodeURIComponent(
        `Hola, acabo de hacer el pedido ${orderNumber}. ¿Me confirmas la recepción?`
      )}`
    : null;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg">
        <Card className="border-border">
          <CardContent className="p-6 md:p-8 space-y-6">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-primary" />
              </div>
              <h1 className="font-display text-2xl font-bold text-card-foreground">
                ¡Pedido recibido!
              </h1>
              <p className="text-sm text-muted-foreground">
                Tu número de pedido es:
              </p>
              <p className="font-mono text-lg font-bold text-primary">
                {orderNumber}
              </p>
            </div>

            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ) : order ? (
              <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cliente</span>
                  <span className="font-medium">{order.customer.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Productos</span>
                  <span className="font-medium">
                    {order.items.reduce((sum, item) => sum + item.quantity, 0)} uds.
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-bold">
                    ${order.subtotal.toLocaleString('es-CL')}
                  </span>
                </div>
                {order.deliveryMethod === 'delivery' && order.shippingCost === 0 && (
                  <p className="text-xs text-muted-foreground pt-1">
                    El costo de envío se confirmará contigo por WhatsApp.
                  </p>
                )}
              </div>
            ) : null}

            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                Guarda este número como referencia. Te contactaremos por WhatsApp
                para confirmar los detalles de tu pedido y coordinar la entrega.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              {whatsappHref && (
                <Button asChild className="w-full">
                  <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Contactar al negocio
                  </a>
                </Button>
              )}
              <Button asChild variant="outline" className="w-full">
                <Link href="/productos">
                  <ShoppingBag className="mr-2 h-4 w-4" />
                  Seguir comprando
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

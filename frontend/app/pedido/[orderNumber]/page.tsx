'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { CheckCircle2, MessageCircle, ShoppingBag, MapPin, CreditCard, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { getSafeImageUrl } from '@/lib/image-utils';
import type { Order } from '@/types/order';

interface StoredOrder {
  orderNumber: string;
  createdAt: string;
  order: Order;
  whatsappURL?: string | null;
}

const STORAGE_KEY = 'confi2:last-order';

/**
 * Página de confirmación de pedido para invitados.
 *
 * Lee los datos del pedido recién creado desde `sessionStorage` (guardados
 * por el checkout tras un POST /api/orders exitoso). No consulta la API:
 * los invitados no pueden ver pedidos pasados, sólo confirmar el que acaban
 * de realizar. Si el usuario abre el link sin datos en session (bookmark,
 * nueva pestaña), se muestra un estado de fallback con CTAs.
 */
export default function PedidoConfirmacionPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = use(params);
  const [stored, setStored] = useState<StoredOrder | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as StoredOrder;
        // Sólo usar los datos si corresponden al orderNumber de la URL.
        if (parsed?.orderNumber === orderNumber) {
          setStored(parsed);
        }
      }
    } catch {
      // JSON inválido o sessionStorage bloqueado: seguimos al fallback.
    } finally {
      setHydrated(true);
    }
  }, [orderNumber]);

  const businessPhone = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '').replace(/\D/g, '');
  const fallbackWhatsappHref = businessPhone
    ? `https://wa.me/${businessPhone}?text=${encodeURIComponent(
        `Hola, realicé el pedido ${orderNumber} y quiero consultar su estado.`
      )}`
    : null;

  const order = stored?.order ?? null;
  const whatsappHref = stored?.whatsappURL || fallbackWhatsappHref;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg">
        <Card className="border-border">
          <CardContent className="p-6 md:p-8 space-y-6">
            {/* Header */}
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

            {/* Body: depende de si tenemos datos en sessionStorage */}
            {!hydrated ? null : order ? (
              <>
                {/* Resumen cliente */}
                <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cliente</span>
                    <span className="font-medium">{order.customer.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Teléfono</span>
                    <span className="font-medium">{order.customer.phone}</span>
                  </div>
                  {order.customer.email && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Email</span>
                      <span className="font-medium truncate ml-2">{order.customer.email}</span>
                    </div>
                  )}
                </div>

                {/* Items */}
                <div className="space-y-2">
                  <h2 className="font-display text-sm font-semibold text-card-foreground">
                    Productos
                  </h2>
                  <ul className="divide-y divide-border rounded-lg border border-border overflow-hidden">
                    {order.items.map((item, i) => (
                      <li key={i} className="flex items-center gap-3 p-3 bg-card">
                        {item.productSnapshot.image && (
                          <div className="relative w-12 h-12 flex-shrink-0 rounded-md overflow-hidden bg-muted">
                            <Image
                              src={getSafeImageUrl(item.productSnapshot.image, {
                                width: 96,
                                height: 96,
                                quality: 'auto',
                              })}
                              alt={item.productSnapshot.name}
                              fill
                              className="object-contain"
                              sizes="48px"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-card-foreground truncate">
                            {item.productSnapshot.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {item.quantity} × ${item.pricePerUnit.toLocaleString('es-CL')}
                          </p>
                        </div>
                        <span className="text-sm font-semibold text-card-foreground whitespace-nowrap">
                          ${item.subtotal.toLocaleString('es-CL')}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Totales */}
                <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">
                      ${order.subtotal.toLocaleString('es-CL')}
                    </span>
                  </div>
                  {order.totalDiscount > 0 && (
                    <div className="flex justify-between text-primary">
                      <span>Descuento</span>
                      <span className="font-medium">
                        −${order.totalDiscount.toLocaleString('es-CL')}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Envío</span>
                    <span className="font-medium">
                      {order.deliveryMethod === 'delivery' && order.shippingCost === 0
                        ? 'Por confirmar'
                        : `$${order.shippingCost.toLocaleString('es-CL')}`}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-border">
                    <span className="font-semibold text-card-foreground">Total</span>
                    <span className="font-bold text-primary text-base">
                      ${order.total.toLocaleString('es-CL')}
                    </span>
                  </div>
                </div>

                {/* Entrega + pago */}
                <div className="rounded-lg border border-border p-4 space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <Truck className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">Método de entrega</p>
                      <p className="font-medium text-card-foreground">
                        {order.deliveryMethod === 'delivery' ? 'Envío a domicilio' : 'Retiro en tienda'}
                      </p>
                    </div>
                  </div>
                  {order.deliveryMethod === 'delivery' && order.customer.address && (
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground">Dirección</p>
                        <p className="font-medium text-card-foreground">
                          {order.customer.address.street} {order.customer.address.number}
                          {order.customer.address.neighborhood && `, ${order.customer.address.neighborhood}`}
                          , {order.customer.address.city}
                        </p>
                        {order.customer.address.reference && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Ref: {order.customer.address.reference}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                  <div className="flex items-start gap-2">
                    <CreditCard className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">Método de pago</p>
                      <p className="font-medium text-card-foreground">
                        {order.paymentMethod === 'cash' ? 'Efectivo' : 'Transferencia'}
                      </p>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground text-center">
                  Guarda este número como referencia. Te contactaremos por WhatsApp
                  para confirmar los detalles y coordinar la entrega.
                </p>
              </>
            ) : (
              <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground text-center space-y-2">
                <p>
                  Este pedido ya fue confirmado. Para consultar los detalles,
                  contáctanos por WhatsApp con tu número de pedido.
                </p>
              </div>
            )}

            {/* CTAs */}
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

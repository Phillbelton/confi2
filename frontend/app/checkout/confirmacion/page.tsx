'use client';

import { Suspense, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, MessageCircle, Package, Home } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

function ConfirmacionContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderNumber = searchParams.get('orderNumber');

  useEffect(() => {
    if (!orderNumber) {
      router.push('/productos');
    }
  }, [orderNumber, router]);

  if (!orderNumber) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        <div className="container px-4 py-12 md:px-6 md:py-20 max-w-2xl">
          {/* Success Icon */}
          <div className="flex justify-center mb-8 animate-in fade-in zoom-in duration-500">
            <div className="rounded-full bg-success/10 p-6">
              <CheckCircle2 className="h-24 w-24 text-success" />
            </div>
          </div>

          {/* Title */}
          <div className="text-center space-y-4 mb-8">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              ¡Pedido enviado por WhatsApp!
            </h1>
            <p className="text-lg text-muted-foreground">
              Tu pedido ha sido enviado exitosamente. En breve nos contactaremos contigo
              para confirmar la disponibilidad.
            </p>
          </div>

          {/* Order Number Card */}
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Número de orden
                  </p>
                  <p className="text-2xl font-bold">{orderNumber}</p>
                </div>
                <Package className="h-12 w-12 text-primary" />
              </div>
            </CardContent>
          </Card>

          {/* Next Steps */}
          <Card className="mb-8">
            <CardContent className="p-6 space-y-4">
              <h2 className="text-xl font-semibold mb-4">Próximos pasos</h2>

              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                    1
                  </div>
                  <div>
                    <p className="font-medium">Revisa WhatsApp</p>
                    <p className="text-sm text-muted-foreground">
                      Hemos abierto una conversación de WhatsApp con tu pedido. Revisa
                      los detalles.
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                    2
                  </div>
                  <div>
                    <p className="font-medium">Esperá nuestra confirmación</p>
                    <p className="text-sm text-muted-foreground">
                      Te contactaremos por WhatsApp para confirmar la disponibilidad de
                      los productos.
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                    3
                  </div>
                  <div>
                    <p className="font-medium">Coordinamos la entrega</p>
                    <p className="text-sm text-muted-foreground">
                      Una vez confirmado, coordinaremos el retiro o envío de tu pedido.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link href="/productos">
                <Home className="mr-2 h-5 w-5" />
                Volver a la tienda
              </Link>
            </Button>

            <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
              <a
                href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || ''}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle className="mr-2 h-5 w-5" />
                Abrir WhatsApp
              </a>
            </Button>
          </div>

          {/* Additional Info */}
          <div className="mt-8 text-center text-sm text-muted-foreground">
            <p>
              Guardá tu número de orden para consultas:{' '}
              <span className="font-semibold text-foreground">{orderNumber}</span>
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function ConfirmacionPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
        </div>
      }
    >
      <ConfirmacionContent />
    </Suspense>
  );
}

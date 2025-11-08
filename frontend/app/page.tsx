import Link from 'next/link';
import { ArrowRight, Package, ShoppingBag, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="container px-4 py-16 md:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              Bienvenido a{' '}
              <span className="text-primary">Confitería Quelita</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground">
              Descubre nuestra selección de productos de confitería premium.
              Calidad garantizada y los mejores precios del mercado.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/productos">
                <Button size="lg" className="w-full sm:w-auto">
                  Ver productos
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/ofertas">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  Ver ofertas
                  <Sparkles className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="border-t bg-muted/50 py-16">
          <div className="container px-4">
            <div className="grid gap-8 md:grid-cols-3">
              <div className="flex flex-col items-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Package className="h-8 w-8" />
                </div>
                <h3 className="mt-4 text-xl font-semibold">
                  Amplio catálogo
                </h3>
                <p className="mt-2 text-muted-foreground">
                  Más de 1000 productos para elegir
                </p>
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Sparkles className="h-8 w-8" />
                </div>
                <h3 className="mt-4 text-xl font-semibold">
                  Descuentos por cantidad
                </h3>
                <p className="mt-2 text-muted-foreground">
                  Comprá más y ahorrá más
                </p>
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <ShoppingBag className="h-8 w-8" />
                </div>
                <h3 className="mt-4 text-xl font-semibold">
                  Pedidos por WhatsApp
                </h3>
                <p className="mt-2 text-muted-foreground">
                  Comprá fácil y rápido
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container px-4 py-16">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight">
              ¿Listo para hacer tu pedido?
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Explorá nuestro catálogo y descubrí los mejores productos al mejor
              precio.
            </p>
            <Link href="/productos" className="mt-8 inline-block">
              <Button size="lg">
                Ir al catálogo
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

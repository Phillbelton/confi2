'use client';

import Link from 'next/link';
import { ArrowRight, ChevronRight, Truck, CreditCard, Clock, Shield, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ProductCardCentral } from '@/components/products/ProductCardCentral';
import { Skeleton } from '@/components/ui/skeleton';
import { useFeaturedProducts } from '@/hooks/useProducts';
import { useMainCategories } from '@/hooks/useCategories';
import { getCategoryVisualConfig } from '@/lib/categoryVisualConfig';
import type { ProductParent, ProductVariant, Category } from '@/types';

export default function HomePage() {
  const { data: featuredData, isLoading: featuredLoading } = useFeaturedProducts();
  const { data: mainCategories, isLoading: categoriesLoading } = useMainCategories();

  const featuredProducts = featuredData?.data || [];

  return (
    <div className="flex min-h-screen flex-col bg-[#1a1a2e]">
      <Header />

      <main className="flex-1">
        {/* Hero Banner */}
        <section className="relative bg-gradient-to-r from-primary to-primary/80 text-white overflow-hidden">
          <div className="container mx-auto px-4 py-12 md:py-16">
            <div className="grid md:grid-cols-2 gap-6 md:gap-8 items-center">
              <div className="space-y-6">
                <h1 className="text-4xl md:text-5xl font-bold leading-tight">
                  Los mejores productos
                  <br />
                  <span className="text-yellow-300">al mejor precio</span>
                </h1>
                <p className="text-lg text-white/90 max-w-md">
                  Descubre nuestra amplia selección de productos de confitería al por mayor. Calidad garantizada y entregas rápidas.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Button
                    asChild
                    size="lg"
                    className="bg-white text-primary hover:bg-gray-100 font-semibold"
                  >
                    <Link href="/productos">
                      Ver catálogo
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="border-white text-white hover:bg-white/10"
                  >
                    <Link href="/ofertas">
                      Ver ofertas
                    </Link>
                  </Button>
                </div>
              </div>
              <div className="hidden md:block">
                <div className="relative h-80 w-full">
                  <div className="absolute inset-0 bg-white/10 rounded-2xl" />
                </div>
              </div>
            </div>
          </div>
          {/* Decorative wave */}
          <div className="absolute bottom-0 left-0 right-0">
            <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-12 fill-[#1a1a2e]">
              <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" opacity=".25" />
              <path d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z" opacity=".5" />
              <path d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z" />
            </svg>
          </div>
        </section>

        {/* Features */}
        <section className="py-8 bg-[#1a1a2e]">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              <div className="flex items-center gap-3 p-4 bg-white/5 rounded-lg">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <Truck className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-white">Envío rápido</p>
                  <p className="text-xs text-gray-400">A todo el país</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-white/5 rounded-lg">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <CreditCard className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-white">Pago seguro</p>
                  <p className="text-xs text-gray-400">100% protegido</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-white/5 rounded-lg">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-white">Garantía</p>
                  <p className="text-xs text-gray-400">Productos originales</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-white/5 rounded-lg">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-white">Atención 24/7</p>
                  <p className="text-xs text-gray-400">Soporte continuo</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="py-12 bg-[#1a1a2e]">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-white">Categorías</h2>
              <Link
                href="/productos"
                className="text-primary hover:text-primary/80 text-sm font-medium flex items-center gap-1"
              >
                Ver todas
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            {categoriesLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-32 rounded-lg" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {mainCategories?.slice(0, 6).map((category: Category) => {
                  const config = getCategoryVisualConfig(category.name);
                  return (
                    <Link
                      key={category._id}
                      href={`/productos?categoria=${category._id}`}
                      className="group relative bg-white rounded-lg p-4 text-center hover:shadow-lg transition-all hover:-translate-y-1"
                    >
                      <div className="text-4xl mb-3">{config.emoji}</div>
                      <h3 className="font-medium text-gray-900 text-sm group-hover:text-primary transition-colors">
                        {category.name}
                      </h3>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Featured Products */}
        <section className="py-12 bg-[#1a1a2e]">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                  <Star className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-400 fill-yellow-400" />
                  Productos Destacados
                </h2>
                <p className="text-gray-400 text-sm mt-1">Los más vendidos de la semana</p>
              </div>
              <Link
                href="/productos?featured=true"
                className="text-primary hover:text-primary/80 text-sm font-medium flex items-center gap-1"
              >
                Ver todos
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            {featuredLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-lg overflow-hidden">
                    <Skeleton className="aspect-square" />
                    <div className="p-4 space-y-3">
                      <Skeleton className="h-6 w-20" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                {featuredProducts.slice(0, 10).map((product: ProductParent & { variants?: ProductVariant[] }) => (
                  <ProductCardCentral
                    key={product._id}
                    product={product}
                    variants={product.variants || []}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Promo Banner */}
        <section className="py-12 bg-gradient-to-r from-yellow-500 to-orange-500">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="text-center md:text-left">
                <h2 className="text-3xl font-bold text-white">
                  Ofertas especiales
                </h2>
                <p className="text-white/90 mt-2">
                  Aprovecha nuestras promociones por tiempo limitado
                </p>
              </div>
              <Button
                asChild
                size="lg"
                className="bg-white text-orange-600 hover:bg-gray-100 font-semibold"
              >
                <Link href="/ofertas">
                  Ver ofertas
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-[#1a1a2e]">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-white">
              ¿Listo para hacer tu pedido?
            </h2>
            <p className="mt-4 text-gray-400 max-w-lg mx-auto">
              Explora nuestro catálogo completo y descubre los mejores productos al mejor precio.
            </p>
            <Button
              asChild
              size="lg"
              className="mt-8 bg-primary hover:bg-primary/90 text-white font-semibold"
            >
              <Link href="/productos">
                Ver catálogo completo
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

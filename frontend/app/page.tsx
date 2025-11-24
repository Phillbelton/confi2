'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import {
  HeroSection,
  FeaturesSection,
  CategoriesSection,
  FeaturedProductsSection,
} from '@/components/home';
import { useFeaturedProducts } from '@/hooks/useProducts';
import { useMainCategories } from '@/hooks/useCategories';

export default function HomePage() {
  const { data: featuredData, isLoading: featuredLoading } = useFeaturedProducts();
  const { data: mainCategories, isLoading: categoriesLoading } = useMainCategories();

  const featuredProducts = featuredData?.data || [];

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <HeroSection />

        {/* Features */}
        <FeaturesSection />

        {/* Categories */}
        <CategoriesSection
          categories={mainCategories || []}
          isLoading={categoriesLoading}
        />

        {/* Featured Products */}
        <FeaturedProductsSection
          products={featuredProducts}
          isLoading={featuredLoading}
        />

        {/* CTA Section */}
        <section className="py-12 sm:py-16 bg-gradient-to-br from-primary/5 to-secondary/5">
          <div className="container px-4 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              ¿Listo para hacer tu pedido?
            </h2>
            <p className="mt-4 text-muted-foreground max-w-lg mx-auto">
              Explora nuestro catálogo completo y descubre los mejores productos
              al mejor precio.
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

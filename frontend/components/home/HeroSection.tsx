'use client';

import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5" />

      {/* Decorative Elements */}
      <div className="absolute top-10 right-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-10 left-10 w-24 h-24 bg-secondary/10 rounded-full blur-2xl" />

      <div className="relative container px-4 py-12 sm:py-16 lg:py-24">
        <div className="max-w-2xl mx-auto text-center lg:text-left lg:mx-0">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Sparkles className="h-4 w-4" />
            <span>Descuentos por cantidad</span>
          </div>

          {/* Heading */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
            Confitería{' '}
            <span className="text-primary">Quelita</span>
          </h1>

          <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-lg mx-auto lg:mx-0">
            Los mejores productos de confitería al mejor precio.
            Compra por mayor y ahorra más.
          </p>

          {/* CTA Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
            <Link href="/productos">
              <Button size="lg" className="w-full sm:w-auto">
                Ver catálogo
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/productos?onSale=true">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto"
              >
                <Sparkles className="mr-2 h-5 w-5" />
                Ver ofertas
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

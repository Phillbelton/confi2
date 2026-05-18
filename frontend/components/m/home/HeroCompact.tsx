'use client';

import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export function HeroCompact() {
  return (
    <section className="px-4 pt-3 lg:px-8 lg:pt-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary/90 to-secondary p-5 text-primary-foreground shadow-lg lg:p-12 lg:min-h-[260px] lg:flex lg:items-center"
      >
        <div
          className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/15 blur-2xl lg:h-72 lg:w-72"
          aria-hidden
        />
        <div
          className="absolute -bottom-12 -left-12 h-44 w-44 rounded-full bg-accent/30 blur-3xl lg:h-80 lg:w-80"
          aria-hidden
        />

        <div className="relative z-10 lg:max-w-2xl">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/20 backdrop-blur lg:h-16 lg:w-16">
              <Sparkles className="h-6 w-6 lg:h-8 lg:w-8" />
            </span>
            <div className="flex-1">
              <p className="text-[11px] font-bold uppercase tracking-widest opacity-80 lg:text-sm">
                Confitería Quelita
              </p>
              <h1 className="font-display text-2xl font-bold leading-tight lg:text-5xl">
                Endulzá tu día
              </h1>
            </div>
          </div>

          <p className="mt-3 text-sm opacity-90 lg:mt-5 lg:text-lg lg:max-w-xl">
            Descubrí caramelos, chocolates y bebidas con descuentos por mayor.
          </p>

          <Link
            href="/m/productos"
            className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-bold text-primary shadow-md hover:scale-105 active:scale-95 transition-transform lg:mt-6 lg:px-6 lg:py-3 lg:text-base"
          >
            Ver catálogo
            <ArrowRight className="h-4 w-4 lg:h-5 lg:w-5" />
          </Link>
        </div>
      </motion.div>
    </section>
  );
}

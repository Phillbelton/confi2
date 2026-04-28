'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Bell, Sparkles } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface StickyHeaderProps {
  initialQuery?: string;
}

export function StickyHeader({ initialQuery = '' }: StickyHeaderProps) {
  const router = useRouter();
  const [q, setQ] = useState(initialQuery);
  const [focused, setFocused] = useState(false);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const term = q.trim();
    router.push(term ? `/m/productos?search=${encodeURIComponent(term)}` : '/m/productos');
  };

  return (
    <header
      className={cn(
        'sticky top-0 z-30',
        'pt-[env(safe-area-inset-top)]'
      )}
    >
      {/* Marquee superior — promo strip */}
      <div className="relative overflow-hidden bg-accent text-accent-foreground">
        <div className="flex animate-[marquee_28s_linear_infinite] gap-12 whitespace-nowrap py-1.5 text-[11px] font-bold uppercase tracking-widest">
          {Array.from({ length: 4 }).map((_, i) => (
            <span key={i} className="inline-flex items-center gap-2">
              <Sparkles className="h-3 w-3" />
              31 años endulzando Chile
              <span className="opacity-70">·</span>
              Envíos a todo el país
              <span className="opacity-70">·</span>
              Descuentos por mayor automáticos
              <span className="opacity-70">·</span>
            </span>
          ))}
        </div>
      </div>

      {/* Bloque colorido con logo + saludo + búsqueda */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary via-primary to-secondary text-primary-foreground shadow-lg">
        {/* Decoración blobs */}
        <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/15 blur-2xl" aria-hidden />
        <div className="pointer-events-none absolute -left-10 bottom-0 h-28 w-28 rounded-full bg-accent/30 blur-2xl" aria-hidden />

        <div className="relative z-10 flex items-center gap-3 px-4 pt-3">
          <Link href="/m" className="flex items-center gap-2" aria-label="Inicio Quelita">
            <motion.div
              initial={{ scale: 0.9, rotate: -4 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 12 }}
              className="relative grid h-12 w-12 place-items-center rounded-2xl bg-white/15 p-1 backdrop-blur ring-1 ring-white/30"
            >
              <Image
                src="/brand/logo.png"
                alt="Confitería Quelita"
                width={64}
                height={64}
                priority
                className="h-9 w-auto drop-shadow-md"
              />
            </motion.div>
            <div className="flex flex-col leading-tight">
              <span className="font-handwriting text-xl text-white/90">¡Hola dulce!</span>
              <span className="font-display text-[13px] font-bold uppercase tracking-wider opacity-80">
                Confitería Quelita
              </span>
            </div>
          </Link>

          <button
            type="button"
            className="ml-auto tappable relative grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white backdrop-blur transition-colors hover:bg-white/20"
            aria-label="Notificaciones"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute right-2 top-2 h-2 w-2 animate-pulse rounded-full bg-accent ring-2 ring-primary" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="relative z-10 px-4 pb-5 pt-3">
          <label
            className={cn(
              'group relative block overflow-hidden rounded-full bg-white/95 shadow-lg transition-all',
              focused && 'ring-4 ring-white/30'
            )}
          >
            <span className="sr-only">Buscar productos</span>
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="¿Qué dulce buscás hoy?"
              className={cn(
                'w-full bg-transparent py-3 pl-11 pr-24 text-sm text-foreground',
                'placeholder:text-muted-foreground focus:outline-none'
              )}
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full bg-primary px-4 py-1.5 text-xs font-bold text-primary-foreground shadow-md hover:bg-primary/90 active:scale-95 transition-transform"
            >
              Buscar
            </button>
          </label>
        </form>

        {/* Curva inferior decorativa */}
        <svg
          className="absolute -bottom-px left-0 right-0 w-full text-background"
          viewBox="0 0 1200 24"
          preserveAspectRatio="none"
          aria-hidden
        >
          <path
            d="M0 24 Q 300 0 600 12 T 1200 8 V 24 Z"
            fill="currentColor"
          />
        </svg>
      </div>

    </header>
  );
}

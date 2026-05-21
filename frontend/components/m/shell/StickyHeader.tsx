'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Bell, Sparkles, ShoppingBag, User } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import { useCartStoreM } from '@/store/m/useCartStoreM';
import { CategoriesDropdown } from '@/components/layout/CategoriesDropdown';
import { cn } from '@/lib/utils';

interface StickyHeaderProps {
  initialQuery?: string;
}

export function StickyHeader({ initialQuery = '' }: StickyHeaderProps) {
  const router = useRouter();
  const [q, setQ] = useState(initialQuery);
  const [focused, setFocused] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [bump, setBump] = useState(false);
  const itemCount = useCartStoreM((s) => s.itemCount);
  const prevCount = useRef(itemCount);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (itemCount !== prevCount.current) {
      prevCount.current = itemCount;
      if (itemCount > 0) {
        setBump(true);
        const t = setTimeout(() => setBump(false), 360);
        return () => clearTimeout(t);
      }
    }
  }, [itemCount]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const term = q.trim();
    router.push(
      term ? `/m/productos?search=${encodeURIComponent(term)}` : '/m/productos'
    );
  };

  return (
    <header className={cn('sticky top-0 z-30', 'pt-[env(safe-area-inset-top)]')}>
      {/* ============================ Marquee superior — promo strip ============================ */}
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

      {/* ============================ Bloque principal ============================ */}
      <div
        className={cn(
          'relative overflow-hidden bg-gradient-to-br from-primary via-primary to-secondary text-primary-foreground transition-shadow duration-300',
          scrolled ? 'shadow-2xl' : 'shadow-md'
        )}
      >
        {/* Decoración blobs */}
        <div
          className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/15 blur-2xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -left-10 bottom-0 h-28 w-28 rounded-full bg-accent/30 blur-2xl"
          aria-hidden
        />

        {/* ---------------------------- MOBILE: logo + búsqueda + notificaciones en una fila ---------------------------- */}
        <div className="mx-auto w-full max-w-screen-md lg:hidden">
          <div className="relative z-10 flex items-center gap-2.5 px-4 py-3">
            <Link href="/m" className="flex shrink-0 items-center" aria-label="Inicio Quelita">
              <motion.div
                initial={{ scale: 0.9, rotate: -4 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 12 }}
                className="relative grid h-12 w-16 place-items-center rounded-2xl bg-white/15 p-1 backdrop-blur ring-1 ring-white/30"
              >
                <Image
                  src="/brand/logo.png"
                  alt="Confitería Quelita"
                  width={96}
                  height={64}
                  priority
                  className="h-9 w-auto drop-shadow-md"
                />
              </motion.div>
            </Link>

            <form onSubmit={onSubmit} className="min-w-0 flex-1">
              <SearchField
                q={q}
                setQ={setQ}
                focused={focused}
                setFocused={setFocused}
              />
            </form>

            <button
              type="button"
              className="tappable relative grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/10 text-white backdrop-blur transition-colors hover:bg-white/20"
              aria-label="Notificaciones"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute right-2.5 top-2.5 h-2 w-2 animate-pulse rounded-full bg-accent ring-2 ring-primary" />
            </button>
          </div>
        </div>

        {/* ---------------------------- DESKTOP: layout horizontal estilo Jumbo ---------------------------- */}
        <div className="hidden lg:block">
          <div className="relative z-10 mx-auto flex w-full max-w-[1440px] items-center gap-6 px-8 py-4">
            <Link
              href="/m"
              className="flex shrink-0 items-center gap-3"
              aria-label="Inicio Quelita"
            >
              <div className="relative grid h-14 w-14 place-items-center rounded-2xl bg-white/15 p-1 backdrop-blur ring-1 ring-white/30">
                <Image
                  src="/brand/logo.png"
                  alt="Confitería Quelita"
                  width={64}
                  height={64}
                  priority
                  className="h-10 w-auto drop-shadow-md"
                />
              </div>
            </Link>

            {/* Selector de categorías (dropdown con mega-panel hover) */}
            <CategoriesDropdown basePath="/m/productos" useSlug />

            {/* Search expandido */}
            <form onSubmit={onSubmit} className="flex-1 max-w-2xl">
              <SearchField
                q={q}
                setQ={setQ}
                focused={focused}
                setFocused={setFocused}
              />
            </form>

            {/* CTAs derecha: Cuenta + Carrito */}
            <div className="ml-auto flex shrink-0 items-center gap-2">
              <Link
                href="/m/cuenta"
                className="tappable inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur transition-colors hover:bg-white/25"
                aria-label="Cuenta"
              >
                <User className="h-4 w-4" />
                <span>Cuenta</span>
              </Link>
              <Link
                href="/m/carrito"
                className="tappable relative inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur transition-colors hover:bg-white/25"
                aria-label="Carrito"
              >
                <ShoppingBag className="h-4 w-4" />
                <span>Carrito</span>
                {itemCount > 0 && (
                  <span
                    className={cn(
                      'ml-0.5 grid h-5 min-w-[20px] place-items-center rounded-full bg-accent px-1 text-[10px] font-bold leading-none text-accent-foreground',
                      bump && 'stepper-bump'
                    )}
                  >
                    {itemCount > 99 ? '99+' : itemCount}
                  </span>
                )}
              </Link>
            </div>
          </div>

        </div>

        {/* Curva inferior decorativa */}
        <svg
          className="absolute -bottom-px left-0 right-0 w-full text-background"
          viewBox="0 0 1200 24"
          preserveAspectRatio="none"
          aria-hidden
        >
          <path d="M0 24 Q 300 0 600 12 T 1200 8 V 24 Z" fill="currentColor" />
        </svg>
      </div>
    </header>
  );
}

interface SearchFieldProps {
  q: string;
  setQ: (v: string) => void;
  focused: boolean;
  setFocused: (v: boolean) => void;
}

function SearchField({ q, setQ, focused, setFocused }: SearchFieldProps) {
  return (
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
  );
}

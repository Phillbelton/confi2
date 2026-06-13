'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Clock, Search, Sparkles, ShoppingBag, Tag, User } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { useCartStoreM } from '@/store/m/useCartStoreM';
import { useClientStore } from '@/store/useClientStore';
import { CategoriesDropdown } from '@/components/layout/CategoriesDropdown';
import { MobileMenuDrawer } from './MobileMenuDrawer';
import { cn } from '@/lib/utils';

const QUICK_LINKS = [
  { label: 'Ofertas', href: '/productos?onSale=true', icon: Tag },
  { label: 'Destacados', href: '/productos?featured=true', icon: Sparkles },
  { label: 'Novedades', href: '/productos?sort=newest', icon: Clock },
];

export function StickyHeader() {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [focused, setFocused] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const itemCount = useCartStoreM((s) => s.itemCount);

  // Enlace de cuenta consciente de sesión. Se gatea con _hasHydrated para
  // que SSR y primer paint cliente coincidan (evita hydration mismatch).
  const isAuthenticated = useClientStore((s) => s.isAuthenticated);
  const hydrated = useClientStore((s) => s._hasHydrated);
  const loggedIn = hydrated && isAuthenticated;
  const accountHref = loggedIn ? '/perfil' : '/login';
  const accountLabel = loggedIn ? 'Mi cuenta' : 'Iniciar sesión';
  // Preserve original UX: badge ya cargado del carrito persistido no debe
  // bumpear al primer paint; sí debe bumpear ante cambios reales.
  // useState con lazy init captura el valor del primer render como una
  // constante estable, sin necesidad de leer ref.current durante render.
  const [initialItemCount] = useState(itemCount);
  const shouldBump = itemCount !== initialItemCount;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const term = q.trim();
    router.push(
      term ? `/productos?search=${encodeURIComponent(term)}` : '/productos'
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
          'relative overflow-hidden bg-gradient-to-br from-primary via-primary to-secondary candy-bg text-primary-foreground transition-shadow duration-300',
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

        {/* ---------------------------- MOBILE: hamburguesa + logo + cuenta + carrito, búsqueda debajo ---------------------------- */}
        <div className="mx-auto w-full max-w-screen-md lg:hidden">
          <div className="relative z-10 flex items-center gap-2 px-4 pt-3">
            <MobileMenuDrawer />

            <Link
              href="/"
              className="flex shrink-0 items-center"
              aria-label="Inicio Quelita"
            >
              <Image
                src="/brand/logo.png"
                alt="Confitería Quelita"
                width={120}
                height={78}
                priority
                className="h-9 w-auto drop-shadow-md"
              />
            </Link>

            <div className="ml-auto flex shrink-0 items-center gap-0.5">
              <Link
                href={accountHref}
                className="tappable inline-flex items-center gap-1.5 rounded-full px-2.5 py-2 text-[11px] font-semibold text-white transition-colors hover:bg-white/15"
                aria-label={accountLabel}
              >
                <User className="h-5 w-5" />
                <span>{accountLabel}</span>
              </Link>

              <Link
                href="/carrito"
                className="tappable relative grid h-10 w-10 place-items-center rounded-full text-white transition-colors hover:bg-white/15"
                aria-label="Carrito"
              >
                <ShoppingBag className="h-5 w-5" />
                {itemCount > 0 && (
                  <span
                    key={itemCount}
                    className={cn(
                      'absolute right-0.5 top-0.5 grid h-4 min-w-[16px] place-items-center rounded-full bg-accent px-1 text-[9px] font-bold leading-none text-accent-foreground',
                      shouldBump && 'stepper-bump'
                    )}
                  >
                    {itemCount > 99 ? '99+' : itemCount}
                  </span>
                )}
              </Link>
            </div>
          </div>

          <form onSubmit={onSubmit} className="relative z-10 px-4 pb-5 pt-3">
            <SearchField
              q={q}
              setQ={setQ}
              focused={focused}
              setFocused={setFocused}
            />
          </form>
        </div>

        {/* ---------------------------- DESKTOP: layout horizontal estilo Jumbo ---------------------------- */}
        <div className="hidden lg:block">
          <div className="relative z-10 mx-auto flex w-full max-w-[1440px] items-center gap-6 px-8 py-4">
            <Link
              href="/"
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
            <CategoriesDropdown basePath="/productos" useSlug />

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
                href={accountHref}
                className="tappable inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur transition-colors hover:bg-white/25"
                aria-label={accountLabel}
              >
                <User className="h-4 w-4" />
                <span>{accountLabel}</span>
              </Link>
              <Link
                href="/carrito"
                className="tappable relative inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur transition-colors hover:bg-white/25"
                aria-label="Carrito"
              >
                <ShoppingBag className="h-4 w-4" />
                <span>Carrito</span>
                {itemCount > 0 && (
                  <span
                    key={itemCount}
                    className={cn(
                      'ml-0.5 grid h-5 min-w-[20px] place-items-center rounded-full bg-accent px-1 text-[10px] font-bold leading-none text-accent-foreground',
                      shouldBump && 'stepper-bump'
                    )}
                  >
                    {itemCount > 99 ? '99+' : itemCount}
                  </span>
                )}
              </Link>
            </div>
          </div>

          {/* Fila de accesos rápidos — mismo set que el drawer mobile */}
          <nav
            aria-label="Accesos rápidos"
            className="relative z-10 border-t border-white/10"
          >
            <div className="mx-auto flex w-full max-w-[1440px] items-center gap-1 px-8 py-1.5">
              {QUICK_LINKS.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-semibold text-white/85 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </nav>
        </div>

        {/* Remate inferior: hilo candy que ancla el header al fondo crema de
            la página (reemplaza la onda que dejaba una franja clara flotando
            sobre el contenido al scrollear). */}
        <div
          className="relative z-10 h-[3px] bg-gradient-to-r from-accent via-secondary to-accent"
          aria-hidden
        />
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
        placeholder="¿Qué dulce buscas hoy?"
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

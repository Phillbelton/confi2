'use client';

import {
  useCallback, useEffect, useMemo, useRef, useState,
  type CSSProperties, type FormEvent, type KeyboardEvent,
} from 'react';
import { createPortal } from 'react-dom';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { useDebounce } from 'use-debounce';
import { buildSrcSet, SIZESET } from '@/lib/imageSrcset';
import { effectiveUnitPrice, minQuantity, priceFrom } from '@/lib/discountCalculator';
import { useSearchSuggestions } from '@/hooks/useProducts';
import { useRecentSearches } from '@/hooks/useRecentSearches';
import { SearchSuggestions, type SuggestItem } from './SearchSuggestions';
import { cn } from '@/lib/utils';
import type { Product } from '@/types';

interface NavbarSearchProps {
  /** Clases para el <form> contenedor (ej. anchos del layout desktop). */
  className?: string;
  /** Sufijo para IDs únicos cuando hay varias instancias (mobile/desktop). */
  idSuffix: string;
  /** Activa el atajo de teclado "/" para enfocar (solo la instancia desktop). */
  enableSlashShortcut?: boolean;
}

/** Etiqueta de precio "desde $X" / "$X" replicando la lógica de la card. */
function priceLabel(p: Product): string {
  const minQ = minQuantity(p);
  const ppu = effectiveUnitPrice(p, Math.max(minQ, 1));
  const multi = (p.presentaciones?.length ?? 0) > 1;
  const shown = multi ? priceFrom(p) : ppu;
  const showFrom = multi || (p.tiers?.length ?? 0) > 0;
  return `${showFrom ? 'desde ' : ''}$${Math.round(shown).toLocaleString('es-CL')}`;
}

/**
 * Buscador del navbar con autocompletado en vivo.
 *
 * - Dropdown con productos (miniatura + precio) y accesos a categorías/marcas/
 *   colecciones, navegable con teclado.
 * - Búsquedas recientes cuando el campo está vacío.
 * - En `/productos` filtra la grilla en vivo (escribe `search` en la URL con
 *   debounce mientras el campo tiene foco); desde cualquier otra página, el
 *   submit navega al catálogo.
 *
 * Hay dos instancias montadas (mobile y desktop). Para que no se pisen, solo la
 * instancia con foco escribe la URL; las demás reflejan el `search` actual.
 */
export function NavbarSearch({ className, idSuffix, enableSlashShortcut }: NavbarSearchProps) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const isCatalog = pathname?.startsWith('/productos') ?? false;

  const [q, setQ] = useState('');
  const [focused, setFocused] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [mounted, setMounted] = useState(false);
  const [anchor, setAnchor] = useState<CSSProperties>();

  const inputRef = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLLabelElement>(null);

  const [debouncedQ] = useDebounce(q, 250);
  const term = q.trim();
  const hasQuery = term.length >= 2;

  const { data: sugg, isFetching } = useSearchSuggestions(debouncedQ);
  const { recent, add, remove, clear } = useRecentSearches();

  const listId = `navbar-search-${idSuffix}`;

  useEffect(() => setMounted(true), []);

  // ── Sincronía con la URL (solo /productos) ───────────────────────────────
  // Cuando NO estoy enfocado, mi valor refleja `search` de la URL (navegación,
  // limpieza, o lo que escribió la otra instancia). Con foco no se pisa.
  useEffect(() => {
    if (focused) return;
    setQ(isCatalog ? (sp.get('search') ?? '') : '');
  }, [sp, isCatalog, focused]);

  // Filtrado en vivo: con foco y en el catálogo, empujo `search` con debounce.
  useEffect(() => {
    if (!focused || !isCatalog) return;
    const current = sp.get('search') ?? '';
    const next = debouncedQ.trim();
    if (next === current) return;
    const params = new URLSearchParams(sp.toString());
    if (next) params.set('search', next);
    else params.delete('search');
    router.replace(`/productos?${params.toString()}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQ, focused, isCatalog]);

  // Reset de la selección de teclado al cambiar el texto.
  useEffect(() => setActiveIndex(-1), [q]);

  // ── Posición del dropdown (fixed, medido) ────────────────────────────────
  // El header tiene overflow-hidden, así que el panel se ancla por medición y
  // se renderiza vía portal para no quedar recortado.
  useEffect(() => {
    if (!open) return;
    const measure = () => {
      const el = wrapRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      setAnchor({ position: 'fixed', top: r.bottom + 6, left: r.left, width: r.width });
    };
    measure();
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [open]);

  // ── Atajo "/" para enfocar (desktop) ─────────────────────────────────────
  useEffect(() => {
    if (!enableSlashShortcut) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key !== '/') return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      e.preventDefault();
      inputRef.current?.focus();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [enableSlashShortcut]);

  // ── Acciones ─────────────────────────────────────────────────────────────
  const close = useCallback(() => {
    setOpen(false);
    setActiveIndex(-1);
    inputRef.current?.blur();
  }, []);

  const searchFor = useCallback(
    (raw: string) => {
      const t = raw.trim();
      if (t) add(t);
      close();
      if (isCatalog) {
        const params = new URLSearchParams(sp.toString());
        if (t) params.set('search', t);
        else params.delete('search');
        router.push(`/productos?${params.toString()}`);
      } else {
        router.push(t ? `/productos?search=${encodeURIComponent(t)}` : '/productos');
      }
    },
    [add, close, isCatalog, router, sp]
  );

  const navigate = useCallback(
    (href: string) => {
      close();
      router.push(href);
    },
    [close, router]
  );

  // Entradas del dropdown: item de presentación + acción al activar, alineados
  // por índice para la navegación con teclado.
  const entries = useMemo<Array<{ item: SuggestItem; run: () => void }>>(() => {
    const out: Array<{ item: SuggestItem; run: () => void }> = [];
    if (hasQuery) {
      for (const p of sugg?.products ?? []) {
        out.push({
          item: {
            key: `p-${p._id}`,
            group: 'product',
            label: p.name,
            sublabel: priceLabel(p),
            img: buildSrcSet(p.images?.[0], SIZESET.thumb),
          },
          run: () => navigate(`/productos/${p.slug}`),
        });
      }
      for (const c of sugg?.categories ?? []) {
        out.push({
          item: { key: `cat-${c._id}`, group: 'category', label: c.name },
          run: () => navigate(`/productos?categoria=${c.slug}`),
        });
      }
      for (const b of sugg?.brands ?? []) {
        out.push({
          item: { key: `br-${b._id}`, group: 'brand', label: b.name },
          run: () => navigate(`/productos?brands=${b.slug}`),
        });
      }
      for (const c of sugg?.collections ?? []) {
        out.push({
          item: { key: `co-${c._id}`, group: 'collection', label: c.name },
          run: () => navigate(`/productos?coleccion=${c.slug}`),
        });
      }
      out.push({
        item: { key: 'all', group: 'all', label: `Ver todos los resultados de “${term}”` },
        run: () => searchFor(term),
      });
    } else {
      for (const t of recent) {
        out.push({
          item: { key: `re-${t}`, group: 'recent', label: t, term: t },
          run: () => searchFor(t),
        });
      }
    }
    return out;
  }, [hasQuery, sugg, recent, term, navigate, searchFor]);

  const items = useMemo(() => entries.map((e) => e.item), [entries]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (open && activeIndex >= 0 && entries[activeIndex]) {
      entries[activeIndex].run();
      return;
    }
    searchFor(q);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setActiveIndex((i) => Math.min(entries.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(-1, i - 1));
    } else if (e.key === 'Escape') {
      setOpen(false);
      setActiveIndex(-1);
    }
  };

  return (
    <form onSubmit={onSubmit} className={cn('relative', className)}>
      <label
        ref={wrapRef}
        className={cn(
          'group relative block overflow-hidden rounded-full bg-white/95 shadow-lg transition-all',
          focused && 'ring-4 ring-white/30'
        )}
      >
        <span className="sr-only">Buscar productos</span>
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
        <input
          ref={inputRef}
          type="search"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={activeIndex >= 0 ? `${listId}-opt-${activeIndex}` : undefined}
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            setFocused(true);
            setOpen(true);
          }}
          onBlur={() => {
            setFocused(false);
            setOpen(false);
          }}
          onKeyDown={onKeyDown}
          placeholder="¿Qué dulce buscas hoy?"
          className={cn(
            'w-full bg-transparent py-3 pl-11 pr-[5.75rem] text-sm text-foreground',
            'placeholder:text-muted-foreground focus:outline-none',
            '[&::-webkit-search-cancel-button]:appearance-none'
          )}
        />
        {q && (
          <button
            type="button"
            aria-label="Limpiar búsqueda"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              setQ('');
              inputRef.current?.focus();
            }}
            className="absolute right-[4.75rem] top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        <button
          type="submit"
          className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full bg-primary px-4 py-1.5 text-xs font-bold text-primary-foreground shadow-md transition-transform hover:bg-primary/90 active:scale-95"
        >
          Buscar
        </button>
      </label>

      {mounted && open && anchor &&
        createPortal(
          <SearchSuggestions
            style={anchor}
            query={q}
            isLoading={isFetching}
            items={items}
            activeIndex={activeIndex}
            listId={listId}
            onActivate={(i) => entries[i]?.run()}
            onHover={setActiveIndex}
            onRemoveRecent={remove}
            onClearRecent={clear}
          />,
          document.body
        )}
    </form>
  );
}

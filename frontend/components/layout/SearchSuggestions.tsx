'use client';

import { useEffect, useRef, type CSSProperties } from 'react';
import {
  Search, Package, TrendingUp, Clock, Tag, FolderTree, Layers, X,
} from 'lucide-react';
import type { SrcsetResult } from '@/lib/imageSrcset';
import { cn } from '@/lib/utils';

export type SuggestGroup =
  | 'recent' | 'product' | 'category' | 'brand' | 'collection' | 'all';

/** Una fila navegable del dropdown. La acción la resuelve el contenedor por índice. */
export interface SuggestItem {
  key: string;
  group: SuggestGroup;
  label: string;
  /** Línea secundaria: precio para productos, tipo para entidades. */
  sublabel?: string;
  /** Miniatura (productos). */
  img?: SrcsetResult;
  /** Término original (filas de 'recent', para poder borrarlo). */
  term?: string;
}

interface SearchSuggestionsProps {
  /** Estilo de anclaje (position fixed + top/left/width medidos por el contenedor). */
  style?: CSSProperties;
  query: string;
  isLoading: boolean;
  items: SuggestItem[];
  activeIndex: number;
  listId: string;
  onActivate: (index: number) => void;
  onHover: (index: number) => void;
  onRemoveRecent?: (term: string) => void;
  onClearRecent?: () => void;
}

const GROUP_LABEL: Record<SuggestGroup, string> = {
  recent: 'Búsquedas recientes',
  product: 'Productos',
  category: 'Categorías',
  brand: 'Marcas',
  collection: 'Colecciones',
  all: '',
};

/** Resalta (case-insensitive) la parte del label que coincide con el query. */
function highlight(label: string, query: string) {
  const q = query.trim();
  if (!q) return label;
  const idx = label.toLowerCase().indexOf(q.toLowerCase());
  if (idx < 0) return label;
  return (
    <>
      {label.slice(0, idx)}
      <mark className="bg-transparent font-bold text-primary">{label.slice(idx, idx + q.length)}</mark>
      {label.slice(idx + q.length)}
    </>
  );
}

function GroupIcon({ group }: { group: SuggestGroup }) {
  const cls = 'h-4 w-4 text-muted-foreground';
  switch (group) {
    case 'recent': return <Clock className={cls} />;
    case 'category': return <FolderTree className={cls} />;
    case 'brand': return <Tag className={cls} />;
    case 'collection': return <Layers className={cls} />;
    default: return <Search className={cls} />;
  }
}

export function SearchSuggestions({
  style,
  query,
  isLoading,
  items,
  activeIndex,
  listId,
  onActivate,
  onHover,
  onRemoveRecent,
  onClearRecent,
}: SearchSuggestionsProps) {
  const hasQuery = query.trim().length >= 2;
  const recentMode = !hasQuery;
  const containerRef = useRef<HTMLDivElement>(null);

  // Mantener el ítem activo (teclado) visible dentro del scroll del panel.
  useEffect(() => {
    if (activeIndex < 0 || !containerRef.current) return;
    const el = containerRef.current.querySelector<HTMLElement>(`#${listId}-opt-${activeIndex}`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, listId]);

  // En modo recientes sin historial no hay nada que mostrar.
  if (recentMode && items.length === 0) return null;

  const resultItems = items.filter((i) => i.group !== 'all');
  const showEmpty = hasQuery && !isLoading && resultItems.length === 0;

  return (
    <div
      ref={containerRef}
      className="fixed z-[100] overflow-hidden rounded-2xl border border-border bg-background text-foreground shadow-2xl"
      style={style}
    >
      {/* Encabezado del modo recientes con acción de limpiar. */}
      {recentMode && (
        <div className="flex items-center justify-between border-b border-border px-3 py-2">
          <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
            {GROUP_LABEL.recent}
          </span>
          {onClearRecent && (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={onClearRecent}
              className="text-[11px] font-semibold text-primary hover:underline"
            >
              Borrar
            </button>
          )}
        </div>
      )}

      {hasQuery && isLoading && resultItems.length === 0 ? (
        <div className="p-4 text-center text-sm text-muted-foreground">Buscando…</div>
      ) : showEmpty ? (
        <div className="px-4 py-4 text-center text-sm text-muted-foreground">
          No encontramos productos para “{query.trim()}”
        </div>
      ) : (
        <ul role="listbox" id={listId} className="max-h-[min(70vh,420px)] overflow-y-auto py-1">
          {items.map((item, i) => {
            const prev = items[i - 1];
            const showHeader =
              !recentMode &&
              item.group !== 'all' &&
              (!prev || prev.group !== item.group);
            const active = i === activeIndex;

            return (
              <li key={item.key}>
                {showHeader && (
                  <div className="px-3 pb-1 pt-2 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                    {GROUP_LABEL[item.group]}
                  </div>
                )}

                {item.group === 'all' ? (
                  <button
                    type="button"
                    id={`${listId}-opt-${i}`}
                    role="option"
                    aria-selected={active}
                    onMouseEnter={() => onHover(i)}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => onActivate(i)}
                    className={cn(
                      'mt-1 flex w-full items-center justify-center gap-2 border-t border-border px-3 py-2.5 text-sm font-semibold text-primary transition-colors',
                      active ? 'bg-primary/10' : 'hover:bg-muted/60'
                    )}
                  >
                    <TrendingUp className="h-4 w-4" />
                    {item.label}
                  </button>
                ) : (
                  <div
                    id={`${listId}-opt-${i}`}
                    role="option"
                    aria-selected={active}
                    onMouseEnter={() => onHover(i)}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => onActivate(i)}
                    className={cn(
                      'flex w-full cursor-pointer items-center gap-3 px-3 py-2 text-left transition-colors',
                      active ? 'bg-muted' : 'hover:bg-muted/60'
                    )}
                  >
                    {/* Miniatura para productos; ícono para entidades/recientes. */}
                    {item.group === 'product' ? (
                      item.img?.src ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.img.src}
                          srcSet={item.img.srcSet}
                          alt=""
                          sizes="40px"
                          className="h-10 w-10 flex-shrink-0 rounded-md object-cover"
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <span className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-md bg-muted">
                          <Package className="h-5 w-5 text-muted-foreground" />
                        </span>
                      )
                    ) : (
                      <span className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-md bg-muted">
                        <GroupIcon group={item.group} />
                      </span>
                    )}

                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm">{highlight(item.label, query)}</span>
                      {item.sublabel && (
                        <span className="block truncate text-xs text-muted-foreground">
                          {item.sublabel}
                        </span>
                      )}
                    </span>

                    {/* Borrar reciente. */}
                    {item.group === 'recent' && item.term && onRemoveRecent ? (
                      <button
                        type="button"
                        aria-label={`Quitar ${item.term} del historial`}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveRecent(item.term!);
                        }}
                        className="grid h-7 w-7 flex-shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-muted-foreground/10 hover:text-foreground"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    ) : (
                      item.group !== 'recent' && (
                        <Search className="h-4 w-4 flex-shrink-0 text-muted-foreground/60" />
                      )
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

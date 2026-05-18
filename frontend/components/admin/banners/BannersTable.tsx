'use client';

import { Pencil, Trash2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { buildSrcSet, SIZESET } from '@/lib/imageSrcset';
import type { Banner } from '@/types';

const PLACEMENT_LABEL: Record<string, string> = {
  home_hero: 'Hero',
  home_promo: 'Promociones',
  home_secondary: 'Home 2°',
  category_top: 'Categoría',
  collection_top: 'Colección',
};

const LINK_LABEL: Record<string, string> = {
  collection: 'Colección',
  category: 'Categoría',
  product: 'Producto',
  external: 'URL',
  none: '—',
};

interface BannersTableProps {
  banners: Banner[];
  onEdit: (b: Banner) => void;
  onDelete: (id: string) => void;
  isDeleting?: boolean;
}

export function BannersTable({ banners, onEdit, onDelete, isDeleting }: BannersTableProps) {
  if (banners.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          No hay banners todavía. Creá el primero.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="divide-y">
          {banners.map((b) => {
            const attrs = buildSrcSet(b.image, SIZESET.hero);
            const scheduled = !!b.startDate || !!b.endDate;
            return (
              <div
                key={b._id}
                className="flex items-center gap-3 p-3 hover:bg-muted/30"
              >
                {/* thumb */}
                <div className="relative h-12 w-20 shrink-0 overflow-hidden rounded-md bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={attrs.src}
                    srcSet={attrs.srcSet}
                    alt=""
                    sizes="80px"
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                </div>

                {/* info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="truncate text-sm font-semibold">
                      {b.title || <span className="italic text-muted-foreground">Sin título</span>}
                    </p>
                    <Badge variant="outline" className="text-[10px]">
                      {PLACEMENT_LABEL[b.placement] || b.placement}
                    </Badge>
                    <Badge variant="outline" className="text-[10px]">
                      {b.size}
                    </Badge>
                    {!b.active && (
                      <Badge variant="secondary" className="text-[10px]">
                        Inactivo
                      </Badge>
                    )}
                    {scheduled && (
                      <Badge variant="outline" className="text-[10px]">
                        ⏰ programado
                      </Badge>
                    )}
                  </div>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {b.subtitle || '—'} {' · '}
                    Link: <span className="font-medium">{LINK_LABEL[b.link?.type] || '—'}</span>
                    {b.link?.target && (
                      <span className="ml-1 text-primary">→ {b.link.target}</span>
                    )}
                  </p>
                </div>

                {/* actions */}
                <div className="flex shrink-0 gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onEdit(b)}
                    aria-label="Editar"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      if (confirm(`¿Eliminar banner "${b.title || 'sin título'}"?`)) {
                        onDelete(b._id);
                      }
                    }}
                    disabled={isDeleting}
                    aria-label="Eliminar"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  GalleryHorizontalEnd,
  LayoutGrid,
  Images,
  Gift,
  Megaphone,
  Plus,
  Pencil,
  Trash2,
  GripVertical,
  ChevronDown,
  ExternalLink,
  Ruler,
  Loader2,
  ImageOff,
  Package,
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
  arrayMove,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { buildSrcSet, SIZESET } from '@/lib/imageSrcset';
import { cn } from '@/lib/utils';
import { useAdminBanners, useBannerOperations } from '@/hooks/admin/useAdminBanners';
import { useHomeCollections } from '@/hooks/useCollections';
import { FranjaZoneEditor } from '@/components/admin/banners/FranjaZoneEditor';
import {
  DimensionHint,
  HERO_SPEC,
  COLLECTION_SPEC,
} from '@/components/admin/banners/DimensionHint';
import type { Banner, Collection } from '@/types';

/**
 * Wireframe de la home completa: muestra todos los bloques de imágenes en el
 * orden real de la página (hero, colecciones, banners secundarios, promociones)
 * como un mapa editable. Las secciones de productos aparecen como placeholders
 * inertes para dar contexto — se llenan solas desde el catálogo.
 *
 * El orden acá refleja el de la home pública (app/(tienda)/page.tsx).
 */
export function HomeWireframe() {
  return (
    <div className="space-y-1">
      <p className="mb-3 text-sm text-muted-foreground">
        Así se arma la home, de arriba hacia abajo. Editá los bloques de
        imágenes; las secciones de productos se completan automáticamente desde
        el catálogo.
      </p>

      <SectionBlock
        icon={<GalleryHorizontalEnd className="h-4 w-4" />}
        title="Hero — carrusel principal"
        typeLabel="Imágenes"
      >
        <HeroBlock />
      </SectionBlock>

      <Connector />
      <ProductPlaceholder title="Ofertas" emoji="🔥" />

      <Connector />
      <SectionBlock
        icon={<Images className="h-4 w-4" />}
        title="Huinchas / banners secundarios"
        typeLabel="Imágenes · franjas"
      >
        <FranjaZoneEditor placement="home_secondary" />
      </SectionBlock>

      <Connector />
      <ProductPlaceholder title="Destacados" emoji="⭐" />

      <Connector />
      <SectionBlock
        icon={<LayoutGrid className="h-4 w-4" />}
        title="Colecciones"
        typeLabel="Imágenes"
      >
        <CollectionsBlock />
      </SectionBlock>

      <Connector />
      <StaticBlock
        title="Comprá por mayor"
        description="Banner promocional fijo (definido en el código, no editable acá)."
      />

      <Connector />
      <ProductPlaceholder title="Novedades" emoji="✨" />

      <Connector />
      <SectionBlock
        icon={<Gift className="h-4 w-4" />}
        title="Promociones"
        typeLabel="Imágenes · franjas"
      >
        <FranjaZoneEditor placement="home_promo" />
      </SectionBlock>

      <Connector />
      <ProductPlaceholder title="Más vendidos" emoji="🏆" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Layout helpers                                                      */
/* ------------------------------------------------------------------ */

function Connector() {
  return (
    <div className="flex justify-center py-1" aria-hidden>
      <ChevronDown className="h-4 w-4 text-muted-foreground/40" />
    </div>
  );
}

interface SectionBlockProps {
  icon: React.ReactNode;
  title: string;
  typeLabel: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}

/** Bloque editable de imágenes (acento de color). */
function SectionBlock({ icon, title, typeLabel, action, children }: SectionBlockProps) {
  return (
    <Card className="overflow-hidden border-l-4 border-l-primary">
      <div className="flex items-center justify-between gap-3 border-b bg-primary/5 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-md bg-primary/10 text-primary">
            {icon}
          </span>
          <span className="text-sm font-semibold">{title}</span>
          <Badge variant="outline" className="text-[10px] font-normal">
            {typeLabel}
          </Badge>
        </div>
        {action}
      </div>
      <CardContent className="p-4">{children}</CardContent>
    </Card>
  );
}

/** Placeholder inerte: sección de productos automática. */
function ProductPlaceholder({ title, emoji }: { title: string; emoji: string }) {
  return (
    <div className="rounded-xl border border-dashed bg-muted/30 px-4 py-3">
      <div className="mb-2 flex items-center gap-2">
        <span aria-hidden>{emoji}</span>
        <span className="text-sm font-medium text-muted-foreground">{title}</span>
        <Badge variant="secondary" className="gap-1 text-[10px] font-normal">
          <Package className="h-3 w-3" />
          Productos · automático
        </Badge>
      </div>
      <div className="flex gap-2 overflow-hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-12 flex-1 rounded-lg bg-muted-foreground/10"
            aria-hidden
          />
        ))}
      </div>
    </div>
  );
}

/** Bloque fijo definido en código (no editable). */
function StaticBlock({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-xl border border-dashed bg-muted/30 px-4 py-3">
      <div className="flex items-center gap-2">
        <Megaphone className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium text-muted-foreground">{title}</span>
        <Badge variant="secondary" className="text-[10px] font-normal">
          Fijo
        </Badge>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Hero — carrusel de slides (placement=home_hero)                     */
/* ------------------------------------------------------------------ */

function HeroBlock() {
  const router = useRouter();
  const { data: heroes = [], isLoading } = useAdminBanners('home_hero');
  const { saveLayout, remove, isRemoving } = useBannerOperations();

  const [items, setItems] = useState<Banner[]>([]);
  const key = heroes.map((h) => `${h._id}:${h.order}`).join('|');
  useEffect(() => {
    setItems([...heroes].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = items.findIndex((b) => b._id === active.id);
    const to = items.findIndex((b) => b._id === over.id);
    if (from === -1 || to === -1) return;
    const next = arrayMove(items, from, to);
    setItems(next);
    saveLayout(next.map((b, i) => ({ id: b._id, order: i })));
  };

  const handleDelete = (id: string) => {
    if (!confirm('¿Eliminar este slide del hero?')) return;
    setItems((prev) => prev.filter((b) => b._id !== id));
    remove(id);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <Ruler className="h-3 w-3 shrink-0" />
        <span>Tamaño ideal por slide:</span>
        <DimensionHint spec={HERO_SPEC} />
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map((b) => b._id)} strategy={horizontalListSortingStrategy}>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {items.map((b) => (
              <HeroSlide
                key={b._id}
                banner={b}
                isRemoving={isRemoving}
                onEdit={() => router.push(`/admin/banners/${b._id}`)}
                onDelete={() => handleDelete(b._id)}
              />
            ))}

            <button
              type="button"
              onClick={() => router.push('/admin/banners/new?placement=home_hero')}
              className="grid aspect-[1920/364] w-[20rem] shrink-0 place-items-center rounded-xl border-2 border-dashed text-sm text-muted-foreground transition hover:border-primary hover:text-primary"
            >
              <span className="flex flex-col items-center gap-1">
                <Plus className="h-5 w-5" />
                Agregar slide
              </span>
            </button>
          </div>
        </SortableContext>
      </DndContext>

      {items.length > 1 && (
        <p className="text-xs text-muted-foreground">
          Arrastrá los slides para cambiar el orden del carrusel.
        </p>
      )}
    </div>
  );
}

function HeroSlide({
  banner,
  isRemoving,
  onEdit,
  onDelete,
}: {
  banner: Banner;
  isRemoving: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: banner._id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 'auto',
  };

  const attrs = buildSrcSet(banner.image, SIZESET.hero);
  const hasImage = !!banner.image && !banner.image.includes('placeholder');

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group relative aspect-[1920/364] w-[20rem] shrink-0 overflow-hidden rounded-xl border bg-muted shadow-sm"
    >
      {hasImage ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={attrs.src}
          srcSet={attrs.srcSet}
          alt={banner.title || ''}
          sizes="320px"
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 grid place-items-center text-muted-foreground/50">
          <ImageOff className="h-5 w-5" />
        </div>
      )}

      <button
        type="button"
        {...attributes}
        {...listeners}
        className="absolute left-1.5 top-1.5 grid h-7 w-7 cursor-grab touch-none place-items-center rounded-md bg-black/55 text-white opacity-0 backdrop-blur transition active:cursor-grabbing group-hover:opacity-100"
        aria-label="Arrastrar para reordenar"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <div className="absolute right-1.5 top-1.5 flex gap-1 opacity-0 transition group-hover:opacity-100">
        <button
          type="button"
          onClick={onEdit}
          aria-label="Editar"
          title="Editar"
          className="grid h-7 w-7 place-items-center rounded-md bg-black/55 text-white backdrop-blur transition hover:bg-black/75"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={onDelete}
          disabled={isRemoving}
          aria-label="Eliminar"
          title="Eliminar"
          className="grid h-7 w-7 place-items-center rounded-md bg-black/55 text-white backdrop-blur transition hover:bg-destructive disabled:opacity-30"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {banner.title && (
        <span className="pointer-events-none absolute bottom-1.5 left-1.5 max-w-[80%] truncate rounded bg-black/55 px-1.5 py-0.5 text-[10px] text-white backdrop-blur">
          {banner.title}
        </span>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Colecciones — read-only + link a su gestión                         */
/* ------------------------------------------------------------------ */

function CollectionsBlock() {
  const router = useRouter();
  const { data: collections = [], isLoading } = useHomeCollections();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <Ruler className="h-3 w-3 shrink-0" />
        <span>Tamaño ideal por colección:</span>
        <DimensionHint spec={COLLECTION_SPEC} />
      </div>

      {collections.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No hay colecciones marcadas para la home.
        </p>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-1">
          {collections.map((c) => (
            <CollectionThumb key={c._id} collection={c} />
          ))}
        </div>
      )}

      <Button
        variant="outline"
        size="sm"
        onClick={() => router.push('/admin/colecciones')}
      >
        <ExternalLink className="mr-1.5 h-4 w-4" />
        Administrar colecciones
      </Button>
    </div>
  );
}

function CollectionThumb({ collection: c }: { collection: Collection }) {
  const attrs = c.image ? buildSrcSet(c.image, SIZESET.card) : null;

  return (
    <div className="w-[12rem] shrink-0">
      <div className="relative aspect-[5/3] overflow-hidden rounded-xl border shadow-sm">
        {attrs ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={attrs.src}
            srcSet={attrs.srcSet}
            alt={c.name}
            sizes="192px"
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div
            className={cn(
              'absolute inset-0 grid place-items-center bg-gradient-to-br text-3xl',
              c.gradient || 'from-primary to-secondary'
            )}
          >
            <span aria-hidden>{c.emoji || '🎀'}</span>
          </div>
        )}
      </div>
      <p className="mt-1 truncate text-xs font-medium">{c.name}</p>
    </div>
  );
}

export default HomeWireframe;

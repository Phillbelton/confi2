'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Trash2,
  Pencil,
  GripVertical,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  Save,
  Smartphone,
  Ruler,
  Loader2,
  ImageOff,
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
import { DimensionHint, recommendedForCols } from '@/components/admin/banners/DimensionHint';
import { BannerStatusBadge } from '@/components/admin/banners/bannerStatus';
import { cn } from '@/lib/utils';
import { useAdminBanners, useBannerOperations } from '@/hooks/admin/useAdminBanners';
import type { LayoutItem } from '@/services/admin/banners';
import type { Banner, BannerCols, BannerMobileMode } from '@/types';

export type MosaicPlacement = 'home_promo' | 'home_secondary';

let tempRowSeq = 0;

interface EditorRow {
  id: string;
  cols: BannerCols;
  mobileMode: BannerMobileMode;
  banners: Banner[];
}

/** Agrupa banners por rowOrder en franjas editables. */
function buildRows(banners: Banner[]): EditorRow[] {
  const map = new Map<number, Banner[]>();
  for (const b of banners) {
    const key = b.rowOrder ?? 0;
    const arr = map.get(key);
    if (arr) arr.push(b);
    else map.set(key, [b]);
  }
  return [...map.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([key, arr]) => {
      const sorted = [...arr].sort((x, y) => (x.order ?? 0) - (y.order ?? 0));
      const first = sorted[0];
      return {
        id: `row-${key}`,
        cols: (first?.cols ?? 1) as BannerCols,
        mobileMode: (first?.mobileMode ?? 'stack') as BannerMobileMode,
        banners: sorted,
      };
    });
}

/** Aplana las franjas al payload del bulk endpoint. */
function rowsToLayout(rows: EditorRow[]): LayoutItem[] {
  const items: LayoutItem[] = [];
  rows.forEach((row, rowOrder) => {
    row.banners.forEach((b, order) => {
      items.push({
        id: b._id,
        rowOrder,
        order,
        cols: row.cols,
        mobileMode: row.mobileMode,
      });
    });
  });
  return items;
}

/**
 * Editor de franjas de un placement de mosaico (home_promo / home_secondary).
 * Se usa dentro del wireframe del home — sin selector de zona.
 */
export function FranjaZoneEditor({ placement }: { placement: MosaicPlacement }) {
  const router = useRouter();
  const { data: banners = [], isLoading } = useAdminBanners(placement);
  const { saveLayoutAsync, isSavingLayout, remove, isRemoving } = useBannerOperations();

  const [rows, setRows] = useState<EditorRow[]>([]);
  const [dirty, setDirty] = useState(false);

  // Resync desde el server cuando cambia la data; no pisa ediciones locales sin guardar.
  const serverRowsKey = useMemo(
    () => banners.map((b) => `${b._id}:${b.rowOrder}:${b.order}:${b.cols}:${b.mobileMode}`).join('|'),
    [banners]
  );
  useEffect(() => {
    if (!dirty) setRows(buildRows(banners));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverRowsKey]);

  const mutate = (next: EditorRow[]) => {
    setRows(next);
    setDirty(true);
  };

  const setCols = (rowId: string, cols: BannerCols) =>
    mutate(rows.map((r) => (r.id === rowId ? { ...r, cols } : r)));

  const setMobileMode = (rowId: string, mode: BannerMobileMode) =>
    mutate(rows.map((r) => (r.id === rowId ? { ...r, mobileMode: mode } : r)));

  const moveRow = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= rows.length) return;
    mutate(arrayMove(rows, index, target));
  };

  const addRow = () =>
    mutate([
      ...rows,
      { id: `row-temp-${tempRowSeq++}`, cols: 1, mobileMode: 'stack', banners: [] },
    ]);

  const removeRow = (rowId: string) => mutate(rows.filter((r) => r.id !== rowId));

  const reorderInRow = (rowId: string, from: number, to: number) =>
    mutate(
      rows.map((r) =>
        r.id === rowId ? { ...r, banners: arrayMove(r.banners, from, to) } : r
      )
    );

  const moveBannerToAdjacentRow = (rowIndex: number, bannerIndex: number, dir: -1 | 1) => {
    const targetIndex = rowIndex + dir;
    if (targetIndex < 0 || targetIndex >= rows.length) return;
    const next = rows.map((r) => ({ ...r, banners: [...r.banners] }));
    const [moved] = next[rowIndex].banners.splice(bannerIndex, 1);
    next[targetIndex].banners.push(moved);
    mutate(next);
  };

  const deleteBanner = (rowId: string, bannerId: string) => {
    if (!confirm('¿Eliminar este banner? Se borra definitivamente.')) return;
    mutate(
      rows.map((r) =>
        r.id === rowId ? { ...r, banners: r.banners.filter((b) => b._id !== bannerId) } : r
      )
    );
    remove(bannerId);
  };

  const addBannerToRow = (row: EditorRow, rowIndex: number) => {
    const params = new URLSearchParams({
      placement,
      rowOrder: String(rowIndex),
      cols: String(row.cols),
      mobileMode: row.mobileMode,
    });
    router.push(`/admin/banners/new?${params.toString()}`);
  };

  const handleSave = async () => {
    try {
      await saveLayoutAsync(rowsToLayout(rows));
      setDirty(false);
    } catch {
      /* el toast de error lo maneja el hook */
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Acciones de la zona */}
      <div className="flex flex-wrap items-center justify-end gap-2">
        {dirty && (
          <span className="mr-auto text-xs font-medium text-amber-600">
            Cambios sin guardar
          </span>
        )}
        <Button variant="outline" size="sm" onClick={addRow}>
          <Plus className="mr-1.5 h-4 w-4" />
          Agregar franja
        </Button>
        <Button size="sm" onClick={handleSave} disabled={!dirty || isSavingLayout}>
          {isSavingLayout ? (
            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-1.5 h-4 w-4" />
          )}
          Guardar
        </Button>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed py-8 text-center text-sm text-muted-foreground">
          Sin franjas todavía. Agrega una franja y después un banner.
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((row, rowIndex) => (
            <FranjaCard
              key={row.id}
              row={row}
              rowIndex={rowIndex}
              totalRows={rows.length}
              isRemoving={isRemoving}
              onSetCols={(c) => setCols(row.id, c)}
              onSetMobileMode={(m) => setMobileMode(row.id, m)}
              onMoveRow={(dir) => moveRow(rowIndex, dir)}
              onRemoveRow={() => removeRow(row.id)}
              onReorderInRow={(from, to) => reorderInRow(row.id, from, to)}
              onMoveBanner={(bi, dir) => moveBannerToAdjacentRow(rowIndex, bi, dir)}
              onEditBanner={(id) => router.push(`/admin/banners/${id}`)}
              onDeleteBanner={(id) => deleteBanner(row.id, id)}
              onAddBanner={() => addBannerToRow(row, rowIndex)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

const COL_OPTIONS: BannerCols[] = [1, 2, 3, 4];

interface FranjaCardProps {
  row: EditorRow;
  rowIndex: number;
  totalRows: number;
  isRemoving: boolean;
  onSetCols: (cols: BannerCols) => void;
  onSetMobileMode: (mode: BannerMobileMode) => void;
  onMoveRow: (dir: -1 | 1) => void;
  onRemoveRow: () => void;
  onReorderInRow: (from: number, to: number) => void;
  onMoveBanner: (bannerIndex: number, dir: -1 | 1) => void;
  onEditBanner: (id: string) => void;
  onDeleteBanner: (id: string) => void;
  onAddBanner: () => void;
}

function FranjaCard({
  row,
  rowIndex,
  totalRows,
  isRemoving,
  onSetCols,
  onSetMobileMode,
  onMoveRow,
  onRemoveRow,
  onReorderInRow,
  onMoveBanner,
  onEditBanner,
  onDeleteBanner,
  onAddBanner,
}: FranjaCardProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = row.banners.findIndex((b) => b._id === active.id);
    const to = row.banners.findIndex((b) => b._id === over.id);
    if (from === -1 || to === -1) return;
    onReorderInRow(from, to);
  };

  const ids = row.banners.map((b) => b._id);
  const spec = recommendedForCols(row.cols);
  const aspectRatio = `${spec.w}/${spec.h}`;

  return (
    <Card className="border-border/70">
      <CardContent className="space-y-3 p-3">
        {/* Header de la franja */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px]">
              Franja {rowIndex + 1}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {row.banners.length} banner{row.banners.length === 1 ? '' : 's'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Selector de columnas 1·2·3·4 */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">Columnas:</span>
              <div className="flex overflow-hidden rounded-md border">
                {COL_OPTIONS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => onSetCols(c)}
                    aria-pressed={row.cols === c}
                    className={cn(
                      'flex h-8 w-9 items-center justify-center border-r text-xs font-semibold last:border-r-0 transition',
                      row.cols === c
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-background hover:bg-muted'
                    )}
                    title={`${c} en línea`}
                  >
                    <ColsIcon n={c} active={row.cols === c} />
                  </button>
                ))}
              </div>
            </div>

            {/* Modo mobile */}
            <button
              type="button"
              onClick={() => onSetMobileMode(row.mobileMode === 'stack' ? 'scroll' : 'stack')}
              className="inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium hover:bg-muted"
              title="Cómo se ve en celular"
            >
              <Smartphone className="h-3.5 w-3.5" />
              {row.mobileMode === 'stack' ? 'Apilado' : 'Scroll'}
            </button>

            {/* Mover / eliminar franja */}
            <div className="flex items-center gap-1">
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                disabled={rowIndex === 0}
                onClick={() => onMoveRow(-1)}
                aria-label="Subir franja"
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                disabled={rowIndex === totalRows - 1}
                onClick={() => onMoveRow(1)}
                aria-label="Bajar franja"
              >
                <ArrowDown className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-destructive"
                disabled={row.banners.length > 0}
                onClick={onRemoveRow}
                aria-label="Eliminar franja"
                title={
                  row.banners.length > 0
                    ? 'Vaciá la franja antes de eliminarla'
                    : 'Eliminar franja'
                }
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Tamaño ideal de imagen para esta franja (cambia según las columnas) */}
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Ruler className="h-3 w-3 shrink-0" />
          <span>Tamaño ideal por imagen:</span>
          <DimensionHint spec={spec} />
        </div>

        {/* Preview de los banners de la franja */}
        {row.banners.length === 0 ? (
          <button
            type="button"
            onClick={onAddBanner}
            className="flex w-full flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed py-8 text-sm text-muted-foreground transition hover:border-primary hover:text-primary"
          >
            <Plus className="h-4 w-4" />
            Agregar banner a esta franja
          </button>
        ) : (
          <>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={ids} strategy={horizontalListSortingStrategy}>
                <div
                  className="grid gap-3"
                  style={{ gridTemplateColumns: `repeat(${row.cols}, minmax(0, 1fr))` }}
                >
                  {row.banners.map((b, bi) => (
                    <SortableBannerTile
                      key={b._id}
                      banner={b}
                      aspectRatio={aspectRatio}
                      canMovePrev={rowIndex > 0}
                      canMoveNext={rowIndex < totalRows - 1}
                      isRemoving={isRemoving}
                      onMovePrev={() => onMoveBanner(bi, -1)}
                      onMoveNext={() => onMoveBanner(bi, 1)}
                      onEdit={() => onEditBanner(b._id)}
                      onDelete={() => onDeleteBanner(b._id)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            <div className="flex justify-end">
              <Button variant="ghost" size="sm" onClick={onAddBanner}>
                <Plus className="mr-1 h-4 w-4" />
                Agregar banner
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

interface SortableBannerTileProps {
  banner: Banner;
  /** Proporción de la franja (ej. "16/5") — el tile se dibuja con esa forma. */
  aspectRatio: string;
  canMovePrev: boolean;
  canMoveNext: boolean;
  isRemoving: boolean;
  onMovePrev: () => void;
  onMoveNext: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function SortableBannerTile({
  banner,
  aspectRatio,
  canMovePrev,
  canMoveNext,
  isRemoving,
  onMovePrev,
  onMoveNext,
  onEdit,
  onDelete,
}: SortableBannerTileProps) {
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
      className="group relative overflow-hidden rounded-xl border bg-muted shadow-sm"
    >
      <div className="relative" style={{ aspectRatio }}>
        {hasImage ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={attrs.src}
            srcSet={attrs.srcSet}
            alt={banner.title || ''}
            sizes="(max-width: 1024px) 50vw, 25vw"
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center text-muted-foreground/50">
            <div className="flex flex-col items-center gap-1 text-xs">
              <ImageOff className="h-5 w-5" />
              Sin imagen
            </div>
          </div>
        )}

        <BannerStatusBadge banner={banner} />

        {/* Handle de arrastre */}
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="absolute left-1.5 top-1.5 grid h-7 w-7 cursor-grab touch-none place-items-center rounded-md bg-black/55 text-white opacity-0 backdrop-blur transition active:cursor-grabbing group-hover:opacity-100"
          aria-label="Arrastrar para reordenar"
        >
          <GripVertical className="h-4 w-4" />
        </button>

        {/* Acciones */}
        <div className="absolute right-1.5 top-1.5 flex gap-1 opacity-0 transition group-hover:opacity-100">
          <IconBtn label="Editar" onClick={onEdit}>
            <Pencil className="h-3.5 w-3.5" />
          </IconBtn>
          <IconBtn label="Eliminar" onClick={onDelete} disabled={isRemoving} danger>
            <Trash2 className="h-3.5 w-3.5" />
          </IconBtn>
        </div>

        {/* Mover entre franjas */}
        <div className="absolute inset-x-1.5 bottom-1.5 flex items-center justify-between opacity-0 transition group-hover:opacity-100">
          <IconBtn label="Mover a franja anterior" onClick={onMovePrev} disabled={!canMovePrev}>
            <ChevronLeft className="h-3.5 w-3.5" />
          </IconBtn>
          {banner.title && (
            <span className="pointer-events-none max-w-[60%] truncate rounded bg-black/55 px-1.5 py-0.5 text-[10px] text-white backdrop-blur">
              {banner.title}
            </span>
          )}
          <IconBtn label="Mover a franja siguiente" onClick={onMoveNext} disabled={!canMoveNext}>
            <ChevronRight className="h-3.5 w-3.5" />
          </IconBtn>
        </div>
      </div>
    </div>
  );
}

function IconBtn({
  children,
  label,
  onClick,
  disabled,
  danger,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cn(
        'grid h-7 w-7 place-items-center rounded-md bg-black/55 text-white backdrop-blur transition hover:bg-black/75 disabled:opacity-30',
        danger && 'hover:bg-destructive'
      )}
    >
      {children}
    </button>
  );
}

/** Iconito esquemático de N columnas. */
function ColsIcon({ n, active }: { n: number; active: boolean }) {
  return (
    <span className="flex items-center gap-0.5">
      {Array.from({ length: n }).map((_, i) => (
        <span
          key={i}
          className={cn(
            'block h-3 w-[3px] rounded-[1px]',
            active ? 'bg-primary-foreground' : 'bg-muted-foreground/70'
          )}
        />
      ))}
    </span>
  );
}

export default FranjaZoneEditor;

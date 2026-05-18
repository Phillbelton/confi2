'use client';

import { useEffect, useState } from 'react';
import { Edit, Trash2, Search, EyeOff, Eye, GripVertical } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
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
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Collection } from '@/types';

interface CollectionsTableProps {
  collections: Collection[];
  onEdit: (collection: Collection) => void;
  onDelete: (id: string) => void;
  onReorder?: (items: { id: string; order: number }[]) => void;
  isDeleting?: boolean;
  isReordering?: boolean;
}

export function CollectionsTable({
  collections,
  onEdit,
  onDelete,
  onReorder,
  isDeleting = false,
  isReordering = false,
}: CollectionsTableProps) {
  const [search, setSearch] = useState('');
  // Orden local optimista — refleja arrayMove inmediatamente; se resincroniza
  // cuando llega refetch del server (ids o orden distinto).
  const [localItems, setLocalItems] = useState<Collection[]>(collections);

  useEffect(() => {
    setLocalItems(collections);
  }, [collections]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const filtered = localItems.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.slug.toLowerCase().includes(search.toLowerCase())
  );

  // Drag solo habilitado cuando no hay búsqueda activa (la lista filtrada
  // rompería el mapeo a la lista completa).
  const dragEnabled = !!onReorder && search.trim() === '' && !isReordering;

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = localItems.findIndex((c) => c._id === active.id);
    const newIndex = localItems.findIndex((c) => c._id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const next = arrayMove(localItems, oldIndex, newIndex);
    setLocalItems(next);
    onReorder?.(next.map((c, idx) => ({ id: c._id, order: idx })));
  };

  const sortableIds = filtered.map((c) => c._id);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar colecciones..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        {search.trim() !== '' && onReorder && (
          <p className="text-xs text-muted-foreground">
            Limpiá la búsqueda para reordenar.
          </p>
        )}
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={sortableIds}
          strategy={verticalListSortingStrategy}
        >
          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {filtered.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                {search ? 'No se encontraron colecciones' : 'No hay colecciones'}
              </div>
            ) : (
              filtered.map((c) => (
                <SortableMobileCard
                  key={`mobile-${c._id}`}
                  collection={c}
                  onEdit={() => onEdit(c)}
                  onDelete={() => onDelete(c._id)}
                  isDeleting={isDeleting}
                  dragEnabled={dragEnabled}
                />
              ))
            )}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10" />
                  <TableHead className="w-16">Visual</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead className="text-center">Productos</TableHead>
                  <TableHead className="text-center">Orden</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center py-8 text-muted-foreground"
                    >
                      {search
                        ? 'No se encontraron colecciones'
                        : 'No hay colecciones'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((c) => (
                    <SortableTableRow
                      key={c._id}
                      collection={c}
                      onEdit={() => onEdit(c)}
                      onDelete={() => onDelete(c._id)}
                      isDeleting={isDeleting}
                      dragEnabled={dragEnabled}
                    />
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </SortableContext>
      </DndContext>

      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
        <span>
          Total: <strong>{filtered.length}</strong>
        </span>
        <span>
          Activas: <strong>{filtered.filter((c) => c.active).length}</strong>
        </span>
        <span>
          En home: <strong>{filtered.filter((c) => c.showOnHome).length}</strong>
        </span>
        {isReordering && (
          <span className="text-primary">Guardando orden…</span>
        )}
      </div>
    </div>
  );
}

interface RowProps {
  collection: Collection;
  onEdit: () => void;
  onDelete: () => void;
  isDeleting: boolean;
  dragEnabled: boolean;
}

function SortableTableRow({
  collection: c,
  onEdit,
  onDelete,
  isDeleting,
  dragEnabled,
}: RowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: c._id, disabled: !dragEnabled });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: 'relative',
    zIndex: isDragging ? 10 : 'auto',
  };

  const productCount =
    (c as any).productCount ??
    (Array.isArray(c.products) ? c.products.length : 0);

  return (
    <TableRow ref={setNodeRef} style={style}>
      <TableCell className="w-10 p-1">
        <button
          type="button"
          {...attributes}
          {...listeners}
          disabled={!dragEnabled}
          className={cn(
            'grid h-8 w-8 place-items-center rounded text-muted-foreground',
            dragEnabled
              ? 'cursor-grab touch-none hover:bg-muted hover:text-foreground active:cursor-grabbing'
              : 'cursor-not-allowed opacity-30'
          )}
          aria-label="Arrastrar para reordenar"
        >
          <GripVertical className="h-4 w-4" />
        </button>
      </TableCell>
      <TableCell>
        <div
          className={cn(
            'grid h-10 w-10 place-items-center rounded-lg bg-gradient-to-br text-xl shadow-sm',
            c.gradient || 'from-primary to-secondary'
          )}
        >
          <span aria-hidden>{c.emoji || '🎀'}</span>
        </div>
      </TableCell>
      <TableCell>
        <p className="font-medium">{c.name}</p>
        {c.description && (
          <p className="line-clamp-1 text-xs text-muted-foreground">
            {c.description}
          </p>
        )}
      </TableCell>
      <TableCell className="font-mono text-xs text-muted-foreground">
        {c.slug}
      </TableCell>
      <TableCell className="text-center tabular-nums">{productCount}</TableCell>
      <TableCell className="text-center tabular-nums">{c.order}</TableCell>
      <TableCell>
        <div className="flex flex-wrap gap-1">
          {c.active ? (
            <Badge variant="default" className="bg-green-600">
              Activa
            </Badge>
          ) : (
            <Badge variant="secondary">Inactiva</Badge>
          )}
          {c.showOnHome ? (
            <Badge variant="outline" className="gap-1">
              <Eye className="h-3 w-3" />
              Home
            </Badge>
          ) : (
            <Badge variant="outline" className="gap-1 opacity-60">
              <EyeOff className="h-3 w-3" />
              Oculta
            </Badge>
          )}
        </div>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={onEdit}
            disabled={isDeleting}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              if (
                confirm(
                  `¿Eliminar la colección "${c.name}"? Se desactivará y no aparecerá en el catálogo.`
                )
              ) {
                onDelete();
              }
            }}
            disabled={isDeleting}
            className="text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

function SortableMobileCard({
  collection: c,
  onEdit,
  onDelete,
  isDeleting,
  dragEnabled,
}: RowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: c._id, disabled: !dragEnabled });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 'auto',
  };

  const productCount =
    (c as any).productCount ??
    (Array.isArray(c.products) ? c.products.length : 0);

  return (
    <div ref={setNodeRef} style={style}>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <button
              type="button"
              {...attributes}
              {...listeners}
              disabled={!dragEnabled}
              className={cn(
                'grid h-12 w-8 shrink-0 place-items-center rounded text-muted-foreground',
                dragEnabled
                  ? 'cursor-grab touch-none hover:bg-muted hover:text-foreground active:cursor-grabbing'
                  : 'cursor-not-allowed opacity-30'
              )}
              aria-label="Arrastrar para reordenar"
            >
              <GripVertical className="h-4 w-4" />
            </button>
            <div
              className={cn(
                'grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-2xl shadow',
                c.gradient || 'from-primary to-secondary'
              )}
            >
              <span aria-hidden>{c.emoji || '🎀'}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium">{c.name}</p>
                {c.active ? (
                  <Badge variant="default" className="bg-green-600">
                    Activa
                  </Badge>
                ) : (
                  <Badge variant="secondary">Inactiva</Badge>
                )}
                {c.showOnHome && <Badge variant="outline">En home</Badge>}
              </div>
              <p className="font-mono text-xs text-muted-foreground mt-1 truncate">
                {c.slug}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {productCount} productos · orden {c.order}
              </p>
            </div>
            <div className="flex flex-col gap-1 shrink-0">
              <Button
                size="sm"
                variant="ghost"
                className="min-h-[44px] min-w-[44px]"
                onClick={onEdit}
                disabled={isDeleting}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="min-h-[44px] min-w-[44px] text-red-600 hover:bg-red-50 hover:text-red-700"
                onClick={() => {
                  if (
                    confirm(
                      `¿Eliminar la colección "${c.name}"? Se desactivará y no aparecerá más en el catálogo.`
                    )
                  ) {
                    onDelete();
                  }
                }}
                disabled={isDeleting}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

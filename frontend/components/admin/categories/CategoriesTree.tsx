'use client';

import { useMemo, useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Edit,
  Trash2,
  Search,
  Plus,
  FolderClosed,
  FolderOpen,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import type { Category } from '@/types';
import type { CategoryWithSubcategories } from '@/lib/categoryUtils';

interface CategoriesTreeProps {
  categories: CategoryWithSubcategories[];
  onEdit: (category: Category) => void;
  onCreateSubcategory: (parent: Category) => void;
  onDelete: (categoryId: string) => void;
  isDeleting?: boolean;
}

function CategoryAvatar({
  category,
  size = 'md',
}: {
  category: Category;
  size?: 'sm' | 'md' | 'lg';
}) {
  const sz = size === 'lg' ? 'h-12 w-12 text-lg' : size === 'sm' ? 'h-8 w-8 text-sm' : 'h-10 w-10';
  return (
    <Avatar className={cn(sz, 'shrink-0')}>
      {category.image ? (
        <AvatarImage src={category.image} alt={category.name} />
      ) : (
        <AvatarFallback
          style={{
            backgroundColor: category.color || '#e5e7eb',
            color: '#fff',
          }}
        >
          {category.icon || category.name.charAt(0).toUpperCase()}
        </AvatarFallback>
      )}
    </Avatar>
  );
}

export function CategoriesTree({
  categories,
  onEdit,
  onCreateSubcategory,
  onDelete,
  isDeleting = false,
}: CategoriesTreeProps) {
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [pendingDelete, setPendingDelete] = useState<Category | null>(null);

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => {
    setExpanded(new Set(categories.filter((c) => c.subcategories?.length).map((c) => c._id)));
  };
  const collapseAll = () => setExpanded(new Set());

  // Search filter — when search matches a sub, auto-expand its parent.
  const { filtered, autoExpand } = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return { filtered: categories, autoExpand: new Set<string>() };

    const auto = new Set<string>();
    const result = categories
      .map((cat) => {
        const nameMatch =
          cat.name.toLowerCase().includes(q) ||
          (cat.slug?.toLowerCase().includes(q) ?? false);
        const matchingSubs =
          cat.subcategories?.filter(
            (s) =>
              s.name.toLowerCase().includes(q) ||
              (s.slug?.toLowerCase().includes(q) ?? false)
          ) ?? [];
        if (matchingSubs.length > 0) auto.add(cat._id);
        if (nameMatch || matchingSubs.length > 0) {
          return {
            ...cat,
            subcategories: nameMatch ? cat.subcategories : matchingSubs,
          } as CategoryWithSubcategories;
        }
        return null;
      })
      .filter(Boolean) as CategoryWithSubcategories[];
    return { filtered: result, autoExpand: auto };
  }, [categories, search]);

  const isExpanded = (id: string) => expanded.has(id) || autoExpand.has(id);

  // Counters (use raw categories, not filtered)
  const totals = useMemo(() => {
    const main = categories.length;
    const subs = categories.reduce((acc, c) => acc + (c.subcategories?.length ?? 0), 0);
    const active =
      categories.filter((c) => c.active).length +
      categories.reduce(
        (acc, c) => acc + (c.subcategories?.filter((s) => s.active).length ?? 0),
        0
      );
    return { total: main + subs, main, subs, active };
  }, [categories]);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar categoría o subcategoría…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button size="sm" variant="outline" onClick={expandAll} disabled={!totals.subs}>
          Expandir todas
        </Button>
        <Button size="sm" variant="outline" onClick={collapseAll} disabled={!expanded.size}>
          Contraer todas
        </Button>
      </div>

      {/* Tree */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {search ? 'No se encontraron categorías' : 'No hay categorías'}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((cat) => {
            const subs = cat.subcategories ?? [];
            const expandedNow = isExpanded(cat._id);
            const expandable = subs.length > 0;

            return (
              <Card key={cat._id} className="overflow-hidden">
                {/* Parent header — clickable to expand (div, not button:
                    contains action buttons → nested <button> is invalid HTML) */}
                <div
                  role={expandable ? 'button' : undefined}
                  tabIndex={expandable ? 0 : undefined}
                  onClick={() => (expandable ? toggle(cat._id) : undefined)}
                  onKeyDown={(e) => {
                    if (expandable && (e.key === 'Enter' || e.key === ' ')) {
                      e.preventDefault();
                      toggle(cat._id);
                    }
                  }}
                  className={cn(
                    'w-full flex items-center gap-3 p-3 sm:p-4 text-left',
                    expandable
                      ? 'hover:bg-accent/40 transition-colors cursor-pointer'
                      : 'cursor-default'
                  )}
                  aria-expanded={expandable ? expandedNow : undefined}
                >
                  <div className="w-5 shrink-0 grid place-items-center text-muted-foreground">
                    {expandable ? (
                      expandedNow ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )
                    ) : null}
                  </div>

                  <CategoryAvatar category={cat} size="lg" />

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {expandedNow ? (
                        <FolderOpen className="h-4 w-4 text-muted-foreground shrink-0" />
                      ) : (
                        <FolderClosed className="h-4 w-4 text-muted-foreground shrink-0" />
                      )}
                      <span className="font-semibold truncate">{cat.name}</span>
                      {!cat.active && (
                        <Badge variant="secondary" className="text-xs">
                          Inactiva
                        </Badge>
                      )}
                      {expandable && (
                        <Badge variant="outline" className="text-xs">
                          {subs.length} sub{subs.length === 1 ? '' : 's'}
                        </Badge>
                      )}
                    </div>
                    {cat.description && (
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                        {cat.description}
                      </p>
                    )}
                    <p className="text-[11px] font-mono text-muted-foreground/70 mt-0.5 truncate">
                      /{cat.slug}
                    </p>
                  </div>

                  {/* Per-row actions — stopPropagation so clicks don't toggle */}
                  <div
                    className="flex items-center gap-1 shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => onCreateSubcategory(cat)}
                      disabled={isDeleting}
                      title="Agregar subcategoría"
                    >
                      <Plus className="h-4 w-4" />
                      <span className="hidden sm:inline ml-1">Subcategoría</span>
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => onEdit(cat)}
                      disabled={isDeleting}
                      title="Editar"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setPendingDelete(cat)}
                      disabled={isDeleting}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      title="Eliminar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Expanded subcategories area */}
                {expandable && expandedNow && (
                  <div className="border-t bg-muted/20 px-3 sm:px-6 py-3 space-y-2">
                    {subs.map((sub) => (
                      <div
                        key={sub._id}
                        className="flex items-center gap-3 p-2 rounded-md bg-background border"
                      >
                        <CategoryAvatar category={sub} size="sm" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm truncate">{sub.name}</span>
                            {!sub.active && (
                              <Badge variant="secondary" className="text-[10px]">
                                Inactiva
                              </Badge>
                            )}
                          </div>
                          <p className="text-[11px] font-mono text-muted-foreground/70 truncate">
                            /{sub.slug}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => onEdit(sub)}
                            disabled={isDeleting}
                            title="Editar"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => setPendingDelete(sub)}
                            disabled={isDeleting}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            title="Eliminar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}

                    {/* Inline add-subcategory CTA */}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full border-dashed"
                      onClick={() => onCreateSubcategory(cat)}
                      disabled={isDeleting}
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      Agregar subcategoría a "{cat.name}"
                    </Button>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Summary */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground pt-2">
        <span>
          Total: <strong className="text-foreground">{totals.total}</strong>
        </span>
        <span>
          Principales: <strong className="text-foreground">{totals.main}</strong>
        </span>
        <span>
          Subcategorías: <strong className="text-foreground">{totals.subs}</strong>
        </span>
        <span>
          Activas: <strong className="text-foreground">{totals.active}</strong>
        </span>
      </div>

      {/* Delete confirmation */}
      <AlertDialog
        open={!!pendingDelete}
        onOpenChange={(o) => !o && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar categoría</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete && (
                <>
                  Vas a eliminar <strong>{pendingDelete.name}</strong>.
                  {pendingDelete.parent
                    ? ' Esta acción no se puede deshacer.'
                    : ' Si la categoría tiene subcategorías o productos asociados, el backend rechazará la eliminación.'}
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingDelete) {
                  onDelete(pendingDelete._id);
                  setPendingDelete(null);
                }
              }}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Eliminando…
                </>
              ) : (
                'Eliminar'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default CategoriesTree;

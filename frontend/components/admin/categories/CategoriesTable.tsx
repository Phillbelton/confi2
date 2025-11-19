'use client';

import { useState } from 'react';
import {
  Edit,
  Trash2,
  Search,
  ChevronRight,
  ChevronDown,
  FolderClosed,
  FileText,
} from 'lucide-react';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { Category } from '@/types';
import type { CategoryWithSubcategories } from '@/lib/categoryUtils';
import { cn } from '@/lib/utils';

interface CategoriesTableProps {
  categories: CategoryWithSubcategories[];
  onEdit: (category: Category) => void;
  onDelete: (categoryId: string) => void;
  isDeleting?: boolean;
}

export function CategoriesTable({
  categories,
  onEdit,
  onDelete,
  isDeleting = false,
}: CategoriesTableProps) {
  const [search, setSearch] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set()
  );

  // Toggle expansion of a category
  const toggleExpand = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  // Filter categories by search (includes subcategories)
  const filteredCategories = categories
    .map((category) => {
      const matchesSearch =
        category.name.toLowerCase().includes(search.toLowerCase()) ||
        category.slug?.toLowerCase().includes(search.toLowerCase());

      const matchingSubcategories = category.subcategories?.filter(
        (sub) =>
          sub.name.toLowerCase().includes(search.toLowerCase()) ||
          sub.slug?.toLowerCase().includes(search.toLowerCase())
      );

      // Include category if it matches or has matching subcategories
      if (matchesSearch || (matchingSubcategories && matchingSubcategories.length > 0)) {
        return {
          ...category,
          subcategories: matchingSubcategories || category.subcategories,
        };
      }

      return null;
    })
    .filter(Boolean) as CategoryWithSubcategories[];

  // Count totals
  const totalCount = filteredCategories.reduce(
    (acc, cat) => acc + 1 + (cat.subcategories?.length || 0),
    0
  );
  const activeCount = filteredCategories.reduce((acc, cat) => {
    let count = cat.active ? 1 : 0;
    count += cat.subcategories?.filter((sub) => sub.active).length || 0;
    return acc + count;
  }, 0);
  const mainCount = filteredCategories.length;

  // Render a single category row
  const renderCategoryRow = (
    category: Category,
    isSubcategory: boolean = false
  ) => {
    return (
      <TableRow key={category._id} className={cn(isSubcategory && 'bg-muted/30')}>
        {/* Image with hierarchy indicator */}
        <TableCell>
          <div className="flex items-center gap-2">
            {isSubcategory && (
              <div className="w-6 flex justify-center">
                <div className="h-px w-4 bg-border" />
              </div>
            )}
            <Avatar className="h-10 w-10">
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
          </div>
        </TableCell>

        {/* Name with expand/collapse button */}
        <TableCell>
          <div className={cn('flex items-center gap-2', isSubcategory && 'pl-6')}>
            {!isSubcategory && (
              <FolderClosed className="h-4 w-4 text-muted-foreground shrink-0" />
            )}
            {isSubcategory && (
              <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
            )}
            <div className="flex-1">
              <p className="font-medium">{category.name}</p>
              {category.description && (
                <p className="text-xs text-muted-foreground line-clamp-1">
                  {category.description}
                </p>
              )}
            </div>
          </div>
        </TableCell>

        {/* Slug */}
        <TableCell className="font-mono text-xs text-muted-foreground">
          {category.slug}
        </TableCell>

        {/* Color */}
        <TableCell>
          {category.color ? (
            <div className="flex items-center gap-2">
              <div
                className="h-6 w-6 rounded border"
                style={{ backgroundColor: category.color }}
              />
              <span className="text-xs text-muted-foreground font-mono">
                {category.color}
              </span>
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">—</span>
          )}
        </TableCell>

        {/* Order */}
        <TableCell>
          <span className="text-sm">{category.order}</span>
        </TableCell>

        {/* Active */}
        <TableCell>
          {category.active ? (
            <Badge variant="default" className="bg-green-600">
              Activo
            </Badge>
          ) : (
            <Badge variant="secondary">Inactivo</Badge>
          )}
        </TableCell>

        {/* Actions */}
        <TableCell className="text-right">
          <div className="flex justify-end gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onEdit(category)}
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
                    `¿Estás seguro de eliminar la categoría "${category.name}"?`
                  )
                ) {
                  onDelete(category._id);
                }
              }}
              disabled={isDeleting}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
    );
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar categorías..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Imagen</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Color</TableHead>
              <TableHead className="w-[80px]">Orden</TableHead>
              <TableHead className="w-[100px]">Estado</TableHead>
              <TableHead className="text-right w-[120px]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCategories.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-8 text-muted-foreground"
                >
                  {search ? 'No se encontraron categorías' : 'No hay categorías'}
                </TableCell>
              </TableRow>
            ) : (
              filteredCategories.map((category) => {
                const hasSubcategories =
                  category.subcategories && category.subcategories.length > 0;
                const isExpanded = expandedCategories.has(category._id);

                return (
                  <>
                    {/* Parent Category Row */}
                    <TableRow key={category._id}>
                      {/* Image with expand/collapse button */}
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {hasSubcategories && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0"
                              onClick={() => toggleExpand(category._id)}
                            >
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                          <Avatar className="h-10 w-10">
                            {category.image ? (
                              <AvatarImage
                                src={category.image}
                                alt={category.name}
                              />
                            ) : (
                              <AvatarFallback
                                style={{
                                  backgroundColor: category.color || '#e5e7eb',
                                  color: '#fff',
                                }}
                              >
                                {category.icon ||
                                  category.name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            )}
                          </Avatar>
                        </div>
                      </TableCell>

                      {/* Name with subcategory badge */}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FolderClosed className="h-4 w-4 text-muted-foreground shrink-0" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{category.name}</p>
                              {hasSubcategories && (
                                <Badge variant="outline" className="text-xs">
                                  {category.subcategories!.length}{' '}
                                  {category.subcategories!.length === 1
                                    ? 'subcategoría'
                                    : 'subcategorías'}
                                </Badge>
                              )}
                            </div>
                            {category.description && (
                              <p className="text-xs text-muted-foreground line-clamp-1">
                                {category.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      {/* Slug */}
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {category.slug}
                      </TableCell>

                      {/* Color */}
                      <TableCell>
                        {category.color ? (
                          <div className="flex items-center gap-2">
                            <div
                              className="h-6 w-6 rounded border"
                              style={{ backgroundColor: category.color }}
                            />
                            <span className="text-xs text-muted-foreground font-mono">
                              {category.color}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            —
                          </span>
                        )}
                      </TableCell>

                      {/* Order */}
                      <TableCell>
                        <span className="text-sm">{category.order}</span>
                      </TableCell>

                      {/* Active */}
                      <TableCell>
                        {category.active ? (
                          <Badge variant="default" className="bg-green-600">
                            Activo
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Inactivo</Badge>
                        )}
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onEdit(category)}
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
                                  `¿Estás seguro de eliminar la categoría "${category.name}"?`
                                )
                              ) {
                                onDelete(category._id);
                              }
                            }}
                            disabled={isDeleting}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>

                    {/* Subcategories Rows */}
                    {hasSubcategories &&
                      isExpanded &&
                      category.subcategories!.map((subcategory) =>
                        renderCategoryRow(subcategory, true)
                      )}
                  </>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Summary */}
      <div className="flex gap-4 text-sm text-muted-foreground">
        <span>
          Total: <strong>{totalCount}</strong>
        </span>
        <span>
          Activas: <strong>{activeCount}</strong>
        </span>
        <span>
          Principales: <strong>{mainCount}</strong>
        </span>
      </div>
    </div>
  );
}

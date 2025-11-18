'use client';

import { useState } from 'react';
import { Edit, Trash2, Image as ImageIcon, Search } from 'lucide-react';
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

interface CategoriesTableProps {
  categories: Category[];
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

  // Filter categories by search
  const filteredCategories = categories.filter((category) =>
    category.name.toLowerCase().includes(search.toLowerCase()) ||
    category.slug?.toLowerCase().includes(search.toLowerCase())
  );

  // Get parent category name
  const getParentName = (parentId: string | Category | undefined) => {
    if (!parentId) return '—';

    if (typeof parentId === 'string') {
      const parent = categories.find((c) => c._id === parentId);
      return parent?.name || parentId;
    }

    return parentId.name;
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
              <TableHead>Imagen</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Padre</TableHead>
              <TableHead>Color</TableHead>
              <TableHead>Orden</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCategories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  {search ? 'No se encontraron categorías' : 'No hay categorías'}
                </TableCell>
              </TableRow>
            ) : (
              filteredCategories.map((category) => (
                <TableRow key={category._id}>
                  {/* Image */}
                  <TableCell>
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
                  </TableCell>

                  {/* Name */}
                  <TableCell>
                    <div>
                      <p className="font-medium">{category.name}</p>
                      {category.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {category.description}
                        </p>
                      )}
                    </div>
                  </TableCell>

                  {/* Slug */}
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {category.slug}
                  </TableCell>

                  {/* Parent */}
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {getParentName(category.parent)}
                    </span>
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
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Summary */}
      <div className="flex gap-4 text-sm text-muted-foreground">
        <span>
          Total: <strong>{filteredCategories.length}</strong>
        </span>
        <span>
          Activas: <strong>{filteredCategories.filter((c) => c.active).length}</strong>
        </span>
        <span>
          Principales:{' '}
          <strong>{filteredCategories.filter((c) => !c.parent).length}</strong>
        </span>
      </div>
    </div>
  );
}

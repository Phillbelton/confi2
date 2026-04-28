'use client';

import { useState } from 'react';
import { Edit, Trash2, Search, EyeOff, Eye } from 'lucide-react';
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
import type { Collection } from '@/types';

interface CollectionsTableProps {
  collections: Collection[];
  onEdit: (collection: Collection) => void;
  onDelete: (id: string) => void;
  isDeleting?: boolean;
}

export function CollectionsTable({
  collections,
  onEdit,
  onDelete,
  isDeleting = false,
}: CollectionsTableProps) {
  const [search, setSearch] = useState('');

  const filtered = collections.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar colecciones..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {filtered.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            {search ? 'No se encontraron colecciones' : 'No hay colecciones'}
          </div>
        ) : (
          filtered.map((c) => {
            const productCount =
              (c as any).productCount ??
              (Array.isArray(c.products) ? c.products.length : 0);
            return (
              <Card key={`mobile-${c._id}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
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
                        {c.showOnHome && (
                          <Badge variant="outline">En home</Badge>
                        )}
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
                        onClick={() => onEdit(c)}
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
                            onDelete(c._id);
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
            );
          })
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
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
                  colSpan={7}
                  className="text-center py-8 text-muted-foreground"
                >
                  {search ? 'No se encontraron colecciones' : 'No hay colecciones'}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((c) => {
                const productCount =
                  (c as any).productCount ??
                  (Array.isArray(c.products) ? c.products.length : 0);
                return (
                  <TableRow key={c._id}>
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
                    <TableCell className="text-center tabular-nums">
                      {productCount}
                    </TableCell>
                    <TableCell className="text-center tabular-nums">
                      {c.order}
                    </TableCell>
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
                          onClick={() => onEdit(c)}
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
                              onDelete(c._id);
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
              })
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex gap-4 text-sm text-muted-foreground">
        <span>
          Total: <strong>{filtered.length}</strong>
        </span>
        <span>
          Activas: <strong>{filtered.filter((c) => c.active).length}</strong>
        </span>
        <span>
          En home: <strong>{filtered.filter((c) => c.showOnHome).length}</strong>
        </span>
      </div>
    </div>
  );
}

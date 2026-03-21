'use client';

import { useState } from 'react';
import { Edit, Trash2, Search } from 'lucide-react';
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
import type { Brand } from '@/types';

interface BrandsTableProps {
  brands: Brand[];
  onEdit: (brand: Brand) => void;
  onDelete: (brandId: string) => void;
  isDeleting?: boolean;
}

export function BrandsTable({
  brands,
  onEdit,
  onDelete,
  isDeleting = false,
}: BrandsTableProps) {
  const [search, setSearch] = useState('');

  // Filter brands by search
  const filteredBrands = brands.filter((brand) =>
    brand.name.toLowerCase().includes(search.toLowerCase()) ||
    brand.slug?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar marcas..."
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
              <TableHead>Logo</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredBrands.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  {search ? 'No se encontraron marcas' : 'No hay marcas'}
                </TableCell>
              </TableRow>
            ) : (
              filteredBrands.map((brand) => (
                <TableRow key={brand._id}>
                  {/* Logo */}
                  <TableCell>
                    <Avatar className="h-10 w-10">
                      {brand.logo ? (
                        <AvatarImage src={brand.logo} alt={brand.name} />
                      ) : (
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {brand.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      )}
                    </Avatar>
                  </TableCell>

                  {/* Name */}
                  <TableCell>
                    <p className="font-medium">{brand.name}</p>
                  </TableCell>

                  {/* Slug */}
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {brand.slug}
                  </TableCell>

                  {/* Active */}
                  <TableCell>
                    {brand.active ? (
                      <Badge variant="default" className="bg-green-600">
                        Activa
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Inactiva</Badge>
                    )}
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onEdit(brand)}
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
                              `¿Estás seguro de eliminar la marca "${brand.name}"?`
                            )
                          ) {
                            onDelete(brand._id);
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
          Total: <strong>{filteredBrands.length}</strong>
        </span>
        <span>
          Activas: <strong>{filteredBrands.filter((b) => b.active).length}</strong>
        </span>
      </div>
    </div>
  );
}

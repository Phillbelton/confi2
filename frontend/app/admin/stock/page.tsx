'use client';

import { useQuery } from '@tanstack/react-query';
import { Warehouse, AlertTriangle, XCircle, Package } from 'lucide-react';
import { productService } from '@/services/products';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { ProductVariant } from '@/types';

export default function StockAdminPage() {
  // Fetch low stock variants
  const { data: lowStockData, isLoading: lowStockLoading } = useQuery({
    queryKey: ['low-stock'],
    queryFn: () => productService.getLowStockVariants(),
  });

  // Fetch out of stock variants
  const { data: outOfStockData, isLoading: outOfStockLoading } = useQuery({
    queryKey: ['out-of-stock'],
    queryFn: () => productService.getOutOfStockVariants(),
  });

  const lowStockVariants = lowStockData?.data || [];
  const outOfStockVariants = outOfStockData?.data || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Gestión de Stock</h2>
        <p className="text-muted-foreground">
          Monitorea el inventario de tus productos
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Bajo</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {lowStockVariants.length}
            </div>
            <p className="text-xs text-muted-foreground">Variantes con stock bajo</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sin Stock</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {outOfStockVariants.length}
            </div>
            <p className="text-xs text-muted-foreground">Variantes sin stock</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Alertas</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {lowStockVariants.length + outOfStockVariants.length}
            </div>
            <p className="text-xs text-muted-foreground">Requieren atención</p>
          </CardContent>
        </Card>
      </div>

      {/* Out of Stock Table */}
      {outOfStockVariants.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="h-5 w-5" />
              Sin Stock ({outOfStockVariants.length})
            </CardTitle>
            <CardDescription>
              Estas variantes están agotadas y necesitan reposición urgente
            </CardDescription>
          </CardHeader>
          <CardContent>
            {outOfStockLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Variante</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Backorder</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {outOfStockVariants.map((variant: ProductVariant) => (
                    <TableRow key={variant._id}>
                      <TableCell className="font-medium">
                        {typeof variant.parent === 'string' ? variant.parent : variant.parent?.name}
                      </TableCell>
                      <TableCell className="font-mono text-sm">{variant.sku}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {Object.entries(variant.attributes).map(([key, value]) => (
                            <Badge key={key} variant="outline" className="mr-1">
                              {value}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="destructive">{variant.stock}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={variant.allowBackorder ? 'default' : 'secondary'}>
                          {variant.allowBackorder ? 'Sí' : 'No'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Low Stock Table */}
      {lowStockVariants.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-600">
              <AlertTriangle className="h-5 w-5" />
              Stock Bajo ({lowStockVariants.length})
            </CardTitle>
            <CardDescription>
              Estas variantes están por debajo del umbral mínimo
            </CardDescription>
          </CardHeader>
          <CardContent>
            {lowStockLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Variante</TableHead>
                    <TableHead>Stock Actual</TableHead>
                    <TableHead>Umbral</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lowStockVariants.map((variant: ProductVariant) => (
                    <TableRow key={variant._id}>
                      <TableCell className="font-medium">
                        {typeof variant.parent === 'string' ? variant.parent : variant.parent?.name}
                      </TableCell>
                      <TableCell className="font-mono text-sm">{variant.sku}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {Object.entries(variant.attributes).map(([key, value]) => (
                            <Badge key={key} variant="outline" className="mr-1">
                              {value}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                          {variant.stock}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {variant.lowStockThreshold}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* No Issues */}
      {lowStockVariants.length === 0 && outOfStockVariants.length === 0 && !lowStockLoading && !outOfStockLoading && (
        <Alert>
          <Package className="h-4 w-4" />
          <AlertDescription>
            ¡Excelente! No hay productos con problemas de stock en este momento.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

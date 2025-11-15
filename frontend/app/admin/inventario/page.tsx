'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Package, RefreshCw, TrendingDown, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { productService } from '@/services/products';
import { useAdminProductVariants } from '@/hooks/admin/useAdminProducts';
import type { ProductVariant } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';

export default function InventarioPage() {
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [stockAdjustment, setStockAdjustment] = useState('');
  const [adjustmentReason, setAdjustmentReason] = useState('');

  // Get low stock variants
  const { data: lowStockData, isLoading, refetch } = useQuery({
    queryKey: ['low-stock-variants'],
    queryFn: productService.getLowStockVariants,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  const lowStockVariants = lowStockData?.data || [];

  // Get out of stock variants
  const { data: outStockData, isLoading: isLoadingOutStock } = useQuery({
    queryKey: ['out-stock-variants'],
    queryFn: productService.getOutOfStockVariants,
    staleTime: 1000 * 60 * 2,
  });

  const outStockVariants = outStockData?.data || [];

  const handleAdjustClick = (variant: ProductVariant) => {
    setSelectedVariant(variant);
    setStockAdjustment('');
    setAdjustmentReason('');
    setAdjustDialogOpen(true);
  };

  const handleAdjustStock = async () => {
    if (!selectedVariant || !stockAdjustment) return;

    const adjustment = parseInt(stockAdjustment, 10);
    if (isNaN(adjustment)) return;

    const newStock = Math.max(0, selectedVariant.stock + adjustment);

    // Here you would call the update stock API
    // For now, we'll just close the dialog
    console.log('Adjusting stock:', {
      variant: selectedVariant.sku,
      currentStock: selectedVariant.stock,
      adjustment,
      newStock,
      reason: adjustmentReason,
    });

    setAdjustDialogOpen(false);
    refetch();
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventario</h1>
          <p className="text-muted-foreground">
            Control de stock y movimientos de inventario
          </p>
        </div>
        <Button onClick={() => refetch()} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualizar
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Bajo</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lowStockVariants.length}</div>
            <p className="text-xs text-muted-foreground">
              Variantes con stock bajo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sin Stock</CardTitle>
            <Package className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{outStockVariants.length}</div>
            <p className="text-xs text-muted-foreground">
              Variantes agotadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Variantes</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {lowStockVariants.length + outStockVariants.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Requieren atención
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alert */}
      {lowStockVariants.length > 0 && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950 dark:border-amber-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-900 dark:text-amber-100">
              <AlertTriangle className="h-5 w-5" />
              Alertas de Stock Bajo
            </CardTitle>
            <CardDescription className="text-amber-700 dark:text-amber-300">
              Los siguientes productos tienen stock bajo y deben reabastecerse pronto
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <CardTitle>Control de Inventario</CardTitle>
          <CardDescription>
            Gestiona el stock de todas las variantes de productos
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : lowStockVariants.length === 0 && outStockVariants.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4" />
              <p className="text-lg font-medium mb-1">Todo en orden</p>
              <p className="text-sm">No hay productos con problemas de stock</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead>Producto</TableHead>
                    <TableHead>Stock Actual</TableHead>
                    <TableHead>Umbral</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...outStockVariants, ...lowStockVariants].map((variant) => {
                    const isOutOfStock = variant.stock === 0;

                    return (
                      <TableRow key={variant._id}>
                        <TableCell className="font-mono text-xs">
                          {variant.sku}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{variant.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {Object.entries(variant.attributes)
                                .map(([key, value]) => `${key}: ${value}`)
                                .join(', ')}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold">{variant.stock}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {variant.lowStockThreshold}
                          </span>
                        </TableCell>
                        <TableCell>
                          {isOutOfStock ? (
                            <Badge variant="destructive">Agotado</Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                              Stock Bajo
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAdjustClick(variant)}
                          >
                            Ajustar Stock
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Adjust Stock Dialog */}
      <Dialog open={adjustDialogOpen} onOpenChange={setAdjustDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajustar Stock</DialogTitle>
            <DialogDescription>
              {selectedVariant && (
                <>
                  {selectedVariant.name} ({selectedVariant.sku})
                  <br />
                  <span className="text-sm">
                    Stock actual: <strong>{selectedVariant.stock}</strong> unidades
                  </span>
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="adjustment">Ajuste de Stock</Label>
              <Input
                id="adjustment"
                type="number"
                placeholder="Ingresa cantidad (+ o -)"
                value={stockAdjustment}
                onChange={(e) => setStockAdjustment(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Usa números positivos para agregar (+10) o negativos para reducir (-5)
              </p>
              {stockAdjustment && selectedVariant && (
                <p className="text-sm font-medium mt-2">
                  Nuevo stock:{' '}
                  <span className="text-blue-600">
                    {Math.max(0, selectedVariant.stock + parseInt(stockAdjustment || '0', 10))}
                  </span>
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="reason">Razón del Ajuste (opcional)</Label>
              <Input
                id="reason"
                placeholder="Ej: Recepción de mercadería, corrección de inventario"
                value={adjustmentReason}
                onChange={(e) => setAdjustmentReason(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjustDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAdjustStock} disabled={!stockAdjustment}>
              Confirmar Ajuste
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

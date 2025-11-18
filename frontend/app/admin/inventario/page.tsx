'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Package, RefreshCw, TrendingUp, History, Calendar } from 'lucide-react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { productService } from '@/services/products';
import { useStockMovements, useStockOperations } from '@/hooks/admin/useStockMovements';
import type { ProductVariant } from '@/types';
import type { StockMovement } from '@/services/admin/stockMovements';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function InventarioPage() {
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [stockAdjustment, setStockAdjustment] = useState('');
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [adjustmentNotes, setAdjustmentNotes] = useState('');

  // Filters for movements history
  const [movementsPage, setMovementsPage] = useState(1);
  const [movementsType, setMovementsType] = useState<string>('all');
  const [movementsSearch, setMovementsSearch] = useState('');

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

  // Get stock movements
  const {
    data: movementsData,
    isLoading: isLoadingMovements,
    refetch: refetchMovements,
  } = useStockMovements({
    page: movementsPage,
    limit: 20,
    type: movementsType !== 'all' ? (movementsType as any) : undefined,
  });

  const movements = movementsData?.data?.movements || [];
  const movementsPagination = movementsData?.data?.pagination;

  // Stock operations
  const { adjustStock, isAdjusting } = useStockOperations();

  const handleAdjustClick = (variant: ProductVariant) => {
    setSelectedVariant(variant);
    setStockAdjustment('');
    setAdjustmentReason('');
    setAdjustmentNotes('');
    setAdjustDialogOpen(true);
  };

  const handleAdjustStock = async () => {
    if (!selectedVariant || !stockAdjustment || !adjustmentReason) return;

    const adjustment = parseInt(stockAdjustment, 10);
    if (isNaN(adjustment) || adjustment === 0) {
      return;
    }

    adjustStock(
      {
        variant: selectedVariant._id,
        quantity: adjustment,
        reason: adjustmentReason,
        notes: adjustmentNotes || undefined,
      },
      {
        onSuccess: () => {
          setAdjustDialogOpen(false);
          refetch();
          refetchMovements();
        },
      }
    );
  };

  const getMovementTypeBadge = (type: StockMovement['type']) => {
    const variants = {
      sale: { label: 'Venta', variant: 'default' as const, color: 'bg-blue-600' },
      restock: { label: 'Reabastecimiento', variant: 'default' as const, color: 'bg-green-600' },
      adjustment: { label: 'Ajuste', variant: 'secondary' as const, color: 'bg-gray-600' },
      return: { label: 'Devolución', variant: 'default' as const, color: 'bg-amber-600' },
      damage: { label: 'Daño/Pérdida', variant: 'destructive' as const, color: '' },
    };

    const config = variants[type] || variants.adjustment;

    return (
      <Badge variant={config.variant} className={config.color}>
        {config.label}
      </Badge>
    );
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
        <Button onClick={() => { refetch(); refetchMovements(); }} variant="outline" size="sm">
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

      {/* Tabs */}
      <Tabs defaultValue="alerts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="alerts">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Alertas de Stock
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="h-4 w-4 mr-2" />
            Historial de Movimientos
          </TabsTrigger>
        </TabsList>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4">
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
                                    .map(([key, value]: [string, string]) => `${key}: ${value}`)
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
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Historial de Movimientos</CardTitle>
                  <CardDescription>
                    Registro completo de todos los movimientos de stock
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Select value={movementsType} onValueChange={setMovementsType}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Tipo de movimiento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="sale">Ventas</SelectItem>
                      <SelectItem value="restock">Reabastecimientos</SelectItem>
                      <SelectItem value="adjustment">Ajustes</SelectItem>
                      <SelectItem value="return">Devoluciones</SelectItem>
                      <SelectItem value="damage">Daños/Pérdidas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingMovements ? (
                <div className="space-y-3">
                  {[...Array(10)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : movements.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <History className="h-12 w-12 mx-auto mb-4" />
                  <p className="text-lg font-medium mb-1">No hay movimientos</p>
                  <p className="text-sm">Aún no se han registrado movimientos de stock</p>
                </div>
              ) : (
                <>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Variante</TableHead>
                          <TableHead className="text-right">Cantidad</TableHead>
                          <TableHead className="text-right">Stock Anterior</TableHead>
                          <TableHead className="text-right">Stock Nuevo</TableHead>
                          <TableHead>Motivo</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {movements.map((movement: StockMovement) => (
                          <TableRow key={movement._id}>
                            <TableCell className="text-sm">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3 text-muted-foreground" />
                                {format(new Date(movement.createdAt), 'dd/MM/yyyy HH:mm', {
                                  locale: es,
                                })}
                              </div>
                            </TableCell>
                            <TableCell>{getMovementTypeBadge(movement.type)}</TableCell>
                            <TableCell className="font-mono text-xs">
                              {typeof movement.variant === 'string'
                                ? movement.variant
                                : movement.variant}
                            </TableCell>
                            <TableCell className="text-right">
                              <span
                                className={`font-semibold ${
                                  movement.quantity > 0 ? 'text-green-600' : 'text-red-600'
                                }`}
                              >
                                {movement.quantity > 0 ? '+' : ''}
                                {movement.quantity}
                              </span>
                            </TableCell>
                            <TableCell className="text-right text-muted-foreground">
                              {movement.previousStock}
                            </TableCell>
                            <TableCell className="text-right font-semibold">
                              {movement.newStock}
                            </TableCell>
                            <TableCell className="text-sm">
                              {movement.reason || '—'}
                              {movement.notes && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {movement.notes}
                                </p>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination */}
                  {movementsPagination && movementsPagination.totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <p className="text-sm text-muted-foreground">
                        Página {movementsPagination.currentPage} de {movementsPagination.totalPages}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setMovementsPage((p) => Math.max(1, p - 1))}
                          disabled={!movementsPagination.hasPrevPage}
                        >
                          Anterior
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setMovementsPage((p) => p + 1)}
                          disabled={!movementsPagination.hasNextPage}
                        >
                          Siguiente
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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
              <Label htmlFor="adjustment">
                Ajuste de Stock <span className="text-red-600">*</span>
              </Label>
              <Input
                id="adjustment"
                type="number"
                placeholder="Ingresa cantidad (+ o -)"
                value={stockAdjustment}
                onChange={(e) => setStockAdjustment(e.target.value)}
                disabled={isAdjusting}
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
              <Label htmlFor="reason">
                Razón del Ajuste <span className="text-red-600">*</span>
              </Label>
              <Input
                id="reason"
                placeholder="Ej: Recepción de mercadería, corrección de inventario"
                value={adjustmentReason}
                onChange={(e) => setAdjustmentReason(e.target.value)}
                disabled={isAdjusting}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Mínimo 5 caracteres
              </p>
            </div>

            <div>
              <Label htmlFor="notes">Notas adicionales (opcional)</Label>
              <Input
                id="notes"
                placeholder="Información adicional sobre el ajuste"
                value={adjustmentNotes}
                onChange={(e) => setAdjustmentNotes(e.target.value)}
                disabled={isAdjusting}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAdjustDialogOpen(false)}
              disabled={isAdjusting}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleAdjustStock}
              disabled={
                !stockAdjustment ||
                !adjustmentReason ||
                adjustmentReason.length < 5 ||
                isAdjusting
              }
            >
              {isAdjusting ? 'Ajustando...' : 'Confirmar Ajuste'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Edit, Loader2, Trash2, Plus, AlertCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { ProductSelector } from './ProductSelector';
import type { Order } from '@/types/order';
import { formatCurrency } from '@/lib/utils';

interface EditOrderItemsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order;
  onSave: (data: { items: { variantId: string; quantity: number }[]; adminNotes?: string }) => void;
  isSaving: boolean;
}

interface EditableItem {
  variantId: string;
  name: string;
  sku: string;
  image?: string;
  attributes: Record<string, string>;
  pricePerUnit: number;
  quantity: number;
  discount: number;
  subtotal: number;
  originalQuantity: number; // Para tracking de cambios
}

export function EditOrderItemsModal({
  open,
  onOpenChange,
  order,
  onSave,
  isSaving,
}: EditOrderItemsModalProps) {
  // Initialize editable items from order
  const [items, setItems] = useState<EditableItem[]>(() =>
    order.items.map((item) => ({
      variantId: item.variant,
      name: item.variantSnapshot.name,
      sku: item.variantSnapshot.sku,
      image: item.variantSnapshot.image,
      attributes: item.variantSnapshot.attributes,
      pricePerUnit: item.pricePerUnit,
      quantity: item.quantity,
      discount: item.discount,
      subtotal: item.subtotal,
      originalQuantity: item.quantity,
    }))
  );

  const [adminNotes, setAdminNotes] = useState('');
  const [productSelectorOpen, setProductSelectorOpen] = useState(false);

  // Calculate totals
  const calculateTotals = (currentItems: EditableItem[]) => {
    const subtotal = currentItems.reduce((sum, item) => {
      return sum + item.pricePerUnit * item.quantity;
    }, 0);

    // En producción, los descuentos se recalcularían en el backend
    // Por ahora, mantenemos los descuentos proporcionales
    const totalDiscount = currentItems.reduce((sum, item) => {
      // Descuento proporcional basado en cantidad
      const discountPerUnit = item.discount / item.originalQuantity || 0;
      return sum + discountPerUnit * item.quantity;
    }, 0);

    return {
      subtotal,
      totalDiscount,
      shippingCost: order.shippingCost,
      total: subtotal - totalDiscount + order.shippingCost,
    };
  };

  const currentTotals = calculateTotals(items);
  const originalTotal = order.total;
  const difference = currentTotals.total - originalTotal;

  // Handlers
  const handleQuantityChange = (index: number, newQuantity: number) => {
    const updatedItems = [...items];
    updatedItems[index] = {
      ...updatedItems[index],
      quantity: Math.max(1, newQuantity),
      subtotal: updatedItems[index].pricePerUnit * Math.max(1, newQuantity),
    };
    setItems(updatedItems);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) {
      alert('Debe haber al menos un producto en la orden');
      return;
    }
    const updatedItems = items.filter((_, i) => i !== index);
    setItems(updatedItems);
  };

  const handleAddProduct = (variant: any, quantity: number) => {
    const newItem: EditableItem = {
      variantId: variant._id,
      name: variant.name,
      sku: variant.sku,
      image: variant.image,
      attributes: variant.attributes || {},
      pricePerUnit: variant.price,
      quantity,
      discount: 0,
      subtotal: variant.price * quantity,
      originalQuantity: 0, // New item
    };
    setItems([...items, newItem]);
  };

  const handleSave = () => {
    const itemsData = items.map((item) => ({
      variantId: item.variantId,
      quantity: item.quantity,
    }));

    onSave({
      items: itemsData,
      adminNotes: adminNotes.trim() || undefined,
    });
  };

  const hasChanges = items.length !== order.items.length ||
    items.some((item, idx) => {
      const original = order.items[idx];
      return !original || item.quantity !== original.quantity || item.variantId !== original.variant;
    });

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent fullScreenMobile className="sm:max-w-[700px] sm:max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Editar Productos - {order.orderNumber}
            </DialogTitle>
            <DialogDescription>
              Modifica cantidades, elimina o agrega productos a esta orden
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto py-4 space-y-5 sm:space-y-4">
            {/* Current Items */}
            <div className="space-y-4 sm:space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base sm:text-sm">Productos ({items.length})</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setProductSelectorOpen(true)}
                  className="gap-2 min-h-[44px] sm:min-h-0"
                >
                  <Plus className="h-4 w-4" />
                  Agregar
                </Button>
              </div>

              <div className="space-y-4 sm:space-y-2">
                {items.map((item, index) => (
                  <div
                    key={index}
                    className="p-4 sm:p-3 border rounded-xl sm:rounded-lg bg-slate-50 dark:bg-slate-900 space-y-3 sm:space-y-2"
                  >
                    {/* Product info row */}
                    <div className="flex gap-3 items-start">
                      {item.image && (
                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg bg-slate-200 dark:bg-slate-800 flex-shrink-0 overflow-hidden">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm leading-tight">{item.name}</p>
                        <p className="text-xs text-slate-500 font-mono mt-0.5">SKU: {item.sku}</p>
                        {Object.keys(item.attributes).length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {Object.entries(item.attributes).map(([key, value]) => (
                              <Badge key={key} variant="outline" className="text-xs">
                                {key}: {value}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Price + Quantity + Delete row */}
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-10 w-10 sm:h-8 sm:w-8 rounded-lg"
                          onClick={() => handleQuantityChange(index, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                        >
                          -
                        </Button>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) =>
                            handleQuantityChange(index, parseInt(e.target.value) || 1)
                          }
                          className="w-14 h-10 sm:w-16 sm:h-8 text-center text-base sm:text-sm rounded-lg"
                          min="1"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-10 w-10 sm:h-8 sm:w-8 rounded-lg"
                          onClick={() => handleQuantityChange(index, item.quantity + 1)}
                        >
                          +
                        </Button>
                      </div>

                      <p className="text-sm font-semibold whitespace-nowrap">
                        {formatCurrency(item.pricePerUnit * item.quantity)}
                      </p>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveItem(index)}
                        disabled={items.length <= 1}
                        className="h-10 w-10 sm:h-8 sm:w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Totals Summary */}
            <div className="bg-slate-100 dark:bg-slate-900 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">Subtotal:</span>
                <span className="font-semibold">{formatCurrency(currentTotals.subtotal)}</span>
              </div>
              {currentTotals.totalDiscount > 0 && (
                <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                  <span>Descuentos:</span>
                  <span className="font-semibold">-{formatCurrency(currentTotals.totalDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">Costo de envío:</span>
                <span className="font-semibold">{formatCurrency(currentTotals.shippingCost)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold">
                <span>TOTAL NUEVO:</span>
                <span>{formatCurrency(currentTotals.total)}</span>
              </div>

              {/* Difference */}
              {difference !== 0 && (
                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-sm font-medium">Diferencia:</span>
                  <div className="flex items-center gap-2">
                    {difference > 0 ? (
                      <>
                        <TrendingUp className="h-4 w-4 text-red-600" />
                        <span className="font-semibold text-red-600">
                          +{formatCurrency(Math.abs(difference))}
                        </span>
                      </>
                    ) : (
                      <>
                        <TrendingDown className="h-4 w-4 text-green-600" />
                        <span className="font-semibold text-green-600">
                          -{formatCurrency(Math.abs(difference))}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Admin Notes */}
            <div className="space-y-2">
              <Label htmlFor="adminNotes">Notas sobre los cambios (opcional)</Label>
              <Textarea
                id="adminNotes"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Ej: Cliente solicitó cambio de producto por WhatsApp"
                rows={3}
                maxLength={1000}
              />
              <p className="text-xs text-slate-500">{adminNotes.length}/1000 caracteres</p>
            </div>

            {/* Warning */}
            {hasChanges && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  Los descuentos se recalcularán automáticamente al guardar.
                </AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-row sm:gap-0">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving} className="min-h-[44px] sm:min-h-0">
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || !hasChanges || items.length === 0}
              className="gap-2 min-h-[44px] sm:min-h-0"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Edit className="h-4 w-4" />
                  Guardar Cambios
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Product Selector Modal */}
      <ProductSelector
        open={productSelectorOpen}
        onOpenChange={setProductSelectorOpen}
        onSelect={handleAddProduct}
        excludedVariantIds={items.map((item) => item.variantId)}
      />
    </>
  );
}

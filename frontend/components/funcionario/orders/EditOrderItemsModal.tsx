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
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Editar Productos - {order.orderNumber}
            </DialogTitle>
            <DialogDescription>
              Modifica cantidades, elimina o agrega productos a esta orden
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto py-4 space-y-4">
            {/* Current Items */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Productos Actuales ({items.length})</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setProductSelectorOpen(true)}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Agregar Producto
                </Button>
              </div>

              <div className="space-y-2">
                {items.map((item, index) => (
                  <div
                    key={index}
                    className="flex gap-3 p-3 border rounded-lg bg-slate-50 dark:bg-slate-900"
                  >
                    {/* Product Image */}
                    {item.image && (
                      <div className="w-16 h-16 rounded bg-slate-200 dark:bg-slate-800 flex-shrink-0 overflow-hidden">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{item.name}</p>
                      <p className="text-xs text-slate-500 font-mono">SKU: {item.sku}</p>
                      {Object.keys(item.attributes).length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {Object.entries(item.attributes).map(([key, value]) => (
                            <Badge key={key} variant="outline" className="text-xs">
                              {key}: {value}
                            </Badge>
                          ))}
                        </div>
                      )}
                      <p className="text-sm mt-1">
                        {formatCurrency(item.pricePerUnit)} × {item.quantity} ={' '}
                        <span className="font-semibold">
                          {formatCurrency(item.pricePerUnit * item.quantity)}
                        </span>
                      </p>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex flex-col gap-2 items-end">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
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
                          className="w-16 h-8 text-center"
                          min="1"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleQuantityChange(index, item.quantity + 1)}
                        >
                          +
                        </Button>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveItem(index)}
                        disabled={items.length <= 1}
                        className="gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-3 w-3" />
                        Eliminar
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
                  Los descuentos y el stock se recalcularán automáticamente al guardar.
                </AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || !hasChanges || items.length === 0}
              className="gap-2"
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

function formatCurrency(value: number): string {
  return '$' + new Intl.NumberFormat('es-CL', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { ProductSelector } from './ProductSelector';
import { getImageUrl } from '@/lib/images';
import { effectiveUnitPrice } from '@/lib/discountCalculator';
import type { Order } from '@/types/order';
import type { Product } from '@/types';

interface EditableItem {
  productId: string;
  name: string;
  barcode?: string;
  image?: string;
  unitPrice: number;
  quantity: number;
  product?: Product;
}

interface EditOrderItemsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order;
  onSave: (data: { items: { productId: string; quantity: number }[]; adminNotes?: string }) => void;
  isSaving?: boolean;
}

function formatCLP(n: number) {
  return `$${Math.round(n).toLocaleString('es-CL')}`;
}

export function EditOrderItemsModal({
  open,
  onOpenChange,
  order,
  onSave,
  isSaving,
}: EditOrderItemsModalProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [items, setItems] = useState<EditableItem[]>([]);

  // Reset state when modal opens with a new order
  useEffect(() => {
    if (open) {
      setItems(
        order.items.map((item) => ({
          productId: item.product,
          name: item.productSnapshot.name,
          barcode: item.productSnapshot.barcode,
          image: item.productSnapshot.image,
          unitPrice: item.pricePerUnit,
          quantity: item.quantity,
        }))
      );
      setAdminNotes('');
    }
  }, [open, order]);

  const handleAdd = (p: Product) => {
    setItems((prev) => {
      const existing = prev.find((it) => it.productId === p._id);
      if (existing) {
        return prev.map((it) =>
          it.productId === p._id ? { ...it, quantity: it.quantity + 1 } : it
        );
      }
      return [
        ...prev,
        {
          productId: p._id,
          name: p.name,
          barcode: p.barcode,
          image: p.images?.[0],
          unitPrice: p.unitPrice,
          quantity: 1,
          product: p,
        },
      ];
    });
  };

  const handleQty = (productId: string, qty: number) =>
    setItems((prev) =>
      prev.map((it) =>
        it.productId === productId ? { ...it, quantity: Math.max(1, qty) } : it
      )
    );

  const handleRemove = (productId: string) =>
    setItems((prev) => prev.filter((it) => it.productId !== productId));

  const previewPrice = (it: EditableItem) =>
    it.product ? effectiveUnitPrice(it.product, it.quantity) : it.unitPrice;

  const subtotal = items.reduce((sum, it) => sum + previewPrice(it) * it.quantity, 0);

  const handleSave = () => {
    if (items.length === 0) return;
    onSave({
      items: items.map((it) => ({ productId: it.productId, quantity: it.quantity })),
      adminNotes: adminNotes || undefined,
    });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Editar productos de la orden</DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {items.length === 0 && (
              <p className="text-sm text-muted-foreground">
                La orden no tiene productos. Agregá al menos uno para poder guardar.
              </p>
            )}
            {items.map((it) => (
              <div key={it.productId} className="flex items-center gap-3 p-3 rounded-md border">
                {it.image ? (
                  <img
                    src={getImageUrl(it.image)}
                    alt={it.name}
                    className="h-12 w-12 rounded object-cover"
                  />
                ) : (
                  <div className="h-12 w-12 rounded bg-muted" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{it.name}</p>
                  {it.barcode && (
                    <p className="text-xs text-muted-foreground font-mono truncate">
                      {it.barcode}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    {formatCLP(previewPrice(it))} c/u
                  </p>
                </div>
                <Input
                  type="number"
                  min={1}
                  value={it.quantity}
                  onChange={(e) =>
                    handleQty(it.productId, parseInt(e.target.value || '1', 10))
                  }
                  className="w-20"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemove(it.productId)}
                  aria-label="Quitar"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              onClick={() => setPickerOpen(true)}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Agregar producto
            </Button>

            <Separator />

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Subtotal estimado ({items.length} ítem{items.length === 1 ? '' : 's'})
              </span>
              <span className="font-semibold">{formatCLP(subtotal)}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              El precio final lo recalcula el backend (incluye descuentos por volumen y ofertas vigentes).
            </p>

            <div className="space-y-1">
              <label className="text-sm font-medium">Notas administrativas (opcional)</label>
              <Textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Motivo del cambio, observaciones, etc."
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isSaving || items.length === 0}>
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Guardar cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ProductSelector
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onSelect={handleAdd}
        excludeIds={items.map((it) => it.productId)}
      />
    </>
  );
}

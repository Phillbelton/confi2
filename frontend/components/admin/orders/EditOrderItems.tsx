'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Plus, Trash2, Save, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ProductSelector } from './ProductSelector';
import { useAdminOrders } from '@/hooks/admin/useAdminOrders';
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
  product?: Product; // present for new items, used for tiered pricing preview
}

interface EditOrderItemsProps {
  order: Order;
  onSuccess?: () => void;
  onCancel?: () => void;
}

function formatCLP(n: number) {
  return `$${Math.round(n).toLocaleString('es-CL')}`;
}

export function EditOrderItems({ order, onSuccess, onCancel }: EditOrderItemsProps) {
  const { editOrderItems, isEditingItems } = useAdminOrders({ page: 1, limit: 10 });
  const [pickerOpen, setPickerOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');

  const [items, setItems] = useState<EditableItem[]>(
    order.items.map((item) => ({
      productId: item.product,
      name: item.productSnapshot.name,
      barcode: item.productSnapshot.barcode,
      image: item.productSnapshot.image,
      unitPrice: item.pricePerUnit,
      quantity: item.quantity,
    }))
  );

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

  const handleQty = (productId: string, qty: number) => {
    setItems((prev) =>
      prev.map((it) => (it.productId === productId ? { ...it, quantity: Math.max(1, qty) } : it))
    );
  };

  const handleRemove = (productId: string) => {
    setItems((prev) => prev.filter((it) => it.productId !== productId));
  };

  const previewPrice = (it: EditableItem) =>
    it.product ? effectiveUnitPrice(it.product, it.quantity) : it.unitPrice;

  const subtotal = items.reduce((sum, it) => sum + previewPrice(it) * it.quantity, 0);

  const handleSave = () => {
    if (items.length === 0) return;
    editOrderItems(
      {
        id: order._id,
        data: {
          items: items.map((it) => ({ productId: it.productId, quantity: it.quantity })),
          adminNotes: adminNotes || undefined,
        },
      },
      { onSuccess: () => onSuccess?.() }
    );
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Editar productos de la orden</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {items.length === 0 && (
            <p className="text-sm text-muted-foreground">
              La orden no tiene productos. Agrega al menos uno para poder guardar.
            </p>
          )}
          {items.map((it) => (
            <div key={it.productId} className="flex items-center gap-3 p-3 rounded-md border">
              {it.image ? (
                <Image
                  src={getImageUrl(it.image)}
                  alt={it.name}
                  width={48}
                  height={48}
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
                onChange={(e) => handleQty(it.productId, parseInt(e.target.value || '1', 10))}
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
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel} disabled={isEditingItems}>
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isEditingItems || items.length === 0}>
            {isEditingItems ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Guardar cambios
          </Button>
        </CardFooter>
      </Card>

      <ProductSelector
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onSelect={handleAdd}
        excludeIds={items.map((it) => it.productId)}
      />
    </>
  );
}

'use client';

import { useState, useMemo, useEffect } from 'react';
import { Plus, Trash2, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { InlineHelp } from '@/components/ui/inline-help';
import { ProductSelector } from './ProductSelector';
import { useAdminOrders } from '@/hooks/admin/useAdminOrders';
import type { Order } from '@/types/order';
import type { ProductVariant, ProductParent } from '@/types';
import { getImageUrl } from '@/lib/images';
import { calculateItemDiscount } from '@/lib/discountCalculator';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';

interface EditableItem {
  variantId: string;
  sku: string;
  name: string;
  price: number;
  attributes: Record<string, string>;
  image?: string;
  quantity: number;
  variant?: ProductVariant;
  productParent?: ProductParent;
}

interface EditOrderItemsProps {
  order: Order;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function EditOrderItems({ order, onSuccess, onCancel }: EditOrderItemsProps) {
  const { editOrderItems, isEditingItems } = useAdminOrders({ page: 1, limit: 10 });
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');

  // Convert order items to editable format
  const [items, setItems] = useState<EditableItem[]>(
    order.items.map((item) => ({
      variantId: item.variant,
      sku: item.variantSnapshot.sku,
      name: item.variantSnapshot.name,
      price: item.pricePerUnit,
      attributes: item.variantSnapshot.attributes,
      image: item.variantSnapshot.image,
      quantity: item.quantity,
    }))
  );

  // Fetch complete variant data for existing items to calculate discounts
  const variantIds = order.items.map((item) => item.variant);
  const { data: variantsData } = useQuery({
    queryKey: ['order-variants', order._id],
    queryFn: async () => {
      // Fetch all variants in parallel
      const promises = variantIds.map((id) =>
        api.get(`/products/variants/${id}`).then((res) => res.data.data)
      );
      const variants = await Promise.all(promises);
      return variants as ProductVariant[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Update items with complete variant data when loaded
  useEffect(() => {
    if (variantsData && variantsData.length > 0) {
      setItems((currentItems) =>
        currentItems.map((item) => {
          // Skip if already has variant data (newly added items)
          if (item.variant && item.productParent) return item;

          // Find matching variant data
          const variantData = variantsData.find((v) => v._id === item.variantId);
          if (variantData) {
            return {
              ...item,
              variant: variantData,
              productParent: variantData.parent as ProductParent,
            };
          }
          return item;
        })
      );
    }
  }, [variantsData]);

  // Calculate totals with discount calculator
  const calculateTotals = useMemo(() => {
    // Prepare items for discount calculation
    const calculationItems = items.map((item) => {
      // If we have full variant/parent data, use discount calculator
      if (item.variant && item.productParent) {
        const discountResult = calculateItemDiscount(
          item.variant,
          item.quantity,
          item.productParent,
          items
            .filter((i) => i.variant && i.productParent)
            .map((i) => ({
              variant: i.variant!,
              quantity: i.quantity,
              productParent: i.productParent!,
            }))
        );
        return {
          ...item,
          originalPrice: discountResult.originalPrice,
          finalPrice: discountResult.finalPrice,
          discountPerUnit: discountResult.discountPerUnit,
          subtotal: discountResult.subtotal,
          totalDiscount: discountResult.totalDiscount,
        };
      }
      // Fallback for items from order (no discount data available)
      return {
        ...item,
        originalPrice: item.price,
        finalPrice: item.price,
        discountPerUnit: 0,
        subtotal: item.price * item.quantity,
        totalDiscount: 0,
      };
    });

    const subtotal = calculationItems.reduce((sum, item) => sum + item.subtotal, 0);
    const totalDiscount = calculationItems.reduce((sum, item) => sum + item.totalDiscount, 0);
    const total = subtotal + order.shippingCost;

    return { calculationItems, subtotal, totalDiscount, total };
  }, [items, order.shippingCost]);

  const { calculationItems, subtotal: newSubtotal, totalDiscount, total: newTotal } = calculateTotals;
  const hasChanges =
    JSON.stringify(items) !==
    JSON.stringify(
      order.items.map((item) => ({
        variantId: item.variant,
        sku: item.variantSnapshot.sku,
        name: item.variantSnapshot.name,
        price: item.pricePerUnit,
        attributes: item.variantSnapshot.attributes,
        image: item.variantSnapshot.image,
        quantity: item.quantity,
      }))
    );

  // Handle add product
  const handleAddProduct = (variant: any) => {
    setItems([
      ...items,
      {
        variantId: variant._id,
        sku: variant.sku,
        name: variant.name,
        price: variant.price,
        attributes: variant.attributes || {},
        image: variant.images?.[0],
        quantity: 1,
        variant: variant as ProductVariant,
        productParent: variant.parentProduct as ProductParent,
      },
    ]);
  };

  // Handle remove item
  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  // Handle quantity change
  const handleQuantityChange = (index: number, quantity: number) => {
    if (quantity < 1) return;
    if (quantity > 100) return;

    const newItems = [...items];
    newItems[index].quantity = quantity;
    setItems(newItems);
  };

  // Handle save
  const handleSave = () => {
    if (items.length === 0) {
      alert('La orden debe tener al menos 1 producto');
      return;
    }

    editOrderItems(
      {
        id: order._id,
        data: {
          items: items.map((item) => ({
            variantId: item.variantId,
            quantity: item.quantity,
          })),
          adminNotes: adminNotes || undefined,
        },
      },
      {
        onSuccess: () => {
          onSuccess?.();
        },
      }
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Editar Productos de la Orden
          <Badge variant="secondary">{items.length} items</Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Warning */}
        <InlineHelp variant="warning">
          Los cambios en productos afectarán el stock automáticamente. Los descuentos se
          recalcularán según las reglas actuales.
        </InlineHelp>

        {/* Items list */}
        <div className="space-y-2">
          {calculationItems.map((item, index) => {
            const attributes = Object.entries(item.attributes || {});
            const hasDiscount = item.discountPerUnit > 0;

            return (
              <div key={index} className="flex items-center gap-3 p-3 rounded-lg border">
                {/* Image */}
                {item.image && (
                  <img
                    src={getImageUrl(item.image, 'thumbnail')}
                    alt={item.name}
                    className="w-12 h-12 object-cover rounded"
                  />
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate">{item.name}</p>
                    {hasDiscount && (
                      <Badge variant="secondary" className="text-xs">
                        -{item.discountPerUnit.toLocaleString('es-PY')} Gs
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="font-mono">{item.sku}</span>
                    {attributes.length > 0 && (
                      <>
                        <span>•</span>
                        <span>{attributes.map(([key, value]) => value).join(', ')}</span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    {hasDiscount ? (
                      <>
                        <span className="line-through text-muted-foreground">
                          ${item.originalPrice.toLocaleString('es-PY')}
                        </span>
                        <span className="font-semibold text-primary">
                          ${item.finalPrice.toLocaleString('es-PY')} c/u
                        </span>
                      </>
                    ) : (
                      <span className="font-semibold">
                        ${item.finalPrice.toLocaleString('es-PY')} c/u
                      </span>
                    )}
                  </div>
                </div>

                {/* Quantity input */}
                <div className="flex items-center gap-2">
                  <label className="text-sm text-muted-foreground">Cant:</label>
                  <Input
                    type="number"
                    min="1"
                    max="100"
                    value={item.quantity}
                    onChange={(e) => handleQuantityChange(index, parseInt(e.target.value) || 1)}
                    className="w-20"
                  />
                </div>

                {/* Subtotal */}
                <div className="text-right min-w-[100px]">
                  <p className="text-sm text-muted-foreground">Subtotal</p>
                  <p className="font-semibold">
                    ${item.subtotal.toLocaleString('es-PY')}
                  </p>
                </div>

                {/* Delete button */}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveItem(index)}
                  disabled={items.length === 1}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            );
          })}
        </div>

        {/* Add product button */}
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => setSelectorOpen(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Agregar Producto
        </Button>

        <Separator />

        {/* Summary */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal anterior:</span>
            <span className="line-through">${order.subtotal.toLocaleString('es-PY')}</span>
          </div>
          <div className="flex justify-between font-semibold">
            <span>Nuevo subtotal:</span>
            <span className="text-primary">${newSubtotal.toLocaleString('es-PY')}</span>
          </div>
          {totalDiscount > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Descuentos aplicados:</span>
              <span>-${totalDiscount.toLocaleString('es-PY')}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Costo de envío:</span>
            <span>${order.shippingCost.toLocaleString('es-PY')}</span>
          </div>
          <Separator />
          <div className="flex justify-between text-lg font-bold">
            <span>Total nuevo:</span>
            <span className="text-primary">${newTotal.toLocaleString('es-PY')}</span>
          </div>
          {hasChanges && (
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Diferencia:</span>
              <span className={newTotal > order.total ? 'text-green-600' : 'text-red-600'}>
                {newTotal > order.total ? '+' : ''}$
                {(newTotal - order.total).toLocaleString('es-PY')}
              </span>
            </div>
          )}
        </div>

        <Separator />

        {/* Admin notes */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Notas (opcional)</label>
          <Textarea
            placeholder="Describe los cambios realizados..."
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            rows={3}
            maxLength={1000}
          />
          <p className="text-xs text-muted-foreground">{adminNotes.length} / 1000 caracteres</p>
        </div>
      </CardContent>

      <CardFooter className="flex gap-2">
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={isEditingItems}
          className="flex-1"
        >
          <X className="h-4 w-4 mr-2" />
          Cancelar
        </Button>
        <Button
          onClick={handleSave}
          disabled={!hasChanges || isEditingItems || items.length === 0}
          className="flex-1"
        >
          <Save className="h-4 w-4 mr-2" />
          {isEditingItems ? 'Guardando...' : 'Guardar Cambios'}
        </Button>
      </CardFooter>

      {/* Product selector modal */}
      <ProductSelector
        open={selectorOpen}
        onClose={() => setSelectorOpen(false)}
        onSelect={handleAddProduct}
        selectedVariantIds={items.map((item) => item.variantId)}
      />
    </Card>
  );
}

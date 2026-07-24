'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { useDebounce } from 'use-debounce';
import { Plus, Trash2, Save, X, Loader2, AlertTriangle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { ProductSelector } from '@/components/admin/orders/ProductSelector';
import { PresentationPicker, presentationLabel } from './PresentationPicker';
import { getImageUrl } from '@/lib/images';
import { formatCurrency } from '@/lib/utils';
import type { Order, EditOrderLine, OrderEditPreview } from '@/types/order';
import type { Product, SaleUnitType } from '@/types';

/** Línea en edición. El precio NO se calcula acá: lo trae el preview. */
interface EditLine {
  productId: string;
  presentationId?: string;
  name: string;
  barcode?: string;
  image?: string;
  quantity: number;
  /** Del snapshot, por si el producto no tiene presentaciones que elegir. */
  fallbackLabel: string;
}

interface OrderItemsEditorProps {
  order: Order;
  /** Cliente de preview según la superficie (admin o funcionario). */
  previewFn: (id: string, items: EditOrderLine[]) => Promise<OrderEditPreview>;
  onSave: (data: { items: EditOrderLine[]; adminNotes?: string }) => void;
  onCancel: () => void;
  isSaving?: boolean;
}

const lineKey = (productId: string, presentationId?: string) =>
  `${productId}__${presentationId ?? 'principal'}`;

function linesFromOrder(order: Order): EditLine[] {
  return order.items.map((item) => ({
    productId: item.product,
    presentationId: item.presentationId,
    name: item.productSnapshot.name,
    barcode: item.productSnapshot.barcode,
    image: item.productSnapshot.image,
    quantity: item.quantity,
    fallbackLabel: presentationLabel({
      type: (item.productSnapshot.saleUnit?.type ?? 'unidad') as SaleUnitType,
      quantity: item.productSnapshot.saleUnit?.quantity ?? 1,
    }),
  }));
}

/**
 * Editor de los productos de un pedido, compartido entre admin y funcionario.
 *
 * No calcula precios: cada cambio se manda a `previewFn` y se muestra el
 * resultado del backend (precios congelados, tramos por volumen, delta y
 * advertencias). Así lo que se ve en pantalla es exactamente lo que se guarda.
 */
export function OrderItemsEditor({
  order,
  previewFn,
  onSave,
  onCancel,
  isSaving,
}: OrderItemsEditorProps) {
  const [lines, setLines] = useState<EditLine[]>(() => linesFromOrder(order));
  const [adminNotes, setAdminNotes] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);

  const payloadItems: EditOrderLine[] = useMemo(
    () =>
      lines.map((l) => ({
        productId: l.productId,
        presentationId: l.presentationId,
        quantity: l.quantity,
      })),
    [lines]
  );

  // Se pregunta al backend con un respiro, para no disparar en cada tecla.
  const [debouncedItems] = useDebounce(payloadItems, 350);
  const { data: preview, isFetching } = useQuery({
    queryKey: ['order-edit-preview', order._id, debouncedItems],
    queryFn: () => previewFn(order._id, debouncedItems),
    staleTime: 0,
  });

  // Precio de cada línea, indexado para poder mostrarlo junto a la línea local.
  const pricedByKey = useMemo(() => {
    const map = new Map<string, { pricePerUnit: number; subtotal: number; unitQty: number }>();
    for (const it of preview?.items ?? []) {
      map.set(lineKey(it.product, it.presentationId), {
        pricePerUnit: it.pricePerUnit,
        subtotal: it.subtotal,
        unitQty: it.productSnapshot.saleUnit?.quantity ?? 1,
      });
    }
    return map;
  }, [preview]);

  const updateLine = (index: number, patch: Partial<EditLine>) =>
    setLines((prev) => prev.map((l, i) => (i === index ? { ...l, ...patch } : l)));

  const removeLine = (index: number) =>
    setLines((prev) => prev.filter((_, i) => i !== index));

  const handleAdd = (product: Product) => {
    const principal = (product.presentaciones ?? []).find((x) => x.principal)
      ?? product.presentaciones?.[0];
    const presentationId = principal?._id;
    setLines((prev) => {
      // Misma identidad (producto + presentación) = sumar cantidad, no duplicar.
      const existing = prev.findIndex(
        (l) => l.productId === product._id && l.presentationId === presentationId
      );
      if (existing !== -1) {
        return prev.map((l, i) => (i === existing ? { ...l, quantity: l.quantity + 1 } : l));
      }
      return [
        ...prev,
        {
          productId: product._id,
          presentationId,
          name: product.name,
          barcode: product.barcode,
          image: product.images?.[0],
          quantity: 1,
          fallbackLabel: principal
            ? presentationLabel(principal)
            : presentationLabel({
                type: (product.saleUnit?.type ?? 'unidad') as SaleUnitType,
                quantity: product.saleUnit?.quantity ?? 1,
              }),
        },
      ];
    });
  };

  const total = preview?.total ?? order.total;
  const difference = preview?.difference ?? 0;
  const isEmpty = lines.length === 0;

  const handleSave = () => {
    if (isEmpty) return;
    onSave({ items: payloadItems, adminNotes: adminNotes || undefined });
  };

  return (
    <div className="space-y-4" data-testid="order-items-editor">
      {/* ── Líneas ── */}
      <div className="space-y-2">
        {isEmpty && (
          <p className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
            El pedido quedaría sin productos. Si querías anularlo, usa «Cancelar pedido».
          </p>
        )}

        {lines.map((line, index) => {
          const priced = pricedByKey.get(lineKey(line.productId, line.presentationId));
          const unitEquivalent =
            priced && priced.unitQty > 1
              ? Math.round(priced.pricePerUnit / priced.unitQty)
              : null;

          return (
            <div
              key={`${line.productId}-${line.presentationId ?? 'p'}-${index}`}
              className="flex items-center gap-3 rounded-md border p-3"
              data-testid="editor-line"
            >
              {line.image ? (
                <Image
                  src={getImageUrl(line.image)}
                  alt={line.name}
                  width={44}
                  height={44}
                  className="h-11 w-11 rounded object-cover"
                />
              ) : (
                <div className="h-11 w-11 rounded bg-muted" />
              )}

              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{line.name}</p>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <PresentationPicker
                    productId={line.productId}
                    value={line.presentationId}
                    fallbackLabel={line.fallbackLabel}
                    disabled={isSaving}
                    onChange={(presentationId) =>
                      updateLine(index, { presentationId })
                    }
                  />
                  <span className="text-sm text-muted-foreground tabular-nums">
                    {priced ? formatCurrency(priced.pricePerUnit) : '—'} c/u
                    {unitEquivalent !== null && (
                      <span className="ml-1 text-xs">
                        · {formatCurrency(unitEquivalent)} por unidad
                      </span>
                    )}
                  </span>
                </div>
              </div>

              <Input
                type="number"
                min={1}
                value={line.quantity}
                disabled={isSaving}
                onChange={(e) =>
                  updateLine(index, { quantity: Math.max(1, parseInt(e.target.value || '1', 10)) })
                }
                className="w-20 tabular-nums"
                data-testid="editor-line-qty"
                aria-label={`Cantidad de ${line.name}`}
              />

              <span className="hidden w-24 text-right font-semibold tabular-nums sm:block">
                {priced ? formatCurrency(priced.subtotal) : '—'}
              </span>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeLine(index)}
                disabled={isSaving}
                aria-label={`Quitar ${line.name}`}
                data-testid="editor-line-remove"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          );
        })}

        <Button
          type="button"
          variant="outline"
          onClick={() => setPickerOpen(true)}
          disabled={isSaving}
          className="w-full"
          data-testid="editor-add-product"
        >
          <Plus className="mr-2 h-4 w-4" />
          Agregar producto
        </Button>
      </div>

      {/* ── Advertencias ── */}
      {(preview?.warnings.length ?? 0) > 0 && (
        <div className="space-y-2">
          {preview!.warnings.map((w, i) => (
            <div
              key={i}
              className="flex items-start gap-2 rounded-md border border-admin-warn/40 bg-admin-warn-soft/60 px-3 py-2 text-sm text-admin-warn"
              data-testid="editor-warning"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{w}</span>
            </div>
          ))}
        </div>
      )}

      <Separator />

      {/* ── Resumen del cambio ── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Subtotal ({lines.length} ítem{lines.length === 1 ? '' : 's'})
          </span>
          <span className="tabular-nums">
            {formatCurrency(preview?.subtotal ?? order.subtotal)}
          </span>
        </div>
        {(preview?.shippingCost ?? order.shippingCost) > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Envío</span>
            <span className="tabular-nums">
              {formatCurrency(preview?.shippingCost ?? order.shippingCost)}
            </span>
          </div>
        )}
        <div className="flex items-center justify-between font-semibold">
          <span>Total</span>
          <span className="flex items-center gap-2 tabular-nums">
            {difference !== 0 && !isEmpty && (
              <>
                <span className="text-sm font-normal text-muted-foreground line-through">
                  {formatCurrency(order.total)}
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
              </>
            )}
            <span data-testid="editor-total">{formatCurrency(total)}</span>
            {isFetching && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
          </span>
        </div>
        {difference !== 0 && !isEmpty && (
          <p
            className={`text-right text-sm font-medium ${
              difference > 0 ? 'text-admin-warn' : 'text-admin-ok'
            }`}
            data-testid="editor-difference"
          >
            {difference > 0 ? '+' : ''}
            {formatCurrency(difference)} respecto al pedido original
          </p>
        )}
      </div>

      {/* ── Notas ── */}
      <div className="space-y-1">
        <label className="text-sm font-medium" htmlFor="edit-admin-notes">
          Motivo del cambio (opcional)
        </label>
        <Textarea
          id="edit-admin-notes"
          value={adminNotes}
          onChange={(e) => setAdminNotes(e.target.value)}
          placeholder="Ej: el cliente pidió cambiar la cantidad por WhatsApp."
          rows={2}
        />
      </div>

      {/* ── Acciones ── */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel} disabled={isSaving}>
          <X className="mr-2 h-4 w-4" />
          Cancelar
        </Button>
        <Button
          onClick={handleSave}
          disabled={isSaving || isEmpty}
          data-testid="editor-save"
        >
          {isSaving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Guardar cambios
        </Button>
      </div>

      <ProductSelector
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onSelect={handleAdd}
      />
    </div>
  );
}

'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { productService } from '@/services/products';
import { orderedPresentations } from '@/lib/discountCalculator';
import type { Presentation, SaleUnitType } from '@/types';

const TYPE_LABEL: Record<SaleUnitType, string> = {
  unidad: 'Unidad',
  cantidadMinima: 'Cant. mínima',
  display: 'Display',
  embalaje: 'Embalaje',
};

/** "Unidad" · "Display × 6" · "Embalaje × 24" */
export function presentationLabel(p: {
  type: SaleUnitType;
  quantity: number;
  label?: string;
}): string {
  if (p.label?.trim()) return p.label;
  const base = TYPE_LABEL[p.type] ?? p.type;
  return p.quantity > 1 ? `${base} × ${p.quantity}` : base;
}

interface PresentationPickerProps {
  productId: string;
  value?: string;
  /** El label del snapshot, por si la presentación ya no existe en el producto. */
  fallbackLabel: string;
  onChange: (presentationId: string | undefined, presentation?: Presentation) => void;
  disabled?: boolean;
}

/**
 * Selector de la presentación de UNA línea del pedido. Trae las presentaciones
 * del producto (cacheadas) y, si tiene una sola, muestra el label sin selector.
 * Si la presentación comprada ya no existe en el catálogo, la muestra igual
 * marcada como discontinuada para no perder el dato.
 */
export function PresentationPicker({
  productId,
  value,
  fallbackLabel,
  onChange,
  disabled,
}: PresentationPickerProps) {
  const { data: product, isLoading } = useQuery({
    queryKey: ['product-presentations', productId],
    queryFn: () => productService.getProductById(productId),
    staleTime: 60_000,
  });

  // Mismo orden canónico que el storefront (unidad → display → embalaje), para
  // que quien atiende lea la lista igual que la ve el cliente.
  const presentations: Presentation[] = product?.product
    ? orderedPresentations(product.product)
    : [];

  // Una sola (o el producto no migró): no hay nada que elegir.
  if (!isLoading && presentations.length <= 1) {
    return (
      <span className="text-xs text-muted-foreground">
        {presentations[0] ? presentationLabel(presentations[0]) : fallbackLabel}
      </span>
    );
  }

  const known = presentations.some((p) => p._id === value);

  return (
    <Select
      value={value ?? ''}
      onValueChange={(v) =>
        onChange(v, presentations.find((p) => p._id === v))
      }
      disabled={disabled || isLoading}
    >
      <SelectTrigger className="h-8 w-[170px] text-xs" data-testid="line-presentation">
        <SelectValue placeholder={fallbackLabel} />
      </SelectTrigger>
      <SelectContent>
        {presentations.map((p) => (
          <SelectItem key={p._id} value={p._id} className="text-xs">
            {presentationLabel(p)}
          </SelectItem>
        ))}
        {/* La comprada ya no está en el catálogo: se muestra igual. */}
        {value && !known && (
          <SelectItem value={value} className="text-xs text-muted-foreground">
            {fallbackLabel} (discontinuada)
          </SelectItem>
        )}
      </SelectContent>
    </Select>
  );
}

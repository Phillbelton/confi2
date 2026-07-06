'use client';

import { useRef, useState } from 'react';
import { ImagePlus, Loader2, Upload, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DimensionHint,
  WIDE_TOP_SPEC,
  WIDE_TOP_MOBILE_SPEC,
  type ImageSpec,
} from '@/components/admin/banners/DimensionHint';
import { useCategoryOperations } from '@/hooks/admin/useAdminCategories';
import type { CategoryImageVariant, CategoryImagesPayload } from '@/services/admin/categories';
import { getImageUrl } from '@/lib/images';
import { cn } from '@/lib/utils';
import type { Category } from '@/types';

const THUMB_SPEC: ImageSpec = { ratioLabel: '1:1', px: '800 × 800', w: 1, h: 1 };

interface VariantDef {
  key: Exclude<CategoryImageVariant, 'master'>;
  field: keyof CategoryImagesPayload;
  label: string;
  hint: string;
  spec: ImageSpec;
  /** Clase del contenedor de preview (define la proporción). */
  previewClass: string;
}

const VARIANTS: VariantDef[] = [
  {
    key: 'thumb',
    field: 'image',
    label: 'Miniatura',
    hint: 'Avatar en listados y mega-menú',
    spec: THUMB_SPEC,
    previewClass: 'aspect-square w-24',
  },
  {
    key: 'banner',
    field: 'bannerImage',
    label: 'Banner catálogo (desktop)',
    hint: 'Cabecera al filtrar por esta categoría',
    spec: WIDE_TOP_SPEC,
    previewClass: 'aspect-[20/3] w-full',
  },
  {
    key: 'bannerMobile',
    field: 'bannerImageMobile',
    label: 'Banner catálogo (móvil)',
    hint: 'Misma cabecera, en celular',
    spec: WIDE_TOP_MOBILE_SPEC,
    previewClass: 'aspect-[5/2] w-40',
  },
];

/**
 * Gestor de las imágenes de una categoría (solo al editar).
 *
 * Flujo recomendado: subir UNA imagen "master" y el sistema genera los 3
 * encuadres automáticamente (recorte inteligente con sharp). Cada encuadre
 * puede reemplazarse a mano después si el recorte automático no convence.
 */
export function CategoryImagesManager({ category }: { category: Category }) {
  const { uploadImageAsync, isUploadingImage } = useCategoryOperations();

  // Previews locales: seed desde la categoría; se refrescan con la respuesta
  // del upload (la prop `category` del dialog no se re-sincroniza sola).
  const [images, setImages] = useState<CategoryImagesPayload>({
    image: category.image,
    bannerImage: category.bannerImage,
    bannerImageMobile: category.bannerImageMobile,
  });
  const [pendingVariant, setPendingVariant] = useState<CategoryImageVariant | null>(null);

  const masterInputRef = useRef<HTMLInputElement>(null);

  const upload = async (file: File, variant: CategoryImageVariant) => {
    setPendingVariant(variant);
    try {
      const res = await uploadImageAsync({ id: category._id, file, variant });
      if (res?.data) setImages(res.data);
    } catch {
      // El hook ya muestra el toast de error.
    } finally {
      setPendingVariant(null);
    }
  };

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <div>
        <h3 className="text-sm font-medium">Imágenes de la categoría</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Sube una imagen y el sistema genera los 3 tamaños (miniatura + banner
          desktop + banner móvil) recortando automáticamente. Ideal: 2000 × 800 px
          o más, JPG/PNG/WEBP.
        </p>
      </div>

      {/* Master: genera los 3 encuadres */}
      <div className="flex items-center gap-2">
        <input
          ref={masterInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) upload(file, 'master');
            e.target.value = '';
          }}
        />
        <Button
          type="button"
          size="sm"
          onClick={() => masterInputRef.current?.click()}
          disabled={isUploadingImage}
        >
          {pendingVariant === 'master' ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generando 3 tamaños…
            </>
          ) : (
            <>
              <Wand2 className="mr-2 h-4 w-4" />
              Subir imagen y generar los 3 tamaños
            </>
          )}
        </Button>
      </div>

      {/* Variantes individuales */}
      <div className="space-y-3">
        {VARIANTS.map((v) => (
          <VariantRow
            key={v.key}
            def={v}
            url={images[v.field]}
            uploading={pendingVariant === v.key || pendingVariant === 'master'}
            disabled={isUploadingImage}
            onSelect={(file) => upload(file, v.key)}
          />
        ))}
      </div>
    </div>
  );
}

function VariantRow({
  def,
  url,
  uploading,
  disabled,
  onSelect,
}: {
  def: VariantDef;
  url?: string;
  uploading: boolean;
  disabled: boolean;
  onSelect: (file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const src = url ? getImageUrl(url) : '';

  return (
    <div className="flex items-center gap-3 rounded-md border bg-muted/20 p-2.5">
      {/* Preview con la proporción real del encuadre */}
      <div
        className={cn(
          'relative shrink-0 overflow-hidden rounded-md border bg-background',
          def.previewClass,
          def.key === 'banner' && 'max-w-[260px]'
        )}
      >
        {src ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={src} alt={def.label} className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0 grid place-items-center text-muted-foreground/50">
            <ImagePlus className="h-5 w-5" />
          </div>
        )}
        {uploading && (
          <div className="absolute inset-0 grid place-items-center bg-background/60">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium leading-tight">{def.label}</p>
        <p className="text-[11px] text-muted-foreground">{def.hint}</p>
        <DimensionHint spec={def.spec} className="mt-1" />
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onSelect(file);
          e.target.value = '';
        }}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="shrink-0"
        onClick={() => inputRef.current?.click()}
        disabled={disabled}
      >
        <Upload className="mr-1.5 h-3.5 w-3.5" />
        {url ? 'Reemplazar' : 'Subir'}
      </Button>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { Upload, DollarSign, HelpCircle } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { FormFieldWithHelp } from '@/components/ui/form-field-with-help';
import { InlineHelp } from '@/components/ui/inline-help';
import { HelpPanel, HelpSection, HelpExample } from '@/components/ui/help-panel';
import { VariantImageUploader, VariantImageFile } from './VariantImageUploader';

export interface VariantCombination {
  id: string;
  attributes: Record<string, string>;
  price: number;
  images?: VariantImageFile[];
  sku?: string;
}

interface VariantConfigurationTableProps {
  combinations: VariantCombination[];
  onChange: (combinations: VariantCombination[]) => void;
  disabled?: boolean;
}

export function VariantConfigurationTable({
  combinations,
  onChange,
  disabled = false,
}: VariantConfigurationTableProps) {
  const [bulkPrice, setBulkPrice] = useState('');
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const handleUpdateVariant = (id: string, field: 'price' | 'sku', value: string | number) => {
    const updated = combinations.map((combo) => {
      if (combo.id === id) {
        return {
          ...combo,
          [field]: field === 'price' ? Number(value) : value,
        };
      }
      return combo;
    });
    onChange(updated);
  };

  const handleApplyBulkPrice = () => {
    const price = parseFloat(bulkPrice);
    if (!isNaN(price) && price >= 0) {
      const updated = combinations.map((combo) => ({
        ...combo,
        price,
      }));
      onChange(updated);
      setBulkPrice('');
    }
  };

  const handleUpdateVariantImages = (id: string, images: VariantImageFile[]) => {
    const updated = combinations.map((combo) => {
      if (combo.id === id) {
        return {
          ...combo,
          images,
        };
      }
      return combo;
    });
    onChange(updated);
  };

  // Calculate summary stats
  const totalVariants = combinations.length;
  const configuredVariants = combinations.filter(
    (c) => c.price > 0
  ).length;
  const avgPrice = combinations.length > 0
    ? combinations.reduce((sum, c) => sum + (c.price || 0), 0) / combinations.length
    : 0;

  if (combinations.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <DollarSign className="h-12 w-12 mb-4" />
          <p className="text-lg font-medium mb-1">No hay combinaciones</p>
          <p className="text-sm">Define atributos de variantes para generar combinaciones</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle>Configuración de Variantes</CardTitle>
            <CardDescription>
              Configure precio para cada variante. Las imágenes son opcionales.
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => setIsHelpOpen(true)}
          >
            <HelpCircle className="h-5 w-5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Bulk Actions — visually prominent, first thing to see */}
        <div className="rounded-lg border-2 border-primary/20 bg-primary/5 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-primary" />
            <Label className="text-sm font-semibold text-primary">
              Aplicar a todas las variantes
            </Label>
            <span className="text-xs text-muted-foreground">
              — rellena primero, luego ajusta individualmente
            </span>
          </div>
          <div className="flex gap-2 items-center">
            <Input
              id="bulkPrice"
              type="number"
              placeholder="Precio ($) para todas"
              value={bulkPrice}
              onChange={(e) => setBulkPrice(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleApplyBulkPrice()}
              disabled={disabled}
              min="0"
              step="0.01"
              className="flex-1 h-9"
            />
            <Button
              type="button"
              onClick={handleApplyBulkPrice}
              disabled={disabled || !bulkPrice}
              size="sm"
              className="h-9 shrink-0"
            >
              <DollarSign className="h-3.5 w-3.5 mr-1" />
              Precio
            </Button>
          </div>
        </div>

        <InlineHelp variant="info">
          <strong>Tip:</strong> Aplica precio a todas arriba, luego ajusta fila por fila si alguna variante es diferente.
        </InlineHelp>

        {/* Variants Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Variante</TableHead>
                <TableHead>SKU (Opcional)</TableHead>
                <TableHead>Precio ($) *</TableHead>
                <TableHead>Imágenes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {combinations.map((combo) => {
                const attributesText = Object.entries(combo.attributes)
                  .map(([key, value]) => `${key}: ${value}`)
                  .join(', ');

                return (
                  <TableRow key={combo.id}>
                    {/* Variant Attributes */}
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{attributesText}</p>
                        <p className="text-xs text-muted-foreground">
                          ID: {combo.id.slice(0, 8)}
                        </p>
                      </div>
                    </TableCell>

                    {/* SKU */}
                    <TableCell>
                      <Input
                        type="text"
                        value={combo.sku || ''}
                        onChange={(e) => handleUpdateVariant(combo.id, 'sku', e.target.value)}
                        placeholder="Auto-generado"
                        disabled={disabled}
                        className="w-32 text-xs font-mono"
                      />
                    </TableCell>

                    {/* Price */}
                    <TableCell>
                      <Input
                        type="number"
                        value={combo.price || ''}
                        onChange={(e) => handleUpdateVariant(combo.id, 'price', e.target.value)}
                        placeholder="0"
                        disabled={disabled}
                        min="0"
                        step="0.01"
                        className="w-28"
                        required
                      />
                    </TableCell>

                    {/* Images */}
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" disabled={disabled}>
                            <Upload className="h-4 w-4 mr-1" />
                            {combo.images && combo.images.length > 0
                              ? `${combo.images.length} imagen(es)`
                              : 'Imágenes'}
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Imágenes de Variante</DialogTitle>
                            <DialogDescription>
                              {Object.entries(combo.attributes)
                                .map(([key, value]) => `${key}: ${value}`)
                                .join(', ')}
                            </DialogDescription>
                          </DialogHeader>
                          <VariantImageUploader
                            images={combo.images || []}
                            onChange={(images) => handleUpdateVariantImages(combo.id, images)}
                            maxImages={5}
                            disabled={disabled}
                          />
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg text-sm">
          <div>
            <p className="text-muted-foreground">Total Variantes</p>
            <p className="text-2xl font-bold">{totalVariants}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Configuradas</p>
            <p className="text-2xl font-bold text-green-600">{configuredVariants}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Precio Promedio</p>
            <p className="text-2xl font-bold">${avgPrice.toLocaleString()}</p>
          </div>
        </div>

        {/* Validation Message */}
        {configuredVariants < totalVariants && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md text-sm text-yellow-800">
            <p className="font-medium">⚠️ Atención</p>
            <p>
              Hay {totalVariants - configuredVariants} variante(s) sin configurar.
              Asegúrate de establecer precio para todas las variantes.
            </p>
          </div>
        )}

        {/* Help Panel */}
        <HelpPanel
          isOpen={isHelpOpen}
          onClose={() => setIsHelpOpen(false)}
          title="Ayuda: Variantes de Producto"
        >
          <HelpSection title="¿Qué son las variantes de producto?">
            <p>
              Las variantes son diferentes versiones de un mismo producto que varían en características específicas como tamaño, color, sabor, etc.
            </p>
            <p className="mt-2">
              Por ejemplo, un shampoo puede tener variantes de:
            </p>
            <ul className="list-disc ml-4 mt-2 space-y-1">
              <li><strong>Tamaño:</strong> 250ml, 500ml, 1L</li>
              <li><strong>Aroma:</strong> Coco, Vainilla, Lavanda</li>
            </ul>
          </HelpSection>

          <HelpSection title="¿Cómo se generan las combinaciones?">
            <p>
              El sistema genera automáticamente todas las combinaciones posibles de los atributos que definiste.
            </p>
            <p className="mt-2">
              Cada combinación es única y necesita su propia configuración de precio.
            </p>
          </HelpSection>

          <HelpExample title="Ejemplo: Combinaciones de Shampoo">
            <p className="text-sm">Si defines:</p>
            <ul className="list-disc ml-4 mt-1 text-sm space-y-1">
              <li>Tamaño: 250ml, 500ml</li>
              <li>Aroma: Coco, Vainilla</li>
            </ul>
            <p className="text-sm mt-2">Se generan 4 variantes:</p>
            <div className="mt-2 space-y-1 text-sm">
              <p>✓ Tamaño: 250ml, Aroma: Coco</p>
              <p>✓ Tamaño: 250ml, Aroma: Vainilla</p>
              <p>✓ Tamaño: 500ml, Aroma: Coco</p>
              <p>✓ Tamaño: 500ml, Aroma: Vainilla</p>
            </div>
          </HelpExample>

          <HelpSection title="Configurando cada variante">
            <p>Para cada variante debes configurar:</p>
            <ul className="list-disc ml-4 mt-2 space-y-2">
              <li>
                <strong>SKU (Opcional):</strong> Código único de la variante. Se genera automáticamente si lo dejas vacío
              </li>
              <li>
                <strong>Precio (Obligatorio):</strong> Precio de venta en Pesos chilenos. Puede ser diferente para cada variante
              </li>
              <li>
                <strong>Imágenes (Opcional):</strong> Hasta 5 imágenes específicas de esta variante
              </li>
            </ul>
          </HelpSection>

          <HelpExample title="Ejemplo: Precios diferentes por tamaño">
            <div className="text-sm space-y-1">
              <p><strong>Shampoo Coco 250ml:</strong> $25.000</p>
              <p><strong>Shampoo Coco 500ml:</strong> $45.000</p>
              <p><strong>Shampoo Coco 1L:</strong> $80.000</p>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Nota: El precio por litro es más bajo en presentaciones grandes
            </p>
          </HelpExample>

          <HelpSection title="Aplicar valores masivos - ¿Cuándo usar?">
            <p>Usa las acciones masivas cuando:</p>
            <ul className="list-disc ml-4 mt-2 space-y-1">
              <li><strong>Todas tienen el mismo precio:</strong> Por ejemplo, todos los colores al mismo precio</li>
              <li><strong>Quieres empezar rápido:</strong> Aplica el precio base y luego ajusta las excepciones manualmente</li>
            </ul>
          </HelpSection>

          <HelpExample title="Ejemplo: Usando valores masivos">
            <div className="text-sm space-y-2">
              <p className="font-medium">Escenario: Camisetas en 5 colores</p>
              <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded space-y-1">
                <p>1️⃣ Aplicar precio masivo: <strong>$35.000</strong></p>
                <p className="text-muted-foreground text-xs">→ Todas las camisetas quedan a $35.000</p>

                <p className="mt-2">2️⃣ Ajustar manualmente si es necesario:</p>
                <p className="text-muted-foreground text-xs">→ Si alguna variante tiene precio diferente, editar individualmente</p>
              </div>
            </div>
          </HelpExample>

          <HelpSection title="SKU (Stock Keeping Unit) - ¿Qué es?">
            <p>
              El SKU es un código único que identifica cada variante en tu inventario.
            </p>
            <ul className="list-disc ml-4 mt-2 space-y-1">
              <li>Si lo dejas vacío, se genera automáticamente</li>
              <li>Útil si tienes tu propio sistema de códigos</li>
              <li>Debe ser único (no repetirse entre variantes)</li>
              <li>Puede incluir letras y números (ej: SHP-250-COCO)</li>
            </ul>
          </HelpSection>

          <HelpExample title="Ejemplo: SKUs personalizados">
            <div className="text-sm space-y-1 font-mono">
              <p>SHP-250-COCO → Shampoo 250ml Coco</p>
              <p>SHP-250-VAIN → Shampoo 250ml Vainilla</p>
              <p>SHP-500-COCO → Shampoo 500ml Coco</p>
              <p>SHP-500-VAIN → Shampoo 500ml Vainilla</p>
            </div>
          </HelpExample>

          <HelpSection title="Imágenes de variantes - ¿Son necesarias?">
            <p>Las imágenes son <strong>opcionales</strong> pero muy recomendadas cuando:</p>
            <ul className="list-disc ml-4 mt-2 space-y-1">
              <li>Las variantes tienen diferencias visuales (colores, diseños)</li>
              <li>Quieres mostrar el tamaño real del producto</li>
              <li>Necesitas mostrar detalles específicos de cada versión</li>
            </ul>
            <p className="mt-2">
              <strong>No son necesarias cuando:</strong> Las variantes solo difieren en características no visibles (sabor, fragancia).
            </p>
          </HelpSection>

          <HelpExample title="Ejemplo: ¿Cuándo usar imágenes de variantes?">
            <div className="text-sm space-y-3">
              <div>
                <p className="font-medium text-green-600">✅ SÍ usar imágenes:</p>
                <p className="ml-4">Remera en 5 colores → Subir foto de cada color</p>
                <p className="ml-4">Zapatos talla 38, 39, 40 → Mostrar el zapato real</p>
              </div>
              <div>
                <p className="font-medium text-orange-600">⚠️ OPCIONAL:</p>
                <p className="ml-4">Shampoo 250ml vs 500ml → Solo si quieres mostrar tamaño</p>
              </div>
              <div>
                <p className="font-medium text-gray-600">❌ NO necesario:</p>
                <p className="ml-4">Perfume Lavanda vs Vainilla → Mismo envase, solo cambia fragancia</p>
              </div>
            </div>
          </HelpExample>

          <HelpSection title="Panel de Resumen - ¿Qué muestra?">
            <p>El panel inferior muestra estadísticas útiles:</p>
            <ul className="list-disc ml-4 mt-2 space-y-1">
              <li><strong>Total Variantes:</strong> Cantidad total de combinaciones generadas</li>
              <li><strong>Configuradas:</strong> Variantes que ya tienen precio definido</li>
              <li><strong>Precio Promedio:</strong> Precio promedio de todas las variantes</li>
            </ul>
          </HelpSection>

          <HelpSection title="Errores comunes y soluciones">
            <div className="space-y-3">
              <div>
                <p className="font-medium">⚠️ "Hay X variantes sin configurar"</p>
                <p className="text-sm ml-4 text-muted-foreground">
                  Algunas variantes no tienen precio. Revisa la tabla y completa los campos obligatorios (marcados con *).
                </p>
              </div>
              <div>
                <p className="font-medium">⚠️ ¿Cómo cambio los atributos de las variantes?</p>
                <p className="text-sm ml-4 text-muted-foreground">
                  Debes volver a la sección anterior y modificar los atributos. Las combinaciones se regenerarán automáticamente.
                </p>
              </div>
            </div>
          </HelpSection>

          <HelpSection title="Consejos y Buenas Prácticas">
            <ul className="list-disc ml-4 space-y-2">
              <li>
                <strong>Usa valores masivos primero:</strong> Ahorra tiempo aplicando precio base a todas, luego ajusta manualmente las excepciones
              </li>
              <li>
                <strong>Nombra bien los atributos:</strong> Usa nombres claros como "Tamaño: 250ml" en vez de "T1", "T2"
              </li>
              <li>
                <strong>Revisa el resumen:</strong> Verifica que todas las variantes estén configuradas antes de guardar
              </li>
              <li>
                <strong>Imágenes de calidad:</strong> Si subes imágenes, usa fotos claras y bien iluminadas
              </li>
            </ul>
          </HelpSection>
        </HelpPanel>
      </CardContent>
    </Card>
  );
}

'use client';

import { useMemo, useState, useEffect } from 'react';
import { ChevronRight, X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useCategories } from '@/hooks/useCategories';
import { cn } from '@/lib/utils';
import type { Category } from '@/types';

interface Props {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
}

/**
 * Selector de categorías con 3 niveles encadenados (L1 → L2 → L3).
 * Permite asignar múltiples categorías al producto (chips removibles arriba).
 */
export function CategoryWithSubcategorySelector({
  selectedIds, onChange, disabled,
}: Props) {
  const { data, isLoading } = useCategories();
  const cats: Category[] = (data as Category[]) || [];

  const parentIdOf = (c: Category) =>
    typeof c.parent === 'string' ? c.parent : c.parent?._id;

  // Niveles
  const l1 = useMemo(() => cats.filter((c) => !c.parent && c.active), [cats]);

  // Estados de los 3 selects
  const [l1Id, setL1Id] = useState<string>('');
  const [l2Id, setL2Id] = useState<string>('');
  const [l3Id, setL3Id] = useState<string>('');

  // L2 hijos del L1 elegido
  const l2 = useMemo(
    () => l1Id ? cats.filter((c) => c.active && parentIdOf(c) === l1Id) : [],
    [cats, l1Id]
  );
  const l3 = useMemo(
    () => l2Id ? cats.filter((c) => c.active && parentIdOf(c) === l2Id) : [],
    [cats, l2Id]
  );

  // Reset cuando cambia padre
  useEffect(() => { setL2Id(''); setL3Id(''); }, [l1Id]);
  useEffect(() => { setL3Id(''); }, [l2Id]);

  const handleAdd = () => {
    // Tomar el más profundo seleccionado
    const target = l3Id || l2Id || l1Id;
    if (!target) return;
    if (selectedIds.includes(target)) return;
    onChange([...selectedIds, target]);
    // Reset selects
    setL1Id(''); setL2Id(''); setL3Id('');
  };

  const removeId = (id: string) => onChange(selectedIds.filter((x) => x !== id));

  // Path completo de una categoría seleccionada para mostrar en el chip
  const pathOf = (id: string): string => {
    const c = cats.find((x) => x._id === id);
    if (!c) return '';
    const parts: string[] = [c.name];
    let p = parentIdOf(c);
    while (p) {
      const parent = cats.find((x) => x._id === p);
      if (!parent) break;
      parts.unshift(parent.name);
      p = parentIdOf(parent);
    }
    return parts.join(' › ');
  };

  if (isLoading) return <Skeleton className="h-10 w-full" />;

  const canAdd = !!(l1Id || l2Id || l3Id);

  return (
    <div className="space-y-3">
      <Label>Categorías *</Label>

      {/* Chips de seleccionadas */}
      {selectedIds.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedIds.map((id) => (
            <Badge key={id} variant="secondary" className="gap-1 pl-2 pr-1 py-1">
              <span className="text-xs">{pathOf(id) || '(eliminada)'}</span>
              <button
                type="button"
                onClick={() => removeId(id)}
                className="rounded-full p-0.5 hover:bg-destructive/20"
                aria-label="Quitar"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Select chain: L1 → L2 → L3 */}
      <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
        <p className="text-xs font-semibold text-muted-foreground">Agregar categoría</p>
        <div className="flex flex-wrap items-end gap-2">
          {/* L1 */}
          <div className="flex-1 min-w-[140px]">
            <Label className="text-[10px] uppercase">Categoría</Label>
            <Select value={l1Id} onValueChange={setL1Id} disabled={disabled || l1.length === 0}>
              <SelectTrigger><SelectValue placeholder="Seleccionar…" /></SelectTrigger>
              <SelectContent>
                {l1.map((c) => (
                  <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {l1Id && (
            <>
              <ChevronRight className="h-4 w-4 text-muted-foreground self-center mt-4" />
              <div className="flex-1 min-w-[140px]">
                <Label className="text-[10px] uppercase">Subcategoría</Label>
                <Select value={l2Id} onValueChange={setL2Id} disabled={disabled || l2.length === 0}>
                  <SelectTrigger>
                    <SelectValue placeholder={l2.length === 0 ? 'Sin subcategorías' : 'Opcional'} />
                  </SelectTrigger>
                  <SelectContent>
                    {l2.map((c) => (
                      <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {l2Id && (
            <>
              <ChevronRight className="h-4 w-4 text-muted-foreground self-center mt-4" />
              <div className="flex-1 min-w-[140px]">
                <Label className="text-[10px] uppercase">Sub-sub</Label>
                <Select value={l3Id} onValueChange={setL3Id} disabled={disabled || l3.length === 0}>
                  <SelectTrigger>
                    <SelectValue placeholder={l3.length === 0 ? 'Sin niveles' : 'Opcional'} />
                  </SelectTrigger>
                  <SelectContent>
                    {l3.map((c) => (
                      <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          <Button
            type="button"
            size="sm"
            onClick={handleAdd}
            disabled={!canAdd || disabled}
            className="self-end"
          >
            <Plus className="h-4 w-4 mr-1" />Agregar
          </Button>
        </div>
        <p className="text-[11px] text-muted-foreground">
          💡 Se agrega el nivel más profundo seleccionado. Podés agregar varias categorías al mismo producto.
        </p>
      </div>
    </div>
  );
}

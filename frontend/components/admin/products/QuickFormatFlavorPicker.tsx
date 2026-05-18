'use client';

import { useState } from 'react';
import { Plus, Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from '@/components/ui/command';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  usePublicFormats, useFormatOps,
  usePublicFlavors, useFlavorOps,
} from '@/hooks/admin/useFormatsFlavors';
import { cn } from '@/lib/utils';

const UNITS = ['g', 'kg', 'ml', 'l', 'cc', 'oz'] as const;

interface FormatPickerProps {
  value?: string;
  onChange: (id: string | undefined) => void;
  disabled?: boolean;
}

/**
 * Selector de formato con búsqueda + crear nuevo en vivo (inline).
 */
export function FormatPicker({ value, onChange, disabled }: FormatPickerProps) {
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newValue, setNewValue] = useState<number>(0);
  const [newUnit, setNewUnit] = useState<typeof UNITS[number]>('g');
  const { data: formats } = usePublicFormats();
  const { create } = useFormatOps();

  const selected = formats?.find((f) => f._id === value);

  const handleCreate = () => {
    if (!newValue || newValue <= 0) return;
    create.mutate(
      { value: newValue, unit: newUnit, active: true },
      {
        onSuccess: (created: any) => {
          onChange(created._id);
          setCreating(false);
          setNewValue(0);
          setOpen(false);
        },
      }
    );
  };

  return (
    <div>
      <Label className="text-xs">Formato</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            disabled={disabled}
            className="w-full justify-between font-normal"
          >
            {selected ? (
              <span className="font-mono text-sm font-bold text-primary">
                {selected.label}
              </span>
            ) : (
              <span className="text-muted-foreground">Sin formato</span>
            )}
            <ChevronsUpDown className="h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[280px] p-0" align="start">
          {creating ? (
            <div className="p-3 space-y-2">
              <div className="text-xs font-semibold text-muted-foreground">
                Crear nuevo formato
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="number"
                  min={0}
                  placeholder="35"
                  value={newValue || ''}
                  onChange={(e) => setNewValue(parseFloat(e.target.value) || 0)}
                  autoFocus
                />
                <Select value={newUnit} onValueChange={(v) => setNewUnit(v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {UNITS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" onClick={() => setCreating(false)}>
                  Cancelar
                </Button>
                <Button size="sm" onClick={handleCreate} disabled={!newValue || create.isPending}>
                  {create.isPending && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                  Crear "{newValue}{newUnit}"
                </Button>
              </div>
            </div>
          ) : (
            <Command>
              <CommandInput placeholder="Buscar formato…" />
              <CommandList>
                <CommandEmpty>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">No hay coincidencias</p>
                    <Button size="sm" onClick={() => setCreating(true)}>
                      <Plus className="mr-1 h-3 w-3" />Crear nuevo
                    </Button>
                  </div>
                </CommandEmpty>
                <CommandGroup>
                  <CommandItem onSelect={() => { onChange(undefined); setOpen(false); }}>
                    <span className="text-muted-foreground">Sin formato</span>
                  </CommandItem>
                  {(formats || []).map((f) => (
                    <CommandItem
                      key={f._id}
                      onSelect={() => { onChange(f._id); setOpen(false); }}
                    >
                      <Check
                        className={cn('mr-2 h-4 w-4', value === f._id ? 'opacity-100' : 'opacity-0')}
                      />
                      <span className="font-mono font-bold">{f.label}</span>
                      {f.productCount !== undefined && (
                        <span className="ml-auto text-xs text-muted-foreground">
                          {f.productCount}
                        </span>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
                <div className="border-t p-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setCreating(true)}
                    className="w-full justify-start"
                  >
                    <Plus className="mr-2 h-3 w-3" />Crear nuevo formato
                  </Button>
                </div>
              </CommandList>
            </Command>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}

interface FlavorPickerProps {
  value?: string;
  onChange: (id: string | undefined) => void;
  disabled?: boolean;
}

export function FlavorPicker({ value, onChange, disabled }: FlavorPickerProps) {
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('');
  const { data: flavors } = usePublicFlavors();
  const { create } = useFlavorOps();

  const selected = flavors?.find((f) => f._id === value);

  const handleCreate = () => {
    if (!newName.trim()) return;
    create.mutate(
      { name: newName.trim(), color: newColor || undefined, active: true },
      {
        onSuccess: (created: any) => {
          onChange(created._id);
          setCreating(false);
          setNewName('');
          setNewColor('');
          setOpen(false);
        },
      }
    );
  };

  return (
    <div>
      <Label className="text-xs">Sabor</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            disabled={disabled}
            className="w-full justify-between font-normal"
          >
            {selected ? (
              <span className="inline-flex items-center gap-2">
                {selected.color && (
                  <span className="inline-block h-3 w-3 rounded-full" style={{ background: selected.color }} />
                )}
                <span className="font-medium">{selected.name}</span>
              </span>
            ) : (
              <span className="text-muted-foreground">Sin sabor</span>
            )}
            <ChevronsUpDown className="h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[280px] p-0" align="start">
          {creating ? (
            <div className="p-3 space-y-2">
              <div className="text-xs font-semibold text-muted-foreground">
                Crear nuevo sabor
              </div>
              <Input
                placeholder="Chocolate"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                autoFocus
              />
              <div className="flex items-center gap-2">
                <Input
                  placeholder="#8B4513 (opc)"
                  value={newColor}
                  onChange={(e) => setNewColor(e.target.value)}
                  className="flex-1"
                />
                {newColor && (
                  <span className="inline-block h-8 w-8 rounded-md border" style={{ background: newColor }} />
                )}
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" onClick={() => setCreating(false)}>Cancelar</Button>
                <Button size="sm" onClick={handleCreate} disabled={!newName.trim() || create.isPending}>
                  {create.isPending && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                  Crear "{newName}"
                </Button>
              </div>
            </div>
          ) : (
            <Command>
              <CommandInput placeholder="Buscar sabor…" />
              <CommandList>
                <CommandEmpty>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">No hay coincidencias</p>
                    <Button size="sm" onClick={() => setCreating(true)}>
                      <Plus className="mr-1 h-3 w-3" />Crear nuevo
                    </Button>
                  </div>
                </CommandEmpty>
                <CommandGroup>
                  <CommandItem onSelect={() => { onChange(undefined); setOpen(false); }}>
                    <span className="text-muted-foreground">Sin sabor</span>
                  </CommandItem>
                  {(flavors || []).map((f) => (
                    <CommandItem
                      key={f._id}
                      onSelect={() => { onChange(f._id); setOpen(false); }}
                    >
                      <Check
                        className={cn('mr-2 h-4 w-4', value === f._id ? 'opacity-100' : 'opacity-0')}
                      />
                      {f.color && (
                        <span className="mr-2 inline-block h-3 w-3 rounded-full" style={{ background: f.color }} />
                      )}
                      <span>{f.name}</span>
                      {f.productCount !== undefined && (
                        <span className="ml-auto text-xs text-muted-foreground">
                          {f.productCount}
                        </span>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
                <div className="border-t p-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setCreating(true)}
                    className="w-full justify-start"
                  >
                    <Plus className="mr-2 h-3 w-3" />Crear nuevo sabor
                  </Button>
                </div>
              </CommandList>
            </Command>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}

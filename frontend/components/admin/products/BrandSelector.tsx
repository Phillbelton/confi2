'use client';

import { useQuery } from '@tanstack/react-query';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { brandService } from '@/services/brands';
import { Skeleton } from '@/components/ui/skeleton';

interface BrandSelectorProps {
  selectedId?: string;
  onChange: (id: string | undefined) => void;
  disabled?: boolean;
}

export function BrandSelector({
  selectedId,
  onChange,
  disabled = false,
}: BrandSelectorProps) {
  const { data: brands, isLoading } = useQuery({
    queryKey: ['brands'],
    queryFn: brandService.getAll,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const selectedBrand = brands?.find(brand => brand._id === selectedId);

  if (isLoading) {
    return <Skeleton className="h-10 w-full" />;
  }

  return (
    <div className="space-y-2">
      <Label>Marca (opcional)</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            disabled={disabled}
            className="w-full justify-between"
          >
            {selectedBrand ? selectedBrand.name : "Selecciona una marca..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder="Buscar marca..." />
            <CommandEmpty>No se encontraron marcas.</CommandEmpty>
            <CommandGroup className="max-h-64 overflow-auto">
              {/* None option */}
              <CommandItem
                value="none"
                onSelect={() => onChange(undefined)}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    !selectedId ? "opacity-100" : "opacity-0"
                  )}
                />
                Sin marca
              </CommandItem>

              {/* Brands */}
              {brands?.map((brand) => (
                <CommandItem
                  key={brand._id}
                  value={brand.name}
                  onSelect={() => onChange(brand._id)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedId === brand._id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {brand.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}

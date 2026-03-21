'use client';

import { useQuery } from '@tanstack/react-query';
import { Check, ChevronsUpDown, X } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { tagService } from '@/services/tags';
import { Skeleton } from '@/components/ui/skeleton';
import type { Tag } from '@/types';

interface TagSelectorProps {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
}

export function TagSelector({
  selectedIds,
  onChange,
  disabled = false,
}: TagSelectorProps) {
  const { data: tags, isLoading } = useQuery({
    queryKey: ['tags'],
    queryFn: tagService.getAll,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const handleToggle = (tagId: string) => {
    if (selectedIds.includes(tagId)) {
      onChange(selectedIds.filter(id => id !== tagId));
    } else {
      onChange([...selectedIds, tagId]);
    }
  };

  const selectedTags = tags?.filter((tag: Tag) => selectedIds.includes(tag._id)) || [];

  if (isLoading) {
    return <Skeleton className="h-10 w-full" />;
  }

  return (
    <div className="space-y-2">
      <Label>Etiquetas</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            disabled={disabled}
            className="w-full justify-between"
          >
            {selectedTags.length > 0 ? (
              <span className="truncate">
                {selectedTags.length} {selectedTags.length === 1 ? 'etiqueta seleccionada' : 'etiquetas seleccionadas'}
              </span>
            ) : (
              "Selecciona etiquetas..."
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder="Buscar etiqueta..." />
            <CommandEmpty>No se encontraron etiquetas.</CommandEmpty>
            <CommandGroup className="max-h-64 overflow-auto">
              {tags?.map((tag: Tag) => (
                <CommandItem
                  key={tag._id}
                  value={tag.name}
                  onSelect={() => handleToggle(tag._id)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedIds.includes(tag._id) ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span className="flex items-center gap-2">
                    {tag.name}
                    {tag.color && (
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: tag.color }}
                      />
                    )}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Selected Tags */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedTags.map((tag: Tag) => (
            <Badge
              key={tag._id}
              variant="secondary"
              style={tag.color ? { backgroundColor: tag.color + '20', color: tag.color, borderColor: tag.color } : {}}
            >
              {tag.name}
              <button
                onClick={() => handleToggle(tag._id)}
                disabled={disabled}
                className="ml-1 hover:text-red-600"
                type="button"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

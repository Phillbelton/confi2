import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { formatService, type CreateFormatInput, type UpdateFormatInput } from '@/services/admin/formats';
import { flavorService, type CreateFlavorInput, type UpdateFlavorInput } from '@/services/admin/flavors';

// =================== FORMATS ===================
export function useFormats() {
  return useQuery({
    queryKey: ['admin-formats'],
    queryFn: () => formatService.list(),
    staleTime: 60_000,
  });
}

export function usePublicFormats() {
  return useQuery({
    queryKey: ['formats'],
    queryFn: () => formatService.publicList(),
    staleTime: 5 * 60_000,
  });
}

export function useFormatOps() {
  const qc = useQueryClient();
  const inv = () => {
    qc.invalidateQueries({ queryKey: ['admin-formats'] });
    qc.invalidateQueries({ queryKey: ['formats'] });
  };
  return {
    create: useMutation({
      mutationFn: (input: CreateFormatInput) => formatService.create(input),
      onSuccess: () => { toast.success('Formato creado'); inv(); },
      onError: (e: any) => toast.error(e?.message || 'Error'),
    }),
    update: useMutation({
      mutationFn: ({ id, data }: { id: string; data: UpdateFormatInput }) => formatService.update(id, data),
      onSuccess: () => { toast.success('Formato actualizado'); inv(); },
      onError: (e: any) => toast.error(e?.message || 'Error'),
    }),
    remove: useMutation({
      mutationFn: (id: string) => formatService.remove(id),
      onSuccess: () => { toast.success('Formato eliminado'); inv(); },
      onError: (e: any) => toast.error(e?.message || 'Error'),
    }),
  };
}

// =================== FLAVORS ===================
export function useFlavors() {
  return useQuery({
    queryKey: ['admin-flavors'],
    queryFn: () => flavorService.list(),
    staleTime: 60_000,
  });
}

export function usePublicFlavors() {
  return useQuery({
    queryKey: ['flavors'],
    queryFn: () => flavorService.publicList(),
    staleTime: 5 * 60_000,
  });
}

export function useFlavorOps() {
  const qc = useQueryClient();
  const inv = () => {
    qc.invalidateQueries({ queryKey: ['admin-flavors'] });
    qc.invalidateQueries({ queryKey: ['flavors'] });
  };
  return {
    create: useMutation({
      mutationFn: (input: CreateFlavorInput) => flavorService.create(input),
      onSuccess: () => { toast.success('Sabor creado'); inv(); },
      onError: (e: any) => toast.error(e?.message || 'Error'),
    }),
    update: useMutation({
      mutationFn: ({ id, data }: { id: string; data: UpdateFlavorInput }) => flavorService.update(id, data),
      onSuccess: () => { toast.success('Sabor actualizado'); inv(); },
      onError: (e: any) => toast.error(e?.message || 'Error'),
    }),
    remove: useMutation({
      mutationFn: (id: string) => flavorService.remove(id),
      onSuccess: () => { toast.success('Sabor eliminado'); inv(); },
      onError: (e: any) => toast.error(e?.message || 'Error'),
    }),
  };
}

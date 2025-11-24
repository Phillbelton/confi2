'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  Plus,
  Home,
  Building,
  Star,
  Edit,
  Trash2,
  Loader2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  useAddresses,
  useCreateAddress,
  useUpdateAddress,
  useDeleteAddress,
  useSetDefaultAddress,
} from '@/hooks/client/useAddresses';
import type { Address, CreateAddressData } from '@/services/client/addresses';
import { cn } from '@/lib/utils';

const addressSchema = z.object({
  label: z
    .string()
    .min(1, 'El nombre es requerido')
    .max(50, 'Máximo 50 caracteres'),
  street: z
    .string()
    .min(1, 'La calle es requerida')
    .max(200, 'Máximo 200 caracteres'),
  number: z
    .string()
    .min(1, 'El número es requerido')
    .max(20, 'Máximo 20 caracteres'),
  neighborhood: z.string().max(100, 'Máximo 100 caracteres').optional(),
  city: z
    .string()
    .min(1, 'La ciudad es requerida')
    .max(100, 'Máximo 100 caracteres'),
  reference: z.string().max(200, 'Máximo 200 caracteres').optional(),
  isDefault: z.boolean(),
});

type AddressFormData = z.infer<typeof addressSchema>;

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
} as const;

export default function AddressesPage() {
  const { data: addresses = [], isLoading } = useAddresses();
  const createMutation = useCreateAddress();
  const updateMutation = useUpdateAddress();
  const deleteMutation = useDeleteAddress();
  const setDefaultMutation = useSetDefaultAddress();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [deletingAddress, setDeletingAddress] = useState<Address | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      label: '',
      street: '',
      number: '',
      neighborhood: '',
      city: '',
      reference: '',
      isDefault: false,
    },
  });

  const isDefault = watch('isDefault');

  const openCreateDialog = () => {
    setEditingAddress(null);
    reset({
      label: '',
      street: '',
      number: '',
      neighborhood: '',
      city: '',
      reference: '',
      isDefault: addresses.length === 0, // Default si es la primera
    });
    setDialogOpen(true);
  };

  const openEditDialog = (address: Address) => {
    setEditingAddress(address);
    reset({
      label: address.label,
      street: address.street,
      number: address.number,
      neighborhood: address.neighborhood || '',
      city: address.city,
      reference: address.reference || '',
      isDefault: address.isDefault,
    });
    setDialogOpen(true);
  };

  const openDeleteDialog = (address: Address) => {
    setDeletingAddress(address);
    setDeleteDialogOpen(true);
  };

  const onSubmit = async (data: AddressFormData) => {
    if (editingAddress) {
      updateMutation.mutate(
        { id: editingAddress._id, data },
        {
          onSuccess: () => {
            setDialogOpen(false);
            setEditingAddress(null);
          },
        }
      );
    } else {
      createMutation.mutate(data as CreateAddressData, {
        onSuccess: () => {
          setDialogOpen(false);
        },
      });
    }
  };

  const handleDelete = () => {
    if (deletingAddress) {
      deleteMutation.mutate(deletingAddress._id, {
        onSuccess: () => {
          setDeleteDialogOpen(false);
          setDeletingAddress(null);
        },
      });
    }
  };

  const handleSetDefault = (address: Address) => {
    if (!address.isDefault) {
      setDefaultMutation.mutate(address._id);
    }
  };

  const getAddressIcon = (label: string) => {
    const lowerLabel = label.toLowerCase();
    if (lowerLabel.includes('trabajo') || lowerLabel.includes('oficina')) {
      return Building;
    }
    return Home;
  };

  if (isLoading) {
    return <AddressesSkeleton />;
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-4"
    >
      {/* Header */}
      <motion.div
        variants={itemVariants}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold">Mis direcciones</h1>
          <p className="text-muted-foreground">
            Gestiona tus direcciones de entrega
          </p>
        </div>
      </motion.div>

      {/* Add Button */}
      <motion.div variants={itemVariants}>
        <Button onClick={openCreateDialog} className="w-full h-12">
          <Plus className="h-5 w-5 mr-2" />
          Agregar dirección
        </Button>
      </motion.div>

      {/* Address List */}
      {addresses.length === 0 ? (
        <motion.div variants={itemVariants}>
          <EmptyState onAdd={openCreateDialog} />
        </motion.div>
      ) : (
        <motion.div variants={containerVariants} className="space-y-3">
          <AnimatePresence>
            {addresses.map((address) => (
              <motion.div
                key={address._id}
                variants={itemVariants}
                layout
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <AddressCard
                  address={address}
                  onEdit={() => openEditDialog(address)}
                  onDelete={() => openDeleteDialog(address)}
                  onSetDefault={() => handleSetDefault(address)}
                  isSettingDefault={
                    setDefaultMutation.isPending &&
                    setDefaultMutation.variables === address._id
                  }
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingAddress ? 'Editar dirección' : 'Agregar dirección'}
            </DialogTitle>
            <DialogDescription>
              {editingAddress
                ? 'Modifica los datos de tu dirección'
                : 'Agrega una nueva dirección de entrega'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="label">Nombre de la dirección</Label>
              <Input
                id="label"
                placeholder="Ej: Casa, Trabajo, etc."
                className={cn('h-12', errors.label && 'border-destructive')}
                {...register('label')}
              />
              {errors.label && (
                <p className="text-sm text-destructive">{errors.label.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="street">Calle / Avenida</Label>
              <Input
                id="street"
                className={cn('h-12', errors.street && 'border-destructive')}
                {...register('street')}
              />
              {errors.street && (
                <p className="text-sm text-destructive">{errors.street.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="number">Número</Label>
              <Input
                id="number"
                className={cn('h-12', errors.number && 'border-destructive')}
                {...register('number')}
              />
              {errors.number && (
                <p className="text-sm text-destructive">{errors.number.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="neighborhood">Barrio / Colonia (opcional)</Label>
              <Input
                id="neighborhood"
                className="h-12"
                {...register('neighborhood')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">Ciudad</Label>
              <Input
                id="city"
                className={cn('h-12', errors.city && 'border-destructive')}
                {...register('city')}
              />
              {errors.city && (
                <p className="text-sm text-destructive">{errors.city.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="reference">Referencia (opcional)</Label>
              <Input
                id="reference"
                placeholder="Ej: Casa azul, frente al parque"
                className="h-12"
                {...register('reference')}
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Checkbox
                id="isDefault"
                checked={isDefault}
                onCheckedChange={(checked) => setValue('isDefault', !!checked)}
              />
              <Label htmlFor="isDefault" className="font-normal">
                Usar como dirección predeterminada
              </Label>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : editingAddress ? (
                  'Guardar cambios'
                ) : (
                  'Agregar'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar esta dirección?</AlertDialogTitle>
            <AlertDialogDescription>
              {deletingAddress && (
                <>
                  <span className="font-medium">{deletingAddress.label}</span>
                  <br />
                  {deletingAddress.street} {deletingAddress.number}
                  <br />
                  <br />
                  Esta acción no se puede deshacer.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Eliminando...
                </>
              ) : (
                'Eliminar'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}

function AddressCard({
  address,
  onEdit,
  onDelete,
  onSetDefault,
  isSettingDefault,
}: {
  address: Address;
  onEdit: () => void;
  onDelete: () => void;
  onSetDefault: () => void;
  isSettingDefault: boolean;
}) {
  const Icon = address.label.toLowerCase().includes('trabajo') ? Building : Home;

  return (
    <Card>
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold">{address.label}</span>
          </div>
          {address.isDefault && (
            <Badge variant="secondary" className="text-xs">
              <Star className="h-3 w-3 mr-1 fill-current" />
              Predeterminada
            </Badge>
          )}
        </div>

        {/* Address */}
        <div className="text-sm text-muted-foreground space-y-0.5 mb-4">
          <p>
            {address.street} {address.number}
          </p>
          {address.neighborhood && <p>{address.neighborhood}</p>}
          <p>{address.city}</p>
          {address.reference && (
            <p className="italic">Ref: {address.reference}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Edit className="h-4 w-4 mr-1" />
            Editar
          </Button>
          <Button variant="outline" size="sm" onClick={onDelete}>
            <Trash2 className="h-4 w-4 mr-1" />
            Eliminar
          </Button>
          {!address.isDefault && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onSetDefault}
              disabled={isSettingDefault}
            >
              {isSettingDefault ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Star className="h-4 w-4 mr-1" />
              )}
              Predeterminar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <MapPin className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">Sin direcciones</h3>
      <p className="text-sm text-muted-foreground max-w-xs mb-6">
        Agrega una dirección para que tus pedidos lleguen más rápido
      </p>
      <Button onClick={onAdd}>
        <Plus className="h-4 w-4 mr-2" />
        Agregar dirección
      </Button>
    </div>
  );
}

function AddressesSkeleton() {
  return (
    <div className="space-y-4">
      <div>
        <Skeleton className="h-8 w-40 mb-1" />
        <Skeleton className="h-5 w-56" />
      </div>

      <Skeleton className="h-12 w-full" />

      <div className="space-y-3">
        {[1, 2].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-5 w-28 rounded-full" />
              </div>
              <div className="space-y-1 mb-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-9 w-20" />
                <Skeleton className="h-9 w-20" />
                <Skeleton className="h-9 w-28" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

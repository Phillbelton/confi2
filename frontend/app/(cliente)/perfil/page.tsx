'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import {
  User,
  Package,
  MapPin,
  Lock,
  ChevronRight,
  Edit,
  Loader2,
  Calendar,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useClientStore } from '@/store/useClientStore';
import { useClientAuth, useUpdateClientProfile } from '@/hooks/client/useClientAuth';
import { useMyOrders } from '@/hooks/client/useClientOrders';
import { cn } from '@/lib/utils';

const profileSchema = z.object({
  name: z.string().min(2, 'Mínimo 2 caracteres').max(100, 'Máximo 100 caracteres'),
  phone: z.string().regex(/^9\s?\d{4}\s?\d{4}$/, 'Formato: 9 1234 5678').optional().or(z.literal('')),
});

type ProfileFormData = z.infer<typeof profileSchema>;

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

const quickActions = [
  {
    href: '/mis-ordenes',
    icon: Package,
    label: 'Ver mis pedidos',
    description: 'Historial y seguimiento',
  },
  {
    href: '/direcciones',
    icon: MapPin,
    label: 'Mis direcciones',
    description: 'Gestionar entregas',
  },
  {
    href: '#change-password',
    icon: Lock,
    label: 'Cambiar contraseña',
    description: 'Seguridad de cuenta',
  },
];

export default function ProfilePage() {
  const { user } = useClientStore();
  const { isLoading: authLoading } = useClientAuth();
  const updateProfileMutation = useUpdateClientProfile();
  const { data: ordersData, isLoading: ordersLoading } = useMyOrders();

  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Quitar el prefijo +56 del teléfono para mostrarlo en el formulario
  const getPhoneWithoutPrefix = (phone: string | undefined) => {
    if (!phone) return '';
    return phone.startsWith('+56') ? phone.slice(3) : phone;
  };

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      phone: getPhoneWithoutPrefix(user?.phone),
    },
  });

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      month: 'long',
      year: 'numeric',
    });
  };

  const handleOpenEditDialog = () => {
    reset({
      name: user?.name || '',
      phone: getPhoneWithoutPrefix(user?.phone),
    });
    setEditDialogOpen(true);
  };

  const onSubmitProfile = async (data: ProfileFormData) => {
    // Agregar prefijo +56 al teléfono si existe
    const phoneClean = data.phone ? data.phone.replace(/\s/g, '') : '';
    const dataWithPhone = {
      ...data,
      phone: phoneClean ? `+56${phoneClean}` : '',
    };
    updateProfileMutation.mutate(dataWithPhone, {
      onSuccess: () => {
        setEditDialogOpen(false);
      },
    });
  };

  // Stats calculados
  const orders = ordersData?.data || [];
  const totalOrders = orders.length;
  const totalSpent = orders.reduce((sum: number, order: any) => sum + order.total, 0);
  const inProgressOrders = orders.filter(
    (order: any) => !['completed', 'cancelled'].includes(order.status)
  ).length;

  if (authLoading) {
    return <ProfileSkeleton />;
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header con Avatar */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center sm:flex-row sm:text-left sm:items-start gap-4">
              <Avatar className="h-20 w-20 sm:h-24 sm:w-24">
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl sm:text-3xl font-semibold">
                  {user ? getInitials(user.name) : 'U'}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 space-y-1">
                <h1 className="text-xl sm:text-2xl font-bold">{user?.name}</h1>
                <p className="text-muted-foreground">{user?.email}</p>
                {user?.createdAt && (
                  <p className="text-sm text-muted-foreground flex items-center justify-center sm:justify-start gap-1">
                    <Calendar className="h-4 w-4" />
                    Cliente desde {formatDate(user.createdAt)}
                  </p>
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenEditDialog}
                className="shrink-0"
              >
                <Edit className="h-4 w-4 mr-2" />
                Editar perfil
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Tu actividad</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 rounded-lg bg-muted/50">
                {ordersLoading ? (
                  <Skeleton className="h-8 w-12 mx-auto mb-1" />
                ) : (
                  <p className="text-2xl font-bold text-primary">{totalOrders}</p>
                )}
                <p className="text-xs text-muted-foreground">Pedidos</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50">
                {ordersLoading ? (
                  <Skeleton className="h-8 w-16 mx-auto mb-1" />
                ) : (
                  <p className="text-2xl font-bold text-primary">
                    ${totalSpent.toLocaleString()}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50">
                {ordersLoading ? (
                  <Skeleton className="h-8 w-8 mx-auto mb-1" />
                ) : (
                  <p className="text-2xl font-bold text-primary">{inProgressOrders}</p>
                )}
                <p className="text-xs text-muted-foreground">En proceso</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Acciones rápidas */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Acciones rápidas</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {quickActions.map(({ href, icon: Icon, label, description }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{label}</p>
                    <p className="text-sm text-muted-foreground">{description}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Dialog Editar Perfil */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar perfil</DialogTitle>
            <DialogDescription>
              Actualiza tu información personal
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmitProfile)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nombre completo</Label>
              <Input
                id="edit-name"
                className={cn(
                  'h-12',
                  errors.name && 'border-destructive'
                )}
                {...register('name')}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-phone">Teléfono</Label>
              <div className="flex">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-sm h-12">
                  +56
                </span>
                <Input
                  id="edit-phone"
                  type="tel"
                  inputMode="numeric"
                  placeholder="9 1234 5678"
                  maxLength={11}
                  className={cn(
                    'h-12 rounded-l-none',
                    errors.phone && 'border-destructive'
                  )}
                  {...register('phone')}
                />
              </div>
              {errors.phone && (
                <p className="text-sm text-destructive">{errors.phone.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={user?.email || ''} disabled className="h-12 bg-muted" />
              <p className="text-xs text-muted-foreground">
                El email no se puede modificar
              </p>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={updateProfileMutation.isPending || !isDirty}
              >
                {updateProfileMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  'Guardar cambios'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center sm:flex-row sm:items-start gap-4">
            <Skeleton className="h-20 w-20 sm:h-24 sm:w-24 rounded-full" />
            <div className="flex-1 space-y-2 text-center sm:text-left">
              <Skeleton className="h-7 w-40 mx-auto sm:mx-0" />
              <Skeleton className="h-5 w-48 mx-auto sm:mx-0" />
              <Skeleton className="h-4 w-36 mx-auto sm:mx-0" />
            </div>
            <Skeleton className="h-9 w-28" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-24" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="text-center p-3 rounded-lg bg-muted/50">
                <Skeleton className="h-8 w-12 mx-auto mb-1" />
                <Skeleton className="h-3 w-16 mx-auto" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="p-0">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-4 p-4 border-b last:border-0">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-5 w-5" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useAdminOrders } from '@/hooks/admin/useAdminOrders';
import type { OrderStatus } from '@/types/order';

const statusSchema = z.object({
  status: z.enum([
    'pending_whatsapp',
    'confirmed',
    'preparing',
    'shipped',
    'completed',
    'cancelled',
  ]),
  adminNotes: z.string().optional(),
});

type StatusFormValues = z.infer<typeof statusSchema>;

interface UpdateOrderStatusProps {
  orderId: string;
  currentStatus: OrderStatus;
}

const statusOptions: { value: OrderStatus; label: string }[] = [
  { value: 'pending_whatsapp', label: 'Pendiente WhatsApp' },
  { value: 'confirmed', label: 'Confirmada' },
  { value: 'preparing', label: 'En Preparación' },
  { value: 'shipped', label: 'Enviada' },
  { value: 'completed', label: 'Completada' },
];

export function UpdateOrderStatus({ orderId, currentStatus }: UpdateOrderStatusProps) {
  const { updateStatus, isUpdatingStatus } = useAdminOrders({
    page: 1,
    limit: 10,
  });
  const [showNotes, setShowNotes] = useState(false);

  const form = useForm<StatusFormValues>({
    resolver: zodResolver(statusSchema),
    defaultValues: {
      status: currentStatus,
      adminNotes: '',
    },
  });

  const onSubmit = (values: StatusFormValues) => {
    updateStatus(
      { id: orderId, data: values },
      {
        onSuccess: () => {
          form.reset();
          setShowNotes(false);
        },
      }
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Actualizar Estado</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un estado" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {showNotes && (
          <FormField
            control={form.control}
            name="adminNotes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notas (opcional)</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Agregar notas sobre este cambio de estado..."
                    rows={3}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="flex gap-2">
          <Button type="submit" disabled={isUpdatingStatus}>
            {isUpdatingStatus ? 'Actualizando...' : 'Actualizar Estado'}
          </Button>
          {!showNotes && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowNotes(true)}
            >
              Agregar Notas
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}

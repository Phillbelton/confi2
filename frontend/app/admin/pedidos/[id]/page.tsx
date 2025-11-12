'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Package,
  User,
  MapPin,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  MessageSquare,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';
import { orderService } from '@/services/orders';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import type { Order, ProductVariant } from '@/types';
import { useToast } from '@/hooks/use-toast';

const statusConfig = {
  pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' },
  confirmed: { label: 'Confirmado', color: 'bg-blue-100 text-blue-800' },
  in_preparation: { label: 'En preparación', color: 'bg-purple-100 text-purple-800' },
  ready_for_pickup: { label: 'Listo para retiro', color: 'bg-green-100 text-green-800' },
  in_delivery: { label: 'En camino', color: 'bg-indigo-100 text-indigo-800' },
  completed: { label: 'Completado', color: 'bg-green-100 text-green-800' },
  cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-800' },
};

const statusOptions = [
  { value: 'pending', label: 'Pendiente' },
  { value: 'confirmed', label: 'Confirmado' },
  { value: 'in_preparation', label: 'En preparación' },
  { value: 'ready_for_pickup', label: 'Listo para retiro' },
  { value: 'in_delivery', label: 'En camino' },
  { value: 'completed', label: 'Completado' },
];

export default function OrderDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [newStatus, setNewStatus] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  // Fetch order
  const { data, isLoading, error } = useQuery({
    queryKey: ['order', params.id],
    queryFn: () => orderService.getById(params.id),
  });

  const order = data?.data as Order | undefined;

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ status, notes }: { status: string; notes?: string }) =>
      orderService.updateStatus(params.id, status, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', params.id] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast({
        title: 'Estado actualizado',
        description: 'El estado del pedido se actualizó correctamente.',
      });
      setAdminNotes('');
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error?.message || 'No se pudo actualizar el estado.',
      });
    },
  });

  // Cancel order mutation
  const cancelOrderMutation = useMutation({
    mutationFn: (reason: string) => orderService.cancelOrder(params.id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', params.id] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      setShowCancelDialog(false);
      toast({
        title: 'Pedido cancelado',
        description: 'El pedido se canceló correctamente.',
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error?.message || 'No se pudo cancelar el pedido.',
      });
    },
  });

  // Mark WhatsApp sent mutation
  const markWhatsAppMutation = useMutation({
    mutationFn: () => orderService.markWhatsAppSent(params.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', params.id] });
      toast({
        title: 'WhatsApp marcado',
        description: 'El mensaje de WhatsApp fue marcado como enviado.',
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error?.message || 'No se pudo marcar el mensaje.',
      });
    },
  });

  const handleStatusUpdate = () => {
    if (!newStatus) return;
    updateStatusMutation.mutate({ status: newStatus, notes: adminNotes || undefined });
  };

  const handleCancel = () => {
    if (!cancelReason.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Debes proporcionar un motivo de cancelación.',
      });
      return;
    }
    cancelOrderMutation.mutate(cancelReason);
  };

  const generateWhatsAppLink = () => {
    if (!order) return '#';
    const phone = order.customer.phone.replace(/\D/g, '');
    let message = `¡Hola ${order.customer.name}! 👋\n\n`;
    message += `Tu pedido *#${order.orderNumber}* está en estado: *${statusConfig[order.status]?.label}*\n\n`;
    message += `Cualquier consulta estamos a tu disposición. ¡Gracias por tu compra! 🍬`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="space-y-4">
        <Button asChild variant="ghost">
          <Link href="/admin/pedidos">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Link>
        </Button>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            No se pudo cargar el pedido. {error instanceof Error ? error.message : ''}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="icon">
            <Link href="/admin/pedidos">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              Pedido #{order.orderNumber}
            </h2>
            <p className="text-sm text-muted-foreground">
              Creado el {new Date(order.createdAt).toLocaleDateString('es-AR', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(generateWhatsAppLink(), '_blank')}
          >
            <MessageSquare className="mr-2 h-4 w-4" />
            Enviar WhatsApp
          </Button>
          {!order.whatsappSent && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => markWhatsAppMutation.mutate()}
              disabled={markWhatsAppMutation.isPending}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Marcar enviado
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Order Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Productos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.items.map((item, index) => {
                  const variant = item.variant as ProductVariant;
                  const hasDiscount = item.discount > 0;

                  return (
                    <div key={index} className="flex gap-4 pb-4 border-b last:border-0 last:pb-0">
                      {/* Image placeholder */}
                      <div className="h-16 w-16 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                        <Package className="h-6 w-6 text-muted-foreground" />
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{item.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          Cantidad: {item.quantity}
                        </p>
                        {hasDiscount && (
                          <Badge variant="outline" className="mt-1 text-xs text-success border-success">
                            -{((item.discount / (item.price * item.quantity)) * 100).toFixed(0)}% descuento
                          </Badge>
                        )}
                      </div>

                      {/* Price */}
                      <div className="text-right">
                        <div className="font-semibold">${item.subtotal.toLocaleString()}</div>
                        {hasDiscount && (
                          <div className="text-sm text-muted-foreground line-through">
                            ${(item.price * item.quantity).toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <Separator className="my-4" />

              {/* Totals */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>${order.subtotal.toLocaleString()}</span>
                </div>
                {order.totalDiscount > 0 && (
                  <div className="flex justify-between text-sm text-success">
                    <span>Descuentos</span>
                    <span>-${order.totalDiscount.toLocaleString()}</span>
                  </div>
                )}
                {order.shippingCost > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Envío</span>
                    <span>${order.shippingCost.toLocaleString()}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>${order.total.toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Información del Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="h-4 w-4" />
                    Nombre
                  </div>
                  <div className="font-medium">{order.customer.name}</div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    Teléfono
                  </div>
                  <div className="font-medium">{order.customer.phone}</div>
                </div>

                {order.customer.email && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      Email
                    </div>
                    <div className="font-medium">{order.customer.email}</div>
                  </div>
                )}

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    Dirección
                  </div>
                  <div className="font-medium">
                    {order.customer.address.street} {order.customer.address.number}
                    <br />
                    {order.customer.address.city} ({order.customer.address.postalCode})
                  </div>
                </div>
              </div>

              {order.customerNotes && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-muted-foreground">
                      Notas del cliente:
                    </div>
                    <div className="text-sm bg-muted p-3 rounded-lg">
                      {order.customerNotes}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Status & Actions */}
        <div className="space-y-6">
          {/* Current Status */}
          <Card>
            <CardHeader>
              <CardTitle>Estado del Pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Estado actual:</span>
                <Badge className={statusConfig[order.status]?.color}>
                  {statusConfig[order.status]?.label}
                </Badge>
              </div>

              <Separator />

              <div className="space-y-3">
                <Label htmlFor="status">Cambiar estado</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Seleccionar nuevo estado" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="space-y-2">
                  <Label htmlFor="admin-notes">Notas (opcional)</Label>
                  <Textarea
                    id="admin-notes"
                    placeholder="Agregar notas internas..."
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    rows={3}
                  />
                </div>

                <Button
                  className="w-full"
                  onClick={handleStatusUpdate}
                  disabled={!newStatus || updateStatusMutation.isPending}
                >
                  {updateStatusMutation.isPending ? 'Actualizando...' : 'Actualizar Estado'}
                </Button>
              </div>

              {order.status !== 'cancelled' && order.status !== 'completed' && (
                <>
                  <Separator />
                  <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
                    <DialogTrigger asChild>
                      <Button variant="destructive" className="w-full">
                        <XCircle className="mr-2 h-4 w-4" />
                        Cancelar Pedido
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Cancelar Pedido</DialogTitle>
                        <DialogDescription>
                          Esta acción cancelará el pedido. Proporciona un motivo de cancelación.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <Label htmlFor="cancel-reason">Motivo de cancelación</Label>
                        <Textarea
                          id="cancel-reason"
                          placeholder="Ej: Cliente solicitó cancelación, producto sin stock..."
                          value={cancelReason}
                          onChange={(e) => setCancelReason(e.target.value)}
                          rows={4}
                        />
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
                          Cerrar
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={handleCancel}
                          disabled={!cancelReason.trim() || cancelOrderMutation.isPending}
                        >
                          {cancelOrderMutation.isPending ? 'Cancelando...' : 'Confirmar Cancelación'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </>
              )}
            </CardContent>
          </Card>

          {/* Order Info */}
          <Card>
            <CardHeader>
              <CardTitle>Detalles del Pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Método de entrega:</span>
                <Badge variant="outline">
                  {order.deliveryMethod === 'pickup' ? 'Retiro en local' : 'Delivery'}
                </Badge>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Método de pago:</span>
                <Badge variant="outline">
                  {order.paymentMethod === 'cash' ? 'Efectivo' : 'Transferencia'}
                </Badge>
              </div>

              <Separator />

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">WhatsApp enviado:</span>
                <span className={order.whatsappSent ? 'text-success' : 'text-muted-foreground'}>
                  {order.whatsappSent ? 'Sí' : 'No'}
                </span>
              </div>

              {order.whatsappSentAt && (
                <div className="text-xs text-muted-foreground">
                  Enviado el {new Date(order.whatsappSentAt).toLocaleDateString('es-AR')}
                </div>
              )}

              {order.completedAt && (
                <>
                  <Separator />
                  <div className="text-xs text-muted-foreground">
                    Completado el {new Date(order.completedAt).toLocaleDateString('es-AR')}
                  </div>
                </>
              )}

              {order.cancelledAt && (
                <>
                  <Separator />
                  <div className="text-xs text-destructive">
                    Cancelado el {new Date(order.cancelledAt).toLocaleDateString('es-AR')}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {order.adminNotes && (
            <Card>
              <CardHeader>
                <CardTitle>Notas Internas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm bg-muted p-3 rounded-lg whitespace-pre-wrap">
                  {order.adminNotes}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

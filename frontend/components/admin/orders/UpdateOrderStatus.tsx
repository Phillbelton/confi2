'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Info, HelpCircle } from 'lucide-react';
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
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { InlineHelp } from '@/components/ui/inline-help';
import { HelpPanel, HelpSection, HelpExample } from '@/components/ui/help-panel';
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
  const [isHelpOpen, setIsHelpOpen] = useState(false);

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
        <div className="flex items-center justify-between gap-2">
          <InlineHelp variant="info" className="flex-1">
            <strong>Flujo de estados:</strong> Pendiente WhatsApp → Confirmada → En Preparación → Enviada → Completada
          </InlineHelp>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsHelpOpen(true)}
          >
            <HelpCircle className="h-4 w-4 mr-2" />
            Ayuda
          </Button>
        </div>

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center gap-2">
                <FormLabel>Actualizar Estado</FormLabel>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-sm">
                    <div className="text-xs space-y-1">
                      <p><strong>Pendiente WhatsApp:</strong> Esperando confirmación del cliente</p>
                      <p><strong>Confirmada:</strong> Cliente confirmó, listo para preparar</p>
                      <p><strong>En Preparación:</strong> Empacando el pedido</p>
                      <p><strong>Enviada:</strong> En camino al cliente</p>
                      <p><strong>Completada:</strong> Entregada y finalizada</p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </div>
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
                <div className="flex items-center gap-2">
                  <FormLabel>Notas (opcional)</FormLabel>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="text-xs">
                        Notas internas visibles solo para administradores. Útil para registrar cambios, problemas o información adicional sobre el pedido.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
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

        {/* Help Panel */}
        <HelpPanel
          isOpen={isHelpOpen}
          onClose={() => setIsHelpOpen(false)}
          title="Ayuda: Estados de Pedidos"
        >
          <HelpSection title="Flujo Completo de Estados">
            <p>Los pedidos pasan por diferentes estados durante su ciclo de vida:</p>
            <div className="mt-3 space-y-3">
              <div className="flex items-start gap-2">
                <span className="font-bold text-lg">1️⃣</span>
                <div>
                  <p className="font-medium">Pendiente WhatsApp</p>
                  <p className="text-sm">El cliente hizo el pedido pero aún no confirmó por WhatsApp</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-lg">2️⃣</span>
                <div>
                  <p className="font-medium">Confirmada</p>
                  <p className="text-sm">El cliente confirmó el pedido y método de pago</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-lg">3️⃣</span>
                <div>
                  <p className="font-medium">En Preparación</p>
                  <p className="text-sm">Estás empacando el pedido</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-lg">4️⃣</span>
                <div>
                  <p className="font-medium">Enviada</p>
                  <p className="text-sm">El pedido está en camino al cliente</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-lg">5️⃣</span>
                <div>
                  <p className="font-medium">Completada</p>
                  <p className="text-sm">El cliente recibió el pedido. ¡Proceso finalizado!</p>
                </div>
              </div>
            </div>
          </HelpSection>

          <HelpSection title="Pendiente WhatsApp - ¿Qué hacer?">
            <p>Este es el estado inicial después de que un cliente hace un pedido en tu tienda.</p>
            <ul className="list-disc ml-4 mt-2 space-y-1">
              <li>Contacta al cliente por WhatsApp para confirmar el pedido</li>
              <li>Verifica que los productos y cantidades sean correctos</li>
              <li>Confirma el método de pago y dirección de entrega</li>
              <li>Si el cliente confirma, cambia a <strong>"Confirmada"</strong></li>
              <li>Si el cliente no responde o cancela, cambia a <strong>"Cancelada"</strong></li>
            </ul>
          </HelpSection>

          <HelpExample title="Ejemplo: Confirmando por WhatsApp">
            <p className="text-sm">
              <strong>Tú:</strong> "¡Hola! Recibimos tu pedido #12345. ¿Confirmas la compra de 2 Shampoos por 50.000 Gs?"
            </p>
            <p className="text-sm mt-2">
              <strong>Cliente:</strong> "Sí, confirmo. Pago en efectivo al recibir."
            </p>
            <p className="text-sm mt-2 text-green-600">
              ✅ Cambia el estado a "Confirmada"
            </p>
          </HelpExample>

          <HelpSection title="Confirmada - ¿Qué hacer?">
            <p>El cliente confirmó el pedido. Ahora es momento de prepararlo.</p>
            <ul className="list-disc ml-4 mt-2 space-y-1">
              <li>Verifica que tengas stock de todos los productos</li>
              <li>Reúne los productos del almacén</li>
              <li>Cuando empieces a empacar, cambia a <strong>"En Preparación"</strong></li>
            </ul>
          </HelpSection>

          <HelpSection title="En Preparación - ¿Qué hacer?">
            <p>Estás empacando el pedido para enviarlo.</p>
            <ul className="list-disc ml-4 mt-2 space-y-1">
              <li>Empaca los productos cuidadosamente</li>
              <li>Incluye factura o nota de pedido</li>
              <li>Prepara etiqueta con dirección de entrega</li>
              <li>Cuando el paquete esté listo para enviar, cambia a <strong>"Enviada"</strong></li>
            </ul>
          </HelpSection>

          <HelpExample title="Ejemplo: Preparando pedido">
            <div className="text-sm space-y-1">
              <p>Pedido #12345:</p>
              <p>✅ 2x Shampoo reunidos del estante B3</p>
              <p>✅ Empacados en caja con papel de burbujas</p>
              <p>✅ Factura impresa y adjunta</p>
              <p>✅ Etiqueta con dirección pegada</p>
              <p className="text-green-600 mt-2">
                → Listo para enviar. Cambiar a "Enviada"
              </p>
            </div>
          </HelpExample>

          <HelpSection title="Enviada - ¿Qué hacer?">
            <p>El pedido está en camino al cliente.</p>
            <ul className="list-disc ml-4 mt-2 space-y-1">
              <li>Entrega el paquete al servicio de mensajería o delivery</li>
              <li>Envía al cliente el número de seguimiento (si aplica)</li>
              <li>Mantén al cliente informado sobre el estado del envío</li>
              <li>Cuando el cliente confirme que recibió, cambia a <strong>"Completada"</strong></li>
            </ul>
          </HelpSection>

          <HelpExample title="Ejemplo: Notificando al cliente">
            <p className="text-sm">
              <strong>Tú:</strong> "¡Tu pedido #12345 ya está en camino! Código de seguimiento: ABC123. Llegaría mañana entre 10-18hs."
            </p>
            <p className="text-sm mt-2">
              <strong>Cliente (al día siguiente):</strong> "¡Ya recibí el paquete! Todo perfecto, gracias."
            </p>
            <p className="text-sm mt-2 text-green-600">
              ✅ Cambia el estado a "Completada"
            </p>
          </HelpExample>

          <HelpSection title="Completada - ¡Proceso Finalizado!">
            <p>El cliente recibió su pedido exitosamente.</p>
            <ul className="list-disc ml-4 mt-2 space-y-1">
              <li>Este es el estado final de un pedido exitoso</li>
              <li>El pedido queda registrado en el historial</li>
              <li>Ya no es necesario hacer nada más</li>
              <li>Opcionalmente, puedes pedir una reseña al cliente</li>
            </ul>
          </HelpSection>

          <HelpSection title="Estado Cancelada - ¿Cuándo usar?">
            <p className="text-red-600 font-medium">Usa este estado si el pedido no se completará.</p>
            <p className="mt-2">Razones comunes para cancelar:</p>
            <ul className="list-disc ml-4 mt-2 space-y-1">
              <li>El cliente no respondió al WhatsApp (después de varios intentos)</li>
              <li>El cliente decidió no continuar con la compra</li>
              <li>No hay stock disponible del producto</li>
              <li>Pedido duplicado o hecho por error</li>
              <li>Problemas de pago</li>
            </ul>
            <p className="mt-2 text-sm">
              <strong>Nota:</strong> Cuando cancelas un pedido, el stock reservado vuelve a estar disponible.
            </p>
          </HelpSection>

          <HelpSection title="Notas Administrativas - ¿Para qué sirven?">
            <p>Las notas son visibles solo para ti y otros administradores. Úsalas para:</p>
            <ul className="list-disc ml-4 mt-2 space-y-1">
              <li>Registrar cambios importantes en el pedido</li>
              <li>Anotar problemas o situaciones especiales</li>
              <li>Recordar detalles para futuras referencias</li>
              <li>Comunicarte con otros administradores</li>
            </ul>
          </HelpSection>

          <HelpExample title="Ejemplo: Usando notas">
            <div className="text-sm space-y-2">
              <div>
                <p className="font-medium">Estado: Confirmada → En Preparación</p>
                <p className="text-muted-foreground italic">
                  "Cliente solicitó envolver como regalo con moño azul"
                </p>
              </div>
              <div>
                <p className="font-medium">Estado: En Preparación → Enviada</p>
                <p className="text-muted-foreground italic">
                  "Enviado con MotoExpress. Código: ME-98765. Cliente avisado por WhatsApp."
                </p>
              </div>
              <div>
                <p className="font-medium">Estado: Pendiente WhatsApp → Cancelada</p>
                <p className="text-muted-foreground italic">
                  "Cliente no respondió después de 3 intentos (24/11, 25/11, 26/11)"
                </p>
              </div>
            </div>
          </HelpExample>

          <HelpSection title="Consejos y Buenas Prácticas">
            <ul className="list-disc ml-4 space-y-2">
              <li>
                <strong>Actualiza los estados puntualmente:</strong> Mantén los estados actualizados para que otros admins sepan qué está pasando
              </li>
              <li>
                <strong>Comunica cada cambio al cliente:</strong> Envía un mensaje de WhatsApp cuando cambies a "En Preparación", "Enviada" y "Completada"
              </li>
              <li>
                <strong>Usa las notas:</strong> Especialmente para situaciones especiales, problemas o instrucciones del cliente
              </li>
              <li>
                <strong>No saltes estados:</strong> Sigue el flujo normal (salvo para cancelar)
              </li>
              <li>
                <strong>Cancela rápido si es necesario:</strong> Si un cliente no responde en 48-72hs, cancela el pedido para liberar el stock
              </li>
            </ul>
          </HelpSection>
        </HelpPanel>
      </form>
    </Form>
  );
}

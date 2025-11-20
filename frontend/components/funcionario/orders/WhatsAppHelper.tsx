'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MessageCircle, Copy, ExternalLink, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { Order } from '@/types/order';

interface WhatsAppHelperProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order;
  onSend?: (message: string) => void;
}

type MessageTemplate = {
  id: string;
  label: string;
  description: string;
  message: string;
  category: 'confirmacion' | 'actualizacion' | 'entrega' | 'cancelacion' | 'seguimiento';
};

const messageTemplates: MessageTemplate[] = [
  {
    id: 'confirm_order',
    label: 'Confirmación de Orden',
    description: 'Confirmar recepción de la orden',
    category: 'confirmacion',
    message: `Hola {cliente} 👋

¡Gracias por tu orden {numeroOrden}!

📦 *Detalles de tu pedido:*
{productos}

💰 *Total:* {total}
🚚 *Costo de envío:* {costoEnvio}
💳 *Total a pagar:* {totalConEnvio}

📍 *Dirección de entrega:*
{direccion}

Confirmaremos tu pedido en breve. ¡Gracias por confiar en nosotros! 🙌`,
  },
  {
    id: 'order_confirmed',
    label: 'Pedido Confirmado',
    description: 'Notificar que el pedido fue confirmado',
    category: 'confirmacion',
    message: `Hola {cliente} ✅

Tu orden {numeroOrden} ha sido *confirmada*.

Estamos preparando tu pedido con mucho cuidado. Te avisaremos cuando esté listo para envío.

💰 *Total a pagar:* {totalConEnvio}
📍 *Envío a:* {direccion}

¡Gracias por tu paciencia! 😊`,
  },
  {
    id: 'order_preparing',
    label: 'Preparando Pedido',
    description: 'Informar que el pedido está siendo empacado',
    category: 'actualizacion',
    message: `Hola {cliente} 📦

¡Tu orden {numeroOrden} está siendo preparada!

Estamos empacando cuidadosamente tus productos:
{productos}

Pronto estará lista para el envío. Te notificaremos cuando salga en camino 🚚

💰 *Total:* {totalConEnvio}`,
  },
  {
    id: 'order_shipped',
    label: 'Pedido Enviado',
    description: 'Notificar que el pedido está en camino',
    category: 'entrega',
    message: `Hola {cliente} 🚚

¡Tu orden {numeroOrden} ya está en camino!

📦 *Productos enviados:*
{productos}

📍 *Dirección de entrega:*
{direccion}

Recibirás tu pedido pronto. Cualquier duda, contáctanos 📞

💰 *Total a pagar:* {totalConEnvio}`,
  },
  {
    id: 'order_ready_pickup',
    label: 'Listo para Retiro',
    description: 'Notificar que el pedido está listo para retirar',
    category: 'entrega',
    message: `Hola {cliente} ✅

Tu orden {numeroOrden} está *lista para retiro* en nuestra tienda.

📦 *Productos:*
{productos}

📍 *Dirección de retiro:*
[Dirección de tu tienda]

🕒 *Horario:* Lunes a Viernes 9:00-18:00, Sábados 9:00-13:00

💰 *Total a pagar:* {totalConEnvio}

¡Te esperamos! 🙌`,
  },
  {
    id: 'order_completed',
    label: 'Pedido Completado',
    description: 'Agradecer por la compra',
    category: 'entrega',
    message: `Hola {cliente} 🎉

¡Gracias por tu compra!

Esperamos que disfrutes tus productos. Tu orden {numeroOrden} ha sido completada exitosamente.

¿Te gustó nuestro servicio? Nos encantaría saber tu opinión 💬

¡Vuelve pronto! 😊`,
  },
  {
    id: 'order_cancelled',
    label: 'Pedido Cancelado',
    description: 'Informar cancelación de pedido',
    category: 'cancelacion',
    message: `Hola {cliente} ❌

Tu orden {numeroOrden} ha sido cancelada.

*Motivo:* {motivoCancelacion}

Si tienes alguna duda o deseas hacer un nuevo pedido, estamos aquí para ayudarte 💬

Disculpa las molestias.`,
  },
  {
    id: 'payment_reminder',
    label: 'Recordatorio de Pago',
    description: 'Recordar pago pendiente',
    category: 'seguimiento',
    message: `Hola {cliente} 💰

Recordatorio amigable sobre tu orden {numeroOrden}.

💳 *Total a pagar:* {totalConEnvio}

Una vez confirmemos tu pago, procederemos con el envío inmediatamente.

¿Necesitas ayuda con el pago? Contáctanos 📞`,
  },
  {
    id: 'address_confirmation',
    label: 'Confirmar Dirección',
    description: 'Verificar dirección de entrega',
    category: 'seguimiento',
    message: `Hola {cliente} 📍

Para confirmar tu orden {numeroOrden}, necesitamos verificar tu dirección de entrega:

*Dirección registrada:*
{direccion}

¿Es correcta? Por favor confirma o envíanos la dirección actualizada.

¡Gracias! 🙏`,
  },
  {
    id: 'custom',
    label: 'Mensaje Personalizado',
    description: 'Escribe tu propio mensaje',
    category: 'seguimiento',
    message: 'Hola {cliente},\n\n',
  },
];

export function WhatsAppHelper({
  open,
  onOpenChange,
  order,
  onSend,
}: WhatsAppHelperProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('confirm_order');
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);

  // Initialize message when template changes
  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = messageTemplates.find((t) => t.id === templateId);
    if (template) {
      setMessage(replaceTemplateVariables(template.message, order));
    }
  };

  // Initialize on open
  useEffect(() => {
    if (open) {
      handleTemplateChange(selectedTemplate);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendWhatsApp = () => {
    const phone = order.customer.phone?.replace(/\D/g, '');
    if (!phone) {
      alert('El cliente no tiene número de teléfono registrado');
      return;
    }

    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');

    if (onSend) {
      onSend(message);
    }
  };

  const currentTemplate = messageTemplates.find((t) => t.id === selectedTemplate);
  const categoryTemplates = messageTemplates.filter(
    (t) => !currentTemplate || t.category === currentTemplate.category
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-green-600" />
            Enviar WhatsApp - {order.orderNumber}
          </DialogTitle>
          <DialogDescription>
            Cliente: {order.customer.name} • {order.customer.phone || 'Sin teléfono'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {/* Template Selector */}
          <div className="space-y-2">
            <Label htmlFor="template">Plantilla de Mensaje</Label>
            <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
              <SelectTrigger id="template">
                <SelectValue placeholder="Selecciona una plantilla" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(
                  messageTemplates.reduce((acc, template) => {
                    if (!acc[template.category]) {
                      acc[template.category] = [];
                    }
                    acc[template.category].push(template);
                    return acc;
                  }, {} as Record<string, MessageTemplate[]>)
                ).map(([category, templates]) => (
                  <div key={category}>
                    <div className="px-2 py-1.5 text-xs font-semibold text-slate-500 uppercase">
                      {getCategoryLabel(category)}
                    </div>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        <div className="flex flex-col items-start">
                          <span>{template.label}</span>
                          <span className="text-xs text-slate-500">{template.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </div>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Message Preview/Editor */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="message">Mensaje</Label>
              <Badge variant="outline" className="text-xs">
                {message.length} caracteres
              </Badge>
            </div>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={14}
              className="font-mono text-sm"
              placeholder="El mensaje aparecerá aquí..."
            />
            <p className="text-xs text-slate-500">
              Puedes editar el mensaje antes de enviarlo. Las variables se reemplazarán automáticamente.
            </p>
          </div>

          {/* Available Variables */}
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
              Variables disponibles:
            </p>
            <div className="flex flex-wrap gap-2 text-xs">
              <Badge variant="outline" className="font-mono">{'{cliente}'}</Badge>
              <Badge variant="outline" className="font-mono">{'{numeroOrden}'}</Badge>
              <Badge variant="outline" className="font-mono">{'{productos}'}</Badge>
              <Badge variant="outline" className="font-mono">{'{total}'}</Badge>
              <Badge variant="outline" className="font-mono">{'{costoEnvio}'}</Badge>
              <Badge variant="outline" className="font-mono">{'{totalConEnvio}'}</Badge>
              <Badge variant="outline" className="font-mono">{'{direccion}'}</Badge>
              <Badge variant="outline" className="font-mono">{'{motivoCancelacion}'}</Badge>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button variant="outline" onClick={handleCopy} className="gap-2">
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                Copiado
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copiar
              </>
            )}
          </Button>
          <Button
            onClick={handleSendWhatsApp}
            disabled={!order.customer.phone || !message.trim()}
            className="gap-2 bg-green-600 hover:bg-green-700"
          >
            <ExternalLink className="h-4 w-4" />
            Abrir WhatsApp
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Helper function to replace template variables
function replaceTemplateVariables(template: string, order: Order): string {
  const variables: Record<string, string> = {
    '{cliente}': order.customer.name || 'Cliente',
    '{numeroOrden}': order.orderNumber || '',
    '{productos}': formatProducts(order.items),
    '{total}': formatCurrency(order.subtotal),
    '{costoEnvio}': formatCurrency(order.shippingCost),
    '{totalConEnvio}': formatCurrency(order.total),
    '{direccion}': formatAddress(order),
    '{motivoCancelacion}': order.cancellationReason || 'No especificado',
  };

  let result = template;
  Object.entries(variables).forEach(([key, value]) => {
    result = result.replace(new RegExp(key, 'g'), value);
  });

  return result;
}

function formatProducts(items: Order['items']): string {
  return items
    .map((item, idx) => {
      const attrs = Object.entries(item.variantSnapshot.attributes || {})
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ');
      const attrsStr = attrs ? ` (${attrs})` : '';
      return `${idx + 1}. ${item.variantSnapshot.name}${attrsStr} - ${item.quantity}x ${formatCurrency(item.pricePerUnit)}`;
    })
    .join('\n');
}

function formatAddress(order: Order): string {
  const { shippingAddress } = order;
  if (!shippingAddress) return 'No especificada';

  return `${shippingAddress.street || ''}, ${shippingAddress.city || ''}, ${shippingAddress.department || ''}${
    shippingAddress.reference ? `\nReferencia: ${shippingAddress.reference}` : ''
  }`;
}

function formatCurrency(value: number): string {
  return '$' + new Intl.NumberFormat('es-CL', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    confirmacion: 'Confirmación',
    actualizacion: 'Actualización',
    entrega: 'Entrega',
    cancelacion: 'Cancelación',
    seguimiento: 'Seguimiento',
  };
  return labels[category] || category;
}

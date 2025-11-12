'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { MessageCircle, ChevronLeft, Check } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useCartStore } from '@/store/useCartStore';
import { orderService } from '@/services/orders';
import { toast } from 'sonner';
import type { DeliveryMethod } from '@/types';

// ============================================================================
// VALIDATION SCHEMA
// ============================================================================

const checkoutSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  phone: z.string().min(8, 'El teléfono debe tener al menos 8 dígitos'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  address: z.object({
    street: z.string().min(3, 'La calle es requerida'),
    number: z.string().min(1, 'El número es requerido'),
    city: z.string().min(2, 'La ciudad es requerida'),
    postalCode: z.string().min(4, 'El código postal es requerido'),
  }),
  notes: z.string().optional(),
  deliveryMethod: z.enum(['pickup', 'delivery']),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

// ============================================================================
// CHECKOUT PAGE
// ============================================================================

export default function CheckoutPage() {
  const router = useRouter();
  const { items, total, subtotal, totalDiscount, clearCart } = useCartStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      address: {
        street: '',
        number: '',
        city: '',
        postalCode: '',
      },
      notes: '',
      deliveryMethod: 'pickup',
    },
  });

  // Redirect if cart is empty
  if (items.length === 0) {
    router.push('/productos');
    return null;
  }

  const onSubmit = async (data: CheckoutFormData) => {
    setIsSubmitting(true);

    try {
      // Create order
      const orderData = {
        customer: {
          name: data.name,
          phone: data.phone,
          email: data.email || '',
          address: data.address,
        },
        items: items.map((item) => ({
          variantId: item.variant._id,
          quantity: item.quantity,
        })),
        deliveryMethod: data.deliveryMethod,
        paymentMethod: 'cash' as const, // Default payment method
        customerNotes: data.notes,
      };

      const response = await orderService.create(orderData);
      const order = response.data;

      // Generate WhatsApp message
      const waMessage = generateWhatsAppMessage(order.orderNumber, data, items, {
        subtotal,
        totalDiscount,
        total,
      });

      // Open WhatsApp
      const waNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '';
      const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(waMessage)}`;
      window.open(waUrl, '_blank');

      // Clear cart
      clearCart();

      // Show success message
      toast.success('¡Pedido enviado por WhatsApp!', {
        description: `Número de orden: ${order.orderNumber}`,
        duration: 5000,
      });

      // Redirect to confirmation page
      router.push(`/checkout/confirmacion?orderNumber=${order.orderNumber}`);
    } catch (error: any) {
      console.error('Error creating order:', error);
      toast.error('Error al crear el pedido', {
        description: error.message || 'Por favor, intenta nuevamente',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const deliveryMethod = form.watch('deliveryMethod');
  const shippingCost = deliveryMethod === 'delivery' ? 0 : 0; // TODO: Calculate shipping
  const finalTotal = total + shippingCost;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        <div className="container px-4 py-8 md:px-6 md:py-12 max-w-7xl">
          {/* Back button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="mb-6"
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>

          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Checkout</h1>
            <p className="text-muted-foreground mt-2">
              Completa tus datos para enviar el pedido por WhatsApp
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form */}
            <div className="lg:col-span-2 space-y-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Contact Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Información de contacto</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nombre completo *</FormLabel>
                            <FormControl>
                              <Input placeholder="Juan Pérez" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>WhatsApp *</FormLabel>
                              <FormControl>
                                <Input
                                  type="tel"
                                  placeholder="+595 981 234567"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                Te contactaremos por este número
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email (opcional)</FormLabel>
                              <FormControl>
                                <Input
                                  type="email"
                                  placeholder="correo@ejemplo.com"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Delivery Address */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Dirección de entrega</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2">
                          <FormField
                            control={form.control}
                            name="address.street"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Calle *</FormLabel>
                                <FormControl>
                                  <Input placeholder="Av. Principal" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={form.control}
                          name="address.number"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Número *</FormLabel>
                              <FormControl>
                                <Input placeholder="123" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="address.city"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Ciudad *</FormLabel>
                              <FormControl>
                                <Input placeholder="Asunción" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="address.postalCode"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Código postal *</FormLabel>
                              <FormControl>
                                <Input placeholder="1234" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Delivery Method */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Método de entrega</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <FormField
                        control={form.control}
                        name="deliveryMethod"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <RadioGroup
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                className="space-y-3"
                              >
                                <div className="flex items-center space-x-3 rounded-lg border p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                                  <RadioGroupItem value="pickup" id="pickup" />
                                  <label
                                    htmlFor="pickup"
                                    className="flex-1 cursor-pointer"
                                  >
                                    <div className="font-medium">
                                      Retiro en tienda
                                      <Badge variant="secondary" className="ml-2">
                                        Gratis
                                      </Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                      Retirá tu pedido en nuestro local
                                    </p>
                                  </label>
                                </div>

                                <div className="flex items-center space-x-3 rounded-lg border p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                                  <RadioGroupItem value="delivery" id="delivery" />
                                  <label
                                    htmlFor="delivery"
                                    className="flex-1 cursor-pointer"
                                  >
                                    <div className="font-medium">Envío a domicilio</div>
                                    <p className="text-sm text-muted-foreground">
                                      Te lo llevamos a tu dirección
                                    </p>
                                  </label>
                                </div>
                              </RadioGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>

                  {/* Additional Notes */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Notas adicionales (opcional)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <FormField
                        control={form.control}
                        name="notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Textarea
                                placeholder="Ej: Entregar por la tarde, dejar en portería..."
                                className="min-h-[100px]"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>

                  {/* Submit Button (Mobile) */}
                  <div className="lg:hidden">
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full h-12 text-lg"
                      size="lg"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <MessageCircle className="mr-2 h-5 w-5" />
                          Enviar pedido por WhatsApp
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </div>

            {/* Order Summary - Sticky on desktop */}
            <div className="lg:col-span-1">
              <div className="sticky top-20">
                <Card>
                  <CardHeader>
                    <CardTitle>Resumen del pedido</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Items */}
                    <div className="space-y-3">
                      {items.map((item) => (
                        <div key={item.variantId} className="flex gap-3 text-sm">
                          <span className="font-medium">{item.quantity}×</span>
                          <div className="flex-1">
                            <p className="line-clamp-1">
                              {typeof item.productParent !== 'string'
                                ? item.productParent.name
                                : 'Producto'}
                            </p>
                            {item.variant.displayName && (
                              <p className="text-xs text-muted-foreground">
                                {item.variant.displayName}
                              </p>
                            )}
                          </div>
                          <span className="font-semibold">
                            ${item.subtotal.toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>

                    <Separator />

                    {/* Totals */}
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span className="font-medium">
                          ${subtotal.toLocaleString()}
                        </span>
                      </div>

                      {totalDiscount > 0 && (
                        <div className="flex justify-between">
                          <span className="text-success">Descuentos</span>
                          <span className="font-medium text-success">
                            -${totalDiscount.toLocaleString()}
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Envío</span>
                        <span className="font-medium">
                          {deliveryMethod === 'pickup' ? (
                            <Badge variant="secondary" className="text-xs">
                              Gratis
                            </Badge>
                          ) : (
                            `$${shippingCost.toLocaleString()}`
                          )}
                        </span>
                      </div>
                    </div>

                    <Separator />

                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span className="text-primary">
                        ${finalTotal.toLocaleString()}
                      </span>
                    </div>

                    {/* Submit Button (Desktop) */}
                    <div className="hidden lg:block pt-2">
                      <Button
                        onClick={form.handleSubmit(onSubmit)}
                        disabled={isSubmitting}
                        className="w-full h-12"
                        size="lg"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            Enviando...
                          </>
                        ) : (
                          <>
                            <MessageCircle className="mr-2 h-5 w-5" />
                            Enviar por WhatsApp
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

// ============================================================================
// WHATSAPP MESSAGE GENERATOR
// ============================================================================

function generateWhatsAppMessage(
  orderNumber: string,
  data: CheckoutFormData,
  items: any[],
  totals: { subtotal: number; totalDiscount: number; total: number }
): string {
  const { subtotal, totalDiscount, total } = totals;

  let message = `¡Hola! Quiero realizar el siguiente pedido:\n\n`;

  // Order Number
  message += `📋 *Número de orden:* ${orderNumber}\n\n`;

  // Products
  message += `📦 *PRODUCTOS:*\n`;
  items.forEach((item) => {
    const productName =
      typeof item.productParent !== 'string' ? item.productParent.name : 'Producto';
    const variantName = item.variant.displayName || '';
    message += `• ${item.quantity}× ${productName}${variantName ? ` (${variantName})` : ''} - $${item.subtotal.toLocaleString()}\n`;
  });

  // Summary
  message += `\n💰 *RESUMEN:*\n`;
  message += `Subtotal: $${subtotal.toLocaleString()}\n`;
  if (totalDiscount > 0) {
    message += `Descuento: -$${totalDiscount.toLocaleString()}\n`;
  }
  message += `Envío: ${data.deliveryMethod === 'pickup' ? 'Gratis (Retiro en tienda)' : '$0'}\n`;
  message += `*TOTAL: $${total.toLocaleString()}*\n`;

  // Delivery Info
  message += `\n📍 *DATOS DE ENTREGA:*\n`;
  message += `Nombre: ${data.name}\n`;
  message += `WhatsApp: ${data.phone}\n`;
  if (data.email) {
    message += `Email: ${data.email}\n`;
  }
  if (data.deliveryMethod === 'delivery') {
    message += `Dirección: ${data.address.street} ${data.address.number}, ${data.address.city}\n`;
  } else {
    message += `Retiro en tienda\n`;
  }
  if (data.notes) {
    message += `\n📝 *Notas:* ${data.notes}\n`;
  }

  message += `\n¿Pueden confirmar disponibilidad?`;

  return message;
}

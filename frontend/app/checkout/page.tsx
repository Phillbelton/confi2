'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useCartStore } from '@/store/useCartStore';
import { useClientStore } from '@/store/useClientStore';
import { orderService } from '@/services/orders';
import { getSafeImageUrl } from '@/lib/image-utils';
import { ShoppingCart, Truck, MapPin, CreditCard, AlertCircle, Loader2, User, LogIn, UserPlus } from 'lucide-react';
import type { DeliveryMethod, PaymentMethod } from '@/types';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, total, subtotal, totalDiscount, clearCart } = useCartStore();
  const { isAuthenticated, user, _hasHydrated } = useClientStore();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [continueAsGuest, setContinueAsGuest] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    street: '',
    number: '',
    city: '',
    neighborhood: '',
    reference: '',
    deliveryMethod: 'pickup' as DeliveryMethod,
    paymentMethod: 'cash' as PaymentMethod,
    customerNotes: '',
  });

  // Pre-fill form if user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      setFormData((prev) => ({
        ...prev,
        name: user.name || prev.name,
        email: user.email || prev.email,
        phone: user.phone || prev.phone,
      }));
    }
  }, [isAuthenticated, user]);

  // Redirect if cart is empty
  useEffect(() => {
    if (items.length === 0) {
      router.push('/productos');
    }
  }, [items, router]);

  // Show auth gate if not authenticated and hasn't chosen to continue as guest
  const showAuthGate = _hasHydrated && !isAuthenticated && !continueAsGuest;

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      // Prepare customer data
      const customer = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address:
          formData.deliveryMethod === 'delivery'
            ? {
                street: formData.street,
                number: formData.number,
                city: formData.city,
                neighborhood: formData.neighborhood,
                reference: formData.reference,
              }
            : undefined,
      };

      // Prepare items
      const orderItems = items.map((item) => ({
        variantId: item.variantId,
        quantity: item.quantity,
      }));

      // Create order
      const response = await orderService.create({
        customer,
        items: orderItems,
        deliveryMethod: formData.deliveryMethod,
        paymentMethod: formData.paymentMethod,
        customerNotes: formData.customerNotes || undefined,
      });

      // Clear cart
      clearCart();

      // Redirect to WhatsApp
      if (response.whatsappURL) {
        window.location.href = response.whatsappURL;
      } else {
        // Fallback: redirect to order confirmation page
        router.push(`/pedido/${response.order.orderNumber}`);
      }
    } catch (err: any) {
      console.error('Error creating order:', err);
      setError(
        err.response?.data?.message ||
          'Error al crear el pedido. Por favor intenta nuevamente.'
      );
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return null; // Will redirect via useEffect
  }

  // Auth Gate Component
  if (showAuthGate) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container px-4 py-8 md:px-6">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-8">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <User className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-2xl font-bold mb-2">¿Cómo deseas continuar?</h1>
              <p className="text-muted-foreground">
                Inicia sesión para un checkout más rápido o continúa como invitado
              </p>
            </div>

            <div className="space-y-4">
              {/* Login Option */}
              <Card className="cursor-pointer hover:border-primary transition-colors">
                <CardContent className="p-6">
                  <Link href="/login?redirect=/checkout" className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                      <LogIn className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">Iniciar sesión</h3>
                      <p className="text-sm text-muted-foreground">
                        Accede a tu cuenta para checkout rápido
                      </p>
                    </div>
                  </Link>
                </CardContent>
              </Card>

              {/* Register Option */}
              <Card className="cursor-pointer hover:border-primary transition-colors">
                <CardContent className="p-6">
                  <Link href="/registro?redirect=/checkout" className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary/10">
                      <UserPlus className="h-6 w-6 text-secondary-foreground" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">Crear cuenta</h3>
                      <p className="text-sm text-muted-foreground">
                        Regístrate para guardar tus datos y ver historial
                      </p>
                    </div>
                  </Link>
                </CardContent>
              </Card>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    O
                  </span>
                </div>
              </div>

              {/* Guest Option */}
              <Button
                variant="outline"
                className="w-full h-14"
                onClick={() => setContinueAsGuest(true)}
              >
                <User className="mr-2 h-5 w-5" />
                Continuar como invitado
              </Button>
            </div>

            {/* Cart Summary */}
            <div className="mt-8 p-4 bg-muted/50 rounded-lg">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">
                  {items.length} {items.length === 1 ? 'producto' : 'productos'} en tu carrito
                </span>
                <span className="font-semibold">${total.toLocaleString()}</span>
              </div>
              <Link href="/productos" className="text-sm text-primary hover:underline">
                ← Seguir comprando
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container px-4 py-8 md:px-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Finalizar Compra</h1>
            <p className="text-muted-foreground">
              {isAuthenticated && user
                ? `Hola ${user.name.split(' ')[0]}, completa tu pedido`
                : 'Complete sus datos para continuar con su pedido'}
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid gap-8 lg:grid-cols-3">
              {/* Left Column - Forms */}
              <div className="lg:col-span-2 space-y-6">
                {/* Contact Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ShoppingCart className="h-5 w-5" />
                      Información de Contacto
                    </CardTitle>
                    <CardDescription>
                      Necesitamos estos datos para procesar su pedido
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="name">
                        Nombre completo <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        placeholder="Juan Pérez"
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <Label htmlFor="phone">
                          Teléfono <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="phone"
                          name="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={handleInputChange}
                          required
                          placeholder="0981234567"
                        />
                      </div>

                      <div>
                        <Label htmlFor="email">Email (opcional)</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="juan@ejemplo.com"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Delivery Method */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Truck className="h-5 w-5" />
                      Método de Entrega
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <RadioGroup
                      value={formData.deliveryMethod}
                      onValueChange={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          deliveryMethod: value as DeliveryMethod,
                        }))
                      }
                    >
                      <div className="flex items-center space-x-2 border rounded-lg p-4">
                        <RadioGroupItem value="pickup" id="pickup" />
                        <Label htmlFor="pickup" className="flex-1 cursor-pointer">
                          <div className="font-medium">Retiro en local</div>
                          <div className="text-sm text-muted-foreground">
                            Sin costo adicional
                          </div>
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2 border rounded-lg p-4">
                        <RadioGroupItem value="delivery" id="delivery" />
                        <Label htmlFor="delivery" className="flex-1 cursor-pointer">
                          <div className="font-medium">Delivery a domicilio</div>
                          <div className="text-sm text-muted-foreground">
                            Costo a coordinar
                          </div>
                        </Label>
                      </div>
                    </RadioGroup>
                  </CardContent>
                </Card>

                {/* Delivery Address (only if delivery selected) */}
                {formData.deliveryMethod === 'delivery' && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MapPin className="h-5 w-5" />
                        Dirección de Entrega
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <Label htmlFor="street">
                            Calle <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            id="street"
                            name="street"
                            value={formData.street}
                            onChange={handleInputChange}
                            required={formData.deliveryMethod === 'delivery'}
                            placeholder="Av. Principal"
                          />
                        </div>

                        <div>
                          <Label htmlFor="number">
                            Número <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            id="number"
                            name="number"
                            value={formData.number}
                            onChange={handleInputChange}
                            required={formData.deliveryMethod === 'delivery'}
                            placeholder="1234"
                          />
                        </div>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <Label htmlFor="city">
                            Ciudad <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            id="city"
                            name="city"
                            value={formData.city}
                            onChange={handleInputChange}
                            required={formData.deliveryMethod === 'delivery'}
                            placeholder="Asunción"
                          />
                        </div>

                        <div>
                          <Label htmlFor="neighborhood">Barrio (opcional)</Label>
                          <Input
                            id="neighborhood"
                            name="neighborhood"
                            value={formData.neighborhood}
                            onChange={handleInputChange}
                            placeholder="Centro"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="reference">Referencia (opcional)</Label>
                        <Input
                          id="reference"
                          name="reference"
                          value={formData.reference}
                          onChange={handleInputChange}
                          placeholder="Casa blanca con portón negro"
                        />
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Payment Method */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Método de Pago
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <RadioGroup
                      value={formData.paymentMethod}
                      onValueChange={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          paymentMethod: value as PaymentMethod,
                        }))
                      }
                    >
                      <div className="flex items-center space-x-2 border rounded-lg p-4">
                        <RadioGroupItem value="cash" id="cash" />
                        <Label htmlFor="cash" className="flex-1 cursor-pointer">
                          <div className="font-medium">Efectivo</div>
                          <div className="text-sm text-muted-foreground">
                            Pago al recibir el pedido
                          </div>
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2 border rounded-lg p-4">
                        <RadioGroupItem value="transfer" id="transfer" />
                        <Label htmlFor="transfer" className="flex-1 cursor-pointer">
                          <div className="font-medium">Transferencia</div>
                          <div className="text-sm text-muted-foreground">
                            Te enviaremos los datos por WhatsApp
                          </div>
                        </Label>
                      </div>
                    </RadioGroup>
                  </CardContent>
                </Card>

                {/* Additional Notes */}
                <Card>
                  <CardHeader>
                    <CardTitle>Notas adicionales (opcional)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      name="customerNotes"
                      value={formData.customerNotes}
                      onChange={handleInputChange}
                      placeholder="Instrucciones especiales, preferencias de horario, etc."
                      rows={4}
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - Order Summary */}
              <div className="lg:col-span-1">
                <Card className="sticky top-4">
                  <CardHeader>
                    <CardTitle>Resumen del Pedido</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Items */}
                    <div className="space-y-3">
                      {items.map((item) => {
                        const product = item.productParent;
                        const variant = item.variant;
                        const rawImage =
                          variant.images?.[0] ||
                          (typeof product !== 'string' ? product.images?.[0] : null);
                        // ✅ OPTIMIZACIÓN: Thumbnail muy pequeño en checkout (80x80px)
                        const image = getSafeImageUrl(rawImage, { width: 80, height: 80, quality: 'auto' });

                        return (
                          <div key={item.variantId} className="flex gap-3">
                            <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border">
                              <Image
                                src={image}
                                alt={typeof product !== 'string' ? product.name : 'Producto'}
                                fill
                                className="object-cover"
                                sizes="64px"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium line-clamp-1">
                                {typeof product !== 'string' ? product.name : 'Producto'}
                              </p>
                              {typeof product !== 'string' && product.hasVariants && (
                                <p className="text-xs text-muted-foreground line-clamp-1">
                                  {variant.displayName}
                                </p>
                              )}
                              <div className="flex items-center justify-between mt-1">
                                <span className="text-xs text-muted-foreground">
                                  Cant: {item.quantity}
                                </span>
                                <span className="text-sm font-semibold">
                                  ${(item.unitPrice - item.discount).toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <Separator />

                    {/* Totals */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>${subtotal.toLocaleString()}</span>
                      </div>
                      {totalDiscount > 0 && (
                        <div className="flex justify-between text-sm text-success">
                          <span>Descuento</span>
                          <span>-${totalDiscount.toLocaleString()}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Envío</span>
                        <span>
                          {formData.deliveryMethod === 'pickup'
                            ? 'Gratis'
                            : 'A coordinar'}
                        </span>
                      </div>
                      <Separator />
                      <div className="flex justify-between text-lg font-bold">
                        <span>Total</span>
                        <span>${total.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                      <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-md text-sm">
                        <AlertCircle className="h-4 w-4 flex-shrink-0" />
                        <span>{error}</span>
                      </div>
                    )}

                    {/* Submit Button */}
                    <Button
                      type="submit"
                      className="w-full"
                      size="lg"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Procesando...
                        </>
                      ) : (
                        'Confirmar Pedido'
                      )}
                    </Button>

                    <p className="text-xs text-center text-muted-foreground">
                      Al confirmar, serás redirigido a WhatsApp para finalizar tu pedido
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}

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
import { ShoppingCart, Truck, MapPin, CreditCard, AlertCircle, Loader2, User, LogIn, UserPlus, Info } from 'lucide-react';
import type { DeliveryMethod, PaymentMethod } from '@/types';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, total, subtotal, totalDiscount, clearCart } = useCartStore();
  const { isAuthenticated, user, _hasHydrated } = useClientStore();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [error, setError] = useState('');
  const [continueAsGuest, setContinueAsGuest] = useState(false);
  const [phoneRegistered, setPhoneRegistered] = useState(false);
  const [checkingPhone, setCheckingPhone] = useState(false);

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
      // Quitar el prefijo +56 del teléfono si viene del usuario
      let phone = user.phone || '';
      if (phone.startsWith('+56')) {
        phone = phone.slice(3);
      }
      setFormData((prev) => ({
        ...prev,
        name: user.name || prev.name,
        email: user.email || prev.email,
        phone: phone || prev.phone,
      }));
    }
  }, [isAuthenticated, user]);

  // Redirect if cart is empty — pero NO después de colocar la orden
  // (al confirmar, vaciamos el carrito y redirigimos a la orden: este effect
  // no debe interferir con ese flujo).
  useEffect(() => {
    if (items.length === 0 && !orderPlaced && !isSubmitting) {
      router.push('/productos');
    }
  }, [items, router, orderPlaced, isSubmitting]);

  // Show auth gate if not authenticated and hasn't chosen to continue as guest
  const showAuthGate = _hasHydrated && !isAuthenticated && !continueAsGuest;

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Verificar si el teléfono ya está registrado (solo para invitados)
  const handlePhoneBlur = async () => {
    if (isAuthenticated) return; // No verificar si ya está logueado

    const phoneClean = formData.phone.replace(/\s/g, '');
    if (phoneClean.length < 9) {
      setPhoneRegistered(false);
      return;
    }

    setCheckingPhone(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const res = await fetch(`${API_URL}/auth/check-phone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneClean }),
      });
      const data = await res.json();
      setPhoneRegistered(data.data?.exists === true);
    } catch {
      // Silenciar error — no bloquear checkout
      setPhoneRegistered(false);
    } finally {
      setCheckingPhone(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      // Prepare customer data
      const phoneClean = formData.phone.replace(/\s/g, '');
      const customer = {
        name: formData.name,
        email: formData.email.trim() || undefined,
        phone: `+56${phoneClean}`,
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

      // Marcar que se colocó la orden ANTES de vaciar el carrito, para que
      // el useEffect de "carrito vacío → /productos" no interfiera con el
      // redirect a la vista de detalle del pedido.
      setOrderPlaced(true);

      // Clear cart
      clearCart();

      // Redirect to order detail view
      const orderNumber = response.order.orderNumber;

      if (isAuthenticated) {
        // Registered users: go to their authenticated order detail
        router.push(`/mis-ordenes/${orderNumber}`);
      } else {
        // Guest: persist order snapshot in sessionStorage so the confirmation
        // page can render it without hitting the API.
        try {
          sessionStorage.setItem(
            'confi2:last-order',
            JSON.stringify({
              orderNumber,
              createdAt: new Date().toISOString(),
              order: response.order,
              whatsappURL: response.whatsappURL,
            })
          );
        } catch {
          // sessionStorage puede fallar (modo privado, quota). No bloquea el flujo.
        }
        router.push(`/pedido/${orderNumber}`);
      }
    } catch (err: any) {
      console.error('Error creating order:', err?.response?.data || err?.message || err);
      const message =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        (typeof err === 'string' ? err : 'Error al crear el pedido. Por favor intenta nuevamente.');
      setError(message);
      setIsSubmitting(false);
    }
  };

  if (items.length === 0 && !orderPlaced && !isSubmitting) {
    return null; // Will redirect via useEffect
  }

  // Auth Gate Component
  if (showAuthGate) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 theme-catalog bg-background">
          <div className="container px-4 py-8 md:px-6">
            <div className="max-w-md mx-auto">
              <div className="text-center mb-8">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <User className="h-8 w-8 text-primary" />
                </div>
                <h1 className="font-display text-2xl font-bold text-foreground mb-2">¿Cómo deseas continuar?</h1>
                <p className="text-muted-foreground">
                  Inicia sesión para un checkout más rápido o continúa como invitado
                </p>
              </div>

              <div className="space-y-4">
                {/* Login Option */}
                <Card className="cursor-pointer border-border hover:border-primary transition-colors">
                  <CardContent className="p-6">
                    <Link href="/login?redirect=/checkout" className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                        <LogIn className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-display font-semibold text-foreground">Iniciar sesión</h3>
                        <p className="text-sm text-muted-foreground">
                          Accede a tu cuenta para checkout rápido
                        </p>
                      </div>
                    </Link>
                  </CardContent>
                </Card>

                {/* Register Option */}
                <Card className="cursor-pointer border-border hover:border-primary transition-colors">
                  <CardContent className="p-6">
                    <Link href="/registro?redirect=/checkout" className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                        <UserPlus className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-display font-semibold text-foreground">Crear cuenta</h3>
                        <p className="text-sm text-muted-foreground">
                          Regístrate para guardar tus datos y ver historial
                        </p>
                      </div>
                    </Link>
                  </CardContent>
                </Card>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
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
                  className="w-full h-14 border-border text-foreground hover:bg-muted"
                  onClick={() => setContinueAsGuest(true)}
                >
                  <User className="mr-2 h-5 w-5" />
                  Continuar como invitado
                </Button>
              </div>

              {/* Cart Summary */}
              <div className="mt-8 p-4 bg-muted rounded-lg border border-border">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">
                    {items.length} {items.length === 1 ? 'producto' : 'productos'} en tu carrito
                  </span>
                  <span className="font-sans font-semibold text-foreground" suppressHydrationWarning>${total.toLocaleString('es-CL')}</span>
                </div>
                <Link href="/productos" className="text-sm text-primary hover:underline">
                  ← Seguir comprando
                </Link>
              </div>
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

      <main className="flex-1 theme-catalog bg-background">
        <div className="container px-4 py-6 md:py-8 pb-28 lg:pb-8">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-6 md:mb-8">
              <h1 className="font-display text-xl md:text-3xl font-bold text-foreground mb-1">Finalizar Compra</h1>
              <p className="text-muted-foreground">
                {isAuthenticated && user
                  ? `Hola ${user.name.split(' ')[0]}, completa tu pedido`
                  : 'Complete sus datos para continuar con su pedido'}
              </p>
            </div>

            <form id="checkout-form" onSubmit={handleSubmit}>
              <div className="grid gap-8 lg:grid-cols-3">
                {/* Left Column - Forms */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Contact Information */}
                  <Card className="border-border shadow-sm">
                    <CardHeader>
                      <CardTitle className="font-display flex items-center gap-2 text-foreground">
                        <ShoppingCart className="h-5 w-5 text-primary" />
                        Información de Contacto
                      </CardTitle>
                      <CardDescription>
                        Necesitamos estos datos para procesar su pedido
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="name" className="text-foreground">
                          Nombre completo <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          required
                          placeholder="Juan Pérez"
                          className="h-12 text-base border-border bg-card"
                        />
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <Label htmlFor="phone" className="text-foreground">
                            Teléfono <span className="text-destructive">*</span>
                          </Label>
                          <div className="flex">
                            <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-border bg-muted text-muted-foreground text-base h-12">
                              +56
                            </span>
                            <Input
                              id="phone"
                              name="phone"
                              type="tel"
                              inputMode="numeric"
                              value={formData.phone}
                              onChange={(e) => {
                                const value = e.target.value.replace(/[^\d\s]/g, '').slice(0, 11);
                                setFormData((prev) => ({ ...prev, phone: value }));
                                setPhoneRegistered(false);
                              }}
                              onBlur={handlePhoneBlur}
                              required
                              placeholder="9 1234 5678"
                              maxLength={11}
                              className="rounded-l-none h-12 text-base border-border bg-card"
                            />
                          </div>

                          {/* Aviso: teléfono ya registrado */}
                          {!isAuthenticated && phoneRegistered && (
                            <div className="mt-2 flex items-start gap-2 p-3 bg-primary/5 border border-primary/20 rounded-md text-sm">
                              <Info className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                              <div className="flex-1">
                                <p className="text-foreground">
                                  Ya tenés una cuenta con este número. Iniciá sesión para ver tu historial de pedidos.
                                </p>
                                <div className="flex gap-2 mt-2">
                                  <Link
                                    href="/login?redirect=/checkout"
                                    className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded bg-primary text-white hover:bg-primary/90 transition-colors"
                                  >
                                    <LogIn className="h-3 w-3" />
                                    Iniciar sesión
                                  </Link>
                                  <button
                                    type="button"
                                    onClick={() => setPhoneRegistered(false)}
                                    className="text-xs text-primary hover:underline"
                                  >
                                    Continuar como invitado
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        <div>
                          <Label htmlFor="email" className="text-foreground">
                            Email <span className="text-muted-foreground text-sm">(opcional)</span>
                          </Label>
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            placeholder="chester@gmail.com"
                            className="h-12 text-base border-border bg-card"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Delivery Method */}
                  <Card className="border-border shadow-sm">
                    <CardHeader>
                      <CardTitle className="font-display flex items-center gap-2 text-foreground">
                        <Truck className="h-5 w-5 text-primary" />
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
                        <div className="flex items-center space-x-2 border border-border rounded-lg p-4 min-h-[56px] hover:bg-muted/50 transition-colors">
                          <RadioGroupItem value="pickup" id="pickup" />
                          <Label htmlFor="pickup" className="flex-1 cursor-pointer">
                            <div className="font-medium text-foreground">Retiro en local</div>
                            <div className="text-sm text-muted-foreground">
                              Sin costo adicional
                            </div>
                          </Label>
                        </div>

                        <div className="flex items-center space-x-2 border border-border rounded-lg p-4 min-h-[56px] hover:bg-muted/50 transition-colors">
                          <RadioGroupItem value="delivery" id="delivery" />
                          <Label htmlFor="delivery" className="flex-1 cursor-pointer">
                            <div className="font-medium text-foreground">Delivery a domicilio</div>
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
                    <Card className="border-border shadow-sm">
                      <CardHeader>
                        <CardTitle className="font-display flex items-center gap-2 text-foreground">
                          <MapPin className="h-5 w-5 text-primary" />
                          Dirección de Entrega
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div>
                            <Label htmlFor="street" className="text-foreground">
                              Calle <span className="text-destructive">*</span>
                            </Label>
                            <Input
                              id="street"
                              name="street"
                              value={formData.street}
                              onChange={handleInputChange}
                              required={formData.deliveryMethod === 'delivery'}
                              placeholder="Av. Principal"
                              className="h-12 text-base border-border bg-card"
                            />
                          </div>

                          <div>
                            <Label htmlFor="number" className="text-foreground">
                              Número <span className="text-destructive">*</span>
                            </Label>
                            <Input
                              id="number"
                              name="number"
                              value={formData.number}
                              onChange={handleInputChange}
                              required={formData.deliveryMethod === 'delivery'}
                              placeholder="1234"
                              className="h-12 text-base border-border bg-card"
                            />
                          </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                          <div>
                            <Label htmlFor="city" className="text-foreground">
                              Ciudad <span className="text-destructive">*</span>
                            </Label>
                            <Input
                              id="city"
                              name="city"
                              value={formData.city}
                              onChange={handleInputChange}
                              required={formData.deliveryMethod === 'delivery'}
                              placeholder="Santiago"
                              className="h-12 text-base border-border bg-card"
                            />
                          </div>

                          <div>
                            <Label htmlFor="neighborhood" className="text-foreground">Barrio (opcional)</Label>
                            <Input
                              id="neighborhood"
                              name="neighborhood"
                              value={formData.neighborhood}
                              onChange={handleInputChange}
                              placeholder="Centro"
                              className="h-12 text-base border-border bg-card"
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="reference" className="text-foreground">Referencia (opcional)</Label>
                          <Input
                            id="reference"
                            name="reference"
                            value={formData.reference}
                            onChange={handleInputChange}
                            placeholder="Casa blanca con portón negro"
                            className="h-12 text-base border-border bg-card"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Payment Method */}
                  <Card className="border-border shadow-sm">
                    <CardHeader>
                      <CardTitle className="font-display flex items-center gap-2 text-foreground">
                        <CreditCard className="h-5 w-5 text-primary" />
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
                        <div className="flex items-center space-x-2 border border-border rounded-lg p-4 min-h-[56px] hover:bg-muted/50 transition-colors">
                          <RadioGroupItem value="cash" id="cash" />
                          <Label htmlFor="cash" className="flex-1 cursor-pointer">
                            <div className="font-medium text-foreground">Efectivo</div>
                            <div className="text-sm text-muted-foreground">
                              Pago al recibir el pedido
                            </div>
                          </Label>
                        </div>

                        <div className="flex items-center space-x-2 border border-border rounded-lg p-4 min-h-[56px] hover:bg-muted/50 transition-colors">
                          <RadioGroupItem value="transfer" id="transfer" />
                          <Label htmlFor="transfer" className="flex-1 cursor-pointer">
                            <div className="font-medium text-foreground">Transferencia</div>
                            <div className="text-sm text-muted-foreground">
                              Te enviaremos los datos por WhatsApp
                            </div>
                          </Label>
                        </div>
                      </RadioGroup>
                    </CardContent>
                  </Card>

                  {/* Additional Notes */}
                  <Card className="border-border shadow-sm">
                    <CardHeader>
                      <CardTitle className="font-display text-foreground">Notas adicionales (opcional)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Textarea
                        name="customerNotes"
                        value={formData.customerNotes}
                        onChange={handleInputChange}
                        placeholder="Instrucciones especiales, preferencias de horario, etc."
                        rows={4}
                        className="h-12 text-base border-border bg-card"
                      />
                    </CardContent>
                  </Card>
                </div>

                {/* Right Column - Order Summary */}
                <div className="lg:col-span-1">
                  <Card className="sticky top-4 border-border shadow-sm">
                    <CardHeader>
                      <CardTitle className="font-display text-foreground">Resumen del Pedido</CardTitle>
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
                          const image = getSafeImageUrl(rawImage, { width: 80, height: 80, quality: 'auto' });

                          return (
                            <div key={item.variantId} className="flex gap-3">
                              <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border border-border bg-white">
                                <Image
                                  src={image}
                                  alt={typeof product !== 'string' ? product.name : 'Producto'}
                                  fill
                                  className="object-contain p-1"
                                  sizes="64px"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground line-clamp-1">
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
                                  <span className="font-sans text-sm font-semibold text-foreground" suppressHydrationWarning>
                                    ${(item.unitPrice - item.discount).toLocaleString('es-CL')}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <Separator className="bg-border" />

                      {/* Totals */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Subtotal</span>
                          <span className="font-sans text-foreground" suppressHydrationWarning>${subtotal.toLocaleString('es-CL')}</span>
                        </div>
                        {totalDiscount > 0 && (
                          <div className="flex justify-between text-sm text-emerald-600">
                            <span>Descuento</span>
                            <span className="font-sans" suppressHydrationWarning>-${totalDiscount.toLocaleString('es-CL')}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Envío</span>
                          <span className="text-foreground">
                            {formData.deliveryMethod === 'pickup'
                              ? 'Gratis'
                              : 'A coordinar'}
                          </span>
                        </div>
                        <Separator className="bg-border" />
                        <div className="flex justify-between text-lg font-bold">
                          <span className="text-foreground">Total</span>
                          <span className="font-sans text-primary" suppressHydrationWarning>${total.toLocaleString('es-CL')}</span>
                        </div>
                      </div>

                      {/* Error Message */}
                      {error && (
                        <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-md text-sm">
                          <AlertCircle className="h-4 w-4 flex-shrink-0" />
                          <span>{error}</span>
                        </div>
                      )}

                      {/* Submit Button — desktop */}
                      <div className="hidden lg:block space-y-3">
                        <Button
                          type="submit"
                          className="w-full h-12 font-display font-bold bg-primary hover:bg-primary/90 text-white"
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
                          {isAuthenticated
                            ? 'Al confirmar, te llevaremos al detalle de tu pedido'
                            : 'Al confirmar, recibirás los datos de tu pedido y nos contactaremos contigo por WhatsApp'}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </form>
          </div>
        </div>
      </main>

      {/* Mobile Sticky CTA Bar */}
      <div className="fixed bottom-0 inset-x-0 z-50 lg:hidden bg-card border-t border-border shadow-[0_-2px_10px_rgba(0,0,0,0.08)] px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="flex items-center gap-3">
          <div className="flex flex-col min-w-0">
            <span className="text-xs text-muted-foreground">{items.length} {items.length === 1 ? 'producto' : 'productos'}</span>
            <span className="font-sans text-lg font-bold text-primary leading-tight" suppressHydrationWarning>
              ${total.toLocaleString('es-CL')}
            </span>
          </div>

          <Button
            type="submit"
            form="checkout-form"
            className="flex-1 h-12 font-display font-bold text-sm bg-primary hover:bg-primary/90 text-white rounded-lg transition-all active:scale-[0.98]"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                Procesando...
              </>
            ) : (
              'Confirmar Pedido'
            )}
          </Button>
        </div>
      </div>

      <Footer />
    </div>
  );
}

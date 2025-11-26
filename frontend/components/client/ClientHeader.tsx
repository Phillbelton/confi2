'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ShoppingCart, Menu, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useCartStore } from '@/store/useCartStore';
import { useClientStore } from '@/store/useClientStore';
import { CartSheet } from '@/components/cart/CartSheet';
import { ClientMobileNav } from './ClientMobileNav';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface ClientHeaderProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  className?: string;
}

export function ClientHeader({
  title,
  showBack = false,
  onBack,
  className,
}: ClientHeaderProps) {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const itemCount = useCartStore((state) => state.itemCount);
  const { user, isAuthenticated } = useClientStore();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <>
      <header
        className={cn(
          'sticky top-0 z-50 h-14 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b',
          className
        )}
      >
        <div className="container h-full flex items-center justify-between px-4">
          {/* Izquierda: Volver o Menú */}
          <div className="flex items-center gap-2 min-w-[80px]">
            {showBack ? (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBack}
                className="h-10 w-10 -ml-2"
                aria-label="Volver"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
            ) : (
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild className="lg:hidden">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 -ml-2"
                    aria-label="Menú"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[300px] p-0">
                  <ClientMobileNav onClose={() => setMobileMenuOpen(false)} />
                </SheetContent>
              </Sheet>
            )}
          </div>

          {/* Centro: Logo o Título */}
          <div className="flex-1 text-center">
            {title ? (
              <h1 className="text-base font-semibold truncate px-2">{title}</h1>
            ) : (
              <Link href="/" className="inline-flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
                  Q
                </div>
                <span className="hidden sm:inline font-semibold">
                  <span className="text-primary">Quelita</span>
                </span>
              </Link>
            )}
          </div>

          {/* Derecha: Acciones */}
          <div className="flex items-center gap-1 min-w-[80px] justify-end">
            {/* Usuario (solo desktop, si está autenticado) */}
            {isAuthenticated && (
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 hidden lg:flex"
                asChild
              >
                <Link href="/perfil" aria-label="Mi perfil">
                  <User className="h-5 w-5" />
                </Link>
              </Button>
            )}

            {/* Carrito */}
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 relative"
              onClick={() => setCartOpen(true)}
              aria-label="Ver carrito"
            >
              <ShoppingCart className="h-5 w-5" />
              {itemCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -right-1 -top-1 h-5 min-w-5 px-1 text-xs flex items-center justify-center"
                >
                  {itemCount > 99 ? '99+' : itemCount}
                </Badge>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Cart Sheet */}
      <CartSheet open={cartOpen} onOpenChange={setCartOpen} />
    </>
  );
}

export default ClientHeader;

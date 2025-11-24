'use client';

import Link from 'next/link';
import { ShoppingCart, Search, Menu, User, Package, MapPin, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { useCartStore } from '@/store/useCartStore';
import { useClientStore } from '@/store/useClientStore';
import { useClientLogout } from '@/hooks/client/useClientAuth';
import { CartSheet } from '@/components/cart/CartSheet';
import { UserDropdown } from './UserDropdown';
import { SearchDialog } from './SearchDialog';
import { useState } from 'react';

const navigation = [
  { name: 'Inicio', href: '/' },
  { name: 'Productos', href: '/productos' },
  { name: 'Ofertas', href: '/ofertas' },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const itemCount = useCartStore((state) => state.itemCount);
  const { isAuthenticated, user, _hasHydrated } = useClientStore();
  const logoutMutation = useClientLogout();

  const handleLogout = () => {
    setMobileMenuOpen(false);
    logoutMutation.mutate();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-xl">
            Q
          </div>
          <span className="hidden font-bold sm:inline-block text-xl">
            Confitería <span className="text-primary">Quelita</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex md:gap-6">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              {item.name}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Search Button */}
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 touch-target"
            aria-label="Buscar productos"
            onClick={() => setSearchOpen(true)}
          >
            <Search className="h-5 w-5" />
          </Button>

          {/* Cart Button */}
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 touch-target relative"
            aria-label="Ver carrito"
            onClick={() => setCartOpen(true)}
          >
            <ShoppingCart className="h-5 w-5" />
            {itemCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -right-1 -top-1 h-5 min-w-5 px-1 text-xs flex items-center justify-center pulse-badge"
              >
                {itemCount > 99 ? '99+' : itemCount}
              </Badge>
            )}
          </Button>

          {/* Auth: Desktop */}
          <div className="hidden md:block">
            {_hasHydrated && isAuthenticated && user ? (
              <UserDropdown user={user} />
            ) : _hasHydrated ? (
              <Button variant="outline" size="sm" asChild>
                <Link href="/login">Iniciar sesión</Link>
              </Button>
            ) : null}
          </div>

          {/* Mobile Menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 touch-target"
                aria-label="Menú"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[350px]">
              <SheetHeader>
                <SheetTitle className="text-left">Menú</SheetTitle>
              </SheetHeader>

              {/* User info (if authenticated) */}
              {_hasHydrated && isAuthenticated && user && (
                <div className="mt-6 p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{user.name}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {user.email}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Links */}
              <nav className="flex flex-col gap-1 mt-6">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-3 text-base font-medium transition-colors hover:bg-muted rounded-lg"
                  >
                    {item.name}
                  </Link>
                ))}
              </nav>

              <Separator className="my-4" />

              {/* Auth Links */}
              {_hasHydrated && isAuthenticated && user ? (
                <nav className="flex flex-col gap-1">
                  <Link
                    href="/perfil"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-3 text-base font-medium transition-colors hover:bg-muted rounded-lg"
                  >
                    <User className="h-5 w-5" />
                    Mi perfil
                  </Link>
                  <Link
                    href="/mis-ordenes"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-3 text-base font-medium transition-colors hover:bg-muted rounded-lg"
                  >
                    <Package className="h-5 w-5" />
                    Mis pedidos
                  </Link>
                  <Link
                    href="/direcciones"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-3 text-base font-medium transition-colors hover:bg-muted rounded-lg"
                  >
                    <MapPin className="h-5 w-5" />
                    Mis direcciones
                  </Link>

                  <Separator className="my-4" />

                  <button
                    onClick={handleLogout}
                    disabled={logoutMutation.isPending}
                    className="flex items-center gap-3 px-3 py-3 text-base font-medium text-destructive transition-colors hover:bg-destructive/10 rounded-lg w-full text-left"
                  >
                    <LogOut className="h-5 w-5" />
                    {logoutMutation.isPending ? 'Cerrando...' : 'Cerrar sesión'}
                  </button>
                </nav>
              ) : _hasHydrated ? (
                <div className="flex flex-col gap-3 px-3">
                  <Button asChild className="w-full">
                    <Link
                      href="/login"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Iniciar sesión
                    </Link>
                  </Button>
                  <Button variant="outline" asChild className="w-full">
                    <Link
                      href="/registro"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Crear cuenta
                    </Link>
                  </Button>
                </div>
              ) : null}
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Cart Sheet */}
      <CartSheet open={cartOpen} onOpenChange={setCartOpen} />

      {/* Search Dialog */}
      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </header>
  );
}

'use client';

import Link from 'next/link';
import { ShoppingCart, Search, User, Package, MapPin, LogOut, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useCartStore } from '@/store/useCartStore';
import { useClientStore } from '@/store/useClientStore';
import { useClientLogout } from '@/hooks/client/useClientAuth';
import { CartSheet } from '@/components/cart/CartSheet';
import { UserDropdown } from './UserDropdown';
import { CategoriesDropdown } from './CategoriesDropdown';
import { Logo } from './Logo';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

export function Header() {
  const router = useRouter();
  const [cartOpen, setCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileSearchExpanded, setMobileSearchExpanded] = useState(false);
  const itemCount = useCartStore((state) => state.itemCount);
  const { isAuthenticated, user, _hasHydrated } = useClientStore();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/productos?search=${encodeURIComponent(searchQuery.trim())}`);
      setMobileSearchExpanded(false); // Colapsar después de buscar
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  const toggleMobileSearch = () => {
    setMobileSearchExpanded(!mobileSearchExpanded);
  };

  // Cerrar búsqueda mobile al hacer scroll
  useEffect(() => {
    const handleScroll = () => {
      if (mobileSearchExpanded && window.scrollY > 50) {
        setMobileSearchExpanded(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [mobileSearchExpanded]);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container mx-auto px-4">
        {/* DESKTOP LAYOUT (lg+) */}
        <div className="hidden lg:flex h-16 items-center gap-4 lg:gap-6">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Logo variant="full" size="default" />
          </div>

          {/* Categories Dropdown */}
          <div className="flex-shrink-0">
            <CategoriesDropdown />
          </div>

          {/* Search Bar - Center, Flexible Width */}
          <form
            onSubmit={handleSearch}
            className="flex flex-1 max-w-2xl relative"
          >
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                type="text"
                placeholder="Buscar producto..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={cn(
                  "w-full pl-10 pr-10 h-11 bg-muted/50 border-border/50",
                  "focus-visible:ring-primary/20 focus-visible:border-primary",
                  "placeholder:text-muted-foreground/60"
                )}
              />
              <AnimatePresence>
                {searchQuery && (
                  <motion.button
                    type="button"
                    onClick={clearSearch}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </form>

          {/* Desktop: User Dropdown or Login */}
          <div className="flex items-center gap-2">
            {_hasHydrated && isAuthenticated && user ? (
              <UserDropdown user={user} />
            ) : _hasHydrated ? (
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="h-11 px-4"
              >
                <Link href="/login" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <div className="flex flex-col items-start leading-none">
                    <span className="text-xs text-muted-foreground">¡Hola! Inicia sesión</span>
                    <span className="font-semibold text-sm">Mi cuenta</span>
                  </div>
                </Link>
              </Button>
            ) : null}
          </div>

          {/* Cart Button */}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="ghost"
              size="icon"
              className="h-11 w-11 relative"
              aria-label="Ver carrito"
              onClick={() => setCartOpen(true)}
            >
              <div className="flex flex-col items-center justify-center">
                <motion.div
                  animate={itemCount > 0 ? { rotate: [0, -10, 10, -10, 0] } : {}}
                  transition={{ duration: 0.5 }}
                >
                  <ShoppingCart className="h-5 w-5" />
                </motion.div>
                <span className="text-[10px] font-medium mt-0.5">Carrito</span>
              </div>
              <AnimatePresence>
                {itemCount > 0 && (
                  <motion.div
                    className="absolute top-0 right-0"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{
                      scale: 1,
                      opacity: 1,
                      y: [0, -4, 0],
                    }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{
                      type: 'spring',
                      stiffness: 500,
                      damping: 15,
                      y: {
                        duration: 0.4,
                        repeat: 1,
                        ease: 'easeOut',
                      }
                    }}
                  >
                    <Badge
                      variant="destructive"
                      className="h-5 min-w-5 px-1 text-xs flex items-center justify-center"
                    >
                      <AnimatePresence mode="wait">
                        <motion.span
                          key={itemCount}
                          initial={{ y: -10, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          exit={{ y: 10, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          {itemCount > 99 ? '99+' : itemCount}
                        </motion.span>
                      </AnimatePresence>
                    </Badge>
                  </motion.div>
                )}
              </AnimatePresence>
            </Button>
          </motion.div>
        </div>

        {/* MOBILE LAYOUT (< lg) */}
        <div className="lg:hidden">
          {/* Primera línea: Logo / Categorías / Búsqueda (icono) / Carrito / Perfil */}
          <div className="flex h-14 items-center gap-2">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Logo variant="icon" size="sm" />
            </div>

            {/* Categories Dropdown */}
            <div className="flex-shrink-0">
              <CategoriesDropdown />
            </div>

            {/* Search Icon Button - Solo visible cuando NO está expandido */}
            {!mobileSearchExpanded && (
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleMobileSearch}
                className="h-10 w-10 flex-shrink-0"
                aria-label="Buscar"
              >
                <Search className="h-5 w-5" />
              </Button>
            )}

            {/* Spacer para empujar cart y perfil a la derecha */}
            <div className="flex-1" />

            {/* Cart Button */}
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 relative flex-shrink-0"
                aria-label="Ver carrito"
                onClick={() => setCartOpen(true)}
              >
                <ShoppingCart className="h-5 w-5" />
                <AnimatePresence>
                  {itemCount > 0 && (
                    <motion.div
                      className="absolute -top-1 -right-1"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{
                        scale: 1,
                        opacity: 1,
                        y: [0, -4, 0],
                      }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{
                        type: 'spring',
                        stiffness: 500,
                        damping: 15,
                        y: {
                          duration: 0.4,
                          repeat: 1,
                          ease: 'easeOut',
                        }
                      }}
                    >
                      <Badge
                        variant="destructive"
                        className="h-5 min-w-5 px-1 text-xs flex items-center justify-center"
                      >
                        <AnimatePresence mode="wait">
                          <motion.span
                            key={itemCount}
                            initial={{ y: -10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 10, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            {itemCount > 99 ? '99+' : itemCount}
                          </motion.span>
                        </AnimatePresence>
                      </Badge>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Button>
            </motion.div>

            {/* User Icon */}
            <div className="flex-shrink-0">
              {_hasHydrated && isAuthenticated && user ? (
                <UserDropdown user={user} />
              ) : _hasHydrated ? (
                <Button variant="ghost" size="icon" asChild className="h-10 w-10">
                  <Link href="/login">
                    <User className="h-5 w-5" />
                  </Link>
                </Button>
              ) : null}
            </div>
          </div>

          {/* Segunda línea: Barra de búsqueda expandida (animada) */}
          <AnimatePresence>
            {mobileSearchExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="pb-3 pt-1">
                  <form onSubmit={handleSearch} className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                      type="text"
                      placeholder="Buscar producto..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      autoFocus
                      className="w-full pl-10 pr-20 h-10 bg-muted/50 border-border/50"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      <AnimatePresence>
                        {searchQuery && (
                          <motion.button
                            type="button"
                            onClick={clearSearch}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="text-muted-foreground hover:text-foreground p-1"
                          >
                            <X className="h-4 w-4" />
                          </motion.button>
                        )}
                      </AnimatePresence>
                      <button
                        type="button"
                        onClick={toggleMobileSearch}
                        className="text-muted-foreground hover:text-foreground px-2 py-1 text-xs font-medium"
                      >
                        Cerrar
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Cart Sheet */}
      <CartSheet open={cartOpen} onOpenChange={setCartOpen} />
    </header>
  );
}

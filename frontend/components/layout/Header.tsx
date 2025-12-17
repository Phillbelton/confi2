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
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

export function Header() {
  const router = useRouter();
  const [cartOpen, setCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const itemCount = useCartStore((state) => state.itemCount);
  const { isAuthenticated, user, _hasHydrated } = useClientStore();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/productos?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center gap-4 lg:gap-6">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Logo variant="full" size="default" />
          </div>

          {/* Categories Dropdown */}
          <div className="hidden lg:block flex-shrink-0">
            <CategoriesDropdown />
          </div>

          {/* Search Bar - Center, Flexible Width */}
          <form
            onSubmit={handleSearch}
            className="hidden md:flex flex-1 max-w-2xl relative"
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

          {/* Right Actions */}
          <div className="flex items-center gap-2 ml-auto">
            {/* Desktop: User Dropdown or Login */}
            <div className="hidden md:flex items-center gap-2">
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

            {/* Mobile: User Icon */}
            <div className="md:hidden">
              {_hasHydrated && isAuthenticated && user ? (
                <UserDropdown user={user} />
              ) : _hasHydrated ? (
                <Button variant="ghost" size="icon" asChild className="h-11 w-11">
                  <Link href="/login">
                    <User className="h-5 w-5" />
                  </Link>
                </Button>
              ) : null}
            </div>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="md:hidden pb-3">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              type="text"
              placeholder="Buscar producto..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 h-10 bg-muted/50 border-border/50"
            />
            <AnimatePresence>
              {searchQuery && (
                <motion.button
                  type="button"
                  onClick={clearSearch}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </motion.button>
              )}
            </AnimatePresence>
          </form>
        </div>

        {/* Mobile Categories - Below search */}
        <div className="lg:hidden pb-3 border-t border-border/40 pt-3">
          <CategoriesDropdown />
        </div>
      </div>

      {/* Cart Sheet */}
      <CartSheet open={cartOpen} onOpenChange={setCartOpen} />
    </header>
  );
}

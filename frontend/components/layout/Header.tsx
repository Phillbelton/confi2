'use client';

import Link from 'next/link';
import { ShoppingCart, Search, User, MapPin, Phone, ChevronDown, Menu, X, Grid3x3 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useCartStore } from '@/store/useCartStore';
import { useClientStore } from '@/store/useClientStore';
import { CartSheet } from '@/components/cart/CartSheet';
import { UserDropdown } from './UserDropdown';
import { CategoriesDropdown } from './CategoriesDropdown';
import { MobileCategoriesNav } from './MobileCategoriesNav';
import { SearchSuggestions } from './SearchSuggestions';
import { Logo } from './Logo';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useSearchSuggestions } from '@/hooks/useSearchSuggestions';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

export function Header() {
  const router = useRouter();
  const [cartOpen, setCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const itemCount = useCartStore((state) => state.itemCount);
  const { isAuthenticated, user, _hasHydrated } = useClientStore();

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);

  // Hook para sugerencias de búsqueda
  const { suggestions, isLoading } = useSearchSuggestions(
    searchQuery,
    showSuggestions && searchQuery.length >= 2
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/productos?search=${encodeURIComponent(searchQuery.trim())}`);
      setShowSuggestions(false);
      setMobileMenuOpen(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setShowSuggestions(false);
  };

  const handleSearchFocus = () => {
    if (searchQuery.length >= 2) {
      setShowSuggestions(true);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setShowSuggestions(value.length >= 2);
  };

  const handleSuggestionSelect = () => {
    setShowSuggestions(false);
    setMobileMenuOpen(false);
  };

  // Cerrar sugerencias al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Barra Principal - Fondo oscuro */}
      <div className="bg-[#1a1a2e] border-b border-white/10">
        <div className="container mx-auto px-4">
          {/* Desktop Header */}
          <div className="hidden lg:flex h-16 items-center gap-4">
            {/* Logo - Desktop */}
            <Link href="/" className="flex-shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-primary">confitería</span>
                <span className="text-2xl font-light text-white">quelita</span>
              </div>
            </Link>

            {/* Categories Button - Desktop */}
            <CategoriesDropdown />

            {/* Search Bar - Desktop */}
            <div ref={searchContainerRef} className="flex flex-1 max-w-xl relative">
              <form onSubmit={handleSearch} className="w-full">
                <div className="relative flex">
                  <Input
                    type="text"
                    placeholder="Buscar en Quelita"
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    onFocus={handleSearchFocus}
                    className="w-full h-10 pl-4 pr-12 rounded-lg bg-white text-gray-900 border-0 placeholder:text-gray-500 focus-visible:ring-2 focus-visible:ring-primary"
                  />
                  <button
                    type="submit"
                    className="absolute right-0 top-0 h-10 w-10 flex items-center justify-center text-gray-500 hover:text-primary transition-colors"
                  >
                    <Search className="h-5 w-5" />
                  </button>
                </div>

                {/* Sugerencias Desktop */}
                {showSuggestions && (
                  <SearchSuggestions
                    suggestions={suggestions}
                    isLoading={isLoading}
                    query={searchQuery}
                    onSelect={handleSuggestionSelect}
                  />
                )}
              </form>
            </div>

            {/* User Login/Account - Desktop */}
            <div className="flex items-center">
              {_hasHydrated && isAuthenticated && user ? (
                <UserDropdown user={user} />
              ) : _hasHydrated ? (
                <Link
                  href="/login"
                  className="flex items-center gap-3 text-white hover:text-primary transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                    <User className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col leading-tight">
                    <span className="text-xs text-gray-400">¡Hola! Inicia sesión</span>
                    <span className="font-semibold text-sm">Mi cuenta</span>
                  </div>
                </Link>
              ) : null}
            </div>

            {/* Cart Button - Desktop */}
            <Button
              variant="ghost"
              className="relative h-10 px-3 text-white hover:text-primary hover:bg-white/10"
              onClick={() => setCartOpen(true)}
            >
              <ShoppingCart className="h-5 w-5" />
              <span className="ml-2 font-medium">Carrito</span>
              {itemCount > 0 && (
                <Badge
                  className="absolute -top-1 -right-1 h-5 min-w-5 px-1.5 bg-primary text-white text-xs"
                >
                  {itemCount > 99 ? '99+' : itemCount}
                </Badge>
              )}
            </Button>
          </div>

          {/* Mobile Header */}
          <div className="flex lg:hidden h-14 items-center justify-between gap-1">
            {/* Logo - Mobile (Compacto) */}
            <Link href="/" className="flex-shrink-0">
              <span className="text-lg font-bold text-primary">quelita</span>
            </Link>

            {/* Mobile Navigation Icons */}
            <div className="flex items-center gap-1">
              {/* Categories Button - Mobile */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 text-white hover:text-primary hover:bg-white/10"
                  >
                    <Grid3x3 className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[300px] bg-[#1a1a2e] border-white/10 p-0 overflow-y-auto">
                  <SheetHeader className="p-4 border-b border-white/10">
                    <SheetTitle className="text-white text-left">Categorías</SheetTitle>
                  </SheetHeader>
                  <div className="p-4">
                    <MobileCategoriesNav />
                  </div>
                </SheetContent>
              </Sheet>

              {/* Search Button - Mobile */}
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 text-white hover:text-primary hover:bg-white/10"
                onClick={() => setMobileSearchOpen(true)}
              >
                <Search className="h-5 w-5" />
              </Button>

              {/* Cart Button - Mobile */}
              <Button
                variant="ghost"
                size="icon"
                className="relative h-10 w-10 text-white hover:text-primary hover:bg-white/10"
                onClick={() => setCartOpen(true)}
              >
                <ShoppingCart className="h-5 w-5" />
                {itemCount > 0 && (
                  <Badge
                    className="absolute -top-1 -right-1 h-5 min-w-5 px-1.5 bg-primary text-white text-xs"
                  >
                    {itemCount > 99 ? '99+' : itemCount}
                  </Badge>
                )}
              </Button>

              {/* User Button - Mobile */}
              {_hasHydrated && isAuthenticated && user ? (
                <UserDropdown user={user} />
              ) : _hasHydrated ? (
                <Link href="/login">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 text-white hover:text-primary hover:bg-white/10"
                  >
                    <User className="h-5 w-5" />
                  </Button>
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Search Overlay */}
      <AnimatePresence>
        {mobileSearchOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="lg:hidden fixed inset-0 z-50 bg-[#1a1a2e]"
          >
            <div className="container mx-auto px-4 py-4">
              <div className="flex items-center gap-3">
                <form onSubmit={(e) => { handleSearch(e); setMobileSearchOpen(false); }} className="flex-1 relative">
                  <Input
                    ref={mobileSearchInputRef}
                    type="text"
                    placeholder="Buscar en Quelita"
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    onFocus={handleSearchFocus}
                    autoFocus
                    className="w-full h-12 pl-4 pr-12 rounded-lg bg-white text-gray-900 border-0 placeholder:text-gray-500"
                  />
                  <button
                    type="submit"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                  >
                    <Search className="h-5 w-5" />
                  </button>
                </form>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-12 w-12 text-white hover:text-primary"
                  onClick={() => { setMobileSearchOpen(false); setSearchQuery(''); }}
                >
                  <X className="h-6 w-6" />
                </Button>
              </div>

              {/* Mobile Search Suggestions */}
              {showSuggestions && searchQuery.length >= 2 && (
                <div className="mt-4">
                  <SearchSuggestions
                    suggestions={suggestions}
                    isLoading={isLoading}
                    query={searchQuery}
                    onSelect={() => { handleSuggestionSelect(); setMobileSearchOpen(false); }}
                  />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Barra Secundaria - Rojo (Solo Desktop) */}
      <div className="hidden sm:block bg-primary text-white">
        <div className="container mx-auto px-4">
          <div className="flex h-10 items-center justify-between text-sm">
            {/* Izquierda - Ubicación/Delivery */}
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span>Cómo te gustaría recibir tu pedido</span>
              <ChevronDown className="h-4 w-4" />
            </div>

            {/* Centro - Links útiles (Desktop) */}
            <div className="hidden lg:flex items-center gap-6">
              <Link href="/como-ser-socio" className="hover:underline">
                Cómo ser socio
              </Link>
              <Link href="/locales" className="hover:underline">
                Locales y Horarios
              </Link>
            </div>

            {/* Derecha - Teléfono */}
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              <span className="font-semibold">600 6600 777</span>
            </div>
          </div>
        </div>
      </div>

      {/* Cart Sheet */}
      <CartSheet open={cartOpen} onOpenChange={setCartOpen} />
    </header>
  );
}

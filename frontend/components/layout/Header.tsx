'use client';

import Link from 'next/link';
import { ShoppingCart, Search, User, MapPin, Phone, Clock, ChevronDown, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useCartStore } from '@/store/useCartStore';
import { useClientStore } from '@/store/useClientStore';
import { CartSheet } from '@/components/cart/CartSheet';
import { UserDropdown } from './UserDropdown';
import { CategoriesDropdown } from './CategoriesDropdown';
import { SearchSuggestions } from './SearchSuggestions';
import { Logo } from './Logo';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useSearchSuggestions } from '@/hooks/useSearchSuggestions';

export function Header() {
  const router = useRouter();
  const [cartOpen, setCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const itemCount = useCartStore((state) => state.itemCount);
  const { isAuthenticated, user, _hasHydrated } = useClientStore();

  const searchContainerRef = useRef<HTMLDivElement>(null);

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
          <div className="flex h-16 items-center gap-4">
            {/* Logo */}
            <Link href="/" className="flex-shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-primary">confitería</span>
                <span className="text-2xl font-light text-white">quelita</span>
              </div>
            </Link>

            {/* Categories Button - Desktop */}
            <div className="hidden lg:block">
              <CategoriesDropdown />
            </div>

            {/* Search Bar - Desktop */}
            <div ref={searchContainerRef} className="hidden lg:flex flex-1 max-w-xl relative">
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

            {/* Spacer */}
            <div className="flex-1 lg:hidden" />

            {/* User Login/Account - Desktop */}
            <div className="hidden lg:flex items-center">
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

            {/* Cart Button */}
            <Button
              variant="ghost"
              className="relative h-10 px-3 text-white hover:text-primary hover:bg-white/10"
              onClick={() => setCartOpen(true)}
            >
              <ShoppingCart className="h-5 w-5" />
              <span className="ml-2 hidden sm:inline font-medium">Carrito</span>
              {itemCount > 0 && (
                <Badge
                  className="absolute -top-1 -right-1 h-5 min-w-5 px-1.5 bg-primary text-white text-xs"
                >
                  {itemCount > 99 ? '99+' : itemCount}
                </Badge>
              )}
            </Button>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-white hover:text-primary hover:bg-white/10"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Barra Secundaria - Rojo */}
      <div className="bg-primary text-white">
        <div className="container mx-auto px-4">
          <div className="flex h-10 items-center justify-between text-sm">
            {/* Izquierda - Ubicación/Delivery */}
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span className="hidden sm:inline">Cómo te gustaría recibir tu pedido</span>
              <span className="sm:hidden">Delivery</span>
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

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-[#1a1a2e] border-b border-white/10 overflow-hidden"
          >
            <div className="container mx-auto px-4 py-4 space-y-4">
              {/* Mobile Search */}
              <form onSubmit={handleSearch} className="relative">
                <Input
                  type="text"
                  placeholder="Buscar en Quelita"
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onFocus={handleSearchFocus}
                  className="w-full h-10 pl-4 pr-12 rounded-lg bg-white text-gray-900 border-0 placeholder:text-gray-500"
                />
                <button
                  type="submit"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                >
                  <Search className="h-5 w-5" />
                </button>
              </form>

              {/* Mobile Categories */}
              <div className="pt-2">
                <CategoriesDropdown />
              </div>

              {/* Mobile User */}
              {_hasHydrated && !isAuthenticated && (
                <Link
                  href="/login"
                  className="flex items-center gap-3 text-white py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <User className="h-5 w-5" />
                  <span>Iniciar sesión</span>
                </Link>
              )}

              {/* Mobile Links */}
              <div className="flex flex-col gap-2 pt-2 border-t border-white/10">
                <Link
                  href="/como-ser-socio"
                  className="text-gray-300 hover:text-white py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Cómo ser socio
                </Link>
                <Link
                  href="/locales"
                  className="text-gray-300 hover:text-white py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Locales y Horarios
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cart Sheet */}
      <CartSheet open={cartOpen} onOpenChange={setCartOpen} />
    </header>
  );
}

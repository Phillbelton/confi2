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
  const [scrolled, setScrolled] = useState(false);
  const itemCount = useCartStore((state) => state.itemCount);
  const { isAuthenticated, user, _hasHydrated } = useClientStore();

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);

  // Hook para sugerencias de búsqueda
  const { suggestions, isLoading } = useSearchSuggestions(
    searchQuery,
    showSuggestions && searchQuery.length >= 2
  );

  // Scroll detection for glass effect intensity
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
      {/* Top Info Bar - Darker turquoise */}
      <div className="hidden sm:block bg-secondary/90 text-white relative overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="flex h-8 items-center justify-between text-xs relative z-10">
            <div className="flex items-center gap-2 text-white/80">
              <MapPin className="h-3 w-3" />
              <span>Envíos a Peñalolén · La Florida · Macul · La Reina</span>
            </div>
            <div className="hidden lg:flex items-center gap-4 text-white/80">
              <span>L-S 08:30 a 20:30 · Dom 10:00 a 16:00</span>
            </div>
            <div className="flex items-center gap-2 text-white/90">
              <Phone className="h-3 w-3" />
              <span className="font-semibold">+56 9 6426 9246</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation - Glassmorphism */}
      <div
        className={cn(
          'transition-all duration-300 candy-bg',
          scrolled
            ? 'glass-nav shadow-lg'
            : 'bg-primary/95 border-b border-white/10'
        )}
      >
        <div className="container mx-auto px-4 relative z-10">
          {/* Desktop Header */}
          <div className="hidden lg:flex h-16 items-center gap-4">
            {/* Logo */}
            <Link href="/" className="flex-shrink-0 transition-transform hover:scale-105">
              <img
                src="/brand/logo.png"
                alt="Confitería Quelita"
                className="h-12 w-auto drop-shadow-md"
              />
            </Link>

            {/* Categories Button */}
            <CategoriesDropdown />

            {/* Search Bar */}
            <div ref={searchContainerRef} className="flex flex-1 max-w-xl relative">
              <form onSubmit={handleSearch} className="w-full">
                <div className="relative flex">
                  <Input
                    type="text"
                    placeholder="¿Qué estás buscando?"
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    onFocus={handleSearchFocus}
                    className="w-full h-10 pl-4 pr-12 rounded-full bg-white/20 text-white border border-white/30 placeholder:text-white/60 focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:bg-white/25 backdrop-blur-sm"
                  />
                  <button
                    type="submit"
                    className="absolute right-0 top-0 h-10 w-10 flex items-center justify-center text-white/70 hover:text-white transition-colors"
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

            {/* User Login/Account */}
            <div className="flex items-center">
              {_hasHydrated && isAuthenticated && user ? (
                <UserDropdown user={user} />
              ) : _hasHydrated ? (
                <Link
                  href="/login"
                  className="flex items-center gap-3 text-white hover:text-white/90 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center backdrop-blur-sm border border-white/20">
                    <User className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col leading-tight">
                    <span className="text-xs text-white/70">¡Hola!</span>
                    <span className="font-semibold text-sm">Mi cuenta</span>
                  </div>
                </Link>
              ) : null}
            </div>

            {/* Cart Button */}
            <Button
              variant="ghost"
              className="relative h-10 px-3 text-white hover:text-white hover:bg-white/15 rounded-full"
              onClick={() => setCartOpen(true)}
            >
              <ShoppingCart className="h-5 w-5" />
              <span className="ml-2 font-medium">Carrito</span>
              {itemCount > 0 && (
                <Badge
                  className="absolute -top-1 -right-1 h-5 min-w-5 px-1.5 bg-accent text-white text-xs border-2 border-primary"
                >
                  {itemCount > 99 ? '99+' : itemCount}
                </Badge>
              )}
            </Button>
          </div>

          {/* Mobile Header */}
          <div className="flex lg:hidden h-14 items-center justify-between gap-1">
            <Link href="/" className="flex-shrink-0">
              <img src="/brand/logo.png" alt="Quelita" className="h-10 w-auto drop-shadow-md" />
            </Link>

            <div className="flex items-center gap-0.5">
              <Sheet>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 text-white hover:bg-white/15 rounded-full"
                  >
                    <Grid3x3 className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[300px] bg-gradient-to-b from-primary to-secondary border-white/10 p-0 overflow-y-auto">
                  <SheetHeader className="p-4 border-b border-white/15">
                    <SheetTitle className="text-white text-left">Categorías</SheetTitle>
                  </SheetHeader>
                  <div className="p-4">
                    <MobileCategoriesNav />
                  </div>
                </SheetContent>
              </Sheet>

              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 text-white hover:bg-white/15 rounded-full"
                onClick={() => setMobileSearchOpen(true)}
              >
                <Search className="h-5 w-5" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="relative h-10 w-10 text-white hover:bg-white/15 rounded-full"
                onClick={() => setCartOpen(true)}
              >
                <ShoppingCart className="h-5 w-5" />
                {itemCount > 0 && (
                  <Badge
                    className="absolute -top-1 -right-1 h-5 min-w-5 px-1.5 bg-accent text-white text-xs"
                  >
                    {itemCount > 99 ? '99+' : itemCount}
                  </Badge>
                )}
              </Button>

              {_hasHydrated && isAuthenticated && user ? (
                <UserDropdown user={user} />
              ) : _hasHydrated ? (
                <Link href="/login">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 text-white hover:bg-white/15 rounded-full"
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
            className="lg:hidden fixed inset-0 z-50 bg-gradient-to-b from-primary to-secondary"
          >
            <div className="container mx-auto px-4 py-4">
              <div className="flex items-center gap-3">
                <form onSubmit={(e) => { handleSearch(e); setMobileSearchOpen(false); }} className="flex-1 relative">
                  <Input
                    ref={mobileSearchInputRef}
                    type="text"
                    placeholder="¿Qué estás buscando?"
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    onFocus={handleSearchFocus}
                    autoFocus
                    className="w-full h-12 pl-4 pr-12 rounded-full bg-white/20 text-white border border-white/30 placeholder:text-white/60"
                  />
                  <button
                    type="submit"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70"
                  >
                    <Search className="h-5 w-5" />
                  </button>
                </form>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-12 w-12 text-white hover:bg-white/15 rounded-full"
                  onClick={() => { setMobileSearchOpen(false); setSearchQuery(''); }}
                >
                  <X className="h-6 w-6" />
                </Button>
              </div>

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

      {/* Cart Sheet */}
      <CartSheet open={cartOpen} onOpenChange={setCartOpen} />
    </header>
  );
}

'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, TrendingUp, Clock, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface SearchBarPremiumProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClear?: () => void;
  placeholder?: string;
  className?: string;
}

const TRENDING_SEARCHES = [
  'Chocolates',
  'Caramelos',
  'Gomitas',
  'Snacks',
];

const RECENT_SEARCHES = [
  'Alfajores',
  'Turrones',
];

export function SearchBarPremium({
  value,
  onChange,
  onSubmit,
  onClear,
  placeholder = 'Buscar productos...',
  className,
}: SearchBarPremiumProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
        setIsFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFocus = () => {
    setIsFocused(true);
    setShowSuggestions(true);
  };

  const handleClear = () => {
    onChange('');
    onClear?.();
    inputRef.current?.focus();
  };

  const handleSuggestionClick = (suggestion: string) => {
    onChange(suggestion);
    setShowSuggestions(false);
    setIsFocused(false);
    // Trigger search
    const form = inputRef.current?.closest('form');
    if (form) {
      form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    }
  };

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      <form onSubmit={onSubmit} className="relative">
        <motion.div
          animate={{
            boxShadow: isFocused
              ? '0 8px 24px rgba(245, 184, 208, 0.15)'
              : '0 2px 8px rgba(0, 0, 0, 0.05)',
          }}
          transition={{ duration: 0.2 }}
          className={cn(
            'relative flex items-center rounded-xl bg-card border-2 transition-colors',
            isFocused ? 'border-primary' : 'border-border'
          )}
        >
          {/* Search Icon */}
          <div className="absolute left-4 pointer-events-none">
            <Search
              className={cn(
                'h-5 w-5 transition-colors',
                isFocused ? 'text-primary' : 'text-muted-foreground'
              )}
            />
          </div>

          {/* Input */}
          <Input
            ref={inputRef}
            type="search"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={handleFocus}
            placeholder={placeholder}
            className="pl-12 pr-12 h-14 text-base border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent"
          />

          {/* Clear Button */}
          <AnimatePresence>
            {value && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute right-4"
              >
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleClear}
                  className="h-8 w-8 rounded-full hover:bg-muted"
                >
                  <X className="h-4 w-4" />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </form>

      {/* Suggestions Dropdown */}
      <AnimatePresence>
        {showSuggestions && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-premium-lg overflow-hidden z-50"
          >
            <div className="p-4 space-y-4 max-h-[400px] overflow-y-auto scrollbar-thin">
              {/* Recent Searches */}
              {RECENT_SEARCHES.length > 0 && !value && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">
                      Búsquedas recientes
                    </span>
                  </div>
                  <div className="space-y-1">
                    {RECENT_SEARCHES.map((search) => (
                      <button
                        key={search}
                        onClick={() => handleSuggestionClick(search)}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-muted transition-colors text-sm"
                      >
                        {search}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Trending Searches */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">
                    Tendencias
                  </span>
                  <Sparkles className="h-3 w-3 text-primary animate-pulse" />
                </div>
                <div className="flex flex-wrap gap-2">
                  {TRENDING_SEARCHES.map((search) => (
                    <Badge
                      key={search}
                      variant="secondary"
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                      onClick={() => handleSuggestionClick(search)}
                    >
                      {search}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Quick Tips */}
              <div className="pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium">Tip:</span> Usa términos específicos como "chocolate amargo" para mejores resultados
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

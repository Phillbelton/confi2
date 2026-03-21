'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Palette, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

type Theme = 'dark' | 'clara' | 'suave' | 'viva';

interface ThemeConfig {
  name: string;
  label: string;
  description: string;
  icon: React.ElementType;
  gradient: string;
  textColor: string;
}

const themes: Record<Theme, ThemeConfig> = {
  dark: {
    name: 'dark',
    label: 'Oscuro',
    description: 'Tema oscuro vibrante (predeterminado)',
    icon: Moon,
    gradient: 'from-slate-900 to-slate-700',
    textColor: 'text-slate-100',
  },
  clara: {
    name: 'clara',
    label: 'Clara',
    description: 'Brillante y luminosa',
    icon: Sun,
    gradient: 'from-amber-200 to-orange-300',
    textColor: 'text-slate-900',
  },
  suave: {
    name: 'suave',
    label: 'Suave',
    description: 'Colores suaves y relajados',
    icon: Palette,
    gradient: 'from-slate-600 to-slate-500',
    textColor: 'text-slate-100',
  },
  viva: {
    name: 'viva',
    label: 'Viva',
    description: 'Energética y colorida',
    icon: Sparkles,
    gradient: 'from-fuchsia-600 via-orange-500 to-yellow-500',
    textColor: 'text-white',
  },
};

export function ThemeToggle() {
  const [currentTheme, setCurrentTheme] = React.useState<Theme>('dark');
  const [mounted, setMounted] = React.useState(false);

  // Load theme on mount
  React.useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    const initialTheme = savedTheme || 'dark';
    setCurrentTheme(initialTheme);
    applyTheme(initialTheme);
  }, []);

  const applyTheme = (theme: Theme) => {
    const root = document.documentElement;

    // Remove all theme classes
    root.classList.remove('dark', 'theme-clara', 'theme-suave', 'theme-viva');

    // Apply new theme class
    if (theme === 'dark') {
      // Dark is default in :root, but we can add class for specificity
      root.classList.add('dark');
    } else {
      root.classList.add(`theme-${theme}`);
    }

    // Save to localStorage
    localStorage.setItem('theme', theme);
  };

  const handleThemeChange = (theme: Theme) => {
    setCurrentTheme(theme);
    applyTheme(theme);
  };

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="relative w-10 h-10 rounded-full"
        disabled
      >
        <Moon className="h-5 w-5" />
      </Button>
    );
  }

  const CurrentIcon = themes[currentTheme].icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'relative w-10 h-10 rounded-full',
            'hover:bg-primary/10 transition-all',
            'border-2 border-transparent hover:border-primary/30'
          )}
        >
          <motion.div
            key={currentTheme}
            initial={{ rotate: -30, scale: 0 }}
            animate={{ rotate: 0, scale: 1 }}
            exit={{ rotate: 30, scale: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <CurrentIcon className="h-5 w-5 text-primary" />
          </motion.div>
          <span className="sr-only">Cambiar tema</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64 p-2">
        <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground">
          Seleccionar Tema
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <div className="space-y-1">
          {Object.entries(themes).map(([key, theme]) => {
            const Icon = theme.icon;
            const isActive = currentTheme === key;

            return (
              <DropdownMenuItem
                key={key}
                onClick={() => handleThemeChange(key as Theme)}
                className={cn(
                  'relative flex items-start gap-3 p-3 rounded-lg cursor-pointer',
                  'transition-all duration-200',
                  isActive
                    ? 'bg-primary/10 border-2 border-primary/30'
                    : 'hover:bg-muted/50 border-2 border-transparent'
                )}
              >
                {/* Icon with gradient background */}
                <div
                  className={cn(
                    'flex-shrink-0 w-10 h-10 rounded-lg',
                    'flex items-center justify-center',
                    'bg-gradient-to-br shadow-sm',
                    theme.gradient
                  )}
                >
                  <Icon className={cn('w-5 h-5', theme.textColor)} />
                </div>

                {/* Text Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={cn(
                      'font-medium text-sm',
                      isActive ? 'text-primary' : 'text-foreground'
                    )}>
                      {theme.label}
                    </p>
                    {isActive && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-2 h-2 rounded-full bg-primary"
                      />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {theme.description}
                  </p>
                </div>

                {/* Active indicator bar */}
                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      initial={{ scaleY: 0 }}
                      animate={{ scaleY: 1 }}
                      exit={{ scaleY: 0 }}
                      className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-primary"
                    />
                  )}
                </AnimatePresence>
              </DropdownMenuItem>
            );
          })}
        </div>

        {/* Preview gradient bar */}
        <div className="mt-3 pt-2 border-t">
          <p className="text-xs text-muted-foreground mb-2 px-1">
            Vista previa:
          </p>
          <motion.div
            key={currentTheme}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
              'h-8 rounded-lg bg-gradient-to-r shadow-sm',
              themes[currentTheme].gradient
            )}
          />
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

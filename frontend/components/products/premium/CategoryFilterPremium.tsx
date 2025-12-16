'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight,
  Check,
  Minus,
  Sparkles,
  Search,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CategoryWithSubcategories } from '@/lib/categoryUtils';
import { getCategoryVisualConfig } from '@/lib/categoryVisualConfig';
import { CategoryCardPremium, type CategoryCardSize } from './CategoryCardPremium';

interface CategoryFilterPremiumProps {
  categories: CategoryWithSubcategories[];
  selectedCategories: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  isMobile?: boolean;
  size?: CategoryCardSize;
  showDescriptions?: boolean;
}

// Iconos por defecto para categorías comunes de confitería
const categoryIcons: Record<string, string> = {
  'chocolates': '🍫',
  'caramelos': '🍬',
  'galletas': '🍪',
  'gomitas': '🧸',
  'snacks': '🥨',
  'bebidas': '🥤',
  'dulces': '🍭',
  'pasteles': '🎂',
  'helados': '🍦',
  'frutos secos': '🥜',
  'confitería': '🎀',
  'golosinas': '✨',
  'chicles': '🫧',
  'bombones': '💝',
  'turrones': '🍯',
  'mazapanes': '⭐',
  'regalo': '🎁',
  'infantil': '🧒',
  'premium': '👑',
  'importados': '🌍',
  'nacionales': '🇨🇱',
  'ofertas': '🏷️',
  'nuevos': '🆕',
};

const getCategoryIcon = (name: string, icon?: string): string => {
  if (icon) return icon;
  const lowerName = name.toLowerCase();
  for (const [key, value] of Object.entries(categoryIcons)) {
    if (lowerName.includes(key)) return value;
  }
  return '📦';
};

// Colores pastel para las categorías
const categoryColors = [
  { bg: 'bg-pink-50', border: 'border-pink-200', hover: 'hover:bg-pink-100', active: 'bg-pink-100', ring: 'ring-pink-300', text: 'text-pink-700' },
  { bg: 'bg-purple-50', border: 'border-purple-200', hover: 'hover:bg-purple-100', active: 'bg-purple-100', ring: 'ring-purple-300', text: 'text-purple-700' },
  { bg: 'bg-blue-50', border: 'border-blue-200', hover: 'hover:bg-blue-100', active: 'bg-blue-100', ring: 'ring-blue-300', text: 'text-blue-700' },
  { bg: 'bg-cyan-50', border: 'border-cyan-200', hover: 'hover:bg-cyan-100', active: 'bg-cyan-100', ring: 'ring-cyan-300', text: 'text-cyan-700' },
  { bg: 'bg-teal-50', border: 'border-teal-200', hover: 'hover:bg-teal-100', active: 'bg-teal-100', ring: 'ring-teal-300', text: 'text-teal-700' },
  { bg: 'bg-emerald-50', border: 'border-emerald-200', hover: 'hover:bg-emerald-100', active: 'bg-emerald-100', ring: 'ring-emerald-300', text: 'text-emerald-700' },
  { bg: 'bg-amber-50', border: 'border-amber-200', hover: 'hover:bg-amber-100', active: 'bg-amber-100', ring: 'ring-amber-300', text: 'text-amber-700' },
  { bg: 'bg-orange-50', border: 'border-orange-200', hover: 'hover:bg-orange-100', active: 'bg-orange-100', ring: 'ring-orange-300', text: 'text-orange-700' },
  { bg: 'bg-rose-50', border: 'border-rose-200', hover: 'hover:bg-rose-100', active: 'bg-rose-100', ring: 'ring-rose-300', text: 'text-rose-700' },
  { bg: 'bg-violet-50', border: 'border-violet-200', hover: 'hover:bg-violet-100', active: 'bg-violet-100', ring: 'ring-violet-300', text: 'text-violet-700' },
];

const getColorScheme = (index: number) => categoryColors[index % categoryColors.length];

// Componente de checkbox personalizado animado
function AnimatedCheckbox({
  checked,
  indeterminate,
  onChange,
  colorScheme
}: {
  checked: boolean;
  indeterminate?: boolean;
  onChange: () => void;
  colorScheme: typeof categoryColors[0];
}) {
  return (
    <motion.button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onChange();
      }}
      className={cn(
        'relative w-5 h-5 rounded-md border-2 transition-all duration-200 flex-shrink-0',
        'focus:outline-none focus:ring-2 focus:ring-offset-1',
        colorScheme.ring,
        checked || indeterminate
          ? `bg-primary border-primary`
          : `bg-white ${colorScheme.border} hover:border-primary/50`
      )}
      whileTap={{ scale: 0.9 }}
    >
      <AnimatePresence mode="wait">
        {checked && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <Check className="w-3 h-3 text-white" strokeWidth={3} />
          </motion.div>
        )}
        {indeterminate && !checked && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <Minus className="w-3 h-3 text-white" strokeWidth={3} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

// Componente de categoría padre
function ParentCategory({
  category,
  colorIndex,
  isExpanded,
  checkState,
  selectedCount,
  totalCount,
  onToggleExpand,
  onToggleSelect,
}: {
  category: CategoryWithSubcategories;
  colorIndex: number;
  isExpanded: boolean;
  checkState: 'checked' | 'indeterminate' | 'unchecked';
  selectedCount: number;
  totalCount: number;
  onToggleExpand: () => void;
  onToggleSelect: () => void;
}) {
  const colorScheme = getColorScheme(colorIndex);
  const hasChildren = category.subcategories && category.subcategories.length > 0;
  const isSelected = checkState === 'checked' || checkState === 'indeterminate';
  const icon = getCategoryIcon(category.name, category.icon);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: colorIndex * 0.03 }}
    >
      <motion.div
        className={cn(
          'group relative flex items-center gap-3 p-3 rounded-xl cursor-pointer',
          'border-2 transition-all duration-200',
          isSelected
            ? `${colorScheme.active} ${colorScheme.border} shadow-sm`
            : `${colorScheme.bg} border-transparent ${colorScheme.hover}`,
          'active:scale-[0.99]'
        )}
        onClick={hasChildren ? onToggleExpand : onToggleSelect}
        whileHover={{ x: 2 }}
      >
        {/* Icono de categoría */}
        <motion.div
          className={cn(
            'flex items-center justify-center w-10 h-10 rounded-lg',
            'text-xl transition-all duration-200',
            isSelected
              ? 'bg-white shadow-sm'
              : `${colorScheme.active}`
          )}
          whileHover={{ scale: 1.05, rotate: 5 }}
          whileTap={{ scale: 0.95 }}
        >
          {icon}
        </motion.div>

        {/* Nombre y contador */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn(
              'font-medium text-sm truncate',
              isSelected ? colorScheme.text : 'text-foreground'
            )}>
              {category.name}
            </span>
            {hasChildren && selectedCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className={cn(
                  'px-1.5 py-0.5 text-[10px] font-bold rounded-full',
                  'bg-primary text-white'
                )}
              >
                {selectedCount}/{totalCount}
              </motion.span>
            )}
          </div>
          {hasChildren && (
            <span className="text-xs text-muted-foreground">
              {totalCount} subcategoría{totalCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Checkbox o flecha de expansión */}
        <div className="flex items-center gap-2">
          {hasChildren ? (
            <>
              <AnimatedCheckbox
                checked={checkState === 'checked'}
                indeterminate={checkState === 'indeterminate'}
                onChange={onToggleSelect}
                colorScheme={colorScheme}
              />
              <motion.div
                animate={{ rotate: isExpanded ? 90 : 0 }}
                transition={{ duration: 0.2 }}
                className="text-muted-foreground"
              >
                <ChevronRight className="w-4 h-4" />
              </motion.div>
            </>
          ) : (
            <AnimatedCheckbox
              checked={checkState === 'checked'}
              onChange={onToggleSelect}
              colorScheme={colorScheme}
            />
          )}
        </div>

        {/* Indicador de selección */}
        <AnimatePresence>
          {isSelected && (
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: 3 }}
              exit={{ width: 0 }}
              className={cn(
                'absolute left-0 top-2 bottom-2 rounded-full bg-primary'
              )}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

// Componente de subcategoría mejorado
function SubCategory({
  category,
  parentColorIndex,
  isSelected,
  onToggle,
  index,
}: {
  category: { _id: string; name: string; icon?: string };
  parentColorIndex: number;
  isSelected: boolean;
  onToggle: () => void;
  index: number;
}) {
  const colorScheme = getColorScheme(parentColorIndex);
  const visualConfig = getCategoryVisualConfig(category.name);

  return (
    <motion.div
      initial={{ opacity: 0, x: -10, height: 0 }}
      animate={{ opacity: 1, x: 0, height: 'auto' }}
      exit={{ opacity: 0, x: -10, height: 0 }}
      transition={{ duration: 0.2, delay: index * 0.03 }}
    >
      <motion.div
        className={cn(
          'group flex items-center gap-2 sm:gap-3 p-2.5 pl-4 rounded-lg cursor-pointer ml-4',
          'border-2 transition-all duration-200',
          'min-h-[48px] touch-target',
          isSelected
            ? `${visualConfig.bgColor} ${visualConfig.borderColor} shadow-sm`
            : `bg-background/50 border-transparent ${visualConfig.hoverBg}`
        )}
        onClick={onToggle}
        whileHover={{ x: 4, scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
      >
        {/* Línea conectora decorativa */}
        <div className="absolute left-6 -ml-0.5 w-px h-full bg-border" />

        {/* Emoji Icon */}
        <span className="text-base sm:text-lg flex-shrink-0">{visualConfig.emoji}</span>

        {/* Nombre */}
        <span className={cn(
          'flex-1 text-xs sm:text-sm truncate transition-colors',
          isSelected ? `font-medium ${visualConfig.textColor}` : 'text-muted-foreground group-hover:text-foreground'
        )}>
          {category.name}
        </span>

        {/* Checkbox */}
        <AnimatedCheckbox
          checked={isSelected}
          onChange={onToggle}
          colorScheme={colorScheme}
        />

        {/* Selection indicator */}
        <AnimatePresence>
          {isSelected && (
            <motion.div
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              exit={{ scaleY: 0 }}
              className={cn(
                'absolute left-0 top-1 bottom-1 w-1 rounded-r-full',
                `bg-gradient-to-b ${visualConfig.gradient}`
              )}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

export function CategoryFilterPremium({
  categories,
  selectedCategories,
  onSelectionChange,
  isMobile = false,
  size,
  showDescriptions = false,
}: CategoryFilterPremiumProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  // Auto-determine size based on mobile if not specified
  const cardSize = size || (isMobile ? 'large' : 'medium');

  // Filtrar categorías por búsqueda
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories;

    const query = searchQuery.toLowerCase();
    return categories.filter(cat => {
      const matchesParent = cat.name.toLowerCase().includes(query);
      const matchesChild = cat.subcategories?.some(sub =>
        sub.name.toLowerCase().includes(query)
      );
      return matchesParent || matchesChild;
    });
  }, [categories, searchQuery]);

  // Auto-expandir categorías con hijos seleccionados
  useEffect(() => {
    const newExpanded = new Set(expandedCategories);
    categories.forEach((parent) => {
      if (parent.subcategories?.some((sub) => selectedCategories.includes(sub._id))) {
        newExpanded.add(parent._id);
      }
    });
    setExpandedCategories(newExpanded);
  }, [selectedCategories, categories]);

  // Auto-expandir cuando hay búsqueda
  useEffect(() => {
    if (searchQuery.trim()) {
      const newExpanded = new Set<string>();
      filteredCategories.forEach(cat => {
        if (cat.subcategories?.length) {
          newExpanded.add(cat._id);
        }
      });
      setExpandedCategories(newExpanded);
    }
  }, [searchQuery, filteredCategories]);

  const toggleExpand = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const getParentCheckboxState = (parent: CategoryWithSubcategories): 'checked' | 'indeterminate' | 'unchecked' => {
    if (!parent.subcategories?.length) {
      return selectedCategories.includes(parent._id) ? 'checked' : 'unchecked';
    }

    const childIds = parent.subcategories.map((sub) => sub._id);
    const selectedChildCount = childIds.filter((id) => selectedCategories.includes(id)).length;

    if (selectedChildCount === 0) return 'unchecked';
    if (selectedChildCount === childIds.length) return 'checked';
    return 'indeterminate';
  };

  const handleParentToggle = (parent: CategoryWithSubcategories) => {
    if (!parent.subcategories?.length) {
      const newSelection = selectedCategories.includes(parent._id)
        ? selectedCategories.filter((id) => id !== parent._id)
        : [...selectedCategories, parent._id];
      onSelectionChange(newSelection);
      return;
    }

    const state = getParentCheckboxState(parent);
    const childIds = parent.subcategories.map((sub) => sub._id);

    if (state === 'checked') {
      onSelectionChange(selectedCategories.filter((id) => !childIds.includes(id)));
    } else {
      onSelectionChange([
        ...selectedCategories.filter((id) => !childIds.includes(id)),
        ...childIds,
      ]);
    }
  };

  const handleChildToggle = (childId: string) => {
    const newSelection = selectedCategories.includes(childId)
      ? selectedCategories.filter((id) => id !== childId)
      : [...selectedCategories, childId];
    onSelectionChange(newSelection);
  };

  const totalSelectedCount = selectedCategories.length;

  return (
    <div className="space-y-3">
      {/* Header con búsqueda */}
      <div className="flex items-center gap-2">
        <AnimatePresence mode="wait">
          {showSearch ? (
            <motion.div
              key="search-input"
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: '100%' }}
              exit={{ opacity: 0, width: 0 }}
              className="flex-1 relative"
            >
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar categorías..."
                className={cn(
                  'w-full pl-9 pr-9 py-2 text-sm rounded-lg',
                  'border border-border bg-background',
                  'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary',
                  'placeholder:text-muted-foreground'
                )}
                autoFocus
              />
              <button
                onClick={() => {
                  setShowSearch(false);
                  setSearchQuery('');
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-muted"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="search-button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-between w-full"
            >
              {totalSelectedCount > 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary"
                >
                  <Sparkles className="w-3 h-3" />
                  <span className="text-xs font-medium">
                    {totalSelectedCount} seleccionada{totalSelectedCount !== 1 ? 's' : ''}
                  </span>
                </motion.div>
              )}
              {categories.length > 5 && (
                <motion.button
                  onClick={() => setShowSearch(true)}
                  className={cn(
                    'ml-auto p-2 rounded-lg transition-colors',
                    'hover:bg-muted text-muted-foreground hover:text-foreground'
                  )}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Search className="w-4 h-4" />
                </motion.button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Lista de categorías */}
      <motion.div layout className="space-y-2">
        <AnimatePresence mode="popLayout">
          {filteredCategories.map((parent, index) => {
            const hasChildren = parent.subcategories && parent.subcategories.length > 0;
            const isExpanded = expandedCategories.has(parent._id);
            const checkState = getParentCheckboxState(parent);
            const selectedChildCount = hasChildren
              ? parent.subcategories!.filter(sub => selectedCategories.includes(sub._id)).length
              : 0;

            return (
              <div key={parent._id}>
                <CategoryCardPremium
                  category={parent}
                  isSelected={checkState !== 'unchecked'}
                  isIndeterminate={checkState === 'indeterminate'}
                  selectedChildCount={selectedChildCount}
                  totalChildCount={parent.subcategories?.length || 0}
                  visualConfig={getCategoryVisualConfig(parent.name)}
                  onToggle={() => handleParentToggle(parent)}
                  onExpand={hasChildren ? () => toggleExpand(parent._id) : undefined}
                  isExpanded={isExpanded}
                  size={cardSize}
                  showDescription={showDescriptions || (isMobile && !hasChildren)}
                  index={index}
                />

                {/* Subcategorías */}
                <AnimatePresence>
                  {hasChildren && isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25 }}
                      className="relative mt-1 space-y-1 overflow-hidden"
                    >
                      {/* Línea conectora vertical */}
                      <div className="absolute left-7 top-0 bottom-2 w-px bg-border" />

                      {parent.subcategories!.map((child, childIndex) => (
                        <SubCategory
                          key={child._id}
                          category={child}
                          parentColorIndex={index}
                          isSelected={selectedCategories.includes(child._id)}
                          onToggle={() => handleChildToggle(child._id)}
                          index={childIndex}
                        />
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </AnimatePresence>

        {/* Estado vacío de búsqueda */}
        {filteredCategories.length === 0 && searchQuery && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="py-8 text-center"
          >
            <div className="text-3xl mb-2">🔍</div>
            <p className="text-sm text-muted-foreground">
              No se encontraron categorías para "{searchQuery}"
            </p>
          </motion.div>
        )}
      </motion.div>

      {/* Acciones rápidas */}
      {totalSelectedCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="pt-2 border-t border-border"
        >
          <button
            onClick={() => onSelectionChange([])}
            className={cn(
              'w-full py-2 px-3 rounded-lg text-sm font-medium',
              'text-muted-foreground hover:text-foreground',
              'hover:bg-muted transition-colors',
              'flex items-center justify-center gap-2'
            )}
          >
            <X className="w-4 h-4" />
            Limpiar selección
          </button>
        </motion.div>
      )}
    </div>
  );
}

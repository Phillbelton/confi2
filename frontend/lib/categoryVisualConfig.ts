/**
 * CONFITERÍA QUELITA - VISUAL CONFIGURATION FOR CATEGORIES
 *
 * This file contains the visual configuration (emojis, colors, gradients, descriptions)
 * for all categories in the system. Based on the seed categories structure.
 *
 * Mobile-First Premium Design System
 */

export interface CategoryVisualConfig {
  emoji: string;
  gradient: string;
  bgColor: string;
  borderColor: string;
  hoverBg: string;
  textColor: string;
  ringColor: string;
  description: string;
}

/**
 * Visual configuration map for all categories
 * Keys match the category names from seedCategories.ts
 */
export const categoryVisualMap: Record<string, CategoryVisualConfig> = {
  // ============================================
  // CATEGORÍAS PRINCIPALES (6)
  // ============================================

  'Categoria-1-Bebidas': {
    emoji: '🥤',
    gradient: 'from-cyan-400 to-blue-500',
    bgColor: 'bg-cyan-50',
    borderColor: 'border-cyan-200',
    hoverBg: 'hover:bg-cyan-100',
    textColor: 'text-cyan-700',
    ringColor: 'ring-cyan-300',
    description: 'Gaseosas, jugos, aguas y bebidas refrescantes',
  },

  'Categoria-2-Snacks': {
    emoji: '🥨',
    gradient: 'from-amber-400 to-orange-500',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    hoverBg: 'hover:bg-amber-100',
    textColor: 'text-amber-700',
    ringColor: 'ring-amber-300',
    description: 'Snacks salados, dulces y frutos secos',
  },

  'Categoria-3-Chocolates': {
    emoji: '🍫',
    gradient: 'from-yellow-600 to-amber-700',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-300',
    hoverBg: 'hover:bg-amber-100',
    textColor: 'text-amber-800',
    ringColor: 'ring-amber-400',
    description: 'Barras, bombones y chocolates premium',
  },

  'Categoria-4-Caramelos': {
    emoji: '🍬',
    gradient: 'from-pink-400 to-rose-500',
    bgColor: 'bg-pink-50',
    borderColor: 'border-pink-200',
    hoverBg: 'hover:bg-pink-100',
    textColor: 'text-pink-700',
    ringColor: 'ring-pink-300',
    description: 'Caramelos duros, gomitas y chicles',
  },

  'Categoria-5-Reposteria': {
    emoji: '🍰',
    gradient: 'from-purple-400 to-pink-500',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    hoverBg: 'hover:bg-purple-100',
    textColor: 'text-purple-700',
    ringColor: 'ring-purple-300',
    description: 'Galletas, alfajores y productos de panadería',
  },

  'Categoria-6-Helados': {
    emoji: '🍦',
    gradient: 'from-blue-300 to-cyan-400',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    hoverBg: 'hover:bg-blue-100',
    textColor: 'text-blue-700',
    ringColor: 'ring-blue-300',
    description: 'Paletas, cassatas y conos helados',
  },

  // ============================================
  // SUBCATEGORÍAS de Bebidas (3)
  // ============================================

  'Subcat-1A-Gaseosas': {
    emoji: '🥤',
    gradient: 'from-cyan-300 to-blue-400',
    bgColor: 'bg-cyan-50',
    borderColor: 'border-cyan-200',
    hoverBg: 'hover:bg-cyan-100',
    textColor: 'text-cyan-600',
    ringColor: 'ring-cyan-300',
    description: 'Bebidas gaseosas y carbonatadas',
  },

  'Subcat-1B-Jugos': {
    emoji: '🧃',
    gradient: 'from-orange-300 to-orange-500',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    hoverBg: 'hover:bg-orange-100',
    textColor: 'text-orange-600',
    ringColor: 'ring-orange-300',
    description: 'Jugos y néctares de frutas',
  },

  'Subcat-1C-Aguas': {
    emoji: '💧',
    gradient: 'from-sky-300 to-blue-400',
    bgColor: 'bg-sky-50',
    borderColor: 'border-sky-200',
    hoverBg: 'hover:bg-sky-100',
    textColor: 'text-sky-600',
    ringColor: 'ring-sky-300',
    description: 'Aguas minerales y purificadas',
  },

  // ============================================
  // SUBCATEGORÍAS de Snacks (3)
  // ============================================

  'Subcat-2A-Salados': {
    emoji: '🍿',
    gradient: 'from-yellow-400 to-amber-500',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    hoverBg: 'hover:bg-yellow-100',
    textColor: 'text-yellow-700',
    ringColor: 'ring-yellow-300',
    description: 'Papas, nachos, snacks salados',
  },

  'Subcat-2B-Dulces': {
    emoji: '🍪',
    gradient: 'from-amber-300 to-orange-400',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    hoverBg: 'hover:bg-amber-100',
    textColor: 'text-amber-600',
    ringColor: 'ring-amber-300',
    description: 'Snacks dulces y azucarados',
  },

  'Subcat-2C-Frutos-Secos': {
    emoji: '🥜',
    gradient: 'from-stone-400 to-amber-600',
    bgColor: 'bg-stone-50',
    borderColor: 'border-stone-200',
    hoverBg: 'hover:bg-stone-100',
    textColor: 'text-stone-700',
    ringColor: 'ring-stone-300',
    description: 'Frutos secos, nueces y mezclas',
  },

  // ============================================
  // SUBCATEGORÍAS de Chocolates (3)
  // ============================================

  'Subcat-3A-Barras': {
    emoji: '🍫',
    gradient: 'from-amber-500 to-amber-700',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-300',
    hoverBg: 'hover:bg-amber-100',
    textColor: 'text-amber-700',
    ringColor: 'ring-amber-400',
    description: 'Barras de chocolate individuales',
  },

  'Subcat-3B-Bombones': {
    emoji: '💝',
    gradient: 'from-red-400 to-pink-500',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    hoverBg: 'hover:bg-red-100',
    textColor: 'text-red-700',
    ringColor: 'ring-red-300',
    description: 'Bombones y chocolates rellenos',
  },

  'Subcat-3C-Premium': {
    emoji: '👑',
    gradient: 'from-yellow-500 to-amber-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-300',
    hoverBg: 'hover:bg-yellow-100',
    textColor: 'text-yellow-800',
    ringColor: 'ring-yellow-400',
    description: 'Chocolates premium y artesanales',
  },

  // ============================================
  // SUBCATEGORÍAS de Caramelos (3)
  // ============================================

  'Subcat-4A-Duros': {
    emoji: '🍭',
    gradient: 'from-rose-400 to-pink-500',
    bgColor: 'bg-rose-50',
    borderColor: 'border-rose-200',
    hoverBg: 'hover:bg-rose-100',
    textColor: 'text-rose-700',
    ringColor: 'ring-rose-300',
    description: 'Caramelos duros y lollipops',
  },

  'Subcat-4B-Gomitas': {
    emoji: '🐻',
    gradient: 'from-fuchsia-400 to-pink-500',
    bgColor: 'bg-fuchsia-50',
    borderColor: 'border-fuchsia-200',
    hoverBg: 'hover:bg-fuchsia-100',
    textColor: 'text-fuchsia-700',
    ringColor: 'ring-fuchsia-300',
    description: 'Gomitas y caramelos blandos',
  },

  'Subcat-4C-Chicles': {
    emoji: '🫧',
    gradient: 'from-pink-300 to-rose-400',
    bgColor: 'bg-pink-50',
    borderColor: 'border-pink-200',
    hoverBg: 'hover:bg-pink-100',
    textColor: 'text-pink-600',
    ringColor: 'ring-pink-300',
    description: 'Chicles y gomas de mascar',
  },

  // ============================================
  // SUBCATEGORÍAS de Repostería (3)
  // ============================================

  'Subcat-5A-Galletas': {
    emoji: '🍪',
    gradient: 'from-orange-400 to-amber-500',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    hoverBg: 'hover:bg-orange-100',
    textColor: 'text-orange-700',
    ringColor: 'ring-orange-300',
    description: 'Galletas dulces y saladas',
  },

  'Subcat-5B-Alfajores': {
    emoji: '🥪',
    gradient: 'from-yellow-400 to-orange-500',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    hoverBg: 'hover:bg-yellow-100',
    textColor: 'text-yellow-700',
    ringColor: 'ring-yellow-300',
    description: 'Alfajores y productos rellenos',
  },

  'Subcat-5C-Obleas': {
    emoji: '🧇',
    gradient: 'from-amber-300 to-yellow-500',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    hoverBg: 'hover:bg-amber-100',
    textColor: 'text-amber-600',
    ringColor: 'ring-amber-300',
    description: 'Obleas y barquillos',
  },

  // ============================================
  // SUBCATEGORÍAS de Helados (5)
  // ============================================

  'Subcat-6A-Paletas-Agua': {
    emoji: '🧊',
    gradient: 'from-cyan-300 to-blue-400',
    bgColor: 'bg-cyan-50',
    borderColor: 'border-cyan-200',
    hoverBg: 'hover:bg-cyan-100',
    textColor: 'text-cyan-600',
    ringColor: 'ring-cyan-300',
    description: 'Paletas de agua saborizadas',
  },

  'Subcat-6B-Paletas-Crema': {
    emoji: '🍦',
    gradient: 'from-blue-300 to-indigo-400',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    hoverBg: 'hover:bg-blue-100',
    textColor: 'text-blue-600',
    ringColor: 'ring-blue-300',
    description: 'Paletas de crema y helado cremoso',
  },

  'Subcat-6C-Paletas-Aguacrema': {
    emoji: '🍧',
    gradient: 'from-sky-300 to-blue-500',
    bgColor: 'bg-sky-50',
    borderColor: 'border-sky-200',
    hoverBg: 'hover:bg-sky-100',
    textColor: 'text-sky-600',
    ringColor: 'ring-sky-300',
    description: 'Paletas combinación agua y crema',
  },

  'Subcat-6D-Cassatas': {
    emoji: '🍨',
    gradient: 'from-indigo-300 to-purple-400',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
    hoverBg: 'hover:bg-indigo-100',
    textColor: 'text-indigo-600',
    ringColor: 'ring-indigo-300',
    description: 'Cassatas y helados en caja',
  },

  'Subcat-6E-Conos': {
    emoji: '🍦',
    gradient: 'from-violet-300 to-purple-400',
    bgColor: 'bg-violet-50',
    borderColor: 'border-violet-200',
    hoverBg: 'hover:bg-violet-100',
    textColor: 'text-violet-600',
    ringColor: 'ring-violet-300',
    description: 'Conos de helado individuales',
  },

  // ============================================
  // FALLBACK para categorías sin configuración
  // ============================================

  'default': {
    emoji: '📦',
    gradient: 'from-gray-300 to-gray-400',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    hoverBg: 'hover:bg-gray-100',
    textColor: 'text-gray-700',
    ringColor: 'ring-gray-300',
    description: 'Productos generales',
  },
};

/**
 * Get visual configuration for a category by name
 * Returns default config if category name not found
 */
export function getCategoryVisualConfig(
  categoryName: string | undefined
): CategoryVisualConfig {
  if (!categoryName) {
    return categoryVisualMap['default'];
  }

  return categoryVisualMap[categoryName] || categoryVisualMap['default'];
}

/**
 * Get visual configuration for a category by slug
 * Useful when working with URL slugs
 */
export function getCategoryVisualConfigBySlug(
  slug: string | undefined
): CategoryVisualConfig {
  if (!slug) {
    return categoryVisualMap['default'];
  }

  // Try to find by matching slug pattern (e.g., "categoria-1-bebidas")
  const key = Object.keys(categoryVisualMap).find(
    (k) => k.toLowerCase().replace(/\s+/g, '-') === slug.toLowerCase()
  );

  return key ? categoryVisualMap[key] : categoryVisualMap['default'];
}

/**
 * Check if a category has a custom visual configuration
 */
export function hasCategoryVisualConfig(categoryName: string): boolean {
  return categoryName in categoryVisualMap && categoryName !== 'default';
}

/**
 * Get all category names that have visual configurations
 */
export function getAllConfiguredCategories(): string[] {
  return Object.keys(categoryVisualMap).filter((key) => key !== 'default');
}

/**
 * Stats about configured categories
 */
export const categoryConfigStats = {
  total: Object.keys(categoryVisualMap).length - 1, // Exclude 'default'
  mainCategories: 6,
  subcategories: 21,
};

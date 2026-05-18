/**
 * Configuración visual (emoji + gradient + colores) por nombre de categoría.
 * Cubre las 7 raíces curadas y los tier-2 más representativos. El resto cae al fallback.
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

export const categoryVisualMap: Record<string, CategoryVisualConfig> = {
  // ============================================
  // RAÍCES (7)
  // ============================================
  'Confitería': {
    emoji: '🍬',
    gradient: 'from-pink-400 to-rose-500',
    bgColor: 'bg-pink-50',
    borderColor: 'border-pink-200',
    hoverBg: 'hover:bg-pink-100',
    textColor: 'text-pink-700',
    ringColor: 'ring-pink-300',
    description: 'Gomitas, caramelos, chupetes, chicles y más',
  },
  'Chocolatería': {
    emoji: '🍫',
    gradient: 'from-yellow-600 to-amber-800',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-300',
    hoverBg: 'hover:bg-amber-100',
    textColor: 'text-amber-800',
    ringColor: 'ring-amber-400',
    description: 'Tabletas, bombones e individuales',
  },
  'Heladería': {
    emoji: '🍦',
    gradient: 'from-sky-300 to-blue-500',
    bgColor: 'bg-sky-50',
    borderColor: 'border-sky-200',
    hoverBg: 'hover:bg-sky-100',
    textColor: 'text-sky-700',
    ringColor: 'ring-sky-300',
    description: 'Palitos, cassatas, potes y más',
  },
  'Bebidas y líquidos': {
    emoji: '🥤',
    gradient: 'from-cyan-400 to-blue-500',
    bgColor: 'bg-cyan-50',
    borderColor: 'border-cyan-200',
    hoverBg: 'hover:bg-cyan-100',
    textColor: 'text-cyan-700',
    ringColor: 'ring-cyan-300',
    description: 'Gaseosas, jugos, aguas, isotónicas y café',
  },
  'Cumpleaños': {
    emoji: '🎉',
    gradient: 'from-fuchsia-400 to-purple-500',
    bgColor: 'bg-fuchsia-50',
    borderColor: 'border-fuchsia-200',
    hoverBg: 'hover:bg-fuchsia-100',
    textColor: 'text-fuchsia-700',
    ringColor: 'ring-fuchsia-300',
    description: 'Cotillón, piñatas, Halloween, Pascua',
  },
  'Repostería': {
    emoji: '🍰',
    gradient: 'from-violet-400 to-purple-500',
    bgColor: 'bg-violet-50',
    borderColor: 'border-violet-200',
    hoverBg: 'hover:bg-violet-100',
    textColor: 'text-violet-700',
    ringColor: 'ring-violet-300',
    description: 'Coberturas, cremas, insumos y decoración',
  },
  'Snacks y Galletas': {
    emoji: '🥨',
    gradient: 'from-amber-400 to-orange-500',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    hoverBg: 'hover:bg-amber-100',
    textColor: 'text-amber-700',
    ringColor: 'ring-amber-300',
    description: 'Galletas, papas, alfajores, bizcochos',
  },

  // ============================================
  // TIER 2 — Confitería
  // ============================================
  'Gomitas': { emoji: '🐻', gradient: 'from-purple-400 to-violet-500', bgColor: 'bg-purple-50', borderColor: 'border-purple-200', hoverBg: 'hover:bg-purple-100', textColor: 'text-purple-700', ringColor: 'ring-purple-300', description: 'Gomitas dulces y ácidas' },
  'Caramelos y masticables': { emoji: '🍬', gradient: 'from-orange-400 to-red-500', bgColor: 'bg-orange-50', borderColor: 'border-orange-200', hoverBg: 'hover:bg-orange-100', textColor: 'text-orange-700', ringColor: 'ring-orange-300', description: 'Caramelos duros y blandos' },
  'Caramelos ácidos': { emoji: '🍋', gradient: 'from-lime-400 to-yellow-500', bgColor: 'bg-lime-50', borderColor: 'border-lime-200', hoverBg: 'hover:bg-lime-100', textColor: 'text-lime-700', ringColor: 'ring-lime-300', description: 'Caramelos ácidos y sour' },
  'Chupetes y paletas': { emoji: '🍭', gradient: 'from-red-400 to-pink-500', bgColor: 'bg-red-50', borderColor: 'border-red-200', hoverBg: 'hover:bg-red-100', textColor: 'text-red-700', ringColor: 'ring-red-300', description: 'Chupetes y lollipops' },
  'Chicles': { emoji: '🫧', gradient: 'from-emerald-300 to-teal-400', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-200', hoverBg: 'hover:bg-emerald-100', textColor: 'text-emerald-700', ringColor: 'ring-emerald-300', description: 'Chicles y gomas de mascar' },
  'Marshmallows': { emoji: '☁️', gradient: 'from-pink-300 to-rose-400', bgColor: 'bg-pink-50', borderColor: 'border-pink-200', hoverBg: 'hover:bg-pink-100', textColor: 'text-pink-600', ringColor: 'ring-pink-300', description: 'Marshmallows tradicionales y formas' },
  'Mentas': { emoji: '🌿', gradient: 'from-green-300 to-emerald-400', bgColor: 'bg-green-50', borderColor: 'border-green-200', hoverBg: 'hover:bg-green-100', textColor: 'text-green-700', ringColor: 'ring-green-300', description: 'Caramelos de menta' },
  'Turrones y mantecol': { emoji: '🍯', gradient: 'from-yellow-400 to-amber-600', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200', hoverBg: 'hover:bg-yellow-100', textColor: 'text-yellow-700', ringColor: 'ring-yellow-300', description: 'Turrones y mantecol' },
  'Popping boba': { emoji: '🧋', gradient: 'from-rose-300 to-pink-500', bgColor: 'bg-rose-50', borderColor: 'border-rose-200', hoverBg: 'hover:bg-rose-100', textColor: 'text-rose-700', ringColor: 'ring-rose-300', description: 'Popping boba y bubble tea' },
  'Artesanal': { emoji: '🎂', gradient: 'from-amber-300 to-orange-400', bgColor: 'bg-amber-50', borderColor: 'border-amber-200', hoverBg: 'hover:bg-amber-100', textColor: 'text-amber-700', ringColor: 'ring-amber-300', description: 'Productos artesanales Quelita' },

  // ============================================
  // TIER 2 — Chocolatería
  // ============================================
  'Tabletas': { emoji: '🍫', gradient: 'from-amber-500 to-amber-700', bgColor: 'bg-amber-50', borderColor: 'border-amber-300', hoverBg: 'hover:bg-amber-100', textColor: 'text-amber-800', ringColor: 'ring-amber-400', description: 'Tabletas y barras' },
  'Bombones': { emoji: '💝', gradient: 'from-red-400 to-rose-500', bgColor: 'bg-red-50', borderColor: 'border-red-200', hoverBg: 'hover:bg-red-100', textColor: 'text-red-700', ringColor: 'ring-red-300', description: 'Bombones y chocolates rellenos' },
  'Bolsas e individuales': { emoji: '🍬', gradient: 'from-orange-400 to-amber-600', bgColor: 'bg-orange-50', borderColor: 'border-orange-200', hoverBg: 'hover:bg-orange-100', textColor: 'text-orange-700', ringColor: 'ring-orange-300', description: 'Chocolates individuales y bolsas' },

  // ============================================
  // TIER 2 — Heladería
  // ============================================
  'Palito e individual': { emoji: '🍦', gradient: 'from-blue-300 to-indigo-400', bgColor: 'bg-blue-50', borderColor: 'border-blue-200', hoverBg: 'hover:bg-blue-100', textColor: 'text-blue-700', ringColor: 'ring-blue-300', description: 'Helados de palito y porción individual' },
  'Cassatas y tortas': { emoji: '🍨', gradient: 'from-indigo-300 to-purple-400', bgColor: 'bg-indigo-50', borderColor: 'border-indigo-200', hoverBg: 'hover:bg-indigo-100', textColor: 'text-indigo-700', ringColor: 'ring-indigo-300', description: 'Cassatas y tortas heladas' },
  'Pote': { emoji: '🥣', gradient: 'from-sky-400 to-cyan-500', bgColor: 'bg-sky-50', borderColor: 'border-sky-200', hoverBg: 'hover:bg-sky-100', textColor: 'text-sky-700', ringColor: 'ring-sky-300', description: 'Helado en pote 1L' },
  'Vasitos': { emoji: '🍧', gradient: 'from-cyan-300 to-blue-400', bgColor: 'bg-cyan-50', borderColor: 'border-cyan-200', hoverBg: 'hover:bg-cyan-100', textColor: 'text-cyan-700', ringColor: 'ring-cyan-300', description: 'Helados en vaso' },
  'Conos y barquillos': { emoji: '🍦', gradient: 'from-violet-300 to-purple-400', bgColor: 'bg-violet-50', borderColor: 'border-violet-200', hoverBg: 'hover:bg-violet-100', textColor: 'text-violet-700', ringColor: 'ring-violet-300', description: 'Conos y barquillos' },

  // ============================================
  // TIER 2 — Bebidas y líquidos
  // ============================================
  'Gaseosas': { emoji: '🥤', gradient: 'from-cyan-400 to-blue-500', bgColor: 'bg-cyan-50', borderColor: 'border-cyan-200', hoverBg: 'hover:bg-cyan-100', textColor: 'text-cyan-700', ringColor: 'ring-cyan-300', description: 'Bebidas carbonatadas' },
  'Jugos': { emoji: '🧃', gradient: 'from-orange-300 to-orange-500', bgColor: 'bg-orange-50', borderColor: 'border-orange-200', hoverBg: 'hover:bg-orange-100', textColor: 'text-orange-700', ringColor: 'ring-orange-300', description: 'Jugos y néctares' },
  'Aguas': { emoji: '💧', gradient: 'from-sky-300 to-blue-400', bgColor: 'bg-sky-50', borderColor: 'border-sky-200', hoverBg: 'hover:bg-sky-100', textColor: 'text-sky-700', ringColor: 'ring-sky-300', description: 'Aguas minerales y purificadas' },
  'Aguas saborizadas': { emoji: '💦', gradient: 'from-sky-400 to-cyan-500', bgColor: 'bg-sky-50', borderColor: 'border-sky-200', hoverBg: 'hover:bg-sky-100', textColor: 'text-sky-700', ringColor: 'ring-sky-300', description: 'Aguas con sabor' },
  'Energéticas e isotónicas': { emoji: '⚡', gradient: 'from-yellow-400 to-orange-500', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200', hoverBg: 'hover:bg-yellow-100', textColor: 'text-yellow-700', ringColor: 'ring-yellow-300', description: 'Energéticas e hidratantes deportivas' },
  'Lácteas': { emoji: '🥛', gradient: 'from-slate-300 to-blue-300', bgColor: 'bg-slate-50', borderColor: 'border-slate-200', hoverBg: 'hover:bg-slate-100', textColor: 'text-slate-700', ringColor: 'ring-slate-300', description: 'Bebidas lácteas' },
  'Té frío': { emoji: '🧋', gradient: 'from-amber-300 to-orange-400', bgColor: 'bg-amber-50', borderColor: 'border-amber-200', hoverBg: 'hover:bg-amber-100', textColor: 'text-amber-700', ringColor: 'ring-amber-300', description: 'Té listo para beber' },
  'Café': { emoji: '☕', gradient: 'from-amber-700 to-stone-700', bgColor: 'bg-stone-50', borderColor: 'border-stone-200', hoverBg: 'hover:bg-stone-100', textColor: 'text-stone-700', ringColor: 'ring-stone-300', description: 'Café instantáneo y especialidades' },

  // ============================================
  // TIER 2 — Cumpleaños
  // ============================================
  'Halloween': { emoji: '🎃', gradient: 'from-orange-500 to-purple-700', bgColor: 'bg-orange-50', borderColor: 'border-orange-300', hoverBg: 'hover:bg-orange-100', textColor: 'text-orange-700', ringColor: 'ring-orange-400', description: 'Especial Halloween' },
  'Pascua': { emoji: '🐰', gradient: 'from-yellow-300 to-pink-400', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200', hoverBg: 'hover:bg-yellow-100', textColor: 'text-yellow-700', ringColor: 'ring-yellow-300', description: 'Especial Pascua' },
  'Cotillón': { emoji: '🎊', gradient: 'from-pink-400 to-purple-500', bgColor: 'bg-pink-50', borderColor: 'border-pink-200', hoverBg: 'hover:bg-pink-100', textColor: 'text-pink-700', ringColor: 'ring-pink-300', description: 'Candy toys y cotillón' },
  'Piñatas y bolsones': { emoji: '🪅', gradient: 'from-fuchsia-400 to-pink-500', bgColor: 'bg-fuchsia-50', borderColor: 'border-fuchsia-200', hoverBg: 'hover:bg-fuchsia-100', textColor: 'text-fuchsia-700', ringColor: 'ring-fuchsia-300', description: 'Mix piñateros' },
  'Globos': { emoji: '🎈', gradient: 'from-red-400 to-pink-500', bgColor: 'bg-red-50', borderColor: 'border-red-200', hoverBg: 'hover:bg-red-100', textColor: 'text-red-700', ringColor: 'ring-red-300', description: 'Globos y decoración' },
  'Velas': { emoji: '🕯️', gradient: 'from-yellow-300 to-amber-500', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200', hoverBg: 'hover:bg-yellow-100', textColor: 'text-yellow-700', ringColor: 'ring-yellow-300', description: 'Velas de cumpleaños' },
  'Bolsas y empaque': { emoji: '🎁', gradient: 'from-rose-300 to-pink-400', bgColor: 'bg-rose-50', borderColor: 'border-rose-200', hoverBg: 'hover:bg-rose-100', textColor: 'text-rose-700', ringColor: 'ring-rose-300', description: 'Bolsas de regalo y dulces' },

  // ============================================
  // TIER 2 — Repostería
  // ============================================
  'Coberturas': { emoji: '🟫', gradient: 'from-amber-600 to-stone-700', bgColor: 'bg-amber-50', borderColor: 'border-amber-300', hoverBg: 'hover:bg-amber-100', textColor: 'text-amber-800', ringColor: 'ring-amber-400', description: 'Coberturas de chocolate' },
  'Cremas': { emoji: '🍶', gradient: 'from-yellow-200 to-amber-300', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200', hoverBg: 'hover:bg-yellow-100', textColor: 'text-yellow-700', ringColor: 'ring-yellow-300', description: 'Cremas para batir y decorar' },
  'Manjar': { emoji: '🍮', gradient: 'from-amber-400 to-orange-500', bgColor: 'bg-amber-50', borderColor: 'border-amber-200', hoverBg: 'hover:bg-amber-100', textColor: 'text-amber-700', ringColor: 'ring-amber-300', description: 'Manjar y dulce de leche' },
  'Insumos': { emoji: '🧁', gradient: 'from-violet-300 to-purple-400', bgColor: 'bg-violet-50', borderColor: 'border-violet-200', hoverBg: 'hover:bg-violet-100', textColor: 'text-violet-700', ringColor: 'ring-violet-300', description: 'Insumos varios de repostería' },
  'Decoración': { emoji: '🌸', gradient: 'from-pink-300 to-rose-400', bgColor: 'bg-pink-50', borderColor: 'border-pink-200', hoverBg: 'hover:bg-pink-100', textColor: 'text-pink-600', ringColor: 'ring-pink-300', description: 'Decoración para tortas' },

  // ============================================
  // TIER 2 — Snacks y Galletas
  // ============================================
  'Galletas dulces': { emoji: '🍪', gradient: 'from-amber-300 to-orange-400', bgColor: 'bg-amber-50', borderColor: 'border-amber-200', hoverBg: 'hover:bg-amber-100', textColor: 'text-amber-700', ringColor: 'ring-amber-300', description: 'Galletas dulces' },
  'Galletas saladas': { emoji: '🥨', gradient: 'from-yellow-400 to-amber-500', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200', hoverBg: 'hover:bg-yellow-100', textColor: 'text-yellow-700', ringColor: 'ring-yellow-300', description: 'Galletas saladas y crackers' },
  'Obleas': { emoji: '🧇', gradient: 'from-amber-300 to-yellow-500', bgColor: 'bg-amber-50', borderColor: 'border-amber-200', hoverBg: 'hover:bg-amber-100', textColor: 'text-amber-700', ringColor: 'ring-amber-300', description: 'Obleas y wafer' },
  'Alfajores': { emoji: '🥪', gradient: 'from-yellow-400 to-orange-500', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200', hoverBg: 'hover:bg-yellow-100', textColor: 'text-yellow-700', ringColor: 'ring-yellow-300', description: 'Alfajores rellenos' },
  'Salados': { emoji: '🌶️', gradient: 'from-red-400 to-orange-500', bgColor: 'bg-red-50', borderColor: 'border-red-200', hoverBg: 'hover:bg-red-100', textColor: 'text-red-700', ringColor: 'ring-red-300', description: 'Snacks salados' },
  'Papas fritas': { emoji: '🍟', gradient: 'from-yellow-400 to-orange-500', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200', hoverBg: 'hover:bg-yellow-100', textColor: 'text-yellow-700', ringColor: 'ring-yellow-300', description: 'Papas fritas' },
  'Maní': { emoji: '🥜', gradient: 'from-stone-400 to-amber-600', bgColor: 'bg-stone-50', borderColor: 'border-stone-200', hoverBg: 'hover:bg-stone-100', textColor: 'text-stone-700', ringColor: 'ring-stone-300', description: 'Maní y mezclas' },
  'Cabritas': { emoji: '🍿', gradient: 'from-yellow-300 to-amber-400', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200', hoverBg: 'hover:bg-yellow-100', textColor: 'text-yellow-700', ringColor: 'ring-yellow-300', description: 'Cabritas (palomitas)' },
  'Bizcochos y queques': { emoji: '🧁', gradient: 'from-orange-300 to-amber-500', bgColor: 'bg-orange-50', borderColor: 'border-orange-200', hoverBg: 'hover:bg-orange-100', textColor: 'text-orange-700', ringColor: 'ring-orange-300', description: 'Queques y bizcochos individuales' },

  // ============================================
  // FALLBACK
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

export function getCategoryVisualConfig(categoryName: string | undefined): CategoryVisualConfig {
  if (!categoryName) return categoryVisualMap['default'];
  return categoryVisualMap[categoryName] || categoryVisualMap['default'];
}

export function getCategoryVisualConfigBySlug(slug: string | undefined): CategoryVisualConfig {
  if (!slug) return categoryVisualMap['default'];
  const key = Object.keys(categoryVisualMap).find(
    (k) => k.toLowerCase().replace(/\s+/g, '-') === slug.toLowerCase()
  );
  return key ? categoryVisualMap[key] : categoryVisualMap['default'];
}

export function hasCategoryVisualConfig(categoryName: string): boolean {
  return categoryName in categoryVisualMap && categoryName !== 'default';
}

export function getAllConfiguredCategories(): string[] {
  return Object.keys(categoryVisualMap).filter((key) => key !== 'default');
}

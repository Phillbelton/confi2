import mongoose, { Document, Schema } from 'mongoose';

/**
 * Layout de la home pública: orden, visibilidad y configuración de secciones.
 *
 * Documento SINGLETON (key='home'): el orden es la posición en el array,
 * el guardado es atómico y el rollback trivial. Los TIPOS de sección y su
 * render viven en el frontend; acá se persiste qué instancias hay, en qué
 * orden y con qué config. Reordenar/ocultar/configurar vive en Mongo —
 * cero rebuild de imágenes Docker. Agregar un TIPO nuevo sí requiere deploy.
 *
 * Fase 2: las secciones de producto (carrusel/grilla) son INSTANCIAS
 * configurables (título, emoji, fuente, límite) y puede haber varias —
 * ej. un carrusel "Especial Navidad 🎄" apuntando a una colección.
 */

export const HOME_SECTION_TYPES = [
  'hero',
  'banner_zone',
  'collections',
  'static_cta',
  'product_carousel',
  'product_grid',
] as const;

export type HomeSectionType = (typeof HOME_SECTION_TYPES)[number];

/** Tipos únicos: debe existir EXACTAMENTE una sección de cada uno. */
export const SINGLETON_SECTION_TYPES = ['hero', 'collections', 'static_cta'] as const;

export const PRODUCT_SOURCES = [
  'featured',
  'on_sale',
  'newest',
  'popular',
  'collection',
] as const;

export type ProductSource = (typeof PRODUCT_SOURCES)[number];

export const BANNER_ZONE_PLACEMENTS = ['home_secondary', 'home_promo'] as const;

export interface HomeSectionConfig {
  /** banner_zone: qué zona de banners renderiza. */
  placement?: (typeof BANNER_ZONE_PLACEMENTS)[number];
  /** product_carousel / product_grid */
  title?: string;
  emoji?: string;
  source?: ProductSource;
  /** Requerido cuando source='collection'. */
  collectionSlug?: string;
  limit?: number;
}

export interface HomeSection {
  /** Identidad estable de la instancia (las canónicas usan su nombre). */
  id: string;
  type: HomeSectionType;
  active: boolean;
  config?: HomeSectionConfig;
}

/** Layout por defecto — espeja el orden histórico de la home. */
export const DEFAULT_HOME_SECTIONS: HomeSection[] = [
  { id: 'hero', type: 'hero', active: true },
  {
    id: 'offers',
    type: 'product_carousel',
    active: true,
    config: { title: 'Ofertas', emoji: '🔥', source: 'on_sale', limit: 8 },
  },
  {
    id: 'secondary_banners',
    type: 'banner_zone',
    active: true,
    config: { placement: 'home_secondary' },
  },
  {
    id: 'featured',
    type: 'product_carousel',
    active: true,
    config: { title: 'Destacados', emoji: '⭐', source: 'featured', limit: 8 },
  },
  { id: 'collections', type: 'collections', active: true },
  { id: 'wholesale_cta', type: 'static_cta', active: true },
  {
    id: 'newest',
    type: 'product_carousel',
    active: true,
    config: { title: 'Novedades', emoji: '✨', source: 'newest', limit: 8 },
  },
  {
    id: 'promo_banners',
    type: 'banner_zone',
    active: true,
    config: { placement: 'home_promo' },
  },
  {
    id: 'best_sellers',
    type: 'product_grid',
    active: true,
    config: { title: 'Más vendidos', emoji: '🏆', source: 'popular', limit: 5 },
  },
];

/**
 * Migración de docs Fase 1 ({key, active} sin config) al shape Fase 2.
 * Se aplica al LEER: el PUT siguiente ya persiste el formato nuevo.
 */
export function normalizeSections(raw: unknown[]): HomeSection[] {
  const defaultsById = new Map(DEFAULT_HOME_SECTIONS.map((s) => [s.id, s]));
  const out: HomeSection[] = [];
  for (const item of raw as Array<Record<string, unknown>>) {
    if (typeof item?.id === 'string' && typeof item?.type === 'string') {
      // Shape v2 — tal cual
      out.push(item as unknown as HomeSection);
    } else if (typeof item?.key === 'string') {
      // Shape v1 — derivar del default canónico, preservando active
      const base = defaultsById.get(item.key);
      if (base) out.push({ ...base, active: item.active !== false });
    }
  }
  return out.length > 0 ? out : DEFAULT_HOME_SECTIONS;
}

export interface IHomeLayout extends Document {
  key: 'home';
  sections: HomeSection[];
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const homeLayoutSchema = new Schema<IHomeLayout>(
  {
    key: {
      type: String,
      enum: ['home'],
      default: 'home',
      unique: true,
    },
    sections: [
      {
        _id: false,
        id: { type: String, required: true },
        type: { type: String, enum: HOME_SECTION_TYPES, required: true },
        active: { type: Boolean, default: true },
        config: {
          type: {
            placement: { type: String, enum: BANNER_ZONE_PLACEMENTS },
            title: String,
            emoji: String,
            source: { type: String, enum: PRODUCT_SOURCES },
            collectionSlug: String,
            limit: Number,
          },
          default: undefined,
          _id: false,
        },
      },
    ],
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const HomeLayout = mongoose.model<IHomeLayout>(
  'HomeLayout',
  homeLayoutSchema
);

export default HomeLayout;

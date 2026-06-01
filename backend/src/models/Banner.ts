import mongoose, { Schema, Document } from 'mongoose';

/**
 * Banner — contenido visual con link, gestionado por admin.
 *
 * Maneja heroes, banners promocionales y secciones con un solo modelo,
 * diferenciados por `placement`. Cada banner puede tener un link estructurado
 * (collection / product / category / external) que el frontend resuelve a URL.
 *
 * Schedule: si `startDate`/`endDate` están seteados, el banner solo aparece
 * en su ventana de tiempo. Útil para campañas (Halloween, Black Friday).
 *
 * Tamaño visual (legacy): `size` afectaba el span en el grid mosaic. El layout
 * de los placements de mosaico (home_promo, home_secondary) ahora se gobierna
 * por franjas — ver `rowOrder` / `cols` / `mobileMode` abajo. `size` se conserva
 * por compatibilidad pero ya no decide el layout (cada banner ocupa 1 celda).
 *
 * Franjas (rows): los banners de un placement de mosaico se agrupan en franjas
 * horizontales. Cada franja muestra `cols` banners en línea en desktop (1–4) y,
 * en mobile, los apila (`stack`) o los hace scroll horizontal (`scroll`).
 *  - rowOrder:   a qué franja pertenece (posición vertical, 0-based).
 *  - order:      posición del banner dentro de la franja.
 *  - cols:       columnas de la franja en desktop (denormalizado por franja).
 *  - mobileMode: layout mobile de la franja (denormalizado por franja).
 */

export type BannerPlacement =
  | 'home_hero'
  | 'home_promo'
  | 'home_secondary'
  | 'category_top'
  | 'collection_top';

export type BannerSize = 'normal' | 'wide' | 'tall' | 'hero';

export type BannerCols = 1 | 2 | 3 | 4;

export type BannerMobileMode = 'stack' | 'scroll';

export type BannerLinkType =
  | 'collection'
  | 'product'
  | 'category'
  | 'external'
  | 'none';

export interface IBannerLink {
  type: BannerLinkType;
  target?: string; // slug o URL completa según type
}

export interface IBanner extends Document {
  _id: mongoose.Types.ObjectId;
  placement: BannerPlacement;
  order: number;
  size: BannerSize;

  rowOrder: number;
  cols: BannerCols;
  mobileMode: BannerMobileMode;

  image: string;
  imageMobile?: string;

  title?: string;
  subtitle?: string;
  ctaText?: string;

  link: IBannerLink;

  active: boolean;
  startDate?: Date;
  endDate?: Date;

  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const bannerLinkSchema = new Schema<IBannerLink>(
  {
    type: {
      type: String,
      enum: ['collection', 'product', 'category', 'external', 'none'],
      required: true,
      default: 'none',
    },
    target: { type: String, trim: true },
  },
  { _id: false }
);

const bannerSchema = new Schema<IBanner>(
  {
    placement: {
      type: String,
      enum: ['home_hero', 'home_promo', 'home_secondary', 'category_top', 'collection_top'],
      required: true,
      index: true,
    },
    order: { type: Number, default: 0 },
    size: {
      type: String,
      enum: ['normal', 'wide', 'tall', 'hero'],
      default: 'normal',
    },

    rowOrder: { type: Number, default: 0 },
    cols: { type: Number, enum: [1, 2, 3, 4], default: 1 },
    mobileMode: {
      type: String,
      enum: ['stack', 'scroll'],
      default: 'stack',
    },

    image: { type: String, required: true, trim: true },
    imageMobile: { type: String, trim: true },

    title: { type: String, trim: true, maxlength: 120 },
    subtitle: { type: String, trim: true, maxlength: 200 },
    ctaText: { type: String, trim: true, maxlength: 40 },

    link: { type: bannerLinkSchema, required: true, default: () => ({ type: 'none' }) },

    active: { type: Boolean, default: true, index: true },
    startDate: { type: Date },
    endDate: { type: Date },

    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

bannerSchema.index({ placement: 1, rowOrder: 1, order: 1 });
bannerSchema.index({ placement: 1, active: 1 });

export const Banner = mongoose.model<IBanner>('Banner', bannerSchema);
export default Banner;

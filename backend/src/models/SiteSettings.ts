import mongoose, { Document, Schema } from 'mongoose';

/**
 * Ajustes globales del sitio. Documento SINGLETON (key='site'): un solo doc,
 * guardado atómico. Pensado para settings chicos y editables sin redeploy
 * (mismo espíritu que HomeLayout). Hoy contiene la variante de presentación
 * de la card del catálogo; se puede ir extendiendo con más campos.
 *
 * `catalogPresentationVariant`:
 *   - 'B' = selector inline + el mejor tramo en una línea
 *   - 'C' = selector inline + escalera de tramos desplegable
 *   - 'D' = bottom-sheet "Ver presentaciones"
 * El render de cada variante vive en el frontend (ProductCardM); acá solo se
 * persiste cuál está activa.
 */

export const CATALOG_PRESENTATION_VARIANTS = ['B', 'C', 'D'] as const;
export type CatalogPresentationVariant =
  (typeof CATALOG_PRESENTATION_VARIANTS)[number];

export const DEFAULT_SITE_SETTINGS = {
  catalogPresentationVariant: 'D' as CatalogPresentationVariant,
};

export interface ISiteSettings extends Document {
  key: 'site';
  catalogPresentationVariant: CatalogPresentationVariant;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const siteSettingsSchema = new Schema<ISiteSettings>(
  {
    key: {
      type: String,
      enum: ['site'],
      default: 'site',
      unique: true,
    },
    catalogPresentationVariant: {
      type: String,
      enum: CATALOG_PRESENTATION_VARIANTS,
      default: DEFAULT_SITE_SETTINGS.catalogPresentationVariant,
    },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const SiteSettings = mongoose.model<ISiteSettings>(
  'SiteSettings',
  siteSettingsSchema
);

export default SiteSettings;

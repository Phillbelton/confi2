import mongoose, { Document, Schema } from 'mongoose';

/**
 * Layout de la home pública: orden y visibilidad de las secciones.
 *
 * Documento SINGLETON (key='home'): el orden es la posición en el array,
 * el guardado es atómico y el rollback trivial. Los tipos de sección y su
 * render viven en el frontend — acá solo se persiste qué se muestra y en
 * qué orden. Agregar un TIPO nuevo de sección requiere deploy; reordenar
 * u ocultar, no (vive en Mongo, cero rebuild de imágenes Docker).
 */

/** Claves canónicas de las secciones de la home. Mantener sincronizadas
 *  con DEFAULT_HOME_SECTIONS y con el renderer del frontend. */
export const HOME_SECTION_KEYS = [
  'hero',
  'offers',
  'secondary_banners',
  'featured',
  'collections',
  'wholesale_cta',
  'newest',
  'promo_banners',
  'best_sellers',
] as const;

export type HomeSectionKey = (typeof HOME_SECTION_KEYS)[number];

export interface HomeLayoutSection {
  key: HomeSectionKey;
  active: boolean;
}

/** Orden por defecto (espeja el orden histórico hardcodeado de la home). */
export const DEFAULT_HOME_SECTIONS: HomeLayoutSection[] = HOME_SECTION_KEYS.map(
  (key) => ({ key, active: true })
);

export interface IHomeLayout extends Document {
  key: 'home';
  sections: HomeLayoutSection[];
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
        key: { type: String, enum: HOME_SECTION_KEYS, required: true },
        active: { type: Boolean, default: true },
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

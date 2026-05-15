import mongoose, { Schema, Document } from 'mongoose';

/**
 * ProductImage — registro PERSISTENTE de imágenes de productos, keyed por SKU.
 *
 * Vive independiente de Product. Cuando se hace wipe (Product.deleteMany) y
 * re-import desde Excel, los Product recreados con el mismo SKU son
 * automáticamente re-hidratados con sus imágenes desde acá — el admin NO
 * tiene que re-subir nada.
 *
 * Estructura paralela a Product.images[]: las URLs en este registro deben
 * coincidir con las que termina viendo el cliente. El controlador de upload
 * escribe en ambos: ProductImage (verdad persistente) y Product.images
 * (cache denormalizado para queries rápidas).
 *
 * Borrado:
 *  - Eliminar un Product NO borra sus ProductImage — supervivencia es la feature.
 *  - Si el admin quiere limpiar imágenes huérfanas (SKUs sin Product asociado),
 *    existe un endpoint dedicado /product-images/cleanup.
 */
export interface IProductImage extends Document {
  _id: mongoose.Types.ObjectId;
  sku: string;
  url: string;
  order: number;
  altText?: string;
  uploadedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const productImageSchema = new Schema<IProductImage>(
  {
    sku: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    url: {
      type: String,
      required: true,
      trim: true,
    },
    order: {
      type: Number,
      default: 0,
      min: 0,
    },
    altText: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

// Índice compuesto para fetch rápido y orden estable
productImageSchema.index({ sku: 1, order: 1 });

// Una misma URL no debería duplicarse para el mismo SKU
productImageSchema.index({ sku: 1, url: 1 }, { unique: true });

export const ProductImage = mongoose.model<IProductImage>('ProductImage', productImageSchema);
export default ProductImage;

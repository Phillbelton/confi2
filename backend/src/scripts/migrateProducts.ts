import mongoose from 'mongoose';
import dotenv from 'dotenv';
import slugify from 'slugify';
import ProductParent from '../models/ProductParent';
import ProductVariant from '../models/ProductVariant';

dotenv.config();

// Interface para productos de la DB test
interface OldProduct {
  _id: mongoose.Types.ObjectId;
  name: string;
  price: number;
  category?: mongoose.Types.ObjectId;
  categories?: mongoose.Types.ObjectId[];
  brand?: mongoose.Types.ObjectId;
  imageUrl?: string;
  images?: string[];
  description?: string;
  stock: number;
  isActive?: boolean;
  featured?: boolean;
  discountId?: mongoose.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

async function migrateProducts() {
  try {
    console.log('🔄 Iniciando migración de productos...\n');

    // Conectar a MongoDB
    const uri = process.env.MONGODB_URI || '';
    if (!uri) {
      throw new Error('MONGODB_URI no está configurada');
    }

    await mongoose.connect(uri);
    console.log('✅ Conectado a MongoDB Atlas\n');

    // Obtener productos de la DB "test"
    const testDB = mongoose.connection.useDb('test');
    const OldProductModel = testDB.model('Product', new mongoose.Schema({}, { strict: false }));

    const oldProducts = await OldProductModel.find({}).lean() as unknown as OldProduct[];
    console.log(`📦 Encontrados ${oldProducts.length} productos en DB "test"\n`);

    if (oldProducts.length === 0) {
      console.log('⚠️  No hay productos para migrar');
      return;
    }

    // Cambiar a DB "confiteria-quelita"
    const targetDB = mongoose.connection.useDb('confiteria_quelita');

    // Registrar modelos globalmente primero para que los hooks funcionen
    let ProductParentModel, ProductVariantModel;

    try {
      // Intentar obtener modelos existentes
      ProductParentModel = mongoose.model('ProductParent');
      ProductVariantModel = mongoose.model('ProductVariant');
    } catch {
      // Si no existen, registrarlos
      ProductParentModel = mongoose.model('ProductParent', ProductParent.schema);
      ProductVariantModel = mongoose.model('ProductVariant', ProductVariant.schema);
    }

    // Cambiar la DB del modelo a confiteria_quelita
    ProductParentModel = targetDB.model('ProductParent', ProductParent.schema);
    ProductVariantModel = targetDB.model('ProductVariant', ProductVariant.schema);

    // Limpiar productos existentes para evitar duplicados
    console.log('🗑️  Limpiando productos existentes...');
    await ProductVariantModel.deleteMany({});
    await ProductParentModel.deleteMany({});
    console.log('✅ Productos anteriores eliminados\n');

    let successCount = 0;
    let errorCount = 0;

    // Migrar cada producto
    for (const oldProduct of oldProducts) {
      try {
        console.log(`\n🔄 Migrando: ${oldProduct.name}...`);

        // Preparar categorías
        let categories: mongoose.Types.ObjectId[] = [];
        if (oldProduct.categories && oldProduct.categories.length > 0) {
          categories = oldProduct.categories;
        } else if (oldProduct.category) {
          categories = [oldProduct.category];
        }

        if (categories.length === 0) {
          console.log(`⚠️  ${oldProduct.name} no tiene categorías, usando categoría por defecto`);
          // Crear o usar categoría "Sin categoría"
          const defaultCat = await targetDB.model('Category', new mongoose.Schema({
            name: String,
            slug: String,
            active: Boolean
          })).findOneAndUpdate(
            { slug: 'sin-categoria' },
            {
              name: 'Sin categoría',
              slug: 'sin-categoria',
              active: true,
              description: 'Productos sin categoría asignada'
            },
            { upsert: true, new: true }
          );
          categories = [defaultCat._id];
        }

        // Preparar imágenes
        const images: string[] = [];
        if (oldProduct.images && oldProduct.images.length > 0) {
          images.push(...oldProduct.images);
        } else if (oldProduct.imageUrl) {
          images.push(oldProduct.imageUrl);
        }

        // Preparar descripción (mínimo 10 caracteres)
        let description = oldProduct.description || oldProduct.name;
        if (description.length < 10) {
          description = `${description} - Producto disponible en nuestra tienda`;
        }

        // Crear ProductParent
        const productParent = await ProductParentModel.create({
          name: oldProduct.name,
          description: description,
          categories: categories,
          brand: oldProduct.brand,
          images: images,
          tags: [],
          variantAttributes: [], // Sin variantes
          featured: oldProduct.featured || false,
          active: oldProduct.isActive !== false,
          views: 0,
        });

        console.log(`  ✅ ProductParent creado: ${productParent._id}`);

        // Generar SKU único
        const sku = `SKU-${oldProduct._id.toString().substring(18).toUpperCase()}`;

        // Generar slug único para variant (con timestamp para evitar duplicados)
        const baseSlug = slugify(oldProduct.name, {
          lower: true,
          strict: true,
          remove: /[*+~.()'"!:@]/g,
        });
        const variantSlug = `${baseSlug}-${Date.now()}`;

        // Crear ProductVariant directamente insertando en la colección para evitar hooks
        const variantData = {
          parentProduct: productParent._id,
          sku: sku,
          slug: variantSlug,
          attributes: new Map(), // Sin variantes = Map vacío
          name: oldProduct.name,
          description: description,
          price: oldProduct.price,
          stock: oldProduct.stock || 0,
          images: images.length > 0 ? images : ['/images/placeholder.png'],
          trackStock: true,
          allowBackorder: false,
          lowStockThreshold: 5,
          active: oldProduct.isActive !== false,
          order: 0,
          views: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        // Insertar directamente sin ejecutar hooks
        const result = await targetDB.collection('productvariants').insertOne(variantData);
        const productVariant = { ...variantData, _id: result.insertedId };

        console.log(`  ✅ ProductVariant creado: ${productVariant.sku}`);
        console.log(`  💰 Precio: $${oldProduct.price} | 📦 Stock: ${oldProduct.stock}`);

        successCount++;

      } catch (error: any) {
        console.error(`  ❌ Error migrando ${oldProduct.name}:`, error.message);
        errorCount++;
      }
    }

    // Resumen
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMEN DE MIGRACIÓN');
    console.log('='.repeat(60));
    console.log(`✅ Exitosos: ${successCount}`);
    console.log(`❌ Errores: ${errorCount}`);
    console.log(`📦 Total procesados: ${oldProducts.length}`);
    console.log('='.repeat(60) + '\n');

    console.log('✅ Migración completada!\n');

  } catch (error: any) {
    console.error('❌ Error fatal en migración:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
  }
}

// Ejecutar
if (require.main === module) {
  migrateProducts();
}

export default migrateProducts;

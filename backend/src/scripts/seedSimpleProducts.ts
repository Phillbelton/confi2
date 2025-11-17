import mongoose from 'mongoose';
import dotenv from 'dotenv';
import ProductParent from '../models/ProductParent';
import ProductVariant from '../models/ProductVariant';
import { Category } from '../models/Category';
import { Brand } from '../models/Brand';

dotenv.config();

/**
 * Script para probar productos SIMPLES/UNITARIOS (sin variantes)
 * Crea productos padre sin variantAttributes y automáticamente crea
 * la variante default asociada
 */

interface SimpleProductData {
  name: string;
  description: string;
  categoryName: string;
  brandName: string;
  price: number;
  stock: number;
  images?: string[];
  tags?: string[];
  featured?: boolean;
  sku?: string;
  lowStockThreshold?: number;
  trackStock?: boolean;
  allowBackorder?: boolean;
}

const simpleProducts: SimpleProductData[] = [
  // Chocolates artesanales unitarios
  {
    name: 'Bombón de Chocolate Negro',
    description: 'Delicioso bombón relleno de ganache de chocolate negro 70% cacao. Producto artesanal elaborado a mano.',
    categoryName: 'Chocolates Artesanales',
    brandName: 'Cacao Noble',
    price: 2500,
    stock: 150,
    images: ['/uploads/chocolates/bombon-negro.jpg'],
    tags: ['chocolate', 'bombón', 'artesanal', 'premium'],
    featured: true,
    lowStockThreshold: 20,
  },
  {
    name: 'Trufa de Chocolate con Almendras',
    description: 'Exquisita trufa de chocolate con leche rellena de pasta de almendras tostadas.',
    categoryName: 'Chocolates Artesanales',
    brandName: 'Cacao Noble',
    price: 3000,
    stock: 100,
    images: ['/uploads/chocolates/trufa-almendras.jpg'],
    tags: ['chocolate', 'trufa', 'almendras', 'premium'],
    lowStockThreshold: 15,
  },
  {
    name: 'Chocolate Caliente Premium',
    description: 'Mezcla premium para preparar chocolate caliente. Contiene cacao puro 80%, azúcar de caña y vainilla natural.',
    categoryName: 'Chocolates Artesanales',
    brandName: 'Cacao Noble',
    price: 8500,
    stock: 80,
    images: ['/uploads/chocolates/chocolate-caliente.jpg'],
    tags: ['chocolate', 'bebida', 'cacao', 'premium'],
    featured: true,
    lowStockThreshold: 10,
  },
  {
    name: 'Caja de Bombones Surtidos',
    description: 'Elegante caja con 12 bombones surtidos de diferentes sabores: chocolate negro, con leche, avellanas y frutos rojos.',
    categoryName: 'Chocolates Artesanales',
    brandName: 'Cacao Noble',
    price: 15000,
    stock: 50,
    images: ['/uploads/chocolates/caja-surtidos.jpg'],
    tags: ['chocolate', 'bombones', 'regalo', 'premium', 'caja'],
    featured: true,
    lowStockThreshold: 5,
  },
  {
    name: 'Barra de Chocolate Blanco con Fresas',
    description: 'Barra de 100g de chocolate blanco belga con trozos de fresa deshidratada.',
    categoryName: 'Chocolates Artesanales',
    brandName: 'Cacao Noble',
    price: 7500,
    stock: 120,
    images: ['/uploads/chocolates/blanco-fresas.jpg'],
    tags: ['chocolate', 'blanco', 'fresas', 'barra'],
    lowStockThreshold: 15,
  },
  {
    name: 'Chocolate con Leche y Avellanas',
    description: 'Barra de 90g de chocolate con leche premium con avellanas enteras tostadas.',
    categoryName: 'Chocolates Artesanales',
    brandName: 'Cacao Noble',
    price: 6500,
    stock: 200,
    images: ['/uploads/chocolates/leche-avellanas.jpg'],
    tags: ['chocolate', 'avellanas', 'leche', 'barra'],
    lowStockThreshold: 25,
  },
  {
    name: 'Napolitanas de Chocolate',
    description: 'Paquete de 10 napolitanas de chocolate negro 60% cacao. Ideal para acompañar café o té.',
    categoryName: 'Chocolates Artesanales',
    brandName: 'Cacao Noble',
    price: 4500,
    stock: 150,
    images: ['/uploads/chocolates/napolitanas.jpg'],
    tags: ['chocolate', 'napolitanas', 'café'],
    lowStockThreshold: 20,
  },
  {
    name: 'Corazón de Chocolate Relleno',
    description: 'Corazón de chocolate negro relleno de caramelo salado. Perfecto para regalar.',
    categoryName: 'Chocolates Artesanales',
    brandName: 'Cacao Noble',
    price: 5000,
    stock: 60,
    images: ['/uploads/chocolates/corazon-relleno.jpg'],
    tags: ['chocolate', 'corazón', 'regalo', 'caramelo'],
    featured: true,
    lowStockThreshold: 10,
  },
  {
    name: 'Chocolate Ruby Natural',
    description: 'Barra de 80g de chocolate ruby, el cuarto tipo de chocolate. Sabor afrutado natural sin colorantes.',
    categoryName: 'Chocolates Artesanales',
    brandName: 'Cacao Noble',
    price: 12000,
    stock: 40,
    images: ['/uploads/chocolates/ruby.jpg'],
    tags: ['chocolate', 'ruby', 'premium', 'exclusivo'],
    featured: true,
    lowStockThreshold: 5,
  },
  {
    name: 'Chocolate Bitter 90% Cacao',
    description: 'Barra de 100g de chocolate extra bitter con 90% de cacao puro. Para verdaderos amantes del chocolate intenso.',
    categoryName: 'Chocolates Artesanales',
    brandName: 'Cacao Noble',
    price: 8000,
    stock: 90,
    images: ['/uploads/chocolates/bitter-90.jpg'],
    tags: ['chocolate', 'bitter', 'intenso', 'premium'],
    lowStockThreshold: 10,
  },
];

async function seedSimpleProducts() {
  try {
    // Conectar a MongoDB
    const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/confiteria';
    await mongoose.connect(MONGO_URI);
    console.log('✅ Conectado a MongoDB');

    // Limpiar productos existentes
    console.log('\n🗑️  Limpiando productos existentes...');
    await ProductVariant.deleteMany({});
    await ProductParent.deleteMany({});
    console.log('✅ Productos eliminados');

    // Crear categoría y marca si no existen
    console.log('\n📁 Verificando categoría y marca...');

    let category = await Category.findOne({ name: 'Chocolates Artesanales' });
    if (!category) {
      category = await Category.create({
        name: 'Chocolates Artesanales',
        description: 'Chocolates premium hechos a mano con ingredientes de primera calidad',
        color: '#8B4513',
        order: 1,
        active: true,
      });
      console.log('✅ Categoría "Chocolates Artesanales" creada');
    } else {
      console.log('✅ Categoría "Chocolates Artesanales" encontrada');
    }

    let brand = await Brand.findOne({ name: 'Cacao Noble' });
    if (!brand) {
      brand = await Brand.create({
        name: 'Cacao Noble',
        logo: '/uploads/brands/cacao-noble.jpg',
        active: true,
      });
      console.log('✅ Marca "Cacao Noble" creada');
    } else {
      console.log('✅ Marca "Cacao Noble" encontrada');
    }

    // Crear productos simples
    console.log('\n🍫 Creando productos simples (sin variantes)...');
    let successCount = 0;
    let errorCount = 0;

    for (const productData of simpleProducts) {
      try {
        // Crear ProductParent (sin variantAttributes)
        const parent = await ProductParent.create({
          name: productData.name,
          description: productData.description,
          categories: [category._id],
          brand: brand._id,
          images: productData.images || [],
          tags: productData.tags || [],
          featured: productData.featured || false,
          variantAttributes: [], // Sin atributos de variación = producto simple
          tieredDiscounts: [],
          active: true,
        });

        // Crear variante default automáticamente
        const variant = await ProductVariant.create({
          parentProduct: parent._id,
          sku: productData.sku, // Se autogenera si no se proporciona
          attributes: {}, // Sin atributos
          price: productData.price,
          stock: productData.stock,
          images: productData.images || [],
          trackStock: productData.trackStock !== false,
          allowBackorder: productData.allowBackorder !== false,
          lowStockThreshold: productData.lowStockThreshold || 5,
          active: true,
        });

        console.log(`  ✅ ${productData.name}`);
        console.log(`     Parent ID: ${parent._id}`);
        console.log(`     Variant ID: ${variant._id}`);
        console.log(`     SKU: ${variant.sku}`);
        console.log(`     Slug: ${variant.slug}`);
        console.log(`     Precio: Gs. ${productData.price.toLocaleString()}`);
        console.log(`     Stock: ${productData.stock} unidades`);
        console.log('');

        successCount++;
      } catch (error: any) {
        console.error(`  ❌ Error creando ${productData.name}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n📊 Resumen:');
    console.log(`  ✅ Productos creados exitosamente: ${successCount}`);
    console.log(`  ❌ Errores: ${errorCount}`);

    // Verificar en base de datos
    const totalParents = await ProductParent.countDocuments();
    const totalVariants = await ProductVariant.countDocuments();
    console.log(`\n📦 Total en BD:`);
    console.log(`  - ProductParents: ${totalParents}`);
    console.log(`  - ProductVariants: ${totalVariants}`);

    // Mostrar ejemplos
    console.log('\n🔍 Verificando algunos productos:');
    const sampleProducts = await ProductParent.find().limit(3).populate('brand categories');
    for (const product of sampleProducts) {
      const variants = await ProductVariant.find({ parentProduct: product._id });
      console.log(`\n  📦 ${product.name}`);
      console.log(`     Categorías: ${product.categories.map((c: any) => c.name).join(', ')}`);
      console.log(`     Marca: ${(product.brand as any)?.name}`);
      console.log(`     Variantes: ${variants.length}`);
      console.log(`     Featured: ${product.featured ? 'Sí' : 'No'}`);
    }

    console.log('\n✅ Seed de productos simples completado exitosamente!');
  } catch (error) {
    console.error('\n❌ Error en seed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Desconectado de MongoDB');
  }
}

// Ejecutar el seed
seedSimpleProducts();

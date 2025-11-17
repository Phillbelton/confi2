import request from 'supertest';
import app from '../../server';
import { createTestUser, generateAuthToken, createTestCategory, createTestBrand } from '../setup/testUtils';
import ProductParent from '../../models/ProductParent';
import ProductVariant from '../../models/ProductVariant';

/**
 * Tests para productos SIMPLES/UNITARIOS (sin variantes)
 *
 * Un producto simple es aquel que:
 * - Tiene variantAttributes vacío en el ProductParent
 * - Se crea automáticamente UNA SOLA variante default
 * - La variante tiene attributes vacío
 */

describe('Simple Products - Products without variants', () => {
  let adminUser: any;
  let adminToken: string;
  let chocolateCategory: any;
  let chocolateBrand: any;

  beforeAll(async () => {
    // Crear usuario admin
    adminUser = await createTestUser({
      name: 'Admin Chocolatier',
      email: 'admin@simple-products.com',
      role: 'admin',
    });
    adminToken = generateAuthToken(adminUser);

    // Crear categoría
    chocolateCategory = await createTestCategory({
      name: 'Chocolates Artesanales',
    });

    // Crear marca
    chocolateBrand = await createTestBrand({
      name: 'Cacao Noble',
    });
  });

  beforeEach(async () => {
    // Limpiar productos antes de cada test
    await ProductParent.deleteMany({});
    await ProductVariant.deleteMany({});
  });

  // ==================== Creación de productos simples ====================

  describe('ProductParent - Create simple products', () => {
    it('should create simple product without variantAttributes', async () => {
      const response = await request(app)
        .post('/api/products/parents')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Bombón de Chocolate Negro',
          description: 'Delicioso bombón relleno de ganache de chocolate negro 70% cacao',
          categories: [chocolateCategory._id],
          brand: chocolateBrand._id,
          images: ['/uploads/chocolates/bombon-negro.jpg'],
          tags: [],
          featured: true,
          variantAttributes: [], // Sin atributos = producto simple
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.productParent).toHaveProperty('_id');
      expect(response.body.data.productParent.name).toBe('Bombón de Chocolate Negro');
      expect(response.body.data.productParent.variantAttributes).toHaveLength(0);
      expect(response.body.data.productParent.featured).toBe(true);

      // Verificar en base de datos
      const parent = await ProductParent.findById(response.body.data.productParent._id);
      expect(parent).toBeTruthy();
      expect(parent?.variantAttributes).toHaveLength(0);
    });

    it('should create simple product without variantAttributes field (defaults to empty)', async () => {
      const response = await request(app)
        .post('/api/products/parents')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Trufa de Chocolate con Almendras',
          description: 'Exquisita trufa de chocolate con leche rellena de pasta de almendras',
          categories: [chocolateCategory._id],
          brand: chocolateBrand._id,
          images: ['/uploads/chocolates/trufa-almendras.jpg'],
          // variantAttributes no incluido - debe default a []
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.productParent.variantAttributes).toHaveLength(0);
    });

    it('should create multiple simple products', async () => {
      const products = [
        {
          name: 'Chocolate Caliente Premium',
          description: 'Mezcla premium para preparar chocolate caliente',
          categories: [chocolateCategory._id],
          brand: chocolateBrand._id,
          variantAttributes: [],
        },
        {
          name: 'Caja de Bombones Surtidos',
          description: 'Elegante caja con 12 bombones surtidos',
          categories: [chocolateCategory._id],
          brand: chocolateBrand._id,
          variantAttributes: [],
        },
      ];

      for (const product of products) {
        const response = await request(app)
          .post('/api/products/parents')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(product)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data.productParent.variantAttributes).toHaveLength(0);
      }

      const count = await ProductParent.countDocuments();
      expect(count).toBe(2);
    });
  });

  // ==================== Creación de variante default ====================

  describe('ProductVariant - Default variant for simple products', () => {
    let simpleProductParent: any;

    beforeEach(async () => {
      // Crear producto padre simple
      const parentResponse = await request(app)
        .post('/api/products/parents')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Barra de Chocolate Blanco con Fresas',
          description: 'Barra de 100g de chocolate blanco belga con fresas',
          categories: [chocolateCategory._id],
          brand: chocolateBrand._id,
          images: ['/uploads/chocolates/blanco-fresas.jpg'],
          variantAttributes: [],
        });

      simpleProductParent = parentResponse.body.data.productParent;
    });

    it('should create default variant with empty attributes', async () => {
      const response = await request(app)
        .post('/api/products/variants')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          parentProduct: simpleProductParent._id,
          attributes: {}, // Sin atributos para producto simple
          price: 7500,
          stock: 120,
          images: ['/uploads/chocolates/blanco-fresas.jpg'],
          lowStockThreshold: 15,
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.price).toBe(7500);
      expect(response.body.data.stock).toBe(120);
      expect(response.body.data.lowStockThreshold).toBe(15);

      // Verificar en base de datos
      const variant = await ProductVariant.findById(response.body.data._id);
      expect(variant).toBeTruthy();

      // Verificar que attributes está vacío
      const attributes = variant?.attributes;
      expect(attributes).toBeDefined();
      if (attributes instanceof Map) {
        expect(attributes.size).toBe(0);
      } else {
        expect(Object.keys(attributes as any).length).toBe(0);
      }
    });

    it('should auto-generate SKU for simple product variant', async () => {
      const response = await request(app)
        .post('/api/products/variants')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          parentProduct: simpleProductParent._id,
          attributes: {},
          price: 7500,
          stock: 120,
          // SKU no proporcionado - debe autogenerarse
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.sku).toBeTruthy();
      expect(response.body.data.sku).toMatch(/^[A-Z0-9-]+$/);
    });

    it('should auto-generate slug for simple product variant', async () => {
      const response = await request(app)
        .post('/api/products/variants')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          parentProduct: simpleProductParent._id,
          attributes: {},
          price: 7500,
          stock: 120,
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.slug).toBeTruthy();
      expect(response.body.data.slug).toContain('barra-de-chocolate-blanco-con-fresas');
    });

    it('should allow multiple variants for simple products with empty attributes', async () => {
      // Crear primera variante
      const variant1 = await request(app)
        .post('/api/products/variants')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          parentProduct: simpleProductParent._id,
          attributes: {},
          price: 7500,
          stock: 120,
        })
        .expect(201);

      // Crear segunda variante - esto es permitido (aunque no es común en productos simples)
      const variant2 = await request(app)
        .post('/api/products/variants')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          parentProduct: simpleProductParent._id,
          attributes: {},
          price: 8000,
          stock: 50,
        })
        .expect(201);

      expect(variant1.body.success).toBe(true);
      expect(variant2.body.success).toBe(true);
      expect(variant1.body.data._id).not.toBe(variant2.body.data._id);

      // Verificar que ambas variantes existen
      const variantCount = await ProductVariant.countDocuments({
        parentProduct: simpleProductParent._id,
      });
      expect(variantCount).toBe(2);
    });
  });

  // ==================== Operaciones sobre productos simples ====================

  describe('Simple Products - Operations', () => {
    let simpleProduct: any;
    let simpleVariant: any;

    beforeEach(async () => {
      // Crear producto simple completo
      const parentResponse = await request(app)
        .post('/api/products/parents')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Chocolate con Leche y Avellanas',
          description: 'Barra de 90g de chocolate con leche premium',
          categories: [chocolateCategory._id],
          brand: chocolateBrand._id,
          images: ['/uploads/chocolates/leche-avellanas.jpg'],
          variantAttributes: [],
        });

      simpleProduct = parentResponse.body.data.productParent;

      const variantResponse = await request(app)
        .post('/api/products/variants')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          parentProduct: simpleProduct._id,
          attributes: {},
          price: 6500,
          stock: 200,
          lowStockThreshold: 25,
        });

      simpleVariant = variantResponse.body.data;
    });

    it('should update stock for simple product variant', async () => {
      const response = await request(app)
        .patch(`/api/products/variants/${simpleVariant._id}/stock`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          stock: 150,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.stock).toBe(150);
    });

    it('should update price for simple product variant', async () => {
      const response = await request(app)
        .put(`/api/products/variants/${simpleVariant._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          price: 7000,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.price).toBe(7000);
    });

    it('should get simple product by ID', async () => {
      const response = await request(app)
        .get(`/api/products/parents/${simpleProduct._id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Chocolate con Leche y Avellanas');
      expect(response.body.data.variantAttributes).toHaveLength(0);
    });

    it('should get simple product variant by ID', async () => {
      const response = await request(app)
        .get(`/api/products/variants/${simpleVariant._id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.price).toBe(6500);
      expect(response.body.data.stock).toBe(200);
    });

    it('should get simple product variant by SKU', async () => {
      const response = await request(app)
        .get(`/api/products/variants/sku/${simpleVariant.sku}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.sku).toBe(simpleVariant.sku);
    });

    it('should not delete the only active variant of a product', async () => {
      // Intentar eliminar la única variante - debería fallar
      const response = await request(app)
        .delete(`/api/products/variants/${simpleVariant._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('única variante activa');
    });

    it('should soft delete variant when there are multiple variants', async () => {
      // Crear segunda variante
      const variant2Response = await request(app)
        .post('/api/products/variants')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          parentProduct: simpleProduct._id,
          attributes: {},
          price: 7000,
          stock: 50,
        });

      const variant2 = variant2Response.body.data;

      // Ahora podemos eliminar la primera variante
      const response = await request(app)
        .delete(`/api/products/variants/${simpleVariant._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verificar que fue soft deleted (active: false)
      const variant = await ProductVariant.findById(simpleVariant._id);
      expect(variant).toBeTruthy();
      expect(variant?.active).toBe(false);
    });

    it('should soft delete simple product parent', async () => {
      const response = await request(app)
        .delete(`/api/products/parents/${simpleProduct._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verificar que fue soft deleted (active: false)
      const parent = await ProductParent.findById(simpleProduct._id);
      expect(parent).toBeTruthy();
      expect(parent?.active).toBe(false);

      // Verificar que las variantes también fueron desactivadas
      const variants = await ProductVariant.find({ parentProduct: simpleProduct._id });
      variants.forEach((variant) => {
        expect(variant.active).toBe(false);
      });
    });
  });

  // ==================== Descuentos en productos simples ====================

  describe('Simple Products - Discounts', () => {
    let simpleVariant: any;

    beforeEach(async () => {
      const parentResponse = await request(app)
        .post('/api/products/parents')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Napolitanas de Chocolate',
          description: 'Paquete de 10 napolitanas de chocolate negro 60% cacao',
          categories: [chocolateCategory._id],
          brand: chocolateBrand._id,
          variantAttributes: [],
        });

      const variantResponse = await request(app)
        .post('/api/products/variants')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          parentProduct: parentResponse.body.data.productParent._id,
          attributes: {},
          price: 4500,
          stock: 150,
        });

      simpleVariant = variantResponse.body.data;
    });

    it('should apply percentage discount to simple product', async () => {
      const response = await request(app)
        .put(`/api/products/variants/${simpleVariant._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          fixedDiscount: {
            enabled: true,
            type: 'percentage',
            value: 15,
            badge: '15% OFF',
          },
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.fixedDiscount.enabled).toBe(true);
      expect(response.body.data.fixedDiscount.type).toBe('percentage');
      expect(response.body.data.fixedDiscount.value).toBe(15);
    });

    it('should apply amount discount to simple product', async () => {
      const response = await request(app)
        .put(`/api/products/variants/${simpleVariant._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          fixedDiscount: {
            enabled: true,
            type: 'amount',
            value: 500,
            badge: 'Gs. 500 OFF',
          },
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.fixedDiscount.enabled).toBe(true);
      expect(response.body.data.fixedDiscount.type).toBe('amount');
      expect(response.body.data.fixedDiscount.value).toBe(500);
    });

    it('should preview discount for simple product', async () => {
      // Aplicar descuento
      await request(app)
        .put(`/api/products/variants/${simpleVariant._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          fixedDiscount: {
            enabled: true,
            type: 'percentage',
            value: 20,
            badge: '20% OFF',
          },
        });

      // Obtener preview
      const response = await request(app)
        .get(`/api/products/variants/${simpleVariant._id}/discount-preview`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.originalPrice).toBe(4500);
      expect(response.body.data.hasDiscount).toBe(true);
      expect(response.body.data.discountType).toBe('percentage');
      expect(response.body.data.discountValue).toBe(20);
      expect(response.body.data.discountedPrice).toBe(3600); // 4500 - 20% = 3600
    });
  });

  // ==================== Stock management ====================

  describe('Simple Products - Stock Management', () => {
    let lowStockVariant: any;
    let outOfStockVariant: any;

    beforeEach(async () => {
      // Producto con bajo stock
      const parent1Response = await request(app)
        .post('/api/products/parents')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Corazón de Chocolate Relleno',
          description: 'Corazón de chocolate negro relleno de caramelo salado',
          categories: [chocolateCategory._id],
          brand: chocolateBrand._id,
          variantAttributes: [],
        });

      const variant1Response = await request(app)
        .post('/api/products/variants')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          parentProduct: parent1Response.body.data.productParent._id,
          attributes: {},
          price: 5000,
          stock: 5,
          lowStockThreshold: 10,
          allowBackorder: false,
        });

      lowStockVariant = variant1Response.body.data;

      // Producto sin stock
      const parent2Response = await request(app)
        .post('/api/products/parents')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Chocolate Ruby Natural',
          description: 'Barra de 80g de chocolate ruby',
          categories: [chocolateCategory._id],
          brand: chocolateBrand._id,
          variantAttributes: [],
        });

      const variant2Response = await request(app)
        .post('/api/products/variants')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          parentProduct: parent2Response.body.data.productParent._id,
          attributes: {},
          price: 12000,
          stock: 0,
          lowStockThreshold: 5,
          allowBackorder: false,
        });

      outOfStockVariant = variant2Response.body.data;
    });

    it('should detect low stock simple product', async () => {
      const response = await request(app)
        .get('/api/products/variants/stock/low')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(1);

      const found = response.body.data.find((v: any) => v._id === lowStockVariant._id);
      expect(found).toBeTruthy();
      expect(found.stock).toBeLessThanOrEqual(found.lowStockThreshold);
    });

    it('should detect out of stock simple product', async () => {
      const response = await request(app)
        .get('/api/products/variants/stock/out')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(1);

      const found = response.body.data.find((v: any) => v._id === outOfStockVariant._id);
      expect(found).toBeTruthy();
      expect(found.stock).toBe(0);
    });
  });

  // ==================== Featured products ====================

  describe('Simple Products - Featured', () => {
    beforeEach(async () => {
      // Crear productos destacados y no destacados
      const products = [
        { name: 'Chocolate Featured 1', featured: true },
        { name: 'Chocolate Featured 2', featured: true },
        { name: 'Chocolate Normal', featured: false },
      ];

      for (const product of products) {
        await request(app)
          .post('/api/products/parents')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: product.name,
            description: 'Chocolate description',
            categories: [chocolateCategory._id],
            brand: chocolateBrand._id,
            variantAttributes: [],
            featured: product.featured,
          });
      }
    });

    it('should get only featured simple products', async () => {
      const response = await request(app)
        .get('/api/products/parents/featured')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(2);
      response.body.data.forEach((product: any) => {
        expect(product.featured).toBe(true);
      });
    });
  });
});

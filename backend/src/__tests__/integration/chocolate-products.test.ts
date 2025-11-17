import request from 'supertest';
import app from '../../server';
import {
  createTestUser,
  generateAuthToken,
  createTestCategory,
  createTestBrand,
  clearDatabase,
} from '../setup/testUtils';
import ProductParent from '../../models/ProductParent';
import ProductVariant from '../../models/ProductVariant';

/**
 * Tests específicos para productos de chocolates artesanales con variantes
 * Cubre casos de uso reales para una tienda de chocolates con atributos como:
 * - Peso (100g, 200g, 500g)
 * - % de cacao (70%, 85%, 90%)
 * - Tipo (Bitter, Con Leche, Con Almendras, etc.)
 */

describe('Chocolate Products - Variant Creation', () => {
  let adminUser: any;
  let adminToken: string;
  let chocolateCategory: any;
  let chocolateBrand: any;

  beforeAll(async () => {
    // Crear usuario admin
    adminUser = await createTestUser({
      name: 'Admin Chocolatier',
      email: 'admin@chocolates.com',
      role: 'admin',
    });
    adminToken = generateAuthToken(adminUser);

    // Crear categoría de chocolates
    chocolateCategory = await createTestCategory({
      name: 'Chocolates Artesanales',
    });

    // Crear marca de chocolates
    chocolateBrand = await createTestBrand({
      name: 'Cacao Noble',
    });
  });

  beforeEach(async () => {
    // Limpiar productos antes de cada test
    await ProductParent.deleteMany({});
    await ProductVariant.deleteMany({});
  });

  afterAll(async () => {
    await clearDatabase();
  });

  // ==================== Producto padre con atributos de variación ====================

  describe('ProductParent - Chocolate con atributos de variación', () => {
    it('should create chocolate parent with weight and cacao percentage attributes', async () => {
      const response = await request(app)
        .post('/api/products/parents')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Chocolate Bitter Premium',
          description: 'Chocolate bitter de origen único con alto contenido de cacao',
          categories: [chocolateCategory._id.toString()],
          brand: chocolateBrand._id.toString(),
          images: ['/uploads/chocolates/bitter-premium.jpg'],
          tags: [],
          variantAttributes: [
            {
              name: 'peso',
              displayName: 'Peso',
              order: 1,
              values: [
                { value: '100g', displayValue: '100 gramos', order: 1 },
                { value: '200g', displayValue: '200 gramos', order: 2 },
                { value: '500g', displayValue: '500 gramos', order: 3 },
              ],
            },
            {
              name: 'cacao',
              displayName: '% de Cacao',
              order: 2,
              values: [
                { value: '70%', displayValue: '70% Cacao', order: 1 },
                { value: '85%', displayValue: '85% Cacao', order: 2 },
                { value: '90%', displayValue: '90% Cacao', order: 3 },
              ],
            },
          ],
          seoTitle: 'Chocolate Bitter Premium - Cacao Noble',
          seoDescription: 'El mejor chocolate bitter artesanal con alto contenido de cacao',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.productParent).toHaveProperty('_id');
      expect(response.body.data.productParent.name).toBe('Chocolate Bitter Premium');
      expect(response.body.data.productParent.variantAttributes).toHaveLength(2);
      expect(response.body.data.productParent.variantAttributes[0].name).toBe('peso');
      expect(response.body.data.productParent.variantAttributes[0].values).toHaveLength(3);
      expect(response.body.data.productParent.variantAttributes[1].name).toBe('cacao');
      expect(response.body.data.productParent.variantAttributes[1].values).toHaveLength(3);

      // Verificar en base de datos
      const parent = await ProductParent.findById(response.body.data.productParent._id);
      expect(parent).toBeTruthy();
      expect(parent?.variantAttributes).toHaveLength(2);
    });

    it('should create chocolate parent with type attribute only', async () => {
      const response = await request(app)
        .post('/api/products/parents')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Tableta de Chocolate Artesanal',
          description: 'Tabletas de chocolate en diferentes variedades',
          categories: [chocolateCategory._id.toString()],
          brand: chocolateBrand._id.toString(),
          variantAttributes: [
            {
              name: 'tipo',
              displayName: 'Tipo',
              order: 1,
              values: [
                { value: 'bitter', displayValue: 'Bitter 70%', order: 1 },
                { value: 'leche', displayValue: 'Con Leche', order: 2 },
                { value: 'almendras', displayValue: 'Con Almendras', order: 3 },
                { value: 'naranja', displayValue: 'Con Naranja', order: 4 },
                { value: 'menta', displayValue: 'Con Menta', order: 5 },
              ],
            },
          ],
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.productParent.variantAttributes).toHaveLength(1);
      expect(response.body.data.productParent.variantAttributes[0].name).toBe('tipo');
      expect(response.body.data.productParent.variantAttributes[0].values).toHaveLength(5);
    });

    it('should reject chocolate parent with less than 2 values per attribute', async () => {
      const response = await request(app)
        .post('/api/products/parents')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Chocolate Inválido',
          description: 'Descripción válida',
          categories: [chocolateCategory._id.toString()],
          variantAttributes: [
            {
              name: 'peso',
              displayName: 'Peso',
              order: 1,
              values: [
                { value: '100g', displayValue: '100 gramos', order: 1 },
                // Solo un valor - debe fallar
              ],
            },
          ],
        })
        .expect(500); // Model validation error

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('al menos 2 valores');
    });
  });

  // ==================== Creación de variantes de chocolate ====================

  describe('ProductVariant - Crear variantes de chocolate', () => {
    let chocolateParent: any;

    beforeEach(async () => {
      // Crear producto padre para las variantes
      const parentResponse = await request(app)
        .post('/api/products/parents')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Chocolate Premium',
          description: 'Chocolate artesanal de alta calidad',
          categories: [chocolateCategory._id.toString()],
          brand: chocolateBrand._id.toString(),
          variantAttributes: [
            {
              name: 'peso',
              displayName: 'Peso',
              order: 1,
              values: [
                { value: '100g', displayValue: '100 gramos', order: 1 },
                { value: '200g', displayValue: '200 gramos', order: 2 },
                { value: '500g', displayValue: '500 gramos', order: 3 },
              ],
            },
            {
              name: 'cacao',
              displayName: '% de Cacao',
              order: 2,
              values: [
                { value: '70%', displayValue: '70% Cacao', order: 1 },
                { value: '85%', displayValue: '85% Cacao', order: 2 },
              ],
            },
          ],
        });

      chocolateParent = parentResponse.body.data.productParent;
    });

    it('should create chocolate variant with peso 100g and 70% cacao', async () => {
      const response = await request(app)
        .post('/api/products/variants')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          parentProduct: chocolateParent._id,
          attributes: {
            peso: '100g',
            cacao: '70%',
          },
          price: 8500,
          stock: 100,
          images: ['/uploads/chocolates/premium-100g-70.jpg'],
          description: 'Tableta de 100g con 70% de cacao',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('_id');
      expect(response.body.data).toHaveProperty('sku');
      expect(response.body.data).toHaveProperty('slug');
      expect(response.body.data.name).toContain('Chocolate Premium');
      expect(response.body.data.name).toContain('100g');
      expect(response.body.data.name).toContain('70%');
      expect(response.body.data.price).toBe(8500);
      expect(response.body.data.stock).toBe(100);

      // Verificar que el SKU se generó correctamente
      expect(response.body.data.sku).toBeTruthy();
      expect(response.body.data.sku).toMatch(/^[A-Z0-9-]+$/);

      // Verificar en base de datos
      const variant = await ProductVariant.findById(response.body.data._id);
      expect(variant).toBeTruthy();
      const attributes = variant?.attributes as any;
      expect(attributes.peso || attributes.get?.('peso')).toBe('100g');
      expect(attributes.cacao || attributes.get?.('cacao')).toBe('70%');
    });

    it('should create chocolate variant with peso 200g and 85% cacao', async () => {
      const response = await request(app)
        .post('/api/products/variants')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          parentProduct: chocolateParent._id,
          attributes: {
            peso: '200g',
            cacao: '85%',
          },
          price: 15000,
          stock: 50,
          images: ['/uploads/chocolates/premium-200g-85.jpg'],
          description: 'Tableta de 200g con 85% de cacao - Extra Bitter',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toContain('200g');
      expect(response.body.data.name).toContain('85%');
      expect(response.body.data.price).toBe(15000);
      expect(response.body.data.stock).toBe(50);

      // Verificar que el slug es único
      const variant = await ProductVariant.findById(response.body.data._id);
      expect(variant?.slug).toBeTruthy();
      expect(variant?.slug).toContain('chocolate-premium');
    });

    it('should create chocolate variant with peso 500g and 70% cacao (bulk size)', async () => {
      const response = await request(app)
        .post('/api/products/variants')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          parentProduct: chocolateParent._id,
          attributes: {
            peso: '500g',
            cacao: '70%',
          },
          price: 35000,
          stock: 20,
          images: ['/uploads/chocolates/premium-500g-70.jpg'],
          description: 'Tableta grande de 500g con 70% de cacao',
          lowStockThreshold: 10,
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toContain('500g');
      expect(response.body.data.price).toBe(35000);
      expect(response.body.data.lowStockThreshold).toBe(10);
    });

    it('should create multiple variants for all combinations', async () => {
      const combinations = [
        { peso: '100g', cacao: '70%', price: 8500, stock: 100 },
        { peso: '100g', cacao: '85%', price: 9500, stock: 80 },
        { peso: '200g', cacao: '70%', price: 14000, stock: 60 },
        { peso: '200g', cacao: '85%', price: 16000, stock: 50 },
        { peso: '500g', cacao: '70%', price: 32000, stock: 30 },
        { peso: '500g', cacao: '85%', price: 38000, stock: 20 },
      ];

      for (const combo of combinations) {
        const response = await request(app)
          .post('/api/products/variants')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            parentProduct: chocolateParent._id,
            attributes: {
              peso: combo.peso,
              cacao: combo.cacao,
            },
            price: combo.price,
            stock: combo.stock,
          })
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data.name).toContain(combo.peso);
        expect(response.body.data.name).toContain(combo.cacao);
      }

      // Verificar que se crearon todas las variantes
      const variants = await ProductVariant.find({
        parentProduct: chocolateParent._id,
      });
      expect(variants).toHaveLength(6);

      // Verificar que todos los SKUs son únicos
      const skus = variants.map((v) => v.sku);
      const uniqueSkus = new Set(skus);
      expect(uniqueSkus.size).toBe(6);
    });

    it('should reject variant with invalid attribute value', async () => {
      const response = await request(app)
        .post('/api/products/variants')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          parentProduct: chocolateParent._id,
          attributes: {
            peso: '100g',
            cacao: '95%', // Valor no válido - no está en los valores permitidos
          },
          price: 8500,
          stock: 100,
        })
        .expect(500); // Model validation error

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('no es válido');
    });

    it('should allow variant with partial attributes', async () => {
      // El modelo no requiere que todos los atributos del padre estén presentes
      // Solo valida que los atributos presentes sean válidos
      const response = await request(app)
        .post('/api/products/variants')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          parentProduct: chocolateParent._id,
          attributes: {
            peso: '100g',
            // Falta el atributo 'cacao' - esto es permitido
          },
          price: 8500,
          stock: 100,
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toContain('100g');
    });

    it('should reject variant with extra attribute not defined in parent', async () => {
      const response = await request(app)
        .post('/api/products/variants')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          parentProduct: chocolateParent._id,
          attributes: {
            peso: '100g',
            cacao: '70%',
            sabor: 'naranja', // Atributo no definido en el padre
          },
          price: 8500,
          stock: 100,
        })
        .expect(500); // Model validation error

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('no está definido');
    });
  });

  // ==================== Chocolate con un solo atributo ====================

  describe('ProductVariant - Chocolate con tipo único', () => {
    let chocolateTypeParent: any;

    beforeEach(async () => {
      // Crear producto padre con solo un atributo: tipo
      const parentResponse = await request(app)
        .post('/api/products/parents')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Tableta Artesanal 100g',
          description: 'Tabletas de 100g en diferentes sabores',
          categories: [chocolateCategory._id.toString()],
          brand: chocolateBrand._id.toString(),
          variantAttributes: [
            {
              name: 'tipo',
              displayName: 'Tipo',
              order: 1,
              values: [
                { value: 'bitter', displayValue: 'Bitter 70%', order: 1 },
                { value: 'leche', displayValue: 'Con Leche', order: 2 },
                { value: 'almendras', displayValue: 'Con Almendras', order: 3 },
                { value: 'naranja', displayValue: 'Con Naranja', order: 4 },
              ],
            },
          ],
        });

      chocolateTypeParent = parentResponse.body.data.productParent;
    });

    it('should create bitter chocolate variant', async () => {
      const response = await request(app)
        .post('/api/products/variants')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          parentProduct: chocolateTypeParent._id,
          attributes: {
            tipo: 'bitter',
          },
          price: 9000,
          stock: 100,
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toContain('Tableta Artesanal 100g');
      expect(response.body.data.name).toContain('bitter');
    });

    it('should create milk chocolate variant', async () => {
      const response = await request(app)
        .post('/api/products/variants')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          parentProduct: chocolateTypeParent._id,
          attributes: {
            tipo: 'leche',
          },
          price: 8000,
          stock: 150,
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toContain('leche');
      expect(response.body.data.price).toBe(8000);
    });

    it('should create chocolate with almonds variant', async () => {
      const response = await request(app)
        .post('/api/products/variants')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          parentProduct: chocolateTypeParent._id,
          attributes: {
            tipo: 'almendras',
          },
          price: 10500,
          stock: 80,
          description: 'Chocolate con leche y almendras tostadas',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toContain('almendras');
    });

    it('should create chocolate with orange variant', async () => {
      const response = await request(app)
        .post('/api/products/variants')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          parentProduct: chocolateTypeParent._id,
          attributes: {
            tipo: 'naranja',
          },
          price: 10000,
          stock: 70,
          description: 'Chocolate bitter con esencia natural de naranja',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toContain('naranja');
      expect(response.body.data.price).toBe(10000);
    });
  });

  // ==================== Listar y filtrar variantes de chocolate ====================

  describe('ProductVariant - Listar variantes de chocolate', () => {
    let chocolateParent: any;

    beforeEach(async () => {
      // Crear producto padre
      const parentResponse = await request(app)
        .post('/api/products/parents')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Chocolate Noble',
          description: 'Línea premium de chocolates',
          categories: [chocolateCategory._id.toString()],
          brand: chocolateBrand._id.toString(),
          variantAttributes: [
            {
              name: 'peso',
              displayName: 'Peso',
              order: 1,
              values: [
                { value: '100g', displayValue: '100g', order: 1 },
                { value: '200g', displayValue: '200g', order: 2 },
              ],
            },
          ],
        });

      chocolateParent = parentResponse.body.data.productParent;

      // Crear variantes
      await request(app)
        .post('/api/products/variants')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          parentProduct: chocolateParent._id,
          attributes: { peso: '100g' },
          price: 8000,
          stock: 50,
        });

      await request(app)
        .post('/api/products/variants')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          parentProduct: chocolateParent._id,
          attributes: { peso: '200g' },
          price: 14000,
          stock: 30,
        });
    });

    it('should list all variants of a chocolate parent', async () => {
      const response = await request(app)
        .get(`/api/products/parents/${chocolateParent._id}/variants`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0]).toHaveProperty('attributes');
      expect(response.body.data[0]).toHaveProperty('price');
      expect(response.body.data[0]).toHaveProperty('stock');
    });

    it('should get chocolate variant by ID', async () => {
      const variants = await ProductVariant.find({
        parentProduct: chocolateParent._id,
      });
      const variantId = variants[0]._id.toString();

      const response = await request(app)
        .get(`/api/products/variants/${variantId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(variantId);
      expect(response.body.data.name).toContain('Chocolate Noble');
    });

    it('should get chocolate variant by SKU', async () => {
      const variants = await ProductVariant.find({
        parentProduct: chocolateParent._id,
      });
      const variantSku = variants[0].sku;

      const response = await request(app)
        .get(`/api/products/variants/sku/${variantSku}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.sku).toBe(variantSku);
    });
  });

  // ==================== Stock management para chocolates ====================

  describe('ProductVariant - Gestión de stock de chocolates', () => {
    let chocolateVariant: any;

    beforeEach(async () => {
      // Crear producto padre y variante
      const parentResponse = await request(app)
        .post('/api/products/parents')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Chocolate Diario',
          description: 'Chocolate para consumo diario',
          categories: [chocolateCategory._id.toString()],
          brand: chocolateBrand._id.toString(),
          variantAttributes: [
            {
              name: 'peso',
              displayName: 'Peso',
              order: 1,
              values: [
                { value: '50g', displayValue: '50g', order: 1 },
                { value: '100g', displayValue: '100g', order: 2 },
              ],
            },
          ],
        });

      const variantResponse = await request(app)
        .post('/api/products/variants')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          parentProduct: parentResponse.body.data.productParent._id,
          attributes: { peso: '100g' },
          price: 5000,
          stock: 100,
          lowStockThreshold: 20,
          allowBackorder: false, // Necesario para que aparezca en out of stock
        });

      chocolateVariant = variantResponse.body.data;
    });

    it('should update chocolate variant stock', async () => {
      const response = await request(app)
        .patch(`/api/products/variants/${chocolateVariant._id}/stock`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          stock: 150,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.stock).toBe(150);
    });

    it('should detect low stock chocolate variant', async () => {
      // Actualizar stock a nivel bajo
      await request(app)
        .patch(`/api/products/variants/${chocolateVariant._id}/stock`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          stock: 15, // Debajo del threshold de 20
        })
        .expect(200);

      // Consultar variantes con stock bajo
      const response = await request(app)
        .get('/api/products/variants/stock/low')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      const lowStockVariant = response.body.data.find(
        (v: any) => v._id === chocolateVariant._id
      );
      expect(lowStockVariant).toBeTruthy();
      expect(lowStockVariant.stock).toBe(15);
    });

    it('should detect out of stock chocolate variant', async () => {
      // Actualizar stock a 0
      await request(app)
        .patch(`/api/products/variants/${chocolateVariant._id}/stock`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          stock: 0,
        })
        .expect(200);

      // Consultar variantes sin stock
      const response = await request(app)
        .get('/api/products/variants/stock/out')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      const outOfStockVariant = response.body.data.find(
        (v: any) => v._id === chocolateVariant._id
      );
      expect(outOfStockVariant).toBeTruthy();
      expect(outOfStockVariant.stock).toBe(0);
    });
  });

  // ==================== Descuentos en chocolates ====================

  describe('ProductVariant - Descuentos en chocolates', () => {
    let chocolateVariant: any;

    beforeEach(async () => {
      // Crear producto y variante
      const parentResponse = await request(app)
        .post('/api/products/parents')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Chocolate Promoción',
          description: 'Chocolates en oferta',
          categories: [chocolateCategory._id.toString()],
          variantAttributes: [
            {
              name: 'tipo',
              displayName: 'Tipo',
              order: 1,
              values: [
                { value: 'bitter', displayValue: 'Bitter', order: 1 },
                { value: 'leche', displayValue: 'Leche', order: 2 },
              ],
            },
          ],
        });

      const variantResponse = await request(app)
        .post('/api/products/variants')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          parentProduct: parentResponse.body.data.productParent._id,
          attributes: { tipo: 'bitter' },
          price: 10000,
          stock: 100,
        });

      chocolateVariant = variantResponse.body.data;
    });

    it('should add percentage discount to chocolate variant', async () => {
      const response = await request(app)
        .put(`/api/products/variants/${chocolateVariant._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          fixedDiscount: {
            enabled: true,
            type: 'percentage',
            value: 15,
            badge: 'BLACK FRIDAY',
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          },
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.fixedDiscount.enabled).toBe(true);
      expect(response.body.data.fixedDiscount.type).toBe('percentage');
      expect(response.body.data.fixedDiscount.value).toBe(15);
    });

    it('should add amount discount to chocolate variant', async () => {
      const response = await request(app)
        .put(`/api/products/variants/${chocolateVariant._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          fixedDiscount: {
            enabled: true,
            type: 'amount',
            value: 2000,
            badge: 'DESCUENTO',
          },
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.fixedDiscount.type).toBe('amount');
      expect(response.body.data.fixedDiscount.value).toBe(2000);
    });

    it('should preview discount for chocolate variant', async () => {
      // Agregar descuento
      await request(app)
        .put(`/api/products/variants/${chocolateVariant._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          fixedDiscount: {
            enabled: true,
            type: 'percentage',
            value: 20,
          },
        });

      // Obtener preview del descuento
      const response = await request(app)
        .get(`/api/products/variants/${chocolateVariant._id}/discount-preview`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.hasDiscount).toBe(true);
      expect(response.body.data.originalPrice).toBe(10000);
      expect(response.body.data.discountValue).toBe(20);
      expect(response.body.data.discountType).toBe('percentage');
    });
  });

  // ==================== Casos edge de chocolates ====================

  describe('Chocolate Edge Cases', () => {
    it('should handle chocolate with multiple attributes correctly', async () => {
      // Crear producto con 3 atributos
      const parentResponse = await request(app)
        .post('/api/products/parents')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Chocolate Gourmet',
          description: 'Chocolate premium con múltiples opciones',
          categories: [chocolateCategory._id.toString()],
          brand: chocolateBrand._id.toString(),
          variantAttributes: [
            {
              name: 'peso',
              displayName: 'Peso',
              order: 1,
              values: [
                { value: '100g', displayValue: '100g', order: 1 },
                { value: '200g', displayValue: '200g', order: 2 },
              ],
            },
            {
              name: 'cacao',
              displayName: '% Cacao',
              order: 2,
              values: [
                { value: '70%', displayValue: '70%', order: 1 },
                { value: '85%', displayValue: '85%', order: 2 },
              ],
            },
            {
              name: 'origen',
              displayName: 'Origen',
              order: 3,
              values: [
                { value: 'ecuador', displayValue: 'Ecuador', order: 1 },
                { value: 'peru', displayValue: 'Perú', order: 2 },
              ],
            },
          ],
        });

      const parent = parentResponse.body.data.productParent;

      // Crear variante con todos los atributos
      const response = await request(app)
        .post('/api/products/variants')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          parentProduct: parent._id,
          attributes: {
            peso: '100g',
            cacao: '85%',
            origen: 'ecuador',
          },
          price: 12000,
          stock: 50,
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toContain('100g');
      expect(response.body.data.name).toContain('85%');
      expect(response.body.data.name).toContain('ecuador');
    });

    it('should generate unique SKUs for similar chocolate variants', async () => {
      const parentResponse = await request(app)
        .post('/api/products/parents')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Chocolate Simple',
          description: 'Chocolate básico',
          categories: [chocolateCategory._id.toString()],
          variantAttributes: [
            {
              name: 'peso',
              displayName: 'Peso',
              order: 1,
              values: [
                { value: '100g', displayValue: '100g', order: 1 },
                { value: '200g', displayValue: '200g', order: 2 },
              ],
            },
          ],
        });

      // Crear dos variantes
      const response1 = await request(app)
        .post('/api/products/variants')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          parentProduct: parentResponse.body.data.productParent._id,
          attributes: { peso: '100g' },
          price: 5000,
          stock: 100,
        })
        .expect(201);

      const response2 = await request(app)
        .post('/api/products/variants')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          parentProduct: parentResponse.body.data.productParent._id,
          attributes: { peso: '200g' },
          price: 9000,
          stock: 100,
        })
        .expect(201);

      // Verificar que los SKUs son diferentes
      expect(response1.body.data.sku).not.toBe(response2.body.data.sku);
    });

    it('should generate unique slugs for similar chocolate variants', async () => {
      const parentResponse = await request(app)
        .post('/api/products/parents')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Chocolate Test',
          description: 'Test de slugs',
          categories: [chocolateCategory._id.toString()],
          variantAttributes: [
            {
              name: 'peso',
              displayName: 'Peso',
              order: 1,
              values: [
                { value: '100g', displayValue: '100g', order: 1 },
                { value: '200g', displayValue: '200g', order: 2 },
              ],
            },
          ],
        });

      // Crear dos variantes
      const response1 = await request(app)
        .post('/api/products/variants')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          parentProduct: parentResponse.body.data.productParent._id,
          attributes: { peso: '100g' },
          price: 5000,
          stock: 100,
        })
        .expect(201);

      const response2 = await request(app)
        .post('/api/products/variants')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          parentProduct: parentResponse.body.data.productParent._id,
          attributes: { peso: '200g' },
          price: 9000,
          stock: 100,
        })
        .expect(201);

      // Verificar que los slugs son diferentes
      expect(response1.body.data.slug).not.toBe(response2.body.data.slug);
      expect(response1.body.data.slug).toBeTruthy();
      expect(response2.body.data.slug).toBeTruthy();
    });
  });
});

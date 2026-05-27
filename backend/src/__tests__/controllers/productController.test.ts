import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import app from '../../server';
import Product from '../../models/Product';
import { Category } from '../../models/Category';
import { Brand } from '../../models/Brand';
import { User, IUser } from '../../models/User';
import { ENV } from '../../config/env';
import { signTokenFor } from '../setup/authTestHelpers';
import type { UserRole } from '../../types';

/**
 * Tests e2e del CRUD de Product (admin).
 *
 * Se cubren:
 *  - listProducts: filtros (active, featured, price, search, sort) y paginación.
 *  - getProductById / getProductBySlug.
 *  - createProduct: requiere admin, autogen de SKU formato QU-NNNNNN, validación Zod.
 *  - updateProduct: update parcial + updatedBy.
 *  - deleteProduct: SOFT delete (active=false), no borra el doc.
 *  - getAdminStats: contadores total/active/inactive/featured/sin-imagen/etc.
 *  - listFeaturedProducts.
 *
 * NOTA: el endpoint POST /api/products tiene un pipeline con multer
 * (uploadMultiple) y parseFormData para soportar multipart con imágenes.
 * Si el request es JSON puro (sin files), multer no parsea nada y el body
 * queda intacto; parseFormData solo actúa sobre strings JSON. Así
 * podemos hacer el test sin armar FormData.
 */

const VALID_PASSWORD = 'Password1!';

const createUserAndToken = async (
  role: UserRole = 'admin'
): Promise<{ user: IUser; token: string }> => {
  const suffix = `${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
  const user = await User.create({
    name: `User ${role}`,
    email: `${role}-${suffix}@test.com`,
    password: VALID_PASSWORD,
    role,
    active: true,
  });
  const token = signTokenFor(user);
  return { user, token };
};

const seedCategory = async () => {
  const suffix = `${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
  return Category.create({
    name: `Cat ${suffix}`,
    slug: `cat-${suffix}`,
    level: 0,
  });
};

const seedBrand = async () => {
  const suffix = `${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
  return Brand.create({
    name: `Brand ${suffix}`,
    slug: `brand-${suffix}`,
    active: true,
  });
};

const buildProductBody = (
  categoryId: string,
  overrides: Partial<{
    name: string;
    description: string;
    unitPrice: number;
    saleUnit: { type: string; quantity: number };
    featured: boolean;
    active: boolean;
    sku: string;
  }> = {}
) => ({
  name: overrides.name ?? `Producto ${Date.now()}-${Math.floor(Math.random() * 1e9)}`,
  description: overrides.description ?? 'Descripción de prueba para tests del CRUD.',
  categories: [categoryId],
  unitPrice: overrides.unitPrice ?? 1000,
  saleUnit: overrides.saleUnit ?? { type: 'unidad', quantity: 1 },
  featured: overrides.featured,
  active: overrides.active,
  sku: overrides.sku,
});

// ────────────────────────────────────────────────────────────────────
// GET /api/products (listado público)
// ────────────────────────────────────────────────────────────────────
describe('GET /api/products', () => {
  let categoryId: mongoose.Types.ObjectId;

  beforeEach(async () => {
    const cat = await seedCategory();
    categoryId = cat._id as mongoose.Types.ObjectId;
  });

  const seed = async (overrides: Partial<{
    unitPrice: number;
    featured: boolean;
    active: boolean;
    name: string;
  }> = {}) => {
    const suffix = `${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
    return Product.create({
      name: overrides.name ?? `Producto ${suffix}`,
      slug: `producto-${suffix}`,
      description: 'Producto seed.',
      categories: [categoryId],
      unitPrice: overrides.unitPrice ?? 1000,
      saleUnit: { type: 'unidad', quantity: 1 },
      featured: overrides.featured ?? false,
      active: overrides.active ?? true,
    });
  };

  it('retorna lista vacía con paginación correcta cuando no hay productos', async () => {
    const res = await request(app).get('/api/products');
    expect(res.status).toBe(200);
    expect(res.body.data.data).toEqual([]);
    expect(res.body.data.pagination).toMatchObject({
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 1,
      hasNext: false,
      hasPrev: false,
    });
  });

  it('por defecto solo lista productos activos', async () => {
    await seed({ active: true });
    await seed({ active: false });

    const res = await request(app).get('/api/products');
    expect(res.body.data.data).toHaveLength(1);
    expect(res.body.data.data[0].active).toBe(true);
  });

  it('active=false muestra solo inactivos', async () => {
    await seed({ active: true });
    await seed({ active: false });

    const res = await request(app).get('/api/products?active=false');
    expect(res.body.data.data).toHaveLength(1);
    expect(res.body.data.data[0].active).toBe(false);
  });

  it('featured=true filtra correctamente', async () => {
    await seed({ featured: true });
    await seed({ featured: false });
    await seed({ featured: true });

    const res = await request(app).get('/api/products?featured=true');
    expect(res.body.data.data).toHaveLength(2);
    for (const p of res.body.data.data) {
      expect(p.featured).toBe(true);
    }
  });

  it('minPrice y maxPrice filtran por rango de precio', async () => {
    await seed({ unitPrice: 500 });
    await seed({ unitPrice: 1500 });
    await seed({ unitPrice: 3000 });

    const res = await request(app).get('/api/products?minPrice=1000&maxPrice=2000');
    expect(res.body.data.data).toHaveLength(1);
    expect(res.body.data.data[0].unitPrice).toBe(1500);
  });

  it('sort=price_asc ordena ascendente; sort=price_desc descendente', async () => {
    await seed({ unitPrice: 500 });
    await seed({ unitPrice: 1500 });
    await seed({ unitPrice: 1000 });

    const asc = await request(app).get('/api/products?sort=price_asc');
    expect(asc.body.data.data.map((p: any) => p.unitPrice)).toEqual([500, 1000, 1500]);

    const desc = await request(app).get('/api/products?sort=price_desc');
    expect(desc.body.data.data.map((p: any) => p.unitPrice)).toEqual([1500, 1000, 500]);
  });

  it('respeta limit y page en la paginación', async () => {
    for (let i = 0; i < 5; i++) await seed();

    const page1 = await request(app).get('/api/products?limit=2&page=1');
    expect(page1.body.data.data).toHaveLength(2);
    expect(page1.body.data.pagination).toMatchObject({
      page: 1,
      limit: 2,
      total: 5,
      totalPages: 3,
      hasNext: true,
      hasPrev: false,
    });

    const page3 = await request(app).get('/api/products?limit=2&page=3');
    expect(page3.body.data.data).toHaveLength(1);
    expect(page3.body.data.pagination.hasNext).toBe(false);
    expect(page3.body.data.pagination.hasPrev).toBe(true);
  });

  it('400 si los query params no cumplen Zod (ej. minPrice no numérico)', async () => {
    const res = await request(app).get('/api/products?minPrice=carísimo');
    expect(res.status).toBe(400);
  });
});

// ────────────────────────────────────────────────────────────────────
// GET /api/products/featured
// ────────────────────────────────────────────────────────────────────
describe('GET /api/products/featured', () => {
  it('lista solo productos featured y activos', async () => {
    const cat = await seedCategory();
    const make = (featured: boolean, active = true) =>
      Product.create({
        name: `P ${Date.now()}-${Math.random()}`,
        slug: `p-${Date.now()}-${Math.floor(Math.random() * 1e9)}`,
        description: 'Descripción de seed para tests.',
        categories: [cat._id],
        unitPrice: 1000,
        saleUnit: { type: 'unidad', quantity: 1 },
        featured,
        active,
      });
    await make(true);
    await make(true);
    await make(false);
    await make(true, false); // featured pero inactivo: NO debe aparecer

    const res = await request(app).get('/api/products/featured');
    expect(res.status).toBe(200);
    expect(res.body.data.data).toHaveLength(2);
  });
});

// ────────────────────────────────────────────────────────────────────
// GET /api/products/:id  y  /slug/:slug
// ────────────────────────────────────────────────────────────────────
describe('GET /api/products/:id y /slug/:slug', () => {
  it('id válido devuelve 200 con el producto', async () => {
    const cat = await seedCategory();
    const p = await Product.create({
      name: 'Producto Uno',
      slug: 'p1-test',
      description: 'Descripción de prueba con largo suficiente.',
      categories: [cat._id],
      unitPrice: 1000,
      saleUnit: { type: 'unidad', quantity: 1 },
    });
    const res = await request(app).get(`/api/products/${p._id}`);
    expect(res.status).toBe(200);
    expect(res.body.data.product._id).toBe(p._id.toString());
  });

  it('id inexistente devuelve 404', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request(app).get(`/api/products/${fakeId}`);
    expect(res.status).toBe(404);
  });

  it('id mal formado devuelve 400 (Zod)', async () => {
    const res = await request(app).get('/api/products/no-es-un-id');
    expect(res.status).toBe(400);
  });

  it('slug válido (y producto activo) devuelve 200 e incrementa views', async () => {
    const cat = await seedCategory();
    const p = await Product.create({
      name: 'PSlug',
      slug: 'pslug-test',
      description: 'desc del test',
      categories: [cat._id],
      unitPrice: 1000,
      saleUnit: { type: 'unidad', quantity: 1 },
    });
    expect(p.views).toBe(0);

    const res = await request(app).get(`/api/products/slug/${p.slug}`);
    expect(res.status).toBe(200);

    // El increment de views es fire-and-forget — esperamos un tick.
    await new Promise((r) => setTimeout(r, 50));
    const reloaded = await Product.findById(p._id);
    expect(reloaded?.views).toBe(1);
  });

  it('slug de producto inactivo devuelve 404 (solo activos vía slug)', async () => {
    const cat = await seedCategory();
    await Product.create({
      name: 'PInactive',
      slug: 'pinactive-test',
      description: 'desc del test',
      categories: [cat._id],
      unitPrice: 1000,
      saleUnit: { type: 'unidad', quantity: 1 },
      active: false,
    });
    const res = await request(app).get('/api/products/slug/pinactive-test');
    expect(res.status).toBe(404);
  });
});

// ────────────────────────────────────────────────────────────────────
// POST /api/products  (admin)
// ────────────────────────────────────────────────────────────────────
describe('POST /api/products', () => {
  let adminToken: string;
  let categoryId: string;

  beforeEach(async () => {
    const admin = await createUserAndToken('admin');
    adminToken = admin.token;
    const cat = await seedCategory();
    categoryId = (cat._id as mongoose.Types.ObjectId).toString();
  });

  it('admin crea producto y el SKU se auto-genera con formato QU-NNNNNN', async () => {
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(buildProductBody(categoryId));

    expect(res.status).toBe(201);
    expect(res.body.data.product.sku).toMatch(/^QU-\d{6}$/);
    expect(res.body.data.product.slug).toBeDefined();
    expect(res.body.data.product.active).toBe(true);
  });

  it('SKUs se incrementan secuencialmente al crear varios productos', async () => {
    const r1 = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(buildProductBody(categoryId, { name: 'A' + Date.now() }));
    const r2 = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(buildProductBody(categoryId, { name: 'B' + Date.now() }));

    const sku1 = parseInt(r1.body.data.product.sku.replace('QU-', ''), 10);
    const sku2 = parseInt(r2.body.data.product.sku.replace('QU-', ''), 10);
    expect(sku2).toBe(sku1 + 1);
  });

  it('respeta un SKU explícito si se envía', async () => {
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ...buildProductBody(categoryId), sku: 'QU-CUSTOM01' });
    expect(res.status).toBe(201);
    expect(res.body.data.product.sku).toBe('QU-CUSTOM01');
  });

  it('createdBy se setea con el id del admin', async () => {
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(buildProductBody(categoryId));
    expect(res.status).toBe(201);
    const decoded = jwt.verify(adminToken, ENV.JWT_SECRET) as any;
    expect(res.body.data.product.createdBy).toBe(decoded.id);
  });

  it('rechaza 400 con Zod si faltan campos requeridos (name < 3 chars)', async () => {
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ...buildProductBody(categoryId), name: 'ab' });
    expect(res.status).toBe(400);
  });

  it('rechaza 400 si categories está vacío', async () => {
    const body = buildProductBody(categoryId);
    body.categories = [];
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(body);
    expect(res.status).toBe(400);
  });

  it('rechaza 400 si unitPrice es negativo', async () => {
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ...buildProductBody(categoryId), unitPrice: -100 });
    expect(res.status).toBe(400);
  });

  it('401 sin auth', async () => {
    const res = await request(app).post('/api/products').send(buildProductBody(categoryId));
    expect(res.status).toBe(401);
  });

  it('403 si el rol no es admin (funcionario o cliente)', async () => {
    const f = await createUserAndToken('funcionario');
    const c = await createUserAndToken('cliente');
    const r1 = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${f.token}`)
      .send(buildProductBody(categoryId));
    expect(r1.status).toBe(403);

    const r2 = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${c.token}`)
      .send(buildProductBody(categoryId));
    expect(r2.status).toBe(403);
  });
});

// ────────────────────────────────────────────────────────────────────
// PUT /api/products/:id
// ────────────────────────────────────────────────────────────────────
describe('PUT /api/products/:id', () => {
  let adminToken: string;
  let adminId: string;
  let productId: string;

  beforeEach(async () => {
    const admin = await createUserAndToken('admin');
    adminToken = admin.token;
    adminId = admin.user._id.toString();
    const cat = await seedCategory();
    const prod = await Product.create({
      name: 'Original',
      slug: `orig-${Date.now()}`,
      description: 'desc original del test',
      categories: [cat._id],
      unitPrice: 1000,
      saleUnit: { type: 'unidad', quantity: 1 },
    });
    productId = prod._id.toString();
  });

  it('actualiza parcial: solo el campo enviado cambia, los demás se preservan', async () => {
    const res = await request(app)
      .put(`/api/products/${productId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Renombrado' });

    expect(res.status).toBe(200);
    expect(res.body.data.product.name).toBe('Renombrado');
    expect(res.body.data.product.unitPrice).toBe(1000); // preservado
  });

  it('updatedBy se setea con el id del admin', async () => {
    await request(app)
      .put(`/api/products/${productId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ unitPrice: 1500 });

    const reloaded = await Product.findById(productId);
    expect(reloaded?.updatedBy?.toString()).toBe(adminId);
  });

  it('404 si el producto no existe', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .put(`/api/products/${fakeId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Lo que sea' });
    expect(res.status).toBe(404);
  });

  it('400 si el body no cumple Zod (unitPrice negativo)', async () => {
    const res = await request(app)
      .put(`/api/products/${productId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ unitPrice: -1 });
    expect(res.status).toBe(400);
  });

  it('403 si el usuario no es admin', async () => {
    const f = await createUserAndToken('funcionario');
    const res = await request(app)
      .put(`/api/products/${productId}`)
      .set('Authorization', `Bearer ${f.token}`)
      .send({ name: 'Intento' });
    expect(res.status).toBe(403);
  });
});

// ────────────────────────────────────────────────────────────────────
// DELETE /api/products/:id  (SOFT delete)
// ────────────────────────────────────────────────────────────────────
describe('DELETE /api/products/:id  (soft)', () => {
  let adminToken: string;
  let adminId: string;
  let productId: string;

  beforeEach(async () => {
    const admin = await createUserAndToken('admin');
    adminToken = admin.token;
    adminId = admin.user._id.toString();
    const cat = await seedCategory();
    const prod = await Product.create({
      name: 'Producto a soft-borrar',
      slug: `soft-del-${Date.now()}`,
      description: 'desc del test',
      categories: [cat._id],
      unitPrice: 1000,
      saleUnit: { type: 'unidad', quantity: 1 },
    });
    productId = prod._id.toString();
  });

  it('SOFT delete: marca active=false y NO borra el documento', async () => {
    const res = await request(app)
      .delete(`/api/products/${productId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);

    // El doc sigue existiendo
    const reloaded = await Product.findById(productId);
    expect(reloaded).not.toBeNull();
    expect(reloaded?.active).toBe(false);
    expect(reloaded?.deletedBy?.toString()).toBe(adminId);
  });

  it('después de soft-delete, NO aparece en el listado público por defecto', async () => {
    await request(app)
      .delete(`/api/products/${productId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    const list = await request(app).get('/api/products');
    expect(list.body.data.data).toHaveLength(0);
  });

  it('404 si el producto no existe', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .delete(`/api/products/${fakeId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(404);
  });

  it('403 si el usuario no es admin', async () => {
    const c = await createUserAndToken('cliente');
    const res = await request(app)
      .delete(`/api/products/${productId}`)
      .set('Authorization', `Bearer ${c.token}`);
    expect(res.status).toBe(403);
  });
});

// ────────────────────────────────────────────────────────────────────
// GET /api/products/admin-stats  (admin)
// ────────────────────────────────────────────────────────────────────
describe('GET /api/products/admin-stats', () => {
  it('cuenta total/active/inactive/featured correctamente', async () => {
    const admin = await createUserAndToken('admin');
    const cat = await seedCategory();

    const make = (overrides: any) =>
      Product.create({
        name: `P ${Date.now()}-${Math.random()}`,
        slug: `p-${Date.now()}-${Math.floor(Math.random() * 1e9)}`,
        description: 'Descripción de seed para tests.',
        categories: [cat._id],
        unitPrice: 1000,
        saleUnit: { type: 'unidad', quantity: 1 },
        ...overrides,
      });

    await make({ active: true, featured: false });
    await make({ active: true, featured: true });
    await make({ active: false, featured: false });

    const res = await request(app)
      .get('/api/products/admin-stats')
      .set('Authorization', `Bearer ${admin.token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.stats).toMatchObject({
      total: 3,
      active: 2,
      inactive: 1,
      featured: 1,
    });
  });

  it('403 si el usuario no es admin', async () => {
    const c = await createUserAndToken('cliente');
    const res = await request(app)
      .get('/api/products/admin-stats')
      .set('Authorization', `Bearer ${c.token}`);
    expect(res.status).toBe(403);
  });
});

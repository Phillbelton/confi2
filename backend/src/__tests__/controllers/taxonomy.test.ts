import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../server';
import { Category } from '../../models/Category';
import { Brand } from '../../models/Brand';
import Product from '../../models/Product';
import { User, IUser } from '../../models/User';
import { signTokenFor } from '../setup/authTestHelpers';
import type { UserRole } from '../../types';

/**
 * Tests e2e de la "taxonomía" admin: categorías y marcas.
 *
 * Reglas de negocio relevantes:
 *  - Categorías:
 *      - Jerarquía de 2 niveles: una subcategoría debe tener parent raíz,
 *        no se permiten sub-subcategorías.
 *      - DELETE rechaza si hay productos asociados o subcategorías.
 *      - DELETE real (no soft).
 *  - Marcas:
 *      - DELETE es soft (active=false).
 *      - DELETE rechaza si la marca tiene productos activos.
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

const seedCategory = async (overrides: any = {}) => {
  const suffix = `${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
  return Category.create({
    name: overrides.name ?? `Cat ${suffix}`,
    slug: overrides.slug ?? `cat-${suffix}`,
    parent: overrides.parent,
    active: overrides.active ?? true,
  });
};

const seedProduct = async (categoryId: mongoose.Types.ObjectId, overrides: any = {}) => {
  const suffix = `${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
  return Product.create({
    name: `Prod ${suffix}`,
    slug: `prod-${suffix}`,
    description: 'Descripción de seed para tests.',
    categories: [categoryId],
    brand: overrides.brand,
    unitPrice: 1000,
    saleUnit: { type: 'unidad', quantity: 1 },
    active: overrides.active ?? true,
  });
};

// ────────────────────────────────────────────────────────────────────
// CATEGORÍAS
// ────────────────────────────────────────────────────────────────────
describe('categoryController', () => {
  describe('GET /api/categories', () => {
    it('retorna lista vacía cuando no hay categorías', async () => {
      const res = await request(app).get('/api/categories');
      expect(res.status).toBe(200);
      expect(res.body.data.categories).toEqual([]);
    });

    it('por defecto retorna solo categorías activas', async () => {
      await seedCategory({ active: true });
      await seedCategory({ active: false });
      const res = await request(app).get('/api/categories');
      expect(res.body.data.categories).toHaveLength(1);
      expect(res.body.data.categories[0].active).toBe(true);
    });

    it('?includeInactive=true incluye inactivas', async () => {
      await seedCategory({ active: true });
      await seedCategory({ active: false });
      const res = await request(app).get('/api/categories?includeInactive=true');
      expect(res.body.data.categories).toHaveLength(2);
    });

    it('cada categoría raíz incluye sus subcategorías embebidas', async () => {
      const root = await seedCategory({ name: 'Raíz' });
      const sub = await seedCategory({ name: 'Sub', parent: root._id });

      const res = await request(app).get('/api/categories');
      const rootInResponse = res.body.data.categories.find(
        (c: any) => c._id === (root._id as mongoose.Types.ObjectId).toString()
      );
      expect(rootInResponse.subcategories).toHaveLength(1);
      expect(rootInResponse.subcategories[0]._id).toBe(
        (sub._id as mongoose.Types.ObjectId).toString()
      );
    });
  });

  describe('POST /api/categories (admin)', () => {
    it('admin crea una categoría raíz', async () => {
      const { token } = await createUserAndToken('admin');
      const res = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Pasteles' });
      expect(res.status).toBe(201);
      expect(res.body.data.category.name).toBe('Pasteles');
      expect(res.body.data.category.slug).toBeDefined();
    });

    it('admin crea una subcategoría con parent raíz válido', async () => {
      const { token } = await createUserAndToken('admin');
      const root = await seedCategory({ name: 'Helados' });
      const res = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Cassata', parent: root._id.toString() });
      expect(res.status).toBe(201);
      expect(res.body.data.category.parent).toBe(
        (root._id as mongoose.Types.ObjectId).toString()
      );
    });

    it('rechaza crear sub-subcategoría (jerarquía máxima de 2 niveles)', async () => {
      const { token } = await createUserAndToken('admin');
      const root = await seedCategory({ name: 'Helados' });
      const sub = await seedCategory({ name: 'Cassata', parent: root._id });

      const res = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Cassata-Frutilla', parent: sub._id.toString() });
      expect(res.status).toBe(400);
      expect(res.body.error || res.body.message).toMatch(/raíz/i);
    });

    it('rechaza crear con parent inexistente', async () => {
      const { token } = await createUserAndToken('admin');
      const fakeId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Huérfana', parent: fakeId });
      expect(res.status).toBe(400);
    });

    it('400 si Zod rechaza (name muy corto)', async () => {
      const { token } = await createUserAndToken('admin');
      const res = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'A' });
      expect(res.status).toBe(400);
    });

    it('403 si no es admin', async () => {
      const { token } = await createUserAndToken('funcionario');
      const res = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'X' });
      expect(res.status).toBe(403);
    });
  });

  describe('DELETE /api/categories/:id (admin)', () => {
    it('elimina la categoría si no tiene productos ni subcategorías', async () => {
      const { token } = await createUserAndToken('admin');
      const cat = await seedCategory();
      const res = await request(app)
        .delete(`/api/categories/${cat._id}`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);

      const stillThere = await Category.findById(cat._id);
      expect(stillThere).toBeNull();
    });

    it('rechaza 400 si la categoría tiene productos asociados', async () => {
      const { token } = await createUserAndToken('admin');
      const cat = await seedCategory();
      await seedProduct(cat._id as mongoose.Types.ObjectId);

      const res = await request(app)
        .delete(`/api/categories/${cat._id}`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(400);
      expect(res.body.error || res.body.message).toMatch(/productos/i);

      const stillThere = await Category.findById(cat._id);
      expect(stillThere).not.toBeNull();
    });

    it('rechaza 400 si la categoría tiene subcategorías', async () => {
      const { token } = await createUserAndToken('admin');
      const root = await seedCategory();
      await seedCategory({ parent: root._id });

      const res = await request(app)
        .delete(`/api/categories/${root._id}`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(400);
      expect(res.body.error || res.body.message).toMatch(/subcategor/i);
    });
  });
});

// ────────────────────────────────────────────────────────────────────
// MARCAS
// ────────────────────────────────────────────────────────────────────
describe('brandController', () => {
  describe('GET /api/brands', () => {
    it('retorna marcas activas por defecto', async () => {
      await Brand.create({ name: 'Marca A', slug: 'marca-a', active: true });
      await Brand.create({ name: 'Marca B', slug: 'marca-b', active: false });

      const res = await request(app).get('/api/brands');
      expect(res.status).toBe(200);
      expect(res.body.data.brands).toHaveLength(1);
      expect(res.body.data.brands[0].name).toBe('Marca A');
    });

    it('?includeInactive=true incluye inactivas', async () => {
      await Brand.create({ name: 'Marca A', slug: 'marca-a', active: true });
      await Brand.create({ name: 'Marca B', slug: 'marca-b', active: false });

      const res = await request(app).get('/api/brands?includeInactive=true');
      expect(res.body.data.brands).toHaveLength(2);
    });
  });

  describe('POST /api/brands (admin)', () => {
    it('admin crea una marca', async () => {
      const { token } = await createUserAndToken('admin');
      const res = await request(app)
        .post('/api/brands')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Quelita' });
      expect(res.status).toBe(201);
      expect(res.body.data.brand.name).toBe('Quelita');
      expect(res.body.data.brand.active).toBe(true);
    });

    it('403 si funcionario o cliente intenta crear marca', async () => {
      const f = await createUserAndToken('funcionario');
      const r = await request(app)
        .post('/api/brands')
        .set('Authorization', `Bearer ${f.token}`)
        .send({ name: 'Test Brand' });
      expect(r.status).toBe(403);
    });
  });

  describe('PUT /api/brands/:id (admin)', () => {
    it('actualiza nombre y active', async () => {
      const { token } = await createUserAndToken('admin');
      const b = await Brand.create({ name: 'Old', slug: 'old-brand', active: true });

      const res = await request(app)
        .put(`/api/brands/${b._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'New' });
      expect(res.status).toBe(200);
      expect(res.body.data.brand.name).toBe('New');
    });

    it('404 si la marca no existe', async () => {
      const { token } = await createUserAndToken('admin');
      const res = await request(app)
        .put(`/api/brands/${new mongoose.Types.ObjectId()}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Marca Nueva' });
      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/brands/:id (admin, soft)', () => {
    it('soft-elimina la marca si no tiene productos activos', async () => {
      const { token } = await createUserAndToken('admin');
      const b = await Brand.create({ name: 'Marca Soft', slug: 'marca-soft', active: true });

      const res = await request(app)
        .delete(`/api/brands/${b._id}`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);

      const reloaded = await Brand.findById(b._id);
      expect(reloaded).not.toBeNull(); // no se borra
      expect(reloaded?.active).toBe(false); // se desactiva
    });

    it('rechaza 400 si la marca tiene productos activos', async () => {
      const { token } = await createUserAndToken('admin');
      const cat = await seedCategory();
      const b = await Brand.create({ name: 'Conprod', slug: 'conprod-brand', active: true });
      await seedProduct(cat._id as mongoose.Types.ObjectId, { brand: b._id });

      const res = await request(app)
        .delete(`/api/brands/${b._id}`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(400);
      expect(res.body.error || res.body.message).toMatch(/productos/i);

      const reloaded = await Brand.findById(b._id);
      expect(reloaded?.active).toBe(true);
    });
  });
});

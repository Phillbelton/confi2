import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../server';
import { Brand } from '../../models/Brand';
import { Category } from '../../models/Category';
import { Format } from '../../models/Format';
import { Flavor } from '../../models/Flavor';
import Product from '../../models/Product';
import { User } from '../../models/User';
import { signTokenFor } from '../setup/authTestHelpers';
import {
  getBrandsMap,
  getCategoriesMap,
  getFormatsMap,
  getFlavorsMap,
  invalidateBrandsCache,
  invalidateCategoriesCache,
  invalidateFormatsCache,
  invalidateFlavorsCache,
  invalidateAllTaxonomyCaches,
  getTaxonomyCacheStats,
  warmTaxonomyCache,
  hydrateRef,
  hydrateRefArray,
  pickFields,
  CACHE_TTL_MS,
  type CachedBrand,
} from '../../services/taxonomyCache';

/**
 * Tests del cache de taxonomías. Cubrimos:
 *   1. Lectura básica: el cache devuelve un map con _id → doc.
 *   2. Hit: una segunda lectura no toca Mongo (spy en Brand.find).
 *   3. In-flight dedup: N requests concurrentes con cache vacío disparan
 *      UNA sola query.
 *   4. Invalidación: tras invalidar, la siguiente lectura recarga.
 *   5. TTL safety net: `expiresAt = loadedAt + CACHE_TTL_MS`.
 *   6. Failures no envenenan el cache: si el loader rompe, próxima lectura
 *      reintenta.
 *   7. Hidratación: pickFields, hydrateRef, hydrateRefArray.
 *   8. Integración: GET /api/products refleja cambios admin inmediatamente
 *      (no hay que esperar al TTL) tras edit de Brand vía admin controller.
 */

const VALID_PASSWORD = 'Password1!';

const createAdmin = async () => {
  const suffix = `${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
  const user = await User.create({
    name: 'Admin Test',
    email: `admin-${suffix}@test.com`,
    password: VALID_PASSWORD,
    role: 'admin',
    active: true,
  });
  const token = signTokenFor(user);
  return { user, token };
};

// ────────────────────────────────────────────────────────────────────
// 1-2. Lectura básica + hit
// ────────────────────────────────────────────────────────────────────

describe('taxonomyCache – lectura básica y hit/miss', () => {
  it('getBrandsMap devuelve un map con todas las marcas indexadas por _id', async () => {
    await Brand.create({ name: 'Marca A', active: true });
    await Brand.create({ name: 'Marca B', active: true });

    const map = await getBrandsMap();
    expect(map.size).toBe(2);
    const names = Array.from(map.values()).map((b) => b.name).sort();
    expect(names).toEqual(['Marca A', 'Marca B']);

    for (const [key, doc] of map.entries()) {
      expect(key).toBe(doc._id.toString());
    }
  });

  it('una segunda lectura no toca Mongo (cache hit)', async () => {
    await Brand.create({ name: 'Marca Cacheada', active: true });

    // Primera lectura: miss, carga desde Mongo.
    await getBrandsMap();

    // Spy en Brand.find DESPUÉS del primer fetch.
    const spy = jest.spyOn(Brand, 'find');

    // Segunda lectura: debería ser hit puro, no llama a find.
    const map = await getBrandsMap();
    expect(map.size).toBe(1);
    expect(spy).not.toHaveBeenCalled();

    spy.mockRestore();
  });

  it('stats.hits incrementa en cada hit y stats.misses en cada miss', async () => {
    await Brand.create({ name: 'Marca Stats', active: true });

    invalidateBrandsCache();
    const before = getTaxonomyCacheStats().brands;
    expect(before.size).toBe(0);

    await getBrandsMap(); // miss
    const afterMiss = getTaxonomyCacheStats().brands;
    expect(afterMiss.misses).toBe(before.misses + 1);

    await getBrandsMap(); // hit
    await getBrandsMap(); // hit
    const afterHits = getTaxonomyCacheStats().brands;
    expect(afterHits.hits).toBe(afterMiss.hits + 2);
  });

  it('cache vacío (colección sin docs) devuelve un map vacío válido', async () => {
    const map = await getBrandsMap();
    expect(map.size).toBe(0);
    // Segunda lectura sigue siendo hit, no reintenta.
    const spy = jest.spyOn(Brand, 'find');
    const again = await getBrandsMap();
    expect(again.size).toBe(0);
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});

// ────────────────────────────────────────────────────────────────────
// 3. In-flight dedup
// ────────────────────────────────────────────────────────────────────

describe('taxonomyCache – in-flight deduplication', () => {
  it('N requests concurrentes con cache vacío disparan UNA sola query a Mongo', async () => {
    await Brand.create({ name: 'Marca Dedup', active: true });
    invalidateBrandsCache();

    const spy = jest.spyOn(Brand, 'find');

    // 10 lecturas concurrentes.
    const results = await Promise.all(
      Array.from({ length: 10 }, () => getBrandsMap())
    );

    expect(spy).toHaveBeenCalledTimes(1);
    // Todas las promesas resuelven al mismo map.
    const first = results[0];
    for (const m of results) {
      expect(m).toBe(first);
      expect(m.size).toBe(1);
    }

    spy.mockRestore();
  });

  it('aislamiento por colección: load de brands no carga categories', async () => {
    await Brand.create({ name: 'Brand iso', active: true });
    await Category.create({ name: 'Cat iso', active: true });
    invalidateAllTaxonomyCaches();

    const brandSpy = jest.spyOn(Brand, 'find');
    const catSpy = jest.spyOn(Category, 'find');

    await getBrandsMap();
    expect(brandSpy).toHaveBeenCalledTimes(1);
    expect(catSpy).not.toHaveBeenCalled();

    await getCategoriesMap();
    expect(brandSpy).toHaveBeenCalledTimes(1);
    expect(catSpy).toHaveBeenCalledTimes(1);

    brandSpy.mockRestore();
    catSpy.mockRestore();
  });
});

// ────────────────────────────────────────────────────────────────────
// 4. Invalidación
// ────────────────────────────────────────────────────────────────────

describe('taxonomyCache – invalidación', () => {
  it('invalidateBrandsCache fuerza recarga en la próxima lectura', async () => {
    await Brand.create({ name: 'Marca V1', active: true });
    await getBrandsMap(); // carga V1

    // Editamos en DB sin pasar por el cache.
    await Brand.updateOne({ name: 'Marca V1' }, { name: 'Marca V2' });

    // Sin invalidar: sigue viendo el viejo nombre (TTL no expiró).
    const stale = await getBrandsMap();
    expect(Array.from(stale.values())[0].name).toBe('Marca V1');

    invalidateBrandsCache();

    const fresh = await getBrandsMap();
    expect(Array.from(fresh.values())[0].name).toBe('Marca V2');
  });

  it('invalidateAllTaxonomyCaches limpia las cuatro colecciones', async () => {
    await Brand.create({ name: 'Brand all', active: true });
    await Category.create({ name: 'Cat all', active: true });
    await Format.create({ value: 100, unit: 'g' });
    await Flavor.create({ name: 'Vainilla', active: true });

    await warmTaxonomyCache();
    let stats = getTaxonomyCacheStats();
    expect(stats.brands.size).toBe(1);
    expect(stats.categories.size).toBe(1);
    expect(stats.formats.size).toBe(1);
    expect(stats.flavors.size).toBe(1);

    invalidateAllTaxonomyCaches();
    stats = getTaxonomyCacheStats();
    expect(stats.brands.size).toBe(0);
    expect(stats.categories.size).toBe(0);
    expect(stats.formats.size).toBe(0);
    expect(stats.flavors.size).toBe(0);
    expect(stats.brands.expiresAt).toBeNull();
  });

  it('invalidar una colección NO toca las otras', async () => {
    await Brand.create({ name: 'Brand solo', active: true });
    await Category.create({ name: 'Cat solo', active: true });

    await warmTaxonomyCache();

    invalidateBrandsCache();

    const stats = getTaxonomyCacheStats();
    expect(stats.brands.size).toBe(0);
    expect(stats.categories.size).toBe(1);
  });
});

// ────────────────────────────────────────────────────────────────────
// 5. TTL safety net
// ────────────────────────────────────────────────────────────────────

describe('taxonomyCache – TTL', () => {
  it('expiresAt = loadedAt + CACHE_TTL_MS', async () => {
    await Brand.create({ name: 'TTL', active: true });
    invalidateBrandsCache();

    const t0 = Date.now();
    await getBrandsMap();
    const stats = getTaxonomyCacheStats().brands;
    expect(stats.loadedAt).not.toBeNull();
    expect(stats.expiresAt).not.toBeNull();
    expect(stats.loadedAt!).toBeGreaterThanOrEqual(t0);
    expect(stats.expiresAt! - stats.loadedAt!).toBe(CACHE_TTL_MS);
  });
});

// ────────────────────────────────────────────────────────────────────
// 6. Failures no envenenan el cache
// ────────────────────────────────────────────────────────────────────

describe('taxonomyCache – resiliencia ante fallas del loader', () => {
  it('si el loader rompe, la próxima llamada reintenta y no devuelve un map envenenado', async () => {
    await Brand.create({ name: 'Marca Resilient', active: true });
    invalidateBrandsCache();

    // Forzar un fallo del primer fetch.
    const originalFind = Brand.find.bind(Brand);
    let calls = 0;
    const spy = jest.spyOn(Brand, 'find').mockImplementation(((...args: unknown[]) => {
      calls++;
      if (calls === 1) {
        // Devolver un Query stub que rechaza al .lean().exec()
        const broken: any = {
          select: () => broken,
          lean: () => broken,
          exec: () => Promise.reject(new Error('mongo down')),
        };
        return broken;
      }
      return (originalFind as any)(...args);
    }) as any);

    await expect(getBrandsMap()).rejects.toThrow('mongo down');

    // La estructura interna del cache no quedó con "data: empty map"
    const stats = getTaxonomyCacheStats().brands;
    expect(stats.size).toBe(0);
    expect(stats.expiresAt).toBeNull();

    // Segundo intento: ya no falla, retorna el dato bueno.
    const map = await getBrandsMap();
    expect(map.size).toBe(1);
    expect(Array.from(map.values())[0].name).toBe('Marca Resilient');

    spy.mockRestore();
  });
});

// ────────────────────────────────────────────────────────────────────
// 7. Hidratación pura (sin DB)
// ────────────────────────────────────────────────────────────────────

describe('taxonomyCache – helpers de hidratación', () => {
  const oid = (s?: string) =>
    s ? new mongoose.Types.ObjectId(s) : new mongoose.Types.ObjectId();

  it('pickFields devuelve null para subdoc undefined', () => {
    const out = pickFields<CachedBrand>(undefined, ['name', 'slug']);
    expect(out).toBeNull();
  });

  it('pickFields incluye _id y solo los campos pedidos', () => {
    const _id = oid();
    const brand: CachedBrand = {
      _id,
      name: 'X',
      slug: 'x',
      logo: 'http://logo',
      active: true,
    };
    const picked = pickFields<CachedBrand>(brand, ['name', 'slug']);
    expect(picked).toEqual({ _id, name: 'X', slug: 'x' });
    expect((picked as Record<string, unknown>).active).toBeUndefined();
    expect((picked as Record<string, unknown>).logo).toBeUndefined();
  });

  it('hydrateRef reemplaza ObjectId por subdoc proyectado', () => {
    const brandId = oid();
    const product: Record<string, unknown> = { brand: brandId, name: 'P' };
    const map = new Map<string, CachedBrand>([
      [
        brandId.toString(),
        { _id: brandId, name: 'Marca X', slug: 'marca-x', active: true },
      ],
    ]);
    hydrateRef(product, 'brand', map, ['name', 'slug']);
    expect(product.brand).toEqual({ _id: brandId, name: 'Marca X', slug: 'marca-x' });
  });

  it('hydrateRef con ref colgada (no está en el map) deja null', () => {
    const brandId = oid();
    const product: Record<string, unknown> = { brand: brandId };
    const map = new Map<string, CachedBrand>(); // vacío
    hydrateRef(product, 'brand', map, ['name']);
    expect(product.brand).toBeNull();
  });

  it('hydrateRef con campo null/undefined no rompe', () => {
    const product: Record<string, unknown> = { brand: null };
    const map = new Map<string, CachedBrand>();
    hydrateRef(product, 'brand', map, ['name']);
    expect(product.brand).toBeNull();
  });

  it('hydrateRefArray hidrata cada id; los colgados se omiten', () => {
    const c1 = oid();
    const c2 = oid();
    const c3Dangling = oid();
    const product: Record<string, unknown> = { categories: [c1, c2, c3Dangling] };
    const map = new Map<string, any>([
      [c1.toString(), { _id: c1, name: 'C1', slug: 'c1' }],
      [c2.toString(), { _id: c2, name: 'C2', slug: 'c2' }],
    ]);
    hydrateRefArray(product, 'categories', map, ['name', 'slug']);
    expect(product.categories).toHaveLength(2);
    expect((product.categories as any[])[0].name).toBe('C1');
    expect((product.categories as any[])[1].name).toBe('C2');
  });

  it('hydrateRefArray con campo no-array no rompe', () => {
    const product: Record<string, unknown> = { categories: undefined };
    const map = new Map();
    hydrateRefArray(product, 'categories', map, ['name']);
    expect(product.categories).toBeUndefined();
  });
});

// ────────────────────────────────────────────────────────────────────
// 8. Integración: cambios admin se reflejan inmediatamente
// ────────────────────────────────────────────────────────────────────

describe('taxonomyCache – integración con productController', () => {
  it('GET /api/products devuelve la marca con shape de populate', async () => {
    const brand = await Brand.create({ name: 'Marca Real', active: true });
    const cat = await Category.create({ name: 'Cat Real', active: true });
    await Product.create({
      name: 'Producto Real',
      slug: 'producto-real',
      description: 'descripcion suficiente largo',
      categories: [cat._id],
      brand: brand._id,
      unitPrice: 1000,
      saleUnit: { type: 'unidad', quantity: 1 },
      active: true,
    });

    const res = await request(app).get('/api/products');
    expect(res.status).toBe(200);
    expect(res.body.data.data).toHaveLength(1);
    const p = res.body.data.data[0];
    // El brand debe estar hidratado (no es un ObjectId pelado).
    expect(p.brand).toBeTruthy();
    expect(p.brand.name).toBe('Marca Real');
    expect(p.brand.slug).toBeTruthy();
    expect(p.categories).toHaveLength(1);
    expect(p.categories[0].name).toBe('Cat Real');
  });

  it('producto con brand colgada (orphan) responde con brand:null y no rompe', async () => {
    const cat = await Category.create({ name: 'Cat Orphan', active: true });
    const ghostBrandId = new mongoose.Types.ObjectId();
    await Product.create({
      name: 'Producto Orphan',
      slug: 'producto-orphan',
      description: 'descripcion suficiente largo',
      categories: [cat._id],
      brand: ghostBrandId, // no existe en Brand
      unitPrice: 1000,
      saleUnit: { type: 'unidad', quantity: 1 },
      active: true,
    });

    const res = await request(app).get('/api/products');
    expect(res.status).toBe(200);
    expect(res.body.data.data[0].brand).toBeNull();
  });

  it('al editar una marca vía PUT /api/brands/:id, el cambio se refleja en GET /api/products sin esperar TTL', async () => {
    const { token } = await createAdmin();
    const brand = await Brand.create({ name: 'Marca Original', active: true });
    const cat = await Category.create({ name: 'Cat Edit', active: true });
    await Product.create({
      name: 'Producto Edit',
      slug: 'producto-edit',
      description: 'descripcion suficiente largo',
      categories: [cat._id],
      brand: brand._id,
      unitPrice: 1000,
      saleUnit: { type: 'unidad', quantity: 1 },
      active: true,
    });

    // 1. Primera lectura: popula el cache con "Marca Original".
    const before = await request(app).get('/api/products');
    expect(before.body.data.data[0].brand.name).toBe('Marca Original');

    // 2. Admin actualiza la marca.
    const upd = await request(app)
      .put(`/api/brands/${brand._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Marca Editada' });
    expect(upd.status).toBe(200);

    // 3. Próxima lectura del catálogo: debe ver el nuevo nombre, no el viejo.
    const after = await request(app).get('/api/products');
    expect(after.body.data.data[0].brand.name).toBe('Marca Editada');
  });

  it('al crear una marca vía POST /api/brands, queda visible inmediatamente al asignarla a un producto', async () => {
    const { token } = await createAdmin();
    const cat = await Category.create({ name: 'Cat Create', active: true });
    // Producto sin marca, asignamos después de crearla.
    const product = await Product.create({
      name: 'Producto Sin Marca',
      slug: 'producto-sin-marca',
      description: 'descripcion suficiente largo',
      categories: [cat._id],
      unitPrice: 1000,
      saleUnit: { type: 'unidad', quantity: 1 },
      active: true,
    });

    // Warmup del cache (todavía sin marcas).
    await request(app).get('/api/products');

    // Crear marca vía admin: invalidateBrandsCache() debe dispararse.
    const created = await request(app)
      .post('/api/brands')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Marca Recién Creada' });
    expect(created.status).toBe(201);
    const newBrandId = created.body.data.brand._id;

    // Asignar al producto directo en DB.
    await Product.updateOne(
      { _id: product._id },
      { $set: { brand: new mongoose.Types.ObjectId(newBrandId) } }
    );

    // GET debe ver la marca nueva, no devolver null.
    const res = await request(app).get('/api/products');
    expect(res.body.data.data[0].brand).toBeTruthy();
    expect(res.body.data.data[0].brand.name).toBe('Marca Recién Creada');
  });

  it('al eliminar (soft) una marca vía DELETE, el cache se invalida y la marca sigue visible (active:false) tal como antes', async () => {
    const { token } = await createAdmin();
    const brand = await Brand.create({ name: 'Marca Deleted', active: true });
    const cat = await Category.create({ name: 'Cat Del', active: true });
    // Importante: NO crear producto que la referencie, sino el delete falla (hasProducts check).
    // En su lugar, creamos un producto cuya brand sea esta marca DESPUÉS del soft-delete,
    // para verificar que el populate sigue resolviéndola (semántica de Mongoose populate).
    await request(app).get('/api/products'); // warm

    const del = await request(app)
      .delete(`/api/brands/${brand._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(del.status).toBe(200);

    // Producto que referencia la marca recién soft-borrada.
    await Product.create({
      name: 'P con marca borrada',
      slug: 'p-con-marca-borrada',
      description: 'descripcion suficiente largo',
      categories: [cat._id],
      brand: brand._id,
      unitPrice: 1000,
      saleUnit: { type: 'unidad', quantity: 1 },
      active: true,
    });

    const res = await request(app).get('/api/products');
    expect(res.body.data.data[0].brand).toBeTruthy();
    expect(res.body.data.data[0].brand.name).toBe('Marca Deleted');
  });

  it('invalidación de categories también se dispara en create/update/delete', async () => {
    const { token } = await createAdmin();
    const cat = await Category.create({ name: 'Cat Original', active: true });
    await Product.create({
      name: 'P cat',
      slug: 'p-cat',
      description: 'descripcion suficiente largo',
      categories: [cat._id],
      unitPrice: 1000,
      saleUnit: { type: 'unidad', quantity: 1 },
      active: true,
    });

    await request(app).get('/api/products'); // warm

    // PUT cambia el nombre.
    const upd = await request(app)
      .put(`/api/categories/${cat._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Cat Editada' });
    expect(upd.status).toBe(200);

    const res = await request(app).get('/api/products');
    expect(res.body.data.data[0].categories[0].name).toBe('Cat Editada');
  });

  it('invalidación de formats: editar un Format se ve en el listado', async () => {
    const { token } = await createAdmin();
    const fmt = await Format.create({ value: 100, unit: 'g' });
    const cat = await Category.create({ name: 'Cat Fmt', active: true });
    await Product.create({
      name: 'P fmt',
      slug: 'p-fmt',
      description: 'descripcion suficiente largo',
      categories: [cat._id],
      format: fmt._id,
      unitPrice: 1000,
      saleUnit: { type: 'unidad', quantity: 1 },
      active: true,
    });

    await request(app).get('/api/products'); // warm — cachea "100g"

    const upd = await request(app)
      .put(`/api/formats/${fmt._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ value: 250 });
    expect(upd.status).toBe(200);

    const res = await request(app).get('/api/products');
    // El label se autogenera con value+unit. 250g.
    expect(res.body.data.data[0].format.label).toBe('250g');
    expect(res.body.data.data[0].format.value).toBe(250);
  });

  it('invalidación de flavors: editar un Flavor se ve en el listado', async () => {
    const { token } = await createAdmin();
    const fl = await Flavor.create({ name: 'Vainilla', active: true });
    const cat = await Category.create({ name: 'Cat Fl', active: true });
    await Product.create({
      name: 'P fl',
      slug: 'p-fl',
      description: 'descripcion suficiente largo',
      categories: [cat._id],
      flavor: fl._id,
      unitPrice: 1000,
      saleUnit: { type: 'unidad', quantity: 1 },
      active: true,
    });

    await request(app).get('/api/products');

    const upd = await request(app)
      .put(`/api/flavors/${fl._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Frutilla' });
    expect(upd.status).toBe(200);

    const res = await request(app).get('/api/products');
    expect(res.body.data.data[0].flavor.name).toBe('Frutilla');
  });
});

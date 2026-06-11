import request from 'supertest';
import app from '../../server';
import {
  HomeLayout,
  DEFAULT_HOME_SECTIONS,
  HomeSection,
} from '../../models/HomeLayout';
import { User, IUser } from '../../models/User';
import { signTokenFor } from '../setup/authTestHelpers';
import type { UserRole } from '../../types';

/**
 * Tests e2e del layout de la home (orden + visibilidad + config de secciones).
 * GET es público (lo consume la tienda); PUT es admin-only. Fase 2: las
 * secciones de producto son instancias configurables y puede haber varias.
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

const clone = (): HomeSection[] =>
  JSON.parse(JSON.stringify(DEFAULT_HOME_SECTIONS));

/** Layout válido: hero al final, ofertas oculta, + carrusel de colección. */
const customSections = (): HomeSection[] => {
  const sections = clone();
  const hero = sections.shift()!;
  sections.push(hero);
  sections.find((s) => s.id === 'offers')!.active = false;
  sections.splice(2, 0, {
    id: 'carousel-navidad',
    type: 'product_carousel',
    active: true,
    config: {
      title: 'Especial Navidad',
      emoji: '🎄',
      source: 'collection',
      collectionSlug: 'navidad',
      limit: 8,
    },
  });
  return sections;
};

const putAs = async (token: string, sections: unknown) =>
  request(app)
    .put('/api/home-layout')
    .set('Authorization', `Bearer ${token}`)
    .send({ sections });

beforeEach(async () => {
  await HomeLayout.deleteMany({});
});

describe('GET /api/home-layout', () => {
  it('sin doc devuelve el layout por defecto con isDefault=true (público, sin auth)', async () => {
    const res = await request(app).get('/api/home-layout');

    expect(res.status).toBe(200);
    expect(res.body.data.isDefault).toBe(true);
    expect(res.body.data.sections).toEqual(DEFAULT_HOME_SECTIONS);
    expect(await HomeLayout.countDocuments()).toBe(0);
  });

  it('con doc guardado devuelve ese layout con isDefault=false', async () => {
    const sections = customSections();
    await HomeLayout.create({ key: 'home', sections });

    const res = await request(app).get('/api/home-layout');

    expect(res.status).toBe(200);
    expect(res.body.data.isDefault).toBe(false);
    expect(res.body.data.sections).toEqual(sections);
  });

  it('migra docs con el shape Fase 1 ({key, active}) al formato nuevo', async () => {
    // Doc legacy escrito directo a la colección (el schema actual no lo emite)
    await HomeLayout.collection.insertOne({
      key: 'home',
      sections: [
        { key: 'best_sellers', active: true },
        { key: 'offers', active: false },
        { key: 'hero', active: true },
      ],
    });

    const res = await request(app).get('/api/home-layout');

    expect(res.status).toBe(200);
    const sections = res.body.data.sections as HomeSection[];
    expect(sections.map((s) => s.id)).toEqual(['best_sellers', 'offers', 'hero']);
    // Derivó tipo y config del default canónico, preservando active
    expect(sections[0].type).toBe('product_grid');
    expect(sections[0].config?.title).toBe('Más vendidos');
    expect(sections[1].active).toBe(false);
    expect(sections[1].config?.source).toBe('on_sale');
  });
});

describe('PUT /api/home-layout', () => {
  it('401 sin auth', async () => {
    const res = await request(app)
      .put('/api/home-layout')
      .send({ sections: DEFAULT_HOME_SECTIONS });
    expect(res.status).toBe(401);
  });

  it.each<UserRole>(['cliente', 'funcionario'])('403 con rol %s', async (role) => {
    const { token } = await createUserAndToken(role);
    const res = await putAs(token, DEFAULT_HOME_SECTIONS);
    expect(res.status).toBe(403);
  });

  it('admin guarda layout con carrusel extra y el GET lo refleja (singleton)', async () => {
    const { token } = await createUserAndToken('admin');
    const sections = customSections();

    const put = await putAs(token, sections);
    expect(put.status).toBe(200);
    expect(put.body.data.sections).toEqual(sections);

    const get = await request(app).get('/api/home-layout');
    expect(get.body.data.sections).toEqual(sections);
    expect(get.body.data.isDefault).toBe(false);

    // Singleton: un segundo PUT actualiza el mismo doc
    const put2 = await putAs(token, DEFAULT_HOME_SECTIONS);
    expect(put2.status).toBe(200);
    expect(await HomeLayout.countDocuments()).toBe(1);
  });

  it('permite quitar todas las secciones de producto (0..N)', async () => {
    const { token } = await createUserAndToken('admin');
    const sections = clone().filter(
      (s) => s.type !== 'product_carousel' && s.type !== 'product_grid'
    );
    const res = await putAs(token, sections);
    expect(res.status).toBe(200);
  });

  describe('validación (400)', () => {
    let token: string;
    beforeEach(async () => {
      ({ token } = await createUserAndToken('admin'));
    });

    it('ids repetidos', async () => {
      const bad = clone();
      bad[1].id = bad[0].id;
      expect((await putAs(token, bad)).status).toBe(400);
    });

    it('falta el hero', async () => {
      const bad = clone().filter((s) => s.type !== 'hero');
      expect((await putAs(token, bad)).status).toBe(400);
    });

    it('dos heros', async () => {
      const bad = clone();
      bad.push({ id: 'hero-2', type: 'hero', active: true });
      expect((await putAs(token, bad)).status).toBe(400);
    });

    it('banner_zone sin placement', async () => {
      const bad = clone();
      delete bad.find((s) => s.id === 'promo_banners')!.config!.placement;
      expect((await putAs(token, bad)).status).toBe(400);
    });

    it('dos banner_zone del mismo placement', async () => {
      const bad = clone();
      bad.find((s) => s.id === 'promo_banners')!.config!.placement =
        'home_secondary';
      expect((await putAs(token, bad)).status).toBe(400);
    });

    it('carrusel sin título', async () => {
      const bad = clone();
      delete bad.find((s) => s.id === 'offers')!.config!.title;
      expect((await putAs(token, bad)).status).toBe(400);
    });

    it('carrusel sin source', async () => {
      const bad = clone();
      delete bad.find((s) => s.id === 'offers')!.config!.source;
      expect((await putAs(token, bad)).status).toBe(400);
    });

    it('source=collection sin collectionSlug', async () => {
      const bad = clone();
      const offers = bad.find((s) => s.id === 'offers')!;
      offers.config!.source = 'collection';
      delete offers.config!.collectionSlug;
      expect((await putAs(token, bad)).status).toBe(400);
    });

    it('tipo desconocido', async () => {
      const bad = clone() as unknown as Array<Record<string, unknown>>;
      bad[0].type = 'malware_widget';
      expect((await putAs(token, bad)).status).toBe(400);
    });

    it('más de 20 secciones', async () => {
      const bad = clone();
      for (let i = 0; i < 13; i++) {
        bad.push({
          id: `carousel-${i}`,
          type: 'product_carousel',
          active: true,
          config: { title: `C${i}`, source: 'newest' },
        });
      }
      expect(bad.length).toBeGreaterThan(20);
      expect((await putAs(token, bad)).status).toBe(400);
    });
  });

  it('sanity de los defaults: singletons y zonas correctas', () => {
    const types = DEFAULT_HOME_SECTIONS.map((s) => s.type);
    expect(types.filter((t) => t === 'hero')).toHaveLength(1);
    expect(types.filter((t) => t === 'collections')).toHaveLength(1);
    expect(types.filter((t) => t === 'static_cta')).toHaveLength(1);
    const placements = DEFAULT_HOME_SECTIONS.filter(
      (s) => s.type === 'banner_zone'
    ).map((s) => s.config?.placement);
    expect(placements.sort()).toEqual(['home_promo', 'home_secondary']);
    expect(new Set(DEFAULT_HOME_SECTIONS.map((s) => s.id)).size).toBe(
      DEFAULT_HOME_SECTIONS.length
    );
  });
});

import request from 'supertest';
import app from '../../server';
import {
  HomeLayout,
  HOME_SECTION_KEYS,
  DEFAULT_HOME_SECTIONS,
} from '../../models/HomeLayout';
import { User, IUser } from '../../models/User';
import { signTokenFor } from '../setup/authTestHelpers';
import type { UserRole } from '../../types';

/**
 * Tests e2e del layout de la home (orden + visibilidad de secciones).
 * GET es público (lo consume la tienda); PUT es admin-only y exige el set
 * canónico exacto de secciones (Fase 1: solo reordenar/ocultar).
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

/** Layout válido: el set canónico con el hero al final y ofertas oculta. */
const reorderedSections = () => {
  const sections = DEFAULT_HOME_SECTIONS.map((s) => ({ ...s }));
  const hero = sections.shift()!;
  sections.push(hero);
  const offers = sections.find((s) => s.key === 'offers')!;
  offers.active = false;
  return sections;
};

beforeEach(async () => {
  await HomeLayout.deleteMany({});
});

describe('GET /api/home-layout', () => {
  it('sin doc devuelve el layout por defecto con isDefault=true (público, sin auth)', async () => {
    const res = await request(app).get('/api/home-layout');

    expect(res.status).toBe(200);
    expect(res.body.data.isDefault).toBe(true);
    expect(res.body.data.sections).toEqual(DEFAULT_HOME_SECTIONS);
    // No se creó ningún doc por leer
    expect(await HomeLayout.countDocuments()).toBe(0);
  });

  it('con doc guardado devuelve ese layout con isDefault=false', async () => {
    const sections = reorderedSections();
    await HomeLayout.create({ key: 'home', sections });

    const res = await request(app).get('/api/home-layout');

    expect(res.status).toBe(200);
    expect(res.body.data.isDefault).toBe(false);
    expect(res.body.data.sections).toEqual(sections);
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
    const res = await request(app)
      .put('/api/home-layout')
      .set('Authorization', `Bearer ${token}`)
      .send({ sections: DEFAULT_HOME_SECTIONS });
    expect(res.status).toBe(403);
  });

  it('admin guarda el layout y el GET lo refleja (upsert del singleton)', async () => {
    const { token } = await createUserAndToken('admin');
    const sections = reorderedSections();

    const put = await request(app)
      .put('/api/home-layout')
      .set('Authorization', `Bearer ${token}`)
      .send({ sections });
    expect(put.status).toBe(200);
    expect(put.body.data.sections).toEqual(sections);

    const get = await request(app).get('/api/home-layout');
    expect(get.body.data.sections).toEqual(sections);
    expect(get.body.data.isDefault).toBe(false);

    // Singleton: un segundo PUT actualiza el mismo doc, no crea otro
    const put2 = await request(app)
      .put('/api/home-layout')
      .set('Authorization', `Bearer ${token}`)
      .send({ sections: DEFAULT_HOME_SECTIONS });
    expect(put2.status).toBe(200);
    expect(await HomeLayout.countDocuments()).toBe(1);
  });

  it('400 si falta una sección', async () => {
    const { token } = await createUserAndToken('admin');
    const incomplete = DEFAULT_HOME_SECTIONS.slice(1);

    const res = await request(app)
      .put('/api/home-layout')
      .set('Authorization', `Bearer ${token}`)
      .send({ sections: incomplete });
    expect(res.status).toBe(400);
  });

  it('400 si hay secciones repetidas', async () => {
    const { token } = await createUserAndToken('admin');
    const dup = DEFAULT_HOME_SECTIONS.map((s) => ({ ...s }));
    dup[1] = { ...dup[0] }; // dos veces la misma key, largo correcto

    const res = await request(app)
      .put('/api/home-layout')
      .set('Authorization', `Bearer ${token}`)
      .send({ sections: dup });
    expect(res.status).toBe(400);
  });

  it('400 con key desconocida', async () => {
    const { token } = await createUserAndToken('admin');
    const bad = DEFAULT_HOME_SECTIONS.map((s) => ({ ...s }));
    (bad[0] as { key: string }).key = 'hacker_section';

    const res = await request(app)
      .put('/api/home-layout')
      .set('Authorization', `Bearer ${token}`)
      .send({ sections: bad });
    expect(res.status).toBe(400);
  });

  it('400 con active no booleano', async () => {
    const { token } = await createUserAndToken('admin');
    const bad = DEFAULT_HOME_SECTIONS.map((s) => ({ ...s }));
    (bad[0] as { active: unknown }).active = 'yes';

    const res = await request(app)
      .put('/api/home-layout')
      .set('Authorization', `Bearer ${token}`)
      .send({ sections: bad });
    expect(res.status).toBe(400);
  });

  it('sanity: HOME_SECTION_KEYS tiene 9 secciones sin repetidos', () => {
    expect(HOME_SECTION_KEYS.length).toBe(9);
    expect(new Set(HOME_SECTION_KEYS).size).toBe(9);
  });
});

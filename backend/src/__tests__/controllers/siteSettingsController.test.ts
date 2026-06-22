import request from 'supertest';
import app from '../../server';
import { SiteSettings } from '../../models/SiteSettings';
import { User, IUser } from '../../models/User';
import { signTokenFor } from '../setup/authTestHelpers';
import type { UserRole } from '../../types';

/**
 * Tests e2e del singleton de ajustes del sitio. GET es público (lo consume la
 * tienda para saber qué variante de card mostrar); PUT es admin-only.
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
  return { user, token: signTokenFor(user) };
};

const putAs = (token: string, body: object) =>
  request(app)
    .put('/api/site-settings')
    .set('Authorization', `Bearer ${token}`)
    .send(body);

beforeEach(async () => {
  await SiteSettings.deleteMany({});
});

describe('GET /api/site-settings', () => {
  it('sin doc devuelve el default (D), sin crear doc y sin auth', async () => {
    const res = await request(app).get('/api/site-settings');

    expect(res.status).toBe(200);
    expect(res.body.data.catalogPresentationVariant).toBe('D');
    expect(await SiteSettings.countDocuments()).toBe(0);
  });

  it('con doc guardado devuelve esa variante', async () => {
    await SiteSettings.create({ key: 'site', catalogPresentationVariant: 'C' });

    const res = await request(app).get('/api/site-settings');

    expect(res.status).toBe(200);
    expect(res.body.data.catalogPresentationVariant).toBe('C');
  });
});

describe('PUT /api/site-settings', () => {
  it('401 sin auth', async () => {
    const res = await request(app)
      .put('/api/site-settings')
      .send({ catalogPresentationVariant: 'C' });
    expect(res.status).toBe(401);
  });

  it.each<UserRole>(['cliente', 'funcionario'])('403 con rol %s', async (role) => {
    const { token } = await createUserAndToken(role);
    const res = await putAs(token, { catalogPresentationVariant: 'C' });
    expect(res.status).toBe(403);
  });

  it('admin guarda la variante y el GET la refleja (singleton)', async () => {
    const { token } = await createUserAndToken('admin');

    const put = await putAs(token, { catalogPresentationVariant: 'C' });
    expect(put.status).toBe(200);
    expect(put.body.data.catalogPresentationVariant).toBe('C');

    const get = await request(app).get('/api/site-settings');
    expect(get.body.data.catalogPresentationVariant).toBe('C');

    // Singleton: un segundo PUT actualiza el mismo doc
    const put2 = await putAs(token, { catalogPresentationVariant: 'D' });
    expect(put2.status).toBe(200);
    expect(await SiteSettings.countDocuments()).toBe(1);
    const get2 = await request(app).get('/api/site-settings');
    expect(get2.body.data.catalogPresentationVariant).toBe('D');
  });

  it('400 con variante inválida o body vacío', async () => {
    const { token } = await createUserAndToken('admin');
    expect((await putAs(token, { catalogPresentationVariant: 'X' })).status).toBe(400);
    expect((await putAs(token, {})).status).toBe(400);
  });
});

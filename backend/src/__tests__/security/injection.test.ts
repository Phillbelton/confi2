import request from 'supertest';
import app from '../../server';
import { User } from '../../models/User';
import { signTokenFor } from '../setup/authTestHelpers';

/**
 * Suite de inyección (defensa in-depth ya presente: express-mongo-sanitize +
 * xssSanitize/DOMPurify + validación Zod). Estos tests fijan que la protección
 * NO se rompa en una refactorización.
 *
 * Cubre:
 *  - Inyección NoSQL en login y en query params (operadores $gt/$ne).
 *  - XSS almacenado: los tags se remueven antes de persistir (end-to-end).
 *  - Regex injection / ReDoS en la búsqueda de usuarios (documenta el riesgo
 *    de #10: `$regex` con input crudo — bounded por el dataset pero real).
 */

const STRONG_PASSWORD = 'Password1!';

const createAdmin = async () => {
  const suffix = `${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
  const user = await User.create({
    name: 'Admin',
    email: `admin-${suffix}@test.com`,
    password: STRONG_PASSWORD,
    role: 'admin',
    active: true,
  });
  return { user, token: signTokenFor(user) };
};

// ────────────────────────────────────────────────────────────────────
// Inyección NoSQL
// ────────────────────────────────────────────────────────────────────
describe('Inyección NoSQL', () => {
  const OPERATOR_PAYLOADS = [
    { email: { $gt: '' }, password: { $gt: '' } },
    { email: { $ne: null }, password: { $ne: null } },
    { email: { $gt: '' }, password: 'x' },
  ];

  it.each(OPERATOR_PAYLOADS)(
    'login con operadores Mongo (%j) NO devuelve token ni 200',
    async (payload) => {
      const res = await request(app).post('/api/auth/login').send(payload);
      // mongo-sanitize reescribe $/. → el objeto ya no es un operador; Zod
      // rechaza (email debe ser string) → 400. Nunca 200 con token.
      expect(res.status).not.toBe(200);
      expect(res.body?.data?.token).toBeUndefined();
    }
  );

  it('un usuario real NO puede loguearse mandando la password como operador', async () => {
    const suffix = `${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
    const email = `victim-${suffix}@test.com`;
    await User.create({ name: 'Victim', email, password: STRONG_PASSWORD, role: 'cliente', active: true });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email, password: { $gt: '' } });

    expect(res.status).not.toBe(200);
    expect(res.body?.data?.token).toBeUndefined();
  });

  it('operadores Mongo en query params no rompen ni filtran (GET /api/users)', async () => {
    const admin = await createAdmin();
    // ?role[$ne]=cliente — intento de operador vía querystring
    const res = await request(app)
      .get('/api/users')
      .query({ 'role[$ne]': 'cliente' })
      .set('Authorization', `Bearer ${admin.token}`);
    // Lo importante: NUNCA 500 ni ejecución del operador. El backend lo
    // neutraliza (mongo-sanitize reescribe el $) y responde 200 o lo rechaza
    // con 400; ambos son resultados seguros (el operador no se ejecuta).
    expect([200, 400]).toContain(res.status);
    expect(res.status).not.toBe(500);
  });
});

// ────────────────────────────────────────────────────────────────────
// XSS almacenado (end-to-end): el payload se sanitiza antes de persistir
// ────────────────────────────────────────────────────────────────────
describe('XSS almacenado', () => {
  it('el nombre en /register se guarda sin tags <script>', async () => {
    const suffix = `${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
    const email = `xss-${suffix}@test.com`;
    const res = await request(app).post('/api/auth/register').send({
      name: '<script>alert(1)</script>Juanito',
      email,
      password: STRONG_PASSWORD,
      phone: '+56912345678',
    });

    expect(res.status).toBe(201);
    // La respuesta no debe contener el tag
    expect(res.body.data.user.name).not.toMatch(/<script>/i);
    expect(res.body.data.user.name).toContain('Juanito');

    // Y en DB tampoco quedó el markup
    const stored = await User.findOne({ email }).lean();
    expect(stored?.name).not.toMatch(/<script>/i);
    expect(stored?.name).not.toMatch(/<\/?[a-z]/i);
  });

  it('atributos de evento (onerror=) y tags img se neutralizan', async () => {
    const suffix = `${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
    const email = `xss2-${suffix}@test.com`;
    const res = await request(app).post('/api/auth/register').send({
      name: '<img src=x onerror=alert(1)>Pedro',
      email,
      password: STRONG_PASSWORD,
      phone: '+56912345679',
    });
    expect(res.status).toBe(201);
    expect(res.body.data.user.name).not.toMatch(/onerror/i);
    expect(res.body.data.user.name).not.toMatch(/<img/i);
  });
});

// ────────────────────────────────────────────────────────────────────
// Regex injection / ReDoS en búsqueda (documenta #10)
// ────────────────────────────────────────────────────────────────────
describe('Regex injection en búsqueda de usuarios', () => {
  it('un patrón de regex malicioso NO cuelga la respuesta (bounded por dataset)', async () => {
    const admin = await createAdmin();
    // Patrón clásico de catastrophic backtracking. Con la colección chica de
    // test responde rápido; el riesgo real (ReDoS) crece con el volumen de
    // usuarios → ver recomendación en el reporte (escapar el input o usar
    // índice de texto en lugar de $regex crudo).
    const evil = '(a+)+$';
    const t0 = Date.now();
    const res = await request(app)
      .get('/api/users')
      .query({ search: evil })
      .set('Authorization', `Bearer ${admin.token}`);
    const elapsed = Date.now() - t0;

    expect(res.status).toBe(200);
    expect(elapsed).toBeLessThan(3000);
  });

  it('el input de búsqueda se interpreta como regex (comportamiento a endurecer)', async () => {
    const admin = await createAdmin();
    const suffix = `${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
    await User.create({ name: `Zeta ${suffix}`, email: `zeta-${suffix}@test.com`, password: STRONG_PASSWORD, role: 'cliente', active: true });

    // `.*` (comodín regex) matchea todo → confirma que el input NO se escapa.
    const res = await request(app)
      .get('/api/users')
      .query({ search: '.*' })
      .set('Authorization', `Bearer ${admin.token}`);

    expect(res.status).toBe(200);
    // Documenta el hecho: metacaracteres regex son efectivos (posible abuso).
    expect(res.body.data.data.length).toBeGreaterThan(0);
  });
});

import request from 'supertest';
import app from '../../server';

/**
 * Headers de seguridad (helmet) y política CORS a nivel de aplicación.
 *
 * NOTA: estos tests corren contra la app Express directamente. En el despliegue
 * real, el HTML del frontend lo sirve Next.js/Caddy (fuera de helmet) — por eso
 * las páginas de usuario NO tienen estos headers (ver hallazgo del reporte).
 * Acá fijamos que al menos la API los mantenga.
 */

describe('Headers de seguridad en /api (helmet)', () => {
  it('la respuesta de la API trae los headers helmet clave', async () => {
    const res = await request(app).get('/api/categories');

    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['content-security-policy']).toBeDefined();
    // helmet oculta la tecnología
    expect(res.headers['x-powered-by']).toBeUndefined();
    // Clickjacking
    expect(res.headers['x-frame-options'] || res.headers['content-security-policy']).toBeTruthy();
  });
});

describe('Política CORS', () => {
  it('refleja un origen permitido (localhost:3000) con credenciales', async () => {
    const res = await request(app)
      .get('/api/categories')
      .set('Origin', 'http://localhost:3000');

    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:3000');
    expect(res.headers['access-control-allow-credentials']).toBe('true');
  });

  it('NO refleja un origen no confiable (evil.com)', async () => {
    const res = await request(app)
      .get('/api/categories')
      .set('Origin', 'https://evil.com');

    // Lo crítico: nunca debe devolver ACAO = evil.com (ni '*').
    expect(res.headers['access-control-allow-origin']).not.toBe('https://evil.com');
    expect(res.headers['access-control-allow-origin']).not.toBe('*');
  });

  it('NO permite bypass por sufijo (seenode.com.evil.com)', async () => {
    const res = await request(app)
      .get('/api/categories')
      .set('Origin', 'https://seenode.com.evil.com');

    expect(res.headers['access-control-allow-origin']).not.toBe('https://seenode.com.evil.com');
  });
});

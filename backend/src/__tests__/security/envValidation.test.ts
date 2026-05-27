/**
 * Tests de `validateEnv` (config/env.ts) — específicamente del hardening
 * A2 (longitud y entropía mínima de los JWT secrets en producción).
 *
 * Estos tests NO pueden importar ENV/validateEnv directamente porque
 * ese módulo evalúa process.env al cargar. Para testearlo, usamos
 * `jest.isolateModulesAsync` (o equivalente) que recarga el módulo con
 * `process.env` parcheado.
 */

const STRONG_SECRET_A = 'a'.repeat(33) + 'B1!'; // 36 chars, mezcla
const STRONG_SECRET_B = 'X9'.repeat(20); // 40 chars, 2 caracteres distintos
const STRONG_SECRET_C =
  'c3rt-r4ndom-l00k1ng-w1th-N0ndashes-And_special-chars!!_test_only';

describe('validateEnv — A2 hardening de secrets en producción', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.resetModules();
  });

  /**
   * Carga `validateEnv` desde cero con un process.env mockeado y devuelve
   * una función que la invoca. `jest.isolateModulesAsync` no está
   * disponible en jest v30 stable; usamos `jest.isolateModules` síncrono.
   */
  const loadValidateEnv = (overrides: Record<string, string>): (() => void) => {
    process.env = { ...originalEnv, ...overrides };
    let validateEnv!: () => void;
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      validateEnv = require('../../config/env').validateEnv;
    });
    return validateEnv;
  };

  it('PRODUCCIÓN: JWT_SECRET con < 32 chars es rechazado', () => {
    const validateEnv = loadValidateEnv({
      NODE_ENV: 'production',
      MONGODB_URI: 'mongodb://localhost/x',
      JWT_SECRET: 'demasiado-corto',
      JWT_REFRESH_SECRET: STRONG_SECRET_A,
    });
    expect(validateEnv).toThrow(/JWT_SECRET.*32 caracteres/);
  });

  it('PRODUCCIÓN: JWT_REFRESH_SECRET con < 32 chars es rechazado', () => {
    const validateEnv = loadValidateEnv({
      NODE_ENV: 'production',
      MONGODB_URI: 'mongodb://localhost/x',
      JWT_SECRET: STRONG_SECRET_A,
      JWT_REFRESH_SECRET: 'corto',
    });
    expect(validateEnv).toThrow(/JWT_REFRESH_SECRET.*32 caracteres/);
  });

  it('PRODUCCIÓN: JWT_SECRET con solo minúsculas es rechazado (baja entropía)', () => {
    const validateEnv = loadValidateEnv({
      NODE_ENV: 'production',
      MONGODB_URI: 'mongodb://localhost/x',
      JWT_SECRET: 'a'.repeat(40),
      JWT_REFRESH_SECRET: STRONG_SECRET_A,
    });
    expect(validateEnv).toThrow(/baja entropía/);
  });

  it('PRODUCCIÓN: JWT_SECRET con solo dígitos es rechazado', () => {
    const validateEnv = loadValidateEnv({
      NODE_ENV: 'production',
      MONGODB_URI: 'mongodb://localhost/x',
      JWT_SECRET: '1'.repeat(40),
      JWT_REFRESH_SECRET: STRONG_SECRET_A,
    });
    expect(validateEnv).toThrow(/baja entropía/);
  });

  it('PRODUCCIÓN: JWT_SECRET con un único carácter repetido es rechazado', () => {
    const validateEnv = loadValidateEnv({
      NODE_ENV: 'production',
      MONGODB_URI: 'mongodb://localhost/x',
      JWT_SECRET: 'Z'.repeat(40),
      JWT_REFRESH_SECRET: STRONG_SECRET_A,
    });
    expect(validateEnv).toThrow(/baja entropía/);
  });

  it('PRODUCCIÓN: ambos secrets sólidos pasan la validación', () => {
    const validateEnv = loadValidateEnv({
      NODE_ENV: 'production',
      MONGODB_URI: 'mongodb://localhost/x',
      JWT_SECRET: STRONG_SECRET_C,
      JWT_REFRESH_SECRET: STRONG_SECRET_B,
    });
    expect(validateEnv).not.toThrow();
  });

  it('PRODUCCIÓN: JWT_SECRET === JWT_REFRESH_SECRET es rechazado (validación previa)', () => {
    const validateEnv = loadValidateEnv({
      NODE_ENV: 'production',
      MONGODB_URI: 'mongodb://localhost/x',
      JWT_SECRET: STRONG_SECRET_A,
      JWT_REFRESH_SECRET: STRONG_SECRET_A,
    });
    expect(validateEnv).toThrow(/no puede ser igual/);
  });

  it('DESARROLLO: las reglas de longitud NO se aplican (permite secrets cortos)', () => {
    const validateEnv = loadValidateEnv({
      NODE_ENV: 'development',
      MONGODB_URI: 'mongodb://localhost/x',
      JWT_SECRET: 'corto',
      JWT_REFRESH_SECRET: 'tambien',
    });
    expect(validateEnv).not.toThrow();
  });

  it('PRODUCCIÓN: JWT_SECRET con default-de-repo es rechazado por mensaje específico', () => {
    const validateEnv = loadValidateEnv({
      NODE_ENV: 'production',
      MONGODB_URI: 'mongodb://localhost/x',
      JWT_SECRET: 'default_secret_change_in_production',
      JWT_REFRESH_SECRET: STRONG_SECRET_A,
    });
    expect(validateEnv).toThrow(/JWT_SECRET debe ser cambiado/);
  });
});

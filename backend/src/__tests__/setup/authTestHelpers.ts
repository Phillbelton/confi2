import jwt from 'jsonwebtoken';
import { ENV } from '../../config/env';
import type { IUser } from '../../models/User';
import type { TokenPayload } from '../../types';

const JWT_ALGORITHM: jwt.Algorithm = 'HS256';

/**
 * Helper centralizado para firmar JWTs en tests.
 *
 * Mantiene el contrato del token de producción (incluye `tv`, usa HS256
 * explícito) sin que cada test tenga que recordar los detalles. Si en el
 * futuro cambia el shape del payload, este archivo es el único punto de
 * actualización para que todos los tests sigan reflejando producción.
 */
export const signTokenFor = (
  user: Pick<IUser, '_id' | 'email' | 'role' | 'tokenVersion'>,
  overrides: Partial<TokenPayload> = {},
  signOptions: jwt.SignOptions = {}
): string => {
  const payload: TokenPayload = {
    id: user._id.toString(),
    email: user.email,
    role: user.role,
    tv: user.tokenVersion ?? 0,
    ...overrides,
  };
  return jwt.sign(payload, ENV.JWT_SECRET, {
    algorithm: JWT_ALGORITHM,
    ...signOptions,
  });
};

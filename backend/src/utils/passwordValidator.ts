/**
 * Password Complexity Validator
 *
 * Reglas de complejidad de contraseñas:
 * - Mínimo 8 caracteres
 * - Al menos una letra mayúscula
 * - Al menos una letra minúscula
 * - Al menos un número
 * - Al menos un carácter especial
 */

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  strength: 'weak' | 'medium' | 'strong' | 'very-strong';
}

/**
 * Valida la complejidad de una contraseña
 */
export const validatePasswordComplexity = (password: string): PasswordValidationResult => {
  const errors: string[] = [];
  let strength: 'weak' | 'medium' | 'strong' | 'very-strong' = 'weak';

  // Validación de longitud mínima
  if (!password || password.length < 8) {
    errors.push('La contraseña debe tener al menos 8 caracteres');
  }

  // Validación de mayúsculas
  if (!/[A-Z]/.test(password)) {
    errors.push('La contraseña debe contener al menos una letra mayúscula');
  }

  // Validación de minúsculas
  if (!/[a-z]/.test(password)) {
    errors.push('La contraseña debe contener al menos una letra minúscula');
  }

  // Validación de números
  if (!/[0-9]/.test(password)) {
    errors.push('La contraseña debe contener al menos un número');
  }

  // Validación de caracteres especiales
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('La contraseña debe contener al menos un carácter especial (!@#$%^&*...)');
  }

  // Calcular fortaleza
  if (errors.length === 0) {
    const lengthScore = password.length >= 12 ? 2 : password.length >= 10 ? 1 : 0;
    const varietyScore = [
      /[A-Z]/.test(password),
      /[a-z]/.test(password),
      /[0-9]/.test(password),
      /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    ].filter(Boolean).length;

    const totalScore = lengthScore + varietyScore;

    if (totalScore >= 6) {
      strength = 'very-strong';
    } else if (totalScore >= 5) {
      strength = 'strong';
    } else if (totalScore >= 4) {
      strength = 'medium';
    } else {
      strength = 'weak';
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    strength,
  };
};

/**
 * Verifica si la contraseña es común/débil
 */
export const isCommonPassword = (password: string): boolean => {
  const commonPasswords = [
    'password',
    '12345678',
    '123456789',
    'qwerty123',
    'abc123456',
    'password1',
    'admin123',
    'letmein',
    'welcome',
    'monkey',
    'dragon',
    'master',
    'sunshine',
    'princess',
    'football',
    '1234567890',
  ];

  const lowerPassword = password.toLowerCase();
  return commonPasswords.some(common => lowerPassword.includes(common));
};

/**
 * Valida que la contraseña cumpla con todos los requisitos de seguridad
 */
export const validatePassword = (password: string): PasswordValidationResult => {
  const result = validatePasswordComplexity(password);

  // Verificar contraseñas comunes
  if (result.isValid && isCommonPassword(password)) {
    result.isValid = false;
    result.errors.push('La contraseña es muy común. Por favor, elige una más segura.');
    result.strength = 'weak';
  }

  return result;
};

/**
 * Genera un mensaje de error amigable basado en las validaciones
 */
export const getPasswordErrorMessage = (result: PasswordValidationResult): string => {
  if (result.isValid) {
    return '';
  }

  if (result.errors.length === 1) {
    return result.errors[0];
  }

  return `La contraseña debe cumplir los siguientes requisitos:\n${result.errors.map(e => `• ${e}`).join('\n')}`;
};

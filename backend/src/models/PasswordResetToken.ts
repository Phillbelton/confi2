import mongoose, { Schema, Document } from 'mongoose';
import crypto from 'crypto';

export interface IPasswordResetToken extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  token: string; // Hashed token
  expiresAt: Date;
  used: boolean;
  createdAt: Date;

  // Métodos
  isExpired(): boolean;
}

const passwordResetTokenSchema = new Schema<IPasswordResetToken>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    used: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Índices compuestos
passwordResetTokenSchema.index({ userId: 1, used: 1 });
passwordResetTokenSchema.index({ token: 1, used: 1 });
passwordResetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index - auto-delete expired tokens

// Método para verificar si el token expiró
passwordResetTokenSchema.methods.isExpired = function (): boolean {
  return new Date() > this.expiresAt;
};

// Método estático para generar token
passwordResetTokenSchema.statics.generateToken = function (): string {
  // Generar token aleatorio de 32 bytes
  return crypto.randomBytes(32).toString('hex');
};

// Método estático para hashear token
passwordResetTokenSchema.statics.hashToken = function (token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
};

// Método estático para crear token de reset
passwordResetTokenSchema.statics.createResetToken = async function (
  userId: mongoose.Types.ObjectId,
  expirationHours: number = 1
): Promise<{ token: string; hashedToken: string }> {
  // Generar token aleatorio
  const token = crypto.randomBytes(32).toString('hex');

  // Hashear token para almacenar
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  // Calcular fecha de expiración (1 hora por defecto)
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + expirationHours);

  // Invalidar tokens anteriores del usuario
  await this.updateMany(
    { userId, used: false },
    { used: true }
  );

  // Crear nuevo token
  await this.create({
    userId,
    token: hashedToken,
    expiresAt,
    used: false,
  });

  // Retornar token sin hashear (para enviar por email) y hasheado (para DB)
  return { token, hashedToken };
};

// Método estático para validar y consumir token
passwordResetTokenSchema.statics.validateAndConsumeToken = async function (
  token: string
): Promise<{ valid: boolean; userId?: mongoose.Types.ObjectId; message?: string }> {
  // Hashear token recibido
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  // Buscar token en DB
  const resetToken = await this.findOne({
    token: hashedToken,
    used: false,
  });

  if (!resetToken) {
    return {
      valid: false,
      message: 'Token inválido o ya utilizado',
    };
  }

  // Verificar si expiró
  if (resetToken.isExpired()) {
    return {
      valid: false,
      message: 'El token ha expirado. Solicita uno nuevo.',
    };
  }

  // Marcar token como usado
  resetToken.used = true;
  await resetToken.save();

  return {
    valid: true,
    userId: resetToken.userId,
  };
};

export const PasswordResetToken = mongoose.model<IPasswordResetToken>(
  'PasswordResetToken',
  passwordResetTokenSchema
);

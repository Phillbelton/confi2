import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';
import { UserRole } from '../types';

export interface IAddress {
  _id: mongoose.Types.ObjectId;
  label: string; // "Casa", "Trabajo", "Casa de mamá", etc.
  street: string;
  number: string;
  city: string;
  neighborhood?: string;
  reference?: string; // "Frente al Colegio San José, casa blanca"
  isDefault: boolean;
  createdAt: Date;
}

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  phone?: string;
  addresses: IAddress[];
  active: boolean;

  // Security: Account lockout
  loginAttempts: number;
  lockUntil?: Date;

  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  deletedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;

  // Métodos
  comparePassword(candidatePassword: string): Promise<boolean>;
  isLocked(): boolean;
  incrementLoginAttempts(): Promise<void>;
  resetLoginAttempts(): Promise<void>;
  addAddress(address: Omit<IAddress, '_id' | 'createdAt'>): Promise<IUser>;
  updateAddress(addressId: string, data: Partial<Omit<IAddress, '_id' | 'createdAt'>>): Promise<IUser>;
  deleteAddress(addressId: string): Promise<IUser>;
  setDefaultAddress(addressId: string): Promise<IUser>;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'El nombre es requerido'],
      trim: true,
      minlength: [2, 'El nombre debe tener al menos 2 caracteres'],
      maxlength: [100, 'El nombre no puede exceder 100 caracteres'],
    },
    email: {
      type: String,
      required: [true, 'El email es requerido'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Email inválido'],
    },
    password: {
      type: String,
      required: [true, 'La contraseña es requerida'],
      minlength: [6, 'La contraseña debe tener al menos 6 caracteres'],
      select: false, // No incluir por defecto en queries
    },
    role: {
      type: String,
      enum: ['cliente', 'funcionario', 'admin'],
      default: 'cliente',
    },
    phone: {
      type: String,
      trim: true,
      match: [/^\+?[1-9]\d{1,14}$/, 'Número de teléfono inválido'],
    },
    addresses: [
      {
        label: {
          type: String,
          required: true,
          trim: true,
          maxlength: [50, 'El nombre de la dirección no puede exceder 50 caracteres'],
        },
        street: {
          type: String,
          required: true,
          trim: true,
          maxlength: [200, 'La calle no puede exceder 200 caracteres'],
        },
        number: {
          type: String,
          required: true,
          trim: true,
          maxlength: [20, 'El número no puede exceder 20 caracteres'],
        },
        city: {
          type: String,
          required: true,
          trim: true,
          maxlength: [100, 'La ciudad no puede exceder 100 caracteres'],
        },
        neighborhood: {
          type: String,
          trim: true,
          maxlength: [100, 'El barrio no puede exceder 100 caracteres'],
        },
        reference: {
          type: String,
          trim: true,
          maxlength: [500, 'Las referencias no pueden exceder 500 caracteres'],
        },
        isDefault: {
          type: Boolean,
          default: false,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    active: {
      type: Boolean,
      default: true,
    },
    // Security: Account lockout fields
    loginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: {
      type: Date,
      required: false,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    deletedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        delete (ret as any).password;
        delete (ret as any).__v;
        return ret;
      },
    },
  }
);

// Índices
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ active: 1 });
userSchema.index({ createdAt: -1 });

// Middleware pre-save: Hashear contraseña
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Método para comparar contraseñas
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    return false;
  }
};

// Método para verificar si la cuenta está bloqueada
userSchema.methods.isLocked = function (): boolean {
  // Verificar si lockUntil existe y si aún no ha pasado
  return !!(this.lockUntil && this.lockUntil > new Date());
};

// Método para incrementar intentos de login fallidos
userSchema.methods.incrementLoginAttempts = async function (): Promise<void> {
  // Si el lock expiró, resetear intentos
  if (this.lockUntil && this.lockUntil < new Date()) {
    this.loginAttempts = 1;
    this.lockUntil = undefined;
    await this.save();
    return;
  }

  // Incrementar intentos
  this.loginAttempts += 1;

  // Si llegamos al máximo de intentos (5), bloquear cuenta por 15 minutos
  const MAX_LOGIN_ATTEMPTS = 5;
  const LOCK_TIME = 15 * 60 * 1000; // 15 minutos en milisegundos

  if (this.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
    this.lockUntil = new Date(Date.now() + LOCK_TIME);
    console.warn(`🔒 Cuenta bloqueada por intentos fallidos: ${this.email}`);
  }

  await this.save();
};

// Método para resetear intentos de login
userSchema.methods.resetLoginAttempts = async function (): Promise<void> {
  // Solo resetear si hay intentos o un bloqueo
  if (this.loginAttempts > 0 || this.lockUntil) {
    this.loginAttempts = 0;
    this.lockUntil = undefined;
    await this.save();
  }
};

// Método para agregar dirección
userSchema.methods.addAddress = async function (
  address: Omit<IAddress, '_id' | 'createdAt'>
): Promise<IUser> {
  // Si es la primera dirección o se marca como default, hacerla default
  const isFirstAddress = this.addresses.length === 0;
  const shouldBeDefault = address.isDefault || isFirstAddress;

  // Si se marca como default, quitar default de las demás
  if (shouldBeDefault) {
    this.addresses.forEach((addr: IAddress) => {
      addr.isDefault = false;
    });
  }

  this.addresses.push({
    ...address,
    isDefault: shouldBeDefault,
  } as IAddress);

  return await this.save();
};

// Método para actualizar dirección
userSchema.methods.updateAddress = async function (
  addressId: string,
  data: Partial<Omit<IAddress, '_id' | 'createdAt'>>
): Promise<IUser> {
  const address = this.addresses.id(addressId);

  if (!address) {
    throw new Error('Dirección no encontrada');
  }

  // Si se marca como default, quitar default de las demás
  if (data.isDefault === true) {
    this.addresses.forEach((addr: IAddress) => {
      if (addr._id.toString() !== addressId) {
        addr.isDefault = false;
      }
    });
  }

  // Actualizar campos
  Object.assign(address, data);

  return await this.save();
};

// Método para eliminar dirección
userSchema.methods.deleteAddress = async function (addressId: string): Promise<IUser> {
  const address = this.addresses.id(addressId);

  if (!address) {
    throw new Error('Dirección no encontrada');
  }

  // Remover dirección
  this.addresses.pull(addressId);

  return await this.save();
};

// Método para establecer dirección predeterminada
userSchema.methods.setDefaultAddress = async function (addressId: string): Promise<IUser> {
  const address = this.addresses.id(addressId);

  if (!address) {
    throw new Error('Dirección no encontrada');
  }

  // Quitar default de todas
  this.addresses.forEach((addr: IAddress) => {
    addr.isDefault = false;
  });

  // Marcar la nueva como default
  address.isDefault = true;

  return await this.save();
};

export const User = mongoose.model<IUser>('User', userSchema);

/**
 * Conversation Model
 *
 * Modelo para gestionar conversaciones entre usuarios.
 * Cada conversación tiene dos participantes (chat 1-a-1).
 */

import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IConversation extends Document {
  _id: Types.ObjectId;
  participants: Types.ObjectId[]; // [cliente, admin/funcionario]
  lastMessage?: {
    content: string;
    sender: Types.ObjectId;
    timestamp: Date;
  };
  unreadCount: {
    [key: string]: number; // userId: count
  };
  status: 'active' | 'archived' | 'closed';
  metadata?: {
    orderId?: Types.ObjectId; // Si la conversación está relacionada con un pedido
    subject?: string; // Asunto de la conversación
  };
  createdAt: Date;
  updatedAt: Date;
}

const ConversationSchema = new Schema<IConversation>(
  {
    participants: {
      type: [{ type: Schema.Types.ObjectId, ref: 'User' }],
      required: true,
      validate: {
        validator: function (v: Types.ObjectId[]) {
          return v.length === 2;
        },
        message: 'Una conversación debe tener exactamente 2 participantes',
      },
    },
    lastMessage: {
      content: { type: String },
      sender: { type: Schema.Types.ObjectId, ref: 'User' },
      timestamp: { type: Date },
    },
    unreadCount: {
      type: Map,
      of: Number,
      default: {},
    },
    status: {
      type: String,
      enum: ['active', 'archived', 'closed'],
      default: 'active',
    },
    metadata: {
      orderId: { type: Schema.Types.ObjectId, ref: 'Order' },
      subject: { type: String, trim: true, maxlength: 200 },
    },
  },
  {
    timestamps: true,
  }
);

// Índices
ConversationSchema.index({ participants: 1 });
ConversationSchema.index({ status: 1, updatedAt: -1 });
ConversationSchema.index({ 'lastMessage.timestamp': -1 });

// Métodos de instancia

/**
 * Verificar si un usuario es participante de la conversación
 */
ConversationSchema.methods.isParticipant = function (userId: string | Types.ObjectId): boolean {
  const userIdStr = userId.toString();
  return this.participants.some((p: Types.ObjectId) => p.toString() === userIdStr);
};

/**
 * Obtener el ID del otro participante
 */
ConversationSchema.methods.getOtherParticipant = function (userId: string | Types.ObjectId): Types.ObjectId | null {
  const userIdStr = userId.toString();
  const other = this.participants.find((p: Types.ObjectId) => p.toString() !== userIdStr);
  return other || null;
};

/**
 * Marcar mensajes como leídos para un usuario
 */
ConversationSchema.methods.markAsRead = async function (userId: string | Types.ObjectId): Promise<void> {
  const userIdStr = userId.toString();
  this.unreadCount.set(userIdStr, 0);
  await this.save();
};

/**
 * Incrementar contador de no leídos para un usuario
 */
ConversationSchema.methods.incrementUnread = async function (userId: string | Types.ObjectId): Promise<void> {
  const userIdStr = userId.toString();
  const current = this.unreadCount.get(userIdStr) || 0;
  this.unreadCount.set(userIdStr, current + 1);
  await this.save();
};

// Métodos estáticos

/**
 * Encontrar o crear conversación entre dos usuarios
 */
ConversationSchema.statics.findOrCreate = async function (
  userId1: string | Types.ObjectId,
  userId2: string | Types.ObjectId,
  metadata?: { orderId?: Types.ObjectId; subject?: string }
) {
  // Buscar conversación existente (orden no importa)
  let conversation = await this.findOne({
    participants: { $all: [userId1, userId2] },
    status: { $ne: 'closed' },
  });

  if (!conversation) {
    // Crear nueva conversación
    conversation = await this.create({
      participants: [userId1, userId2],
      status: 'active',
      unreadCount: {
        [userId1.toString()]: 0,
        [userId2.toString()]: 0,
      },
      metadata,
    });
  }

  return conversation;
};

export const Conversation = mongoose.model<IConversation>('Conversation', ConversationSchema);

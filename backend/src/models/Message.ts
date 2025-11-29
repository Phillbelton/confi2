/**
 * Message Model
 *
 * Modelo para mensajes individuales dentro de conversaciones.
 */

import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IMessage extends Document {
  _id: Types.ObjectId;
  conversation: Types.ObjectId;
  sender: Types.ObjectId;
  content: string;
  type: 'text' | 'image' | 'file' | 'system';
  attachments?: {
    url: string;
    filename: string;
    mimetype: string;
    size: number;
  }[];
  read: boolean;
  readAt?: Date;
  deleted: boolean; // Soft delete
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    conversation: {
      type: Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },
    type: {
      type: String,
      enum: ['text', 'image', 'file', 'system'],
      default: 'text',
    },
    attachments: [
      {
        url: { type: String, required: true },
        filename: { type: String, required: true },
        mimetype: { type: String },
        size: { type: Number },
      },
    ],
    read: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
    },
    deleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Índices
MessageSchema.index({ conversation: 1, createdAt: -1 });
MessageSchema.index({ conversation: 1, read: 1 });
MessageSchema.index({ sender: 1, createdAt: -1 });

// Middleware pre-save para actualizar lastMessage en Conversation
MessageSchema.post('save', async function (doc) {
  if (!doc.deleted) {
    const Conversation = mongoose.model('Conversation');
    await Conversation.findByIdAndUpdate(doc.conversation, {
      lastMessage: {
        content: doc.content,
        sender: doc.sender,
        timestamp: doc.createdAt,
      },
    });
  }
});

// Métodos de instancia

/**
 * Marcar mensaje como leído
 */
MessageSchema.methods.markAsRead = async function (): Promise<void> {
  if (!this.read) {
    this.read = true;
    this.readAt = new Date();
    await this.save();
  }
};

/**
 * Soft delete
 */
MessageSchema.methods.softDelete = async function (): Promise<void> {
  this.deleted = true;
  await this.save();
};

export const Message = mongoose.model<IMessage>('Message', MessageSchema);

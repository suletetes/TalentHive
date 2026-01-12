import mongoose, { Schema, Document } from 'mongoose';

export interface IAttachment {
  filename: string;
  url: string;
  size: number;
  mimeType: string;
}

export interface ITicketMessage {
  senderId: mongoose.Types.ObjectId;
  message: string;
  attachments: IAttachment[];
  isAdminResponse: boolean;
  isRead: boolean;
  createdAt: Date;
}

export interface ISupportTicket extends Document {
  ticketId: string;
  userId: mongoose.Types.ObjectId;
  subject: string;
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'technical' | 'billing' | 'account' | 'project' | 'other';
  messages: ITicketMessage[];
  assignedAdminId?: mongoose.Types.ObjectId;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  lastResponseAt?: Date;
  resolvedAt?: Date;
  closedAt?: Date;
}

const attachmentSchema = new Schema<IAttachment>({
  filename: { type: String, required: true },
  url: { type: String, required: true },
  size: { type: Number, required: true },
  mimeType: { type: String, required: true },
}, { _id: false });

const ticketMessageSchema = new Schema<ITicketMessage>({
  senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true, maxlength: 5000 },
  attachments: [attachmentSchema],
  isAdminResponse: { type: Boolean, default: false },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
}, { _id: true });

const supportTicketSchema = new Schema<ISupportTicket>({
  ticketId: {
    type: String,
    required: true,
    unique: true,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  subject: {
    type: String,
    required: true,
    maxlength: 200,
    trim: true,
  },
  status: {
    type: String,
    enum: ['open', 'in-progress', 'resolved', 'closed'],
    default: 'open',
    index: true,
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
    index: true,
  },
  category: {
    type: String,
    enum: ['technical', 'billing', 'account', 'project', 'other'],
    required: true,
    index: true,
  },
  messages: [ticketMessageSchema],
  assignedAdminId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    index: true,
  },
  tags: [{ type: String, trim: true }],
  lastResponseAt: Date,
  resolvedAt: Date,
  closedAt: Date,
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Indexes for better query performance
supportTicketSchema.index({ userId: 1, status: 1 });
supportTicketSchema.index({ assignedAdminId: 1, status: 1 });
supportTicketSchema.index({ createdAt: -1 });
supportTicketSchema.index({ lastResponseAt: -1 });
supportTicketSchema.index({ tags: 1 });

// Auto-generate ticket ID before saving
supportTicketSchema.pre('save', async function(next) {
  if (this.isNew && !this.ticketId) {
    const count = await mongoose.model('SupportTicket').countDocuments();
    this.ticketId = `TKT-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

// Virtual for message count
supportTicketSchema.virtual('messageCount').get(function() {
  return this.messages.length;
});

// Virtual for unread message count
supportTicketSchema.virtual('unreadCount').get(function() {
  return this.messages.filter(msg => !msg.isRead).length;
});

export const SupportTicket = mongoose.model<ISupportTicket>('SupportTicket', supportTicketSchema);

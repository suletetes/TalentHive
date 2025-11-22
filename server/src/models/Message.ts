import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage extends Document {
  conversation: mongoose.Types.ObjectId;
  sender: mongoose.Types.ObjectId;
  content: string;
  attachments: string[];
  readBy: mongoose.Types.ObjectId[];
  isAdminMessage: boolean;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  isEdited: boolean;
  editedAt?: Date;
  isDeleted: boolean;
  deletedAt?: Date;
  reactions: Array<{
    user: mongoose.Types.ObjectId;
    emoji: string;
    createdAt: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>({
  conversation: {
    type: Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true,
  },
  sender: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  content: {
    type: String,
    required: [true, 'Message content is required'],
    trim: true,
    maxlength: [5000, 'Message cannot exceed 5000 characters'],
  },
  attachments: [{
    type: String,
    trim: true,
  }],
  readBy: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
  }],
  isAdminMessage: {
    type: Boolean,
    default: false,
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal',
  },
  isEdited: {
    type: Boolean,
    default: false,
  },
  editedAt: {
    type: Date,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  deletedAt: {
    type: Date,
  },
  reactions: [{
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    emoji: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  }],
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Indexes
messageSchema.index({ conversation: 1, createdAt: -1 });
messageSchema.index({ sender: 1 });
messageSchema.index({ readBy: 1 });

// Virtual to check if message is read by a specific user
messageSchema.virtual('isReadBy').get(function() {
  return (userId: string) => {
    return this.readBy.some(id => id.toString() === userId.toString());
  };
});

// Method to mark as read by a user
messageSchema.methods.markAsRead = function(userId: string) {
  if (!this.readBy.some(id => id.toString() === userId.toString())) {
    this.readBy.push(userId as any);
    return this.save();
  }
  return Promise.resolve(this);
};

// Static method to find messages in a conversation
messageSchema.statics.findByConversation = function(
  conversationId: string,
  limit: number = 50,
  before?: Date
) {
  const query: any = { conversation: conversationId };
  
  if (before) {
    query.createdAt = { $lt: before };
  }
  
  return this.find(query)
    .populate('sender', 'profile')
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Static method to count unread messages for a user in a conversation
messageSchema.statics.countUnread = function(conversationId: string, userId: string) {
  return this.countDocuments({
    conversation: conversationId,
    sender: { $ne: userId },
    readBy: { $ne: userId },
  });
};

export const Message = mongoose.model<IMessage>('Message', messageSchema);

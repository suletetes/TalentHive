import mongoose, { Schema, Document } from 'mongoose';

export interface IConversation extends Document {
  participants: mongoose.Types.ObjectId[];
  lastMessage?: mongoose.Types.ObjectId;
  lastMessageAt: Date;
  unreadCount: Map<string, number>;
  createdAt: Date;
  updatedAt: Date;
}

const conversationSchema = new Schema<IConversation>({
  participants: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  }],
  lastMessage: {
    type: Schema.Types.ObjectId,
    ref: 'Message',
  },
  lastMessageAt: {
    type: Date,
    default: Date.now,
  },
  unreadCount: {
    type: Map,
    of: Number,
    default: new Map(),
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Indexes
conversationSchema.index({ participants: 1 });
conversationSchema.index({ lastMessageAt: -1 });

// Ensure exactly 2 participants
conversationSchema.pre('save', function(next) {
  if (this.participants.length !== 2) {
    next(new Error('Conversation must have exactly 2 participants'));
  } else {
    next();
  }
});

// Static method to find conversation between two users
conversationSchema.statics.findBetweenUsers = function(userId1: string, userId2: string) {
  return this.findOne({
    participants: { $all: [userId1, userId2] },
  });
};

// Static method to find user's conversations
conversationSchema.statics.findByUser = function(userId: string) {
  return this.find({
    participants: userId,
  })
    .populate('participants', 'profile')
    .populate('lastMessage')
    .sort({ lastMessageAt: -1 });
};

// Method to increment unread count for a user
conversationSchema.methods.incrementUnread = function(userId: string) {
  const current = this.unreadCount.get(userId.toString()) || 0;
  this.unreadCount.set(userId.toString(), current + 1);
  return this.save();
};

// Method to reset unread count for a user
conversationSchema.methods.resetUnread = function(userId: string) {
  this.unreadCount.set(userId.toString(), 0);
  return this.save();
};

export const Conversation = mongoose.model<IConversation>('Conversation', conversationSchema);

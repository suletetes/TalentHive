import mongoose, { Schema, Document } from 'mongoose';

export interface IProfileSlugRedirect extends Document {
  oldSlug: string;
  newSlug: string;
  userId: mongoose.Types.ObjectId;
  createdAt: Date;
  redirectCount: number;
  lastRedirectedAt?: Date;
}

const profileSlugRedirectSchema = new Schema<IProfileSlugRedirect>({
  oldSlug: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true,
  },
  newSlug: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  redirectCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  lastRedirectedAt: Date,
}, {
  timestamps: false,
});

// Compound index for efficient lookups
profileSlugRedirectSchema.index({ oldSlug: 1, userId: 1 });

export const ProfileSlugRedirect = mongoose.model<IProfileSlugRedirect>(
  'ProfileSlugRedirect',
  profileSlugRedirectSchema
);

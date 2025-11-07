import mongoose, { Schema } from 'mongoose';
import { IReview } from '@/types/review';
import { User } from './User';

const reviewSchema = new Schema<IReview>({
  contract: {
    type: Schema.Types.ObjectId,
    ref: 'Contract',
    required: true,
  },
  project: {
    type: Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
  },
  reviewer: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  reviewee: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  feedback: {
    type: String,
    required: true,
    minlength: 10,
    maxlength: 2000,
  },
  categories: {
    communication: { type: Number, min: 1, max: 5, required: true },
    quality: { type: Number, min: 1, max: 5, required: true },
    professionalism: { type: Number, min: 1, max: 5, required: true },
    deadlines: { type: Number, min: 1, max: 5, required: true },
  },
  isPublic: {
    type: Boolean,
    default: true,
  },
  response: String,
  respondedAt: Date,
  status: {
    type: String,
    enum: ['pending', 'published', 'flagged', 'removed'],
    default: 'published',
  },
}, {
  timestamps: true,
});

reviewSchema.index({ contract: 1, reviewer: 1 }, { unique: true });
reviewSchema.index({ reviewee: 1, status: 1 });
reviewSchema.index({ project: 1 });

// Update user rating after review
reviewSchema.post('save', async function() {
  const reviews = await Review.find({ reviewee: this.reviewee, status: 'published' });
  const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  await User.findByIdAndUpdate(this.reviewee, { rating: avgRating });
});

export const Review = mongoose.model<IReview>('Review', reviewSchema);
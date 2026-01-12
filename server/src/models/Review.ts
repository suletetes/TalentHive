import mongoose, { Schema } from 'mongoose';
import { IReview } from '@/types/review';
import { User } from './User';

// Define response subdocument schema
const responseSchema = new Schema(
  {
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date },
    isEdited: { type: Boolean, default: false },
  },
  { _id: false }
);

const reviewSchema = new Schema<IReview>(
  {
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
    response: {
      type: responseSchema,
      default: undefined,
    },
    respondedAt: Date,
    status: {
      type: String,
      enum: ['pending', 'published', 'flagged', 'removed'],
      default: 'published',
    },
  },
  {
    timestamps: true,
    minimize: false, // Don't remove empty objects
  }
);

reviewSchema.index({ contract: 1, reviewer: 1 }, { unique: true });
reviewSchema.index({ reviewee: 1, status: 1 });
reviewSchema.index({ project: 1 });

// Update user rating after review save
reviewSchema.post('save', async function() {
  try {
    // Import here to avoid circular dependency
    const { dataConsistencyService } = await import('@/services/dataConsistencyService');
    await dataConsistencyService.syncUserRating(this.reviewee as any);
  } catch (error) {
    console.error('Error syncing user rating after review save:', error);
  }
});

// Update user rating after review deletion
reviewSchema.post('deleteOne', async function() {
  try {
    const review = await this.model.findOne(this.getFilter());
    if (review) {
      const { dataConsistencyService } = await import('@/services/dataConsistencyService');
      await dataConsistencyService.syncUserRating(review.reviewee as any);
    }
  } catch (error) {
    console.error('Error syncing user rating after review deletion:', error);
  }
});

// Update user rating after findOneAndDelete
reviewSchema.post('findOneAndDelete', async function(doc) {
  if (doc) {
    try {
      const { dataConsistencyService } = await import('@/services/dataConsistencyService');
      await dataConsistencyService.syncUserRating(doc.reviewee);
    } catch (error) {
      console.error('Error syncing user rating after review deletion:', error);
    }
  }
});

export const Review = mongoose.model<IReview>('Review', reviewSchema);
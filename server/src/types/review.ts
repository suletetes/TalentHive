import { Document, ObjectId } from 'mongoose';

export interface IReviewResponse {
  content: string;
  createdAt: Date;
  updatedAt?: Date;
  isEdited?: boolean;
}

export interface IReview extends Document {
  contract: ObjectId;
  project: ObjectId;
  reviewer: ObjectId;
  reviewee: ObjectId;
  rating: number;
  feedback: string;
  categories: {
    communication: number;
    quality: number;
    professionalism: number;
    deadlines: number;
  };
  isPublic: boolean;
  response?: IReviewResponse;
  respondedAt?: Date;
  status: 'pending' | 'published' | 'flagged' | 'removed';
  createdAt: Date;
  updatedAt: Date;
}
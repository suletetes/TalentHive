import { apiCore } from './core';

export interface Review {
  _id: string;
  contract: string;
  project?: any;
  reviewer: {
    _id: string;
    profile: {
      firstName: string;
      lastName: string;
      avatar?: string;
    };
  };
  reviewee: string | { _id: string };
  rating: number;
  comment?: string;
  feedback?: string; // Backend uses 'feedback' field
  response?: {
    content: string;
    createdAt: Date;
    updatedAt?: Date;
    isEdited?: boolean;
  } | string; // Can be string for legacy data
  respondedAt?: Date;
  categories?: {
    communication?: number;
    quality?: number;
    professionalism?: number;
    deadlines?: number;
  };
  createdAt: Date;
}

export interface CreateReviewDto {
  rating: number;
  comment: string;
}

export class ReviewsService {
  private basePath = '/reviews';

  async createReview(contractId: string, data: CreateReviewDto): Promise<{ data: Review }> {
    return apiCore.post<{ data: Review }>(`${this.basePath}/contract/${contractId}`, data);
  }

  async getReviews(userId: string): Promise<{ data: Review[] }> {
    return apiCore.get<{ data: Review[] }>(`${this.basePath}/user/${userId}`);
  }

  async respondToReview(reviewId: string, content: string): Promise<{ data: Review }> {
    return apiCore.post<{ data: Review }>(`${this.basePath}/${reviewId}/respond`, {
      content,
    });
  }
}

export const reviewsService = new ReviewsService();

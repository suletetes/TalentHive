import { apiCore } from './core';

export interface Review {
  _id: string;
  contract: string;
  reviewer: {
    _id: string;
    profile: {
      firstName: string;
      lastName: string;
      avatar?: string;
    };
  };
  reviewee: string;
  rating: number;
  comment: string;
  response?: {
    content: string;
    createdAt: Date;
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

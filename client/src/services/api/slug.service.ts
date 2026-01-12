import { apiCore } from './core';

export interface SlugValidationResponse {
  available: boolean;
  message: string;
  suggestions?: string[];
}

export interface SlugHistoryItem {
  slug: string;
  changedAt: Date;
}

export interface UserProfile {
  _id: string;
  email: string;
  role: string;
  profileSlug: string;
  profile: {
    firstName: string;
    lastName: string;
    avatar?: string;
    bio?: string;
  };
}

class SlugService {
  async getUserBySlug(slug: string): Promise<UserProfile> {
    return apiCore.get(`/users/slug/${slug}`);
  }

  async validateSlug(slug: string): Promise<SlugValidationResponse> {
    return apiCore.post('/users/slug/validate', { slug });
  }

  async updateSlug(slug: string): Promise<UserProfile> {
    return apiCore.patch('/users/profile/slug', { slug });
  }

  async getSlugSuggestions(baseName: string): Promise<string[]> {
    const response: any = await apiCore.get(`/users/slug/suggestions/${baseName}`);
    return response.suggestions || [];
  }

  async searchBySlug(query: string): Promise<UserProfile[]> {
    return apiCore.get('/users/slug/search', { params: { q: query } });
  }

  async getSlugHistory(userId: string): Promise<SlugHistoryItem[]> {
    return apiCore.get(`/users/${userId}/slug-history`);
  }
}

export const slugService = new SlugService();

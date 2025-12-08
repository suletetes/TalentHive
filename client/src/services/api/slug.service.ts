import { apiService } from './index';

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
  /**
   * Get user by slug (with redirect handling)
   */
  async getUserBySlug(slug: string): Promise<UserProfile> {
    const response = await apiService.get(`/users/slug/${slug}`);
    return response.data;
  }

  /**
   * Validate if a slug is available
   */
  async validateSlug(slug: string): Promise<SlugValidationResponse> {
    const response = await apiService.post('/users/slug/validate', { slug });
    return response.data;
  }

  /**
   * Update user's profile slug
   */
  async updateSlug(slug: string): Promise<UserProfile> {
    const response = await apiService.patch('/users/profile/slug', { slug });
    return response.data;
  }

  /**
   * Get slug suggestions based on a name
   */
  async getSlugSuggestions(baseName: string): Promise<string[]> {
    const response = await apiService.get(`/users/slug/suggestions/${baseName}`);
    return response.data.suggestions;
  }

  /**
   * Search users by slug (autocomplete)
   */
  async searchBySlug(query: string): Promise<UserProfile[]> {
    const response = await apiService.get('/users/slug/search', {
      params: { q: query },
    });
    return response.data;
  }

  /**
   * Get slug change history for a user
   */
  async getSlugHistory(userId: string): Promise<SlugHistoryItem[]> {
    const response = await apiService.get(`/users/${userId}/slug-history`);
    return response.data;
  }
}

export const slugService = new SlugService();

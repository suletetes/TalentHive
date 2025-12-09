import { apiCore } from './core';

export interface Freelancer {
  _id: string;
  profile: {
    firstName: string;
    lastName: string;
    avatar?: string;
    bio?: string;
    location?: string;
  };
  freelancerProfile: {
    title: string;
    hourlyRate: number;
    skills: string[];
    availability: {
      status: 'available' | 'busy' | 'unavailable';
    };
    portfolio: any[];
  };
  rating: {
    average: number;
    count: number;
  };
  isVerified: boolean;
}

export interface FreelancerFilters {
  skills?: string[];
  minRating?: number;
  maxRate?: number;
  availability?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export class UsersService {
  private basePath = '/users';

  async getFreelancers(filters?: FreelancerFilters): Promise<PaginatedResponse<Freelancer>> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            params.append(key, value.join(','));
          } else {
            params.append(key, String(value));
          }
        }
      });
    }

    const response = await apiCore.get<{
      status: string;
      data: { freelancers: Freelancer[]; pagination: any };
    }>(`${this.basePath}/freelancers?${params.toString()}`);

    return {
      data: response.data.freelancers,
      pagination: response.data.pagination,
    };
  }

  async getFreelancerById(id: string): Promise<{ data: Freelancer }> {
    const response = await apiCore.get<{ status: string; data: { freelancer: Freelancer } }>(
      `${this.basePath}/freelancer/${id}`
    );
    return { data: response.data.freelancer };
  }

  async getFreelancerProfile(slugOrId: string): Promise<any> {
    const response = await apiCore.get(`/freelancers/${slugOrId}/profile`);
    return response.data;
  }

  async getClientProfile(slugOrId: string): Promise<any> {
    const response = await apiCore.get(`/clients/${slugOrId}/profile`);
    return response.data;
  }

  async getUserStats(userId: string): Promise<any> {
    const response = await apiCore.get(`${this.basePath}/${userId}/stats`);
    return response.data;
  }

  async trackProfileView(userId: string): Promise<void> {
    await apiCore.post(`${this.basePath}/${userId}/profile-view`);
  }

  async getProfileViewAnalytics(userId: string, days: number = 30): Promise<any> {
    const response = await apiCore.get(`${this.basePath}/${userId}/profile-views`, {
      params: { days },
    });
    return response.data;
  }

  async getProfileViewers(userId: string): Promise<any> {
    const response = await apiCore.get(`${this.basePath}/${userId}/profile-viewers`);
    return response.data;
  }
}

export const usersService = new UsersService();

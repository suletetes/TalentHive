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
}

export const usersService = new UsersService();

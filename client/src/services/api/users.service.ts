import { apiCore } from './core';
import { dataExtractor, COMMON_PATHS } from '@/utils/dataExtractor';

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

    console.log('[USERS SERVICE] Fetching freelancers with params:', params.toString());
    const response = await apiCore.get<any>(`${this.basePath}/freelancers?${params.toString()}`);
    console.log('[USERS SERVICE] Raw freelancers response:', response);

    // Use robust data extraction with multiple fallback paths
    const freelancers = dataExtractor.extractArray<Freelancer>(response, [
      'freelancers', 'data.freelancers', 'data', 'users', 'data.users'
    ]);

    // Extract pagination info
    let pagination = response.pagination || response.data?.pagination || {
      page: 1,
      limit: 12,
      total: freelancers.length,
      pages: Math.ceil(freelancers.length / 12),
    };

    console.log('[USERS SERVICE] Extracted freelancers:', freelancers.length);
    console.log('[USERS SERVICE] Pagination:', pagination);

    return {
      data: freelancers,
      pagination,
    };
  }

  async getFreelancerById(id: string): Promise<{ data: Freelancer }> {
    const response = await apiCore.get<any>(`${this.basePath}/freelancer/${id}`);
    console.log('[USERS SERVICE] Raw freelancer response:', response);
    
    const freelancer = dataExtractor.extractObject<Freelancer>(response, [
      'freelancer', 'data.freelancer', 'data', 'user', 'data.user'
    ]);
    
    if (!freelancer) {
      throw new Error('Freelancer not found');
    }
    
    return { data: freelancer };
  }

  async getFreelancerProfile(slugOrId: string): Promise<any> {
    const response = await apiCore.get(`/freelancers/${slugOrId}/profile`);
    return dataExtractor.extractObject(response, ['data', 'profile', 'freelancer']) || response;
  }

  async getClientProfile(slugOrId: string): Promise<any> {
    const response = await apiCore.get(`/clients/${slugOrId}/profile`);
    return dataExtractor.extractObject(response, ['data', 'profile', 'client']) || response;
  }

  async getUserStats(userId: string): Promise<any> {
    const response = await apiCore.get(`${this.basePath}/${userId}/stats`);
    return dataExtractor.extractObject(response, ['data', 'stats']) || response;
  }

  async trackProfileView(userId: string): Promise<void> {
    await apiCore.post(`${this.basePath}/${userId}/profile-view`);
  }

  async getProfileViewAnalytics(userId: string, days: number = 30): Promise<any> {
    const response = await apiCore.get(`${this.basePath}/${userId}/profile-views`, {
      params: { days },
    });
    return dataExtractor.extractObject(response, ['data', 'analytics']) || response;
  }

  async getProfileViewers(userId: string): Promise<any> {
    const response = await apiCore.get(`${this.basePath}/${userId}/profile-viewers`);
    return dataExtractor.extractObject(response, ['data', 'viewers']) || response;
  }
}

export const usersService = new UsersService();

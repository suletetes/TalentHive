import { apiCore } from './core';

export interface RevenueAnalyticsParams {
  startDate?: string;
  endDate?: string;
  groupBy?: 'hour' | 'day' | 'week' | 'month' | 'year';
}

export interface UserGrowthParams {
  startDate?: string;
  endDate?: string;
  groupBy?: 'day' | 'week' | 'month' | 'year';
}

export interface ProjectStatsParams {
  startDate?: string;
  endDate?: string;
}

export interface PaymentAnalyticsParams {
  startDate?: string;
  endDate?: string;
}

export class AnalyticsService {
  private basePath = '/analytics';

  async getRevenueAnalytics(params?: RevenueAnalyticsParams) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, String(value));
        }
      });
    }
    return apiCore.get(`${this.basePath}/revenue?${queryParams.toString()}`);
  }

  async getUserGrowthAnalytics(params?: UserGrowthParams) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, String(value));
        }
      });
    }
    return apiCore.get(`${this.basePath}/user-growth?${queryParams.toString()}`);
  }

  async getProjectStats(params?: ProjectStatsParams) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, String(value));
        }
      });
    }
    return apiCore.get(`${this.basePath}/projects?${queryParams.toString()}`);
  }

  async getPaymentAnalytics(params?: PaymentAnalyticsParams) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, String(value));
        }
      });
    }
    return apiCore.get(`${this.basePath}/payments?${queryParams.toString()}`);
  }

  async getDashboardOverview() {
    return apiCore.get(`${this.basePath}/dashboard`);
  }
}

export const analyticsService = new AnalyticsService();

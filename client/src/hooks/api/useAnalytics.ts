import { useQuery } from '@tanstack/react-query';
import {
  analyticsService,
  RevenueAnalyticsParams,
  UserGrowthParams,
  ProjectStatsParams,
  PaymentAnalyticsParams,
} from '@/services/api/analytics.service';

export const useRevenueAnalytics = (params?: RevenueAnalyticsParams) => {
  return useQuery({
    queryKey: ['analytics', 'revenue', params],
    queryFn: async () => {
      const response = await analyticsService.getRevenueAnalytics(params);
      return response.data;
    },
  });
};

export const useUserGrowthAnalytics = (params?: UserGrowthParams) => {
  return useQuery({
    queryKey: ['analytics', 'user-growth', params],
    queryFn: async () => {
      const response = await analyticsService.getUserGrowthAnalytics(params);
      return response.data;
    },
  });
};

export const useProjectStats = (params?: ProjectStatsParams) => {
  return useQuery({
    queryKey: ['analytics', 'projects', params],
    queryFn: async () => {
      const response = await analyticsService.getProjectStats(params);
      return response.data;
    },
  });
};

export const usePaymentAnalytics = (params?: PaymentAnalyticsParams) => {
  return useQuery({
    queryKey: ['analytics', 'payments', params],
    queryFn: async () => {
      const response = await analyticsService.getPaymentAnalytics(params);
      return response.data;
    },
  });
};

export const useDashboardOverview = () => {
  return useQuery({
    queryKey: ['analytics', 'dashboard'],
    queryFn: async () => {
      const response = await analyticsService.getDashboardOverview();
      return response.data;
    },
  });
};

import { apiService } from './index';

export const onboardingService = {
  getOnboardingStatus: async () => {
    const response = await apiService.get('/onboarding/status');
    return response.data;
  },

  updateOnboardingStep: async (step: number) => {
    const response = await apiService.patch('/onboarding/step', { step });
    return response.data;
  },

  completeOnboarding: async () => {
    const response = await apiService.post('/onboarding/complete');
    return response.data;
  },

  skipOnboarding: async () => {
    const response = await apiService.post('/onboarding/skip');
    return response.data;
  },

  getOnboardingAnalytics: async () => {
    const response = await apiService.get('/onboarding/analytics');
    return response.data;
  },

  getUserOnboardingAnalytics: async (userId: string) => {
    const response = await apiService.get(`/onboarding/analytics/${userId}`);
    return response.data;
  },
};

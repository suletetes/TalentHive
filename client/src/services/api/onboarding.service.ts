import { apiCore } from './core';

export const onboardingService = {
  getOnboardingStatus: async () => {
    return apiCore.get('/onboarding/status');
  },

  updateOnboardingStep: async (step: number) => {
    return apiCore.patch('/onboarding/step', { step });
  },

  completeOnboarding: async () => {
    return apiCore.post('/onboarding/complete');
  },

  skipOnboarding: async () => {
    return apiCore.post('/onboarding/skip');
  },

  getOnboardingAnalytics: async () => {
    return apiCore.get('/onboarding/analytics');
  },

  getUserOnboardingAnalytics: async (userId: string) => {
    return apiCore.get(`/onboarding/analytics/${userId}`);
  },
};

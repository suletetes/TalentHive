import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { useQuery } from '@tanstack/react-query';
import { onboardingService } from '@/services/api/onboarding.service';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface OnboardingGuardProps {
  children: React.ReactNode;
}

export const OnboardingGuard: React.FC<OnboardingGuardProps> = ({ children }) => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);

  const { data: onboardingStatus, isLoading } = useQuery({
    queryKey: ['onboardingStatus'],
    queryFn: () => onboardingService.getOnboardingStatus(),
    enabled: isAuthenticated && !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  useEffect(() => {
    if (!isLoading && onboardingStatus && user) {
      // Handle different response structures
      // API returns: { success: true, data: { onboardingCompleted, skippedAt } }
      // apiCore.get returns response.data
      const statusData = onboardingStatus.data || onboardingStatus;
      const { onboardingCompleted, skippedAt } = statusData;

      console.log('[ONBOARDING GUARD] Status:', { onboardingCompleted, skippedAt, statusData });

      // If onboarding not completed and not skipped, redirect to onboarding
      if (!onboardingCompleted && !skippedAt) {
        console.log('[ONBOARDING GUARD] Redirecting to onboarding');
        const onboardingPath = getOnboardingPath(user.role);
        navigate(onboardingPath, { replace: true });
      } else {
        console.log('[ONBOARDING GUARD] Onboarding check passed');
      }
    }
  }, [isLoading, onboardingStatus, user, navigate]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return <>{children}</>;
};

function getOnboardingPath(role: string): string {
  switch (role) {
    case 'freelancer':
      return '/onboarding/freelancer';
    case 'client':
      return '/onboarding/client';
    case 'admin':
      return '/onboarding/admin';
    default:
      return '/dashboard';
  }
}

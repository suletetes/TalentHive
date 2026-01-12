import { useQuery } from '@tanstack/react-query';
import { usersService, FreelancerFilters } from '@/services/api/users.service';

export const userKeys = {
  all: ['users'] as const,
  freelancers: () => [...userKeys.all, 'freelancers'] as const,
  freelancersList: (filters?: FreelancerFilters) => [...userKeys.freelancers(), filters] as const,
  freelancer: (id: string) => [...userKeys.freelancers(), id] as const,
};

export function useFreelancers(filters?: FreelancerFilters) {
  return useQuery({
    queryKey: userKeys.freelancersList(filters),
    queryFn: () => usersService.getFreelancers(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useFreelancer(id: string, enabled = true) {
  return useQuery({
    queryKey: userKeys.freelancer(id),
    queryFn: () => usersService.getFreelancerById(id),
    enabled: !!id && enabled,
    staleTime: 5 * 60 * 1000,
  });
}

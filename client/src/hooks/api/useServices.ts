import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { servicesService, CreateServicePackageDto } from '@/services/api';

export const serviceKeys = {
  all: ['services'] as const,
  packages: (params?: any) => [...serviceKeys.all, 'packages', params] as const,
  package: (id: string) => [...serviceKeys.all, 'package', id] as const,
  stats: () => [...serviceKeys.all, 'stats'] as const,
  templates: () => [...serviceKeys.all, 'templates'] as const,
};

export function useServicePackages(params?: {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
}) {
  return useQuery({
    queryKey: serviceKeys.packages(params),
    queryFn: () => servicesService.getPackages(params),
    staleTime: 5 * 60 * 1000,
  });
}

export function useServicePackage(id: string, enabled = true) {
  return useQuery({
    queryKey: serviceKeys.package(id),
    queryFn: () => servicesService.getPackage(id),
    enabled: !!id && enabled,
    staleTime: 5 * 60 * 1000,
  });
}

export function usePackageStats() {
  return useQuery({
    queryKey: serviceKeys.stats(),
    queryFn: () => servicesService.getPackageStats(),
    staleTime: 2 * 60 * 1000,
  });
}

export function useProjectTemplates() {
  return useQuery({
    queryKey: serviceKeys.templates(),
    queryFn: () => servicesService.getTemplates(),
    staleTime: 10 * 60 * 1000,
  });
}

export function useCreatePackage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateServicePackageDto) => servicesService.createPackage(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: serviceKeys.packages() });
      toast.success('Service package created!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create package');
    },
  });
}

export function useUpdatePackage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateServicePackageDto> }) =>
      servicesService.updatePackage(id, data),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: serviceKeys.package(variables.id) });
      queryClient.invalidateQueries({ queryKey: serviceKeys.packages() });
      toast.success('Package updated!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update package');
    },
  });
}

export function useDeletePackage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => servicesService.deletePackage(id),
    onSuccess: (response, id) => {
      queryClient.removeQueries({ queryKey: serviceKeys.package(id) });
      queryClient.invalidateQueries({ queryKey: serviceKeys.packages() });
      toast.success('Package deleted!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete package');
    },
  });
}

export function usePurchasePackage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => servicesService.purchasePackage(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: serviceKeys.packages() });
      toast.success('Package purchased successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to purchase package');
    },
  });
}

export function useCreateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => servicesService.createTemplate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: serviceKeys.templates() });
      toast.success('Template created!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create template');
    },
  });
}

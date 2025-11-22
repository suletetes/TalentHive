import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import organizationService, {
  CreateOrganizationData,
  UpdateOrganizationData,
  AddMemberData,
} from '@/services/organizationService';

export const useOrganizations = () => {
  return useQuery({
    queryKey: ['organizations'],
    queryFn: organizationService.getOrganizations,
  });
};

export const useOrganization = (id: string) => {
  return useQuery({
    queryKey: ['organization', id],
    queryFn: () => organizationService.getOrganization(id),
    enabled: !!id,
  });
};

export const useCreateOrganization = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateOrganizationData) =>
      organizationService.createOrganization(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
    },
  });
};

export const useUpdateOrganization = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateOrganizationData }) =>
      organizationService.updateOrganization(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['organization', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
    },
  });
};

export const useDeleteOrganization = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => organizationService.deleteOrganization(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
    },
  });
};

export const useAddMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AddMemberData }) =>
      organizationService.addMember(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['organization', variables.id] });
    },
  });
};

export const useRemoveMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, userId }: { id: string; userId: string }) =>
      organizationService.removeMember(id, userId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['organization', variables.id] });
    },
  });
};

export const useUpdateMemberRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      userId,
      role,
      permissions,
    }: {
      id: string;
      userId: string;
      role: string;
      permissions?: string[];
    }) => organizationService.updateMemberRole(id, userId, role, permissions),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['organization', variables.id] });
    },
  });
};

export const useOrganizationProjects = (id: string) => {
  return useQuery({
    queryKey: ['organization', id, 'projects'],
    queryFn: () => organizationService.getOrganizationProjects(id),
    enabled: !!id,
  });
};

export const useOrganizationBudget = (id: string) => {
  return useQuery({
    queryKey: ['organization', id, 'budget'],
    queryFn: () => organizationService.getOrganizationBudget(id),
    enabled: !!id,
  });
};

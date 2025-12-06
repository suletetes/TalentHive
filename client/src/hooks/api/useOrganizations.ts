import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { organizationsService, CreateOrganizationDto } from '@/services/api';

export const organizationKeys = {
  all: ['organizations'] as const,
  lists: () => [...organizationKeys.all, 'list'] as const,
  detail: (id: string) => [...organizationKeys.all, 'detail', id] as const,
  my: () => [...organizationKeys.all, 'my'] as const,
  members: (id: string) => [...organizationKeys.all, 'members', id] as const,
  approvals: (id: string) => [...organizationKeys.all, 'approvals', id] as const,
};

export function useOrganization(id: string, enabled = true) {
  return useQuery({
    queryKey: organizationKeys.detail(id),
    queryFn: () => organizationsService.getOrganization(id),
    enabled: !!id && enabled,
    staleTime: 5 * 60 * 1000,
  });
}

export function useMyOrganizations() {
  return useQuery({
    queryKey: organizationKeys.my(),
    queryFn: () => organizationsService.getMyOrganizations(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useTeamMembers(orgId: string) {
  return useQuery({
    queryKey: organizationKeys.members(orgId),
    queryFn: () => organizationsService.getMembers(orgId),
    enabled: !!orgId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useBudgetApprovals(orgId: string) {
  return useQuery({
    queryKey: organizationKeys.approvals(orgId),
    queryFn: () => organizationsService.getBudgetApprovals(orgId),
    enabled: !!orgId,
    staleTime: 1 * 60 * 1000,
  });
}

export function useCreateOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateOrganizationDto) =>
      organizationsService.createOrganization(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: organizationKeys.my() });
      toast.success('Organization created successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create organization');
    },
  });
}

export function useInviteMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      orgId,
      data,
    }: {
      orgId: string;
      data: { email: string; role: 'admin' | 'member' };
    }) => organizationsService.inviteMember(orgId, data),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: organizationKeys.members(variables.orgId) });
      toast.success('Invitation sent!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to send invitation');
    },
  });
}

export function useRemoveMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orgId, userId }: { orgId: string; userId: string }) =>
      organizationsService.removeMember(orgId, userId),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: organizationKeys.members(variables.orgId) });
      toast.success('Member removed!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to remove member');
    },
  });
}

export function useUpdateBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orgId, data }: { orgId: string; data: { total: number } }) =>
      organizationsService.updateBudget(orgId, data),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: organizationKeys.detail(variables.orgId) });
      toast.success('Budget updated!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update budget');
    },
  });
}

export function useRequestBudgetApproval() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      orgId,
      data,
    }: {
      orgId: string;
      data: { amount: number; reason: string };
    }) => organizationsService.requestBudgetApproval(orgId, data),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: organizationKeys.approvals(variables.orgId) });
      toast.success('Approval requested!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to request approval');
    },
  });
}

export function useRespondToApproval() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      orgId,
      approvalId,
      data,
    }: {
      orgId: string;
      approvalId: string;
      data: { approve: boolean; notes?: string };
    }) => organizationsService.respondToApproval(orgId, approvalId, data),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: organizationKeys.approvals(variables.orgId) });
      toast.success('Response submitted!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to respond to approval');
    },
  });
}

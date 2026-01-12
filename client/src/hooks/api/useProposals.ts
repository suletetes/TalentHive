import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { proposalsService, CreateProposalDto, UpdateProposalDto } from '@/services/api';

// Query keys
export const proposalKeys = {
  all: ['proposals'] as const,
  lists: () => [...proposalKeys.all, 'list'] as const,
  list: (projectId?: string) => [...proposalKeys.lists(), projectId] as const,
  details: () => [...proposalKeys.all, 'detail'] as const,
  detail: (id: string) => [...proposalKeys.details(), id] as const,
  my: () => [...proposalKeys.all, 'my'] as const,
  stats: () => [...proposalKeys.all, 'stats'] as const,
};

// Fetch proposals with filters
export function useProposals(filters?: any) {
  return useQuery({
    queryKey: ['proposals', filters],
    queryFn: () => proposalsService.getProposals(filters),
    staleTime: 2 * 60 * 1000,
  });
}

// Fetch proposals for a project
export function useProposalsForProject(projectId: string) {
  return useQuery({
    queryKey: proposalKeys.list(projectId),
    queryFn: () => proposalsService.getProposalsForProject(projectId),
    enabled: !!projectId,
    staleTime: 2 * 60 * 1000,
  });
}

// Fetch my proposals
export function useMyProposals() {
  return useQuery({
    queryKey: proposalKeys.my(),
    queryFn: () => proposalsService.getMyProposals(),
    staleTime: 2 * 60 * 1000,
  });
}

// Fetch single proposal
export function useProposal(id: string, enabled = true) {
  return useQuery({
    queryKey: proposalKeys.detail(id),
    queryFn: () => proposalsService.getProposalById(id),
    enabled: !!id && enabled,
    staleTime: 5 * 60 * 1000,
  });
}

// Fetch proposal stats
export function useProposalStats() {
  return useQuery({
    queryKey: proposalKeys.stats(),
    queryFn: () => proposalsService.getProposalStats(),
    staleTime: 1 * 60 * 1000,
  });
}

// Create proposal mutation
export function useCreateProposal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, data }: { projectId: string; data: CreateProposalDto }) =>
      proposalsService.createProposal(projectId, data),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: proposalKeys.list(variables.projectId) });
      queryClient.invalidateQueries({ queryKey: proposalKeys.my() });
      queryClient.invalidateQueries({ queryKey: proposalKeys.stats() });
      toast.success('Proposal submitted successfully!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to submit proposal';
      toast.error(message);
    },
  });
}

// Update proposal mutation
export function useUpdateProposal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProposalDto }) =>
      proposalsService.updateProposal(id, data),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: proposalKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: proposalKeys.lists() });
      queryClient.invalidateQueries({ queryKey: proposalKeys.my() });
      toast.success('Proposal updated successfully!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to update proposal';
      toast.error(message);
    },
  });
}

// Withdraw proposal mutation
export function useWithdrawProposal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => proposalsService.withdrawProposal(id),
    onMutate: async (id) => {
      // Optimistically update
      await queryClient.cancelQueries({ queryKey: proposalKeys.detail(id) });
      const previousProposal = queryClient.getQueryData(proposalKeys.detail(id));

      queryClient.setQueryData(proposalKeys.detail(id), (old: any) => ({
        ...old,
        data: { ...old?.data, status: 'withdrawn' },
      }));

      return { previousProposal };
    },
    onError: (error, id, context) => {
      if (context?.previousProposal) {
        queryClient.setQueryData(proposalKeys.detail(id), context.previousProposal);
      }
      const message = error.response?.data?.message || 'Failed to withdraw proposal';
      toast.error(message);
    },
    onSuccess: (response, id) => {
      queryClient.removeQueries({ queryKey: proposalKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: proposalKeys.lists() });
      queryClient.invalidateQueries({ queryKey: proposalKeys.my() });
      toast.success('Proposal withdrawn successfully!');
    },
  });
}

// Accept proposal mutation
export function useAcceptProposal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => proposalsService.acceptProposal(id),
    onSuccess: (response, id) => {
      queryClient.invalidateQueries({ queryKey: proposalKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: proposalKeys.lists() });
      toast.success('Proposal accepted!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to accept proposal';
      toast.error(message);
    },
  });
}

// Reject proposal mutation
export function useRejectProposal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => proposalsService.rejectProposal(id),
    onSuccess: (response, id) => {
      queryClient.invalidateQueries({ queryKey: proposalKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: proposalKeys.lists() });
      toast.success('Proposal rejected');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to reject proposal';
      toast.error(message);
    },
  });
}

// Highlight proposal mutation
export function useHighlightProposal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => proposalsService.highlightProposal(id),
    onSuccess: (response, id) => {
      queryClient.invalidateQueries({ queryKey: proposalKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: proposalKeys.my() });
      toast.success('Proposal highlighted!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to highlight proposal';
      toast.error(message);
    },
  });
}

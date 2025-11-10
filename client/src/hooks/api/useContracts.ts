import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { contractsService, CreateContractDto } from '@/services/api';

export const contractKeys = {
  all: ['contracts'] as const,
  lists: () => [...contractKeys.all, 'list'] as const,
  list: () => [...contractKeys.lists()] as const,
  details: () => [...contractKeys.all, 'detail'] as const,
  detail: (id: string) => [...contractKeys.details(), id] as const,
  my: () => [...contractKeys.all, 'my'] as const,
};

export function useContract(id: string, enabled = true) {
  return useQuery({
    queryKey: contractKeys.detail(id),
    queryFn: () => contractsService.getContract(id),
    enabled: !!id && enabled,
    staleTime: 5 * 60 * 1000,
  });
}

export function useMyContracts() {
  return useQuery({
    queryKey: contractKeys.my(),
    queryFn: () => contractsService.getMyContracts(),
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreateContract() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ proposalId, data }: { proposalId: string; data: CreateContractDto }) =>
      contractsService.createContract(proposalId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contractKeys.my() });
      toast.success('Contract created successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create contract');
    },
  });
}

export function useSignContract() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => contractsService.signContract(id),
    onSuccess: (response, id) => {
      queryClient.invalidateQueries({ queryKey: contractKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: contractKeys.my() });
      toast.success('Contract signed!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to sign contract');
    },
  });
}

export function useSubmitMilestone() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      contractId,
      milestoneId,
      data,
    }: {
      contractId: string;
      milestoneId: string;
      data: { notes?: string; attachments?: string[] };
    }) => contractsService.submitMilestone(contractId, milestoneId, data),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: contractKeys.detail(variables.contractId) });
      toast.success('Milestone submitted!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to submit milestone');
    },
  });
}

export function useApproveMilestone() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      contractId,
      milestoneId,
      data,
    }: {
      contractId: string;
      milestoneId: string;
      data: { feedback?: string };
    }) => contractsService.approveMilestone(contractId, milestoneId, data),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: contractKeys.detail(variables.contractId) });
      toast.success('Milestone approved!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to approve milestone');
    },
  });
}

export function useRejectMilestone() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      contractId,
      milestoneId,
      data,
    }: {
      contractId: string;
      milestoneId: string;
      data: { reason: string };
    }) => contractsService.rejectMilestone(contractId, milestoneId, data),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: contractKeys.detail(variables.contractId) });
      toast.success('Milestone rejected');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to reject milestone');
    },
  });
}

export function useProposeAmendment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      contractId,
      data,
    }: {
      contractId: string;
      data: { changes: any; reason: string };
    }) => contractsService.proposeAmendment(contractId, data),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: contractKeys.detail(variables.contractId) });
      toast.success('Amendment proposed!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to propose amendment');
    },
  });
}

export function useRespondToAmendment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      contractId,
      amendmentId,
      data,
    }: {
      contractId: string;
      amendmentId: string;
      data: { accept: boolean; notes?: string };
    }) => contractsService.respondToAmendment(contractId, amendmentId, data),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: contractKeys.detail(variables.contractId) });
      toast.success('Response submitted!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to respond to amendment');
    },
  });
}

export function useCancelContract() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      contractsService.cancelContract(id, reason),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: contractKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: contractKeys.my() });
      toast.success('Contract cancelled');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to cancel contract');
    },
  });
}

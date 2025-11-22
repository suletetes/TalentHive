import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contractsService } from '@/services/api/contracts.service';

// Query keys for cache management
export const contractKeys = {
  all: ['contracts'] as const,
  lists: () => [...contractKeys.all, 'list'] as const,
  detail: (id: string) => [...contractKeys.all, 'detail', id] as const,
  my: () => [...contractKeys.all, 'my'] as const,
};

export const useMyContracts = (params?: {
  page?: number;
  limit?: number;
  status?: string;
  role?: string;
}) => {
  return useQuery({
    queryKey: ['contracts', 'my', params],
    queryFn: async () => {
      const response = await contractsService.getMyContracts(params);
      return response;
    },
  });
};

export const useContract = (id: string) => {
  return useQuery({
    queryKey: ['contracts', id],
    queryFn: async () => {
      const response = await contractsService.getContractById(id);
      return response.data;
    },
    enabled: !!id,
  });
};

export const useSignContract = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      contractsService.signContract(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
    },
  });
};

export const useSubmitMilestone = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      contractId,
      milestoneId,
      data,
    }: {
      contractId: string;
      milestoneId: string;
      data: any;
    }) => contractsService.submitMilestone(contractId, milestoneId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
    },
  });
};

export const useApproveMilestone = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      contractId,
      milestoneId,
      data,
    }: {
      contractId: string;
      milestoneId: string;
      data: any;
    }) => contractsService.approveMilestone(contractId, milestoneId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
    },
  });
};

export const useRejectMilestone = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      contractId,
      milestoneId,
      data,
    }: {
      contractId: string;
      milestoneId: string;
      data: any;
    }) => contractsService.rejectMilestone(contractId, milestoneId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
    },
  });
};

export const usePauseContract = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ contractId, data }: { contractId: string; data: any }) =>
      contractsService.pauseContract(contractId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
    },
  });
};

export const useResumeContract = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (contractId: string) => contractsService.resumeContract(contractId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
    },
  });
};

export const useCreateDispute = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ contractId, data }: { contractId: string; data: any }) =>
      contractsService.createDispute(contractId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
    },
  });
};

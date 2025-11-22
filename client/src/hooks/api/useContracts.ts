import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contractsService } from '@/services/api/contracts.service';

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

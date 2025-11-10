import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { paymentsService, ProcessPaymentDto, PayoutRequest } from '@/services/api';

export const paymentKeys = {
  all: ['payments'] as const,
  history: (params?: any) => [...paymentKeys.all, 'history', params] as const,
  escrow: () => [...paymentKeys.all, 'escrow'] as const,
  methods: () => [...paymentKeys.all, 'methods'] as const,
};

export function usePaymentHistory(params?: {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
}) {
  return useQuery({
    queryKey: paymentKeys.history(params),
    queryFn: () => paymentsService.getPaymentHistory(params),
    staleTime: 2 * 60 * 1000,
  });
}

export function useEscrowBalance() {
  return useQuery({
    queryKey: paymentKeys.escrow(),
    queryFn: () => paymentsService.getEscrowBalance(),
    staleTime: 1 * 60 * 1000,
  });
}

export function usePaymentMethods() {
  return useQuery({
    queryKey: paymentKeys.methods(),
    queryFn: () => paymentsService.getPaymentMethods(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useProcessPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ProcessPaymentDto) => paymentsService.processPayment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentKeys.history() });
      queryClient.invalidateQueries({ queryKey: paymentKeys.escrow() });
      toast.success('Payment processed successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Payment failed');
    },
  });
}

export function useRequestPayout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: PayoutRequest) => paymentsService.requestPayout(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentKeys.escrow() });
      queryClient.invalidateQueries({ queryKey: paymentKeys.history() });
      toast.success('Payout requested successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Payout request failed');
    },
  });
}

export function useAddPaymentMethod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { paymentMethodId: string }) =>
      paymentsService.addPaymentMethod(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentKeys.methods() });
      toast.success('Payment method added!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to add payment method');
    },
  });
}

export function useRemovePaymentMethod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (methodId: string) => paymentsService.removePaymentMethod(methodId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentKeys.methods() });
      toast.success('Payment method removed!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to remove payment method');
    },
  });
}

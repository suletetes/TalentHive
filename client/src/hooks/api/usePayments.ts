import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { paymentsService, CreatePaymentIntentDto, ConfirmPaymentDto, RefundPaymentDto } from '@/services/api/payments.service';

export const transactionKeys = {
  all: ['transactions'] as const,
  history: (params?: any) => [...transactionKeys.all, 'history', params] as const,
  detail: (id: string) => [...transactionKeys.all, 'detail', id] as const,
  fees: (amount: number) => [...transactionKeys.all, 'fees', amount] as const,
};

// Alias for test compatibility
export const paymentKeys = {
  all: ['payments'] as const,
  escrow: () => [...paymentKeys.all, 'escrow'] as const,
};

export function useTransactionHistory(params?: {
  page?: number;
  limit?: number;
  status?: string;
}) {
  return useQuery({
    queryKey: transactionKeys.history(params),
    queryFn: () => paymentsService.getTransactionHistory(params),
    staleTime: 2 * 60 * 1000,
  });
}

export function useTransaction(transactionId: string) {
  return useQuery({
    queryKey: transactionKeys.detail(transactionId),
    queryFn: () => paymentsService.getTransaction(transactionId),
    staleTime: 1 * 60 * 1000,
  });
}

export function useCalculateFees(amount: number) {
  return useQuery({
    queryKey: transactionKeys.fees(amount),
    queryFn: () => paymentsService.calculateFees(amount),
    staleTime: 5 * 60 * 1000,
    enabled: amount > 0,
  });
}

export function useCreatePaymentIntent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePaymentIntentDto) => 
      paymentsService.createPaymentIntent(data.contractId, data.milestoneId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.history() });
      toast.success('Payment intent created successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create payment intent');
    },
  });
}

export function useConfirmPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ConfirmPaymentDto) => paymentsService.confirmPayment(data.paymentIntentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.history() });
      toast.success('Payment confirmed and held in escrow!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to confirm payment');
    },
  });
}

export function useReleaseEscrow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (transactionId: string) => paymentsService.releaseEscrow(transactionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.history() });
      toast.success('Escrow released successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to release escrow');
    },
  });
}

export function useRefundPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ transactionId, data }: { transactionId: string; data: RefundPaymentDto }) =>
      paymentsService.refundPayment(transactionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.history() });
      toast.success('Payment refunded successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to refund payment');
    },
  });
}

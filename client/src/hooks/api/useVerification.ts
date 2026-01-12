import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import verificationService from '@/services/api/verification.service';

export const useVerificationStatus = () => {
  return useQuery({
    queryKey: ['verification', 'status'],
    queryFn: verificationService.getVerificationStatus,
  });
};

export const useVerificationHistory = () => {
  return useQuery({
    queryKey: ['verification', 'history'],
    queryFn: verificationService.getVerificationHistory,
  });
};

export const useSendVerificationEmail = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: verificationService.sendVerificationEmail,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['verification', 'status'] });
    },
  });
};

export const useVerifyEmail = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (token: string) => verificationService.verifyEmail(token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['verification', 'status'] });
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });
};

export const useResendVerificationEmail = () => {
  return useMutation({
    mutationFn: verificationService.resendVerificationEmail,
  });
};

export const useSendPhoneVerificationCode = () => {
  return useMutation({
    mutationFn: (phone: string) => verificationService.sendPhoneVerificationCode(phone),
  });
};

export const useVerifyPhone = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ phone, code }: { phone: string; code: string }) =>
      verificationService.verifyPhone(phone, code),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['verification', 'status'] });
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });
};

export const useSubmitIdentityVerification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ documentUrl, documentType }: { documentUrl: string; documentType: string }) =>
      verificationService.submitIdentityVerification(documentUrl, documentType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['verification', 'status'] });
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });
};

export const useIsUserVerified = (userId: string) => {
  return useQuery({
    queryKey: ['verification', 'user', userId],
    queryFn: () => verificationService.isUserVerified(userId),
    enabled: !!userId,
  });
};

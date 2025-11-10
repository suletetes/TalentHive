import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { messagesService, SendMessageDto } from '@/services/api';

export const messageKeys = {
  all: ['messages'] as const,
  conversations: () => [...messageKeys.all, 'conversations'] as const,
  conversation: (id: string, params?: any) =>
    [...messageKeys.all, 'conversation', id, params] as const,
};

export function useConversations() {
  return useQuery({
    queryKey: messageKeys.conversations(),
    queryFn: () => messagesService.getConversations(),
    staleTime: 1 * 60 * 1000,
  });
}

export function useMessages(
  conversationId: string,
  params?: { page?: number; limit?: number }
) {
  return useQuery({
    queryKey: messageKeys.conversation(conversationId, params),
    queryFn: () => messagesService.getMessages(conversationId, params),
    enabled: !!conversationId,
    staleTime: 30 * 1000, // 30 seconds
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ conversationId, data }: { conversationId: string; data: SendMessageDto }) =>
      messagesService.sendMessage(conversationId, data),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({
        queryKey: messageKeys.conversation(variables.conversationId),
      });
      queryClient.invalidateQueries({ queryKey: messageKeys.conversations() });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to send message');
    },
  });
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (conversationId: string) => messagesService.markAsRead(conversationId),
    onSuccess: (response, conversationId) => {
      queryClient.invalidateQueries({ queryKey: messageKeys.conversation(conversationId) });
      queryClient.invalidateQueries({ queryKey: messageKeys.conversations() });
    },
  });
}

export function useCreateConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (participantId: string) => messagesService.createConversation(participantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: messageKeys.conversations() });
      toast.success('Conversation created!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create conversation');
    },
  });
}

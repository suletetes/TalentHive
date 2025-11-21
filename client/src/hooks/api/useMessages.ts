import { useQuery } from '@tanstack/react-query';
import { messagesService } from '@/services/api/messages.service';

export const useConversations = () => {
  return useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const response = await messagesService.getConversations();
      return response.data;
    },
  });
};

export const useUnreadCount = (enabled = true) => {
  return useQuery({
    queryKey: ['unread-messages-count'],
    queryFn: async () => {
      const response = await messagesService.getConversations();
      const conversations = response.data;
      const totalUnread = conversations.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);
      return totalUnread;
    },
    enabled,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};

export const useMessages = (conversationId: string, page = 1, limit = 50) => {
  return useQuery({
    queryKey: ['messages', conversationId, page],
    queryFn: async () => {
      const response = await messagesService.getMessages(conversationId, { page, limit });
      return response;
    },
    enabled: !!conversationId,
  });
};

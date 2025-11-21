import { apiCore } from './core';

export interface Message {
  _id: string;
  conversation: string;
  sender: {
    _id: string;
    profile: {
      firstName: string;
      lastName: string;
      avatar?: string;
    };
  };
  content: string;
  attachments?: string[];
  isRead: boolean;
  createdAt: Date;
}

export interface Conversation {
  _id: string;
  participants: Array<{
    _id: string;
    profile: {
      firstName: string;
      lastName: string;
      avatar?: string;
    };
  }>;
  lastMessage?: Message;
  unreadCount: number;
  updatedAt: Date;
}

export interface SendMessageDto {
  content: string;
  attachments?: string[];
}

export class MessagesService {
  private basePath = '/messages';

  async sendMessage(conversationId: string, data: SendMessageDto): Promise<{ data: Message }> {
    return apiCore.post<{ data: Message }>(`${this.basePath}/conversations/${conversationId}/messages`, data);
  }

  async getMessages(
    conversationId: string,
    params?: { page?: number; limit?: number }
  ): Promise<{ data: Message[]; pagination: any }> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, String(value));
        }
      });
    }
    return apiCore.get<{ data: Message[]; pagination: any }>(
      `${this.basePath}/conversations/${conversationId}/messages?${queryParams.toString()}`
    );
  }

  async getConversations(): Promise<{ data: Conversation[] }> {
    return apiCore.get<{ data: Conversation[] }>(`${this.basePath}/conversations`);
  }

  async markAsRead(conversationId: string): Promise<{ message: string }> {
    return apiCore.post<{ message: string }>(
      `${this.basePath}/conversations/${conversationId}/read`,
      {}
    );
  }

  async createConversation(participantId: string): Promise<{ data: Conversation }> {
    return apiCore.post<{ data: Conversation }>(`${this.basePath}/conversations`, {
      participantId,
    });
  }
}

export const messagesService = new MessagesService();

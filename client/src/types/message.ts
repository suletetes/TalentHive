// Message and conversation types

import { UserProfile } from './user';

export type MessageType = 'text' | 'file' | 'image' | 'system';
export type ConversationStatus = 'active' | 'archived' | 'blocked';

export interface Message {
  _id: string;
  conversation: string;
  sender: UserProfile | string;
  recipient: UserProfile | string;
  content: string;
  type: MessageType;
  attachments: MessageAttachment[];
  isRead: boolean;
  readAt?: string;
  isEdited: boolean;
  editedAt?: string;
  replyTo?: Message | string;
  createdAt: string;
  updatedAt: string;
}

export interface MessageAttachment {
  _id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
}

export interface Conversation {
  _id: string;
  participants: UserProfile[];
  lastMessage?: Message;
  unreadCount: number;
  status: ConversationStatus;
  project?: {
    _id: string;
    title: string;
  };
  contract?: {
    _id: string;
    title: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateMessageDto {
  conversationId: string;
  content: string;
  type?: MessageType;
  attachments?: File[];
  replyTo?: string;
}

export interface CreateConversationDto {
  participantId: string;
  initialMessage: string;
  projectId?: string;
  contractId?: string;
}

export interface MessageFilters {
  conversationId?: string;
  page?: number;
  limit?: number;
  before?: string;
  after?: string;
}

export interface ConversationFilters {
  status?: ConversationStatus;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface TypingIndicator {
  conversationId: string;
  userId: string;
  isTyping: boolean;
}

export interface MessageStats {
  totalConversations: number;
  unreadMessages: number;
  activeConversations: number;
  archivedConversations: number;
}
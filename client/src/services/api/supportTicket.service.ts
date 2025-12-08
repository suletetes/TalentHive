import { apiService } from './index';

export interface SupportTicket {
  _id: string;
  ticketId: string;
  userId: string;
  subject: string;
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'technical' | 'billing' | 'account' | 'project' | 'other';
  messages: TicketMessage[];
  tags?: string[];
  assignedAdminId?: string;
  createdAt: string;
  updatedAt: string;
  lastResponseAt?: string;
  resolvedAt?: string;
  closedAt?: string;
}

export interface TicketMessage {
  _id: string;
  senderId: {
    _id: string;
    profile: {
      firstName: string;
      lastName: string;
      avatar?: string;
    };
    role: string;
  };
  message: string;
  attachments?: Array<{
    filename: string;
    url: string;
    size: number;
    mimeType: string;
  }>;
  isAdminResponse: boolean;
  isRead: boolean;
  createdAt: string;
}

export interface CreateTicketData {
  subject: string;
  category: 'technical' | 'billing' | 'account' | 'project' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  message: string;
}

export interface AddMessageData {
  message: string;
}

export interface UpdateStatusData {
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
}

export interface AssignTicketData {
  adminId: string;
}

export interface UpdateTagsData {
  tags: string[];
}

export interface TicketStats {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
  byPriority: {
    low: number;
    medium: number;
    high: number;
    urgent: number;
  };
  byCategory: {
    technical: number;
    billing: number;
    account: number;
    project: number;
    other: number;
  };
  avgResponseTime: number;
  avgResolutionTime: number;
}

class SupportTicketService {
  /**
   * Create a new support ticket
   */
  async createTicket(data: CreateTicketData): Promise<SupportTicket> {
    const response = await apiService.post('/support/tickets', data);
    return response.data;
  }

  /**
   * Get all tickets (user's tickets or all for admin)
   */
  async getTickets(params?: {
    status?: string;
    priority?: string;
    category?: string;
    page?: number;
    limit?: number;
  }): Promise<{ tickets: SupportTicket[]; total: number; page: number; pages: number }> {
    const response = await apiService.get('/support/tickets', { params });
    return response.data;
  }

  /**
   * Get ticket by ID
   */
  async getTicketById(ticketId: string): Promise<SupportTicket> {
    const response = await apiService.get(`/support/tickets/${ticketId}`);
    return response.data;
  }

  /**
   * Add message to ticket
   */
  async addMessage(ticketId: string, data: AddMessageData): Promise<SupportTicket> {
    const response = await apiService.post(`/support/tickets/${ticketId}/messages`, data);
    return response.data;
  }

  /**
   * Update ticket status (admin only)
   */
  async updateStatus(ticketId: string, data: UpdateStatusData): Promise<SupportTicket> {
    const response = await apiService.patch(`/support/tickets/${ticketId}/status`, data);
    return response.data;
  }

  /**
   * Assign ticket to admin (admin only)
   */
  async assignTicket(ticketId: string, data: AssignTicketData): Promise<SupportTicket> {
    const response = await apiService.patch(`/support/tickets/${ticketId}/assign`, data);
    return response.data;
  }

  /**
   * Update ticket tags (admin only)
   */
  async updateTags(ticketId: string, data: UpdateTagsData): Promise<SupportTicket> {
    const response = await apiService.patch(`/support/tickets/${ticketId}/tags`, data);
    return response.data;
  }

  /**
   * Get ticket statistics (admin only)
   */
  async getTicketStats(): Promise<TicketStats> {
    const response = await apiService.get('/support/tickets/stats');
    return response.data;
  }
}

export const supportTicketService = new SupportTicketService();

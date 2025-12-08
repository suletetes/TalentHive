import { apiCore } from './core';

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
    const response: any = await apiCore.post('/support/tickets', data);
    // Backend returns { success: true, data: ticket }
    return response.data || response;
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
    const response: any = await apiCore.get('/support/tickets', { params });
    // Backend returns { success: true, data: tickets[] }
    const tickets = response.data || response || [];
    return {
      tickets: Array.isArray(tickets) ? tickets : [],
      total: tickets.length || 0,
      page: 1,
      pages: 1,
    };
  }

  /**
   * Get ticket by ID
   */
  async getTicketById(ticketId: string): Promise<SupportTicket> {
    const response: any = await apiCore.get(`/support/tickets/${ticketId}`);
    // Backend returns { success: true, data: ticket }
    return response.data || response;
  }

  /**
   * Add message to ticket
   */
  async addMessage(ticketId: string, data: AddMessageData): Promise<SupportTicket> {
    const response: any = await apiCore.post(`/support/tickets/${ticketId}/messages`, data);
    // Backend returns { success: true, data: ticket }
    return response.data || response;
  }

  /**
   * Update ticket status (admin only)
   */
  async updateStatus(ticketId: string, data: UpdateStatusData): Promise<SupportTicket> {
    return apiCore.patch(`/support/tickets/${ticketId}/status`, data);
  }

  /**
   * Assign ticket to admin (admin only)
   */
  async assignTicket(ticketId: string, data: AssignTicketData): Promise<SupportTicket> {
    return apiCore.patch(`/support/tickets/${ticketId}/assign`, data);
  }

  /**
   * Update ticket tags (admin only)
   */
  async updateTags(ticketId: string, data: UpdateTagsData): Promise<SupportTicket> {
    return apiCore.patch(`/support/tickets/${ticketId}/tags`, data);
  }

  /**
   * Get ticket statistics (admin only)
   */
  async getTicketStats(): Promise<TicketStats> {
    return apiCore.get('/support/tickets/stats');
  }
}

export const supportTicketService = new SupportTicketService();

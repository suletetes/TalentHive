import { apiCore } from './core';

export interface SupportTicket {
  _id: string;
  ticketId: string;
  userId: string | {
    _id: string;
    profile: {
      firstName: string;
      lastName: string;
    };
    email: string;
  };
  subject: string;
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'technical' | 'billing' | 'account' | 'project' | 'other';
  messages: TicketMessage[];
  tags?: string[];
  assignedAdminId?: string | {
    _id: string;
    profile: {
      firstName: string;
      lastName: string;
    };
  };
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
    const rawTicket = response.data || response;
    
    // Clean and validate the ticket data
    const cleanTicket = this.cleanTicketData(rawTicket);
    return cleanTicket;
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
    const rawTicket = response.data || response;
    
    // Clean and validate the ticket data to prevent rendering issues
    const cleanTicket = this.cleanTicketData(rawTicket);
    return cleanTicket;
  }

  /**
   * Clean ticket data to remove virtual fields and ensure proper structure
   */
  private cleanTicketData(ticket: any): SupportTicket {
    if (!ticket) return ticket;

    // Clean messages to ensure senderId objects don't have virtual fields
    if (ticket.messages && Array.isArray(ticket.messages)) {
      ticket.messages = ticket.messages.map((message: any) => {
        if (message.senderId && typeof message.senderId === 'object') {
          // Create a clean sender object with only the fields we need
          const cleanSender = {
            _id: String(message.senderId._id || ''),
            profile: {
              firstName: String(message.senderId.profile?.firstName || 'Unknown'),
              lastName: String(message.senderId.profile?.lastName || 'User'),
              avatar: String(message.senderId.profile?.avatar || ''),
            },
            role: String(message.senderId.role || 'user'),
          };
          
          return {
            ...message,
            senderId: cleanSender,
            message: String(message.message || ''),
            isAdminResponse: Boolean(message.isAdminResponse),
            isRead: Boolean(message.isRead),
            createdAt: String(message.createdAt || new Date().toISOString()),
          };
        }
        return message;
      });
    }

    // Clean assignedAdminId if it's populated
    if (ticket.assignedAdminId && typeof ticket.assignedAdminId === 'object') {
      const cleanAdmin = {
        _id: String(ticket.assignedAdminId._id || ''),
        profile: {
          firstName: String(ticket.assignedAdminId.profile?.firstName || 'Unknown'),
          lastName: String(ticket.assignedAdminId.profile?.lastName || 'Admin'),
        },
      };
      ticket.assignedAdminId = cleanAdmin;
    }

    // Clean userId if it's populated
    if (ticket.userId && typeof ticket.userId === 'object') {
      const cleanUser = {
        _id: String(ticket.userId._id || ''),
        profile: {
          firstName: String(ticket.userId.profile?.firstName || 'Unknown'),
          lastName: String(ticket.userId.profile?.lastName || 'User'),
        },
        email: String(ticket.userId.email || ''),
      };
      ticket.userId = cleanUser;
    }

    return ticket;
  }

  /**
   * Add message to ticket
   */
  async addMessage(ticketId: string, data: AddMessageData): Promise<SupportTicket> {
    const response: any = await apiCore.post(`/support/tickets/${ticketId}/messages`, data);
    // Backend returns { success: true, data: ticket }
    const rawTicket = response.data || response;
    
    // Clean and validate the ticket data
    const cleanTicket = this.cleanTicketData(rawTicket);
    return cleanTicket;
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
    const response: any = await apiCore.get('/support/tickets/stats');
    // Backend returns { success: true, data: { total, byStatus, urgent, unassigned, byCategory, avgResponseTimeHours } }
    const data = response.data || response;
    
    // Transform backend response to match TicketStats interface
    return {
      total: data.total || 0,
      open: data.byStatus?.open || 0,
      inProgress: data.byStatus?.inProgress || 0,
      resolved: data.byStatus?.resolved || 0,
      closed: data.byStatus?.closed || 0,
      byPriority: {
        urgent: data.urgent || 0,
        high: 0,
        medium: 0,
        low: 0,
      },
      byCategory: this.transformCategoryStats(data.byCategory || []),
      avgResponseTime: (data.avgResponseTimeHours || 0) * 60, // Convert hours to minutes
      avgResolutionTime: 0,
    };
  }

  private transformCategoryStats(byCategory: Array<{ _id: string; count: number }>): TicketStats['byCategory'] {
    const result = { technical: 0, billing: 0, account: 0, project: 0, other: 0 };
    for (const item of byCategory) {
      if (item._id in result) {
        result[item._id as keyof typeof result] = item.count;
      }
    }
    return result;
  }
}

export const supportTicketService = new SupportTicketService();

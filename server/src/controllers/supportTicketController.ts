import { Request, Response } from 'express';
import { SupportTicket } from '@/models/SupportTicket';
import { User } from '@/models/User';
import { sendEmail } from '@/utils/email';
import { Notification } from '@/models/Notification';

/**
 * Create a new support ticket
 * POST /api/support/tickets
 */
export const createTicket = async (req: Request, res: Response) => {
  try {
    const { subject, category, priority, message } = req.body;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Validate required fields
    if (!subject || !category || !message) {
      return res.status(400).json({ 
        message: 'Subject, category, and message are required' 
      });
    }

    // Generate ticket ID
    const count = await SupportTicket.countDocuments();
    const ticketId = `TKT-${String(count + 1).padStart(5, '0')}`;

    // Create ticket with initial message
    const ticket = await SupportTicket.create({
      ticketId,
      userId,
      subject,
      category,
      priority: priority || 'medium',
      messages: [{
        senderId: userId,
        message,
        isAdminResponse: false,
        isRead: false,
      }],
      lastResponseAt: new Date(),
    });

    await ticket.populate('userId', 'profile.firstName profile.lastName email');

    // Notify all admins
    const admins = await User.find({ role: 'admin', isActive: true });
    
    for (const admin of admins) {
      // Create in-app notification
      await Notification.create({
        user: admin._id,
        type: 'system',
        title: 'New Support Ticket',
        message: `New support ticket: ${subject}`,
        link: `/admin/support/${ticket.ticketId}`, // Admin gets admin link
      });

      // Send email notification (wrapped in try-catch to not block ticket creation)
      try {
        await sendEmail({
          to: admin.email,
          subject: `New Support Ticket: ${subject}`,
          html: `
            <h2>New Support Ticket</h2>
            <p><strong>Ticket ID:</strong> ${ticket.ticketId}</p>
            <p><strong>From:</strong> ${(ticket.userId as any).profile.firstName} ${(ticket.userId as any).profile.lastName}</p>
            <p><strong>Subject:</strong> ${subject}</p>
            <p><strong>Category:</strong> ${category}</p>
            <p><strong>Priority:</strong> ${priority || 'medium'}</p>
            <p><strong>Message:</strong></p>
            <p>${message}</p>
            <p><a href="${process.env.CLIENT_URL}/admin/support/${ticket.ticketId}">View Ticket</a></p>
          `,
        });
      } catch (emailError) {
        console.error('Failed to send email notification:', emailError);
        // Continue execution even if email fails
      }
    }

    res.status(201).json({
      success: true,
      data: ticket,
    });
  } catch (error: any) {
    console.error('Create ticket error:', error);
    res.status(500).json({ 
      message: 'Failed to create support ticket',
      error: error.message 
    });
  }
};

/**
 * Get tickets (user's tickets or all tickets for admin)
 * GET /api/support/tickets
 */
export const getTickets = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;
    const userRole = req.user?.role;
    const { status, priority, category, assignedToMe } = req.query;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    let query: any = {};

    // Non-admins can only see their own tickets
    if (userRole !== 'admin') {
      query.userId = userId;
    } else if (assignedToMe === 'true') {
      query.assignedAdminId = userId;
    }

    // Apply filters
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (category) query.category = category;

    const tickets = await SupportTicket.find(query)
      .populate('userId', 'profile.firstName profile.lastName email')
      .populate('assignedAdminId', 'profile.firstName profile.lastName')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: tickets,
    });
  } catch (error: any) {
    console.error('Get tickets error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch tickets',
      error: error.message 
    });
  }
};

/**
 * Get ticket by ID
 * GET /api/support/tickets/:ticketId
 */
export const getTicketById = async (req: Request, res: Response) => {
  try {
    const { ticketId } = req.params;
    const userId = req.user?._id;
    const userRole = req.user?.role;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const ticket = await SupportTicket.findOne({ ticketId })
      .populate('userId', 'profile.firstName profile.lastName email')
      .populate('assignedAdminId', 'profile.firstName profile.lastName')
      .populate('messages.senderId', 'profile.firstName profile.lastName role');

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Check authorization
    const ticketUserId = typeof ticket.userId === 'object' ? (ticket.userId as any)._id : ticket.userId;
    if (userRole !== 'admin' && ticketUserId.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Mark messages as read for the current user
    let updated = false;
    ticket.messages.forEach(msg => {
      if (msg.senderId.toString() !== userId && !msg.isRead) {
        msg.isRead = true;
        updated = true;
      }
    });

    if (updated) {
      await ticket.save();
    }

    res.json({
      success: true,
      data: ticket,
    });
  } catch (error: any) {
    console.error('Get ticket error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch ticket',
      error: error.message 
    });
  }
};

/**
 * Add message to ticket
 * POST /api/support/tickets/:ticketId/messages
 */
export const addMessage = async (req: Request, res: Response) => {
  try {
    const { ticketId } = req.params;
    const { message, attachments } = req.body;
    const userId = req.user?._id;
    const userRole = req.user?.role;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }

    const ticket = await SupportTicket.findOne({ ticketId })
      .populate('userId', 'profile.firstName profile.lastName email');

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Check authorization
    const ticketUserId = typeof ticket.userId === 'object' ? (ticket.userId as any)._id : ticket.userId;
    if (userRole !== 'admin' && ticketUserId.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const isAdminResponse = userRole === 'admin';

    // Add message
    ticket.messages.push({
      senderId: userId as any,
      message,
      attachments: attachments || [],
      isAdminResponse,
      isRead: false,
      createdAt: new Date(),
    } as any);

    ticket.lastResponseAt = new Date();
    await ticket.save();

    await ticket.populate('messages.senderId', 'profile.firstName profile.lastName role');

    // Send notification to the other party
    if (isAdminResponse) {
      // Notify ticket creator
      await Notification.create({
        user: ticket.userId._id,
        type: 'system',
        title: 'Support Ticket Response',
        message: `Admin responded to your ticket: ${ticket.subject}`,
        link: `/dashboard/support/${ticket.ticketId}`, // User gets dashboard link
      });

      // Send email (wrapped in try-catch)
      try {
        await sendEmail({
          to: (ticket.userId as any).email,
          subject: `Response to your support ticket: ${ticket.subject}`,
          html: `
            <h2>Support Ticket Response</h2>
            <p><strong>Ticket ID:</strong> ${ticket.ticketId}</p>
            <p><strong>Subject:</strong> ${ticket.subject}</p>
            <p><strong>Admin Response:</strong></p>
            <p>${message}</p>
            <p><a href="${process.env.CLIENT_URL}/dashboard/support/${ticket.ticketId}">View Ticket</a></p>
          `,
        });
      } catch (emailError) {
        console.error('Failed to send email notification:', emailError);
      }
    } else {
      // Notify assigned admin or all admins
      const adminsToNotify = ticket.assignedAdminId 
        ? [await User.findById(ticket.assignedAdminId)]
        : await User.find({ role: 'admin', isActive: true });

      for (const admin of adminsToNotify) {
        if (!admin) continue;

        await Notification.create({
          user: admin._id,
          type: 'system',
          title: 'Support Ticket Update',
          message: `User replied to ticket: ${ticket.subject}`,
          link: `/admin/support/${ticket.ticketId}`, // Admin gets admin link
        });
      }
    }

    res.json({
      success: true,
      data: ticket,
    });
  } catch (error: any) {
    console.error('Add message error:', error);
    res.status(500).json({ 
      message: 'Failed to add message',
      error: error.message 
    });
  }
};

/**
 * Update ticket status (admin only)
 * PATCH /api/support/tickets/:ticketId/status
 */
export const updateTicketStatus = async (req: Request, res: Response) => {
  try {
    const { ticketId } = req.params;
    const { status } = req.body;
    const userRole = req.user?.role;

    if (userRole !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    if (!['open', 'in-progress', 'resolved', 'closed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const ticket = await SupportTicket.findOne({ ticketId })
      .populate('userId', 'email profile.firstName profile.lastName');

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    ticket.status = status;
    
    if (status === 'resolved') {
      ticket.resolvedAt = new Date();
    } else if (status === 'closed') {
      ticket.closedAt = new Date();
    }

    await ticket.save();

    // Notify ticket creator
    await Notification.create({
      user: ticket.userId._id,
      type: 'system',
      title: 'Ticket Status Updated',
      message: `Your ticket "${ticket.subject}" status changed to: ${status}`,
      link: `/dashboard/support/${ticket.ticketId}`, // User gets dashboard link
    });

    // Send email (wrapped in try-catch)
    try {
      await sendEmail({
        to: (ticket.userId as any).email,
        subject: `Ticket Status Updated: ${ticket.subject}`,
        html: `
          <h2>Ticket Status Updated</h2>
          <p><strong>Ticket ID:</strong> ${ticket.ticketId}</p>
          <p><strong>Subject:</strong> ${ticket.subject}</p>
          <p><strong>New Status:</strong> ${status}</p>
          <p><a href="${process.env.CLIENT_URL}/dashboard/support/${ticket.ticketId}">View Ticket</a></p>
        `,
      });
    } catch (emailError) {
      console.error('Failed to send email notification:', emailError);
    }

    res.json({
      success: true,
      data: ticket,
    });
  } catch (error: any) {
    console.error('Update status error:', error);
    res.status(500).json({ 
      message: 'Failed to update ticket status',
      error: error.message 
    });
  }
};

/**
 * Assign ticket to admin (admin only)
 * PATCH /api/support/tickets/:ticketId/assign
 */
export const assignTicket = async (req: Request, res: Response) => {
  try {
    const { ticketId } = req.params;
    const { adminId } = req.body;
    const userRole = req.user?.role;

    if (userRole !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const ticket = await SupportTicket.findOne({ ticketId });

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Verify admin exists
    const admin = await User.findById(adminId);
    if (!admin || admin.role !== 'admin') {
      return res.status(400).json({ message: 'Invalid admin ID' });
    }

    ticket.assignedAdminId = adminId;
    await ticket.save();

    await ticket.populate('assignedAdminId', 'profile.firstName profile.lastName');

    // Notify assigned admin
    await Notification.create({
      user: adminId,
      type: 'system',
      title: 'Ticket Assigned',
      message: `You have been assigned to ticket: ${ticket.subject}`,
      link: `/admin/support/${ticket.ticketId}`, // Admin gets admin link
    });

    res.json({
      success: true,
      data: ticket,
    });
  } catch (error: any) {
    console.error('Assign ticket error:', error);
    res.status(500).json({ 
      message: 'Failed to assign ticket',
      error: error.message 
    });
  }
};

/**
 * Update ticket tags (admin only)
 * PATCH /api/support/tickets/:ticketId/tags
 */
export const updateTicketTags = async (req: Request, res: Response) => {
  try {
    const { ticketId } = req.params;
    const { tags } = req.body;
    const userRole = req.user?.role;

    if (userRole !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    if (!Array.isArray(tags)) {
      return res.status(400).json({ message: 'Tags must be an array' });
    }

    const ticket = await SupportTicket.findOne({ ticketId });

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    ticket.tags = tags;
    await ticket.save();

    res.json({
      success: true,
      data: ticket,
    });
  } catch (error: any) {
    console.error('Update tags error:', error);
    res.status(500).json({ 
      message: 'Failed to update ticket tags',
      error: error.message 
    });
  }
};

/**
 * Get ticket statistics (admin only)
 * GET /api/support/tickets/stats
 */
export const getTicketStats = async (req: Request, res: Response) => {
  try {
    const userRole = req.user?.role;

    if (userRole !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const [
      totalTickets,
      openTickets,
      inProgressTickets,
      resolvedTickets,
      closedTickets,
      urgentTickets,
      unassignedTickets,
    ] = await Promise.all([
      SupportTicket.countDocuments(),
      SupportTicket.countDocuments({ status: 'open' }),
      SupportTicket.countDocuments({ status: 'in-progress' }),
      SupportTicket.countDocuments({ status: 'resolved' }),
      SupportTicket.countDocuments({ status: 'closed' }),
      SupportTicket.countDocuments({ priority: 'urgent', status: { $nin: ['resolved', 'closed'] } }),
      SupportTicket.countDocuments({ assignedAdminId: null, status: { $nin: ['resolved', 'closed'] } }),
    ]);

    // Get tickets by category
    const ticketsByCategory = await SupportTicket.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]);

    // Get average response time (in hours)
    const avgResponseTime = await SupportTicket.aggregate([
      { $match: { lastResponseAt: { $exists: true } } },
      {
        $project: {
          responseTime: {
            $divide: [
              { $subtract: ['$lastResponseAt', '$createdAt'] },
              1000 * 60 * 60, // Convert to hours
            ],
          },
        },
      },
      { $group: { _id: null, avgTime: { $avg: '$responseTime' } } },
    ]);

    res.json({
      success: true,
      data: {
        total: totalTickets,
        byStatus: {
          open: openTickets,
          inProgress: inProgressTickets,
          resolved: resolvedTickets,
          closed: closedTickets,
        },
        urgent: urgentTickets,
        unassigned: unassignedTickets,
        byCategory: ticketsByCategory,
        avgResponseTimeHours: avgResponseTime[0]?.avgTime || 0,
      },
    });
  } catch (error: any) {
    console.error('Get stats error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch ticket statistics',
      error: error.message 
    });
  }
};

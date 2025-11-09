// @ts-nocheck
import { Request, Response } from 'express';
import { Organization } from '@/models/Organization';
import BudgetApproval from '@/models/BudgetApproval';
import { User } from '@/models/User';
import { logger } from '@/utils/logger';
import { sendEmail } from '@/utils/email';

// Create organization
export const createOrganization = async (req: Request, res: Response) => {
  try {
    const { name, description, industry, size, website } = req.body;
    const userId = req.user._id;

    const organization = await Organization.create({
      name,
      description,
      industry,
      size,
      website,
      owner: userId,
      members: [
        {
          user: userId,
          role: 'owner',
          permissions: ['*'],
          joinedAt: new Date(),
        },
      ],
    });

    res.status(201).json({
      status: 'success',
      data: { organization },
    });
  } catch (error) {
    logger.error('Error creating organization:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create organization',
    });
  }
};

// Get organization by ID
export const getOrganization = async (req: Request, res: Response) => {
  try {
    const { organizationId } = req.params;
    const userId = req.user._id;

    const organization = await Organization.findById(organizationId).populate(
      'members.user',
      'firstName lastName email profilePicture'
    );

    if (!organization) {
      return res.status(404).json({
        status: 'error',
        message: 'Organization not found',
      });
    }

    // Check if user is a member
    const isMember = organization.members.some(
      (member: any) => member.user._id.toString() === userId.toString()
    );

    if (!isMember && req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to view this organization',
      });
    }

    res.json({
      status: 'success',
      data: { organization },
    });
  } catch (error) {
    logger.error('Error fetching organization:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch organization',
    });
  }
};

// Update organization
export const updateOrganization = async (req: Request, res: Response) => {
  try {
    const { organizationId } = req.params;
    const userId = req.user._id;
    const updates = req.body;

    const organization = await Organization.findById(organizationId);

    if (!organization) {
      return res.status(404).json({
        status: 'error',
        message: 'Organization not found',
      });
    }

    // Check if user is owner or admin
    const member = organization.members.find(
      (m: any) => m.user.toString() === userId.toString()
    );

    if (!member || !['owner', 'admin'].includes(member.role)) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to update this organization',
      });
    }

    // Update allowed fields
    const allowedUpdates = ['name', 'description', 'industry', 'size', 'website', 'logo'];
    allowedUpdates.forEach((field) => {
      if (updates[field] !== undefined) {
        (organization as any)[field] = updates[field];
      }
    });

    await organization.save();

    res.json({
      status: 'success',
      data: { organization },
    });
  } catch (error) {
    logger.error('Error updating organization:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update organization',
    });
  }
};

// Invite member to organization
export const inviteMember = async (req: Request, res: Response) => {
  try {
    const { organizationId } = req.params;
    const { email, role, permissions, spendingLimit } = req.body;
    const userId = req.user._id;

    const organization = await Organization.findById(organizationId);

    if (!organization) {
      return res.status(404).json({
        status: 'error',
        message: 'Organization not found',
      });
    }

    // Check permissions
    if (!organization.hasPermission(userId.toString(), 'invite_members')) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to invite members',
      });
    }

    // Find user by email
    const invitedUser = await User.findOne({ email });

    if (!invitedUser) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found',
      });
    }

    // Add member
    organization.addMember(invitedUser._id.toString(), role, permissions || [], spendingLimit);
    await organization.save();

    // Send invitation email
    await sendEmail({
      to: email,
      subject: `Invitation to join ${organization.name}`,
      text: `You have been invited to join ${organization.name} as a ${role}.`,
    });

    res.json({
      status: 'success',
      message: 'Member invited successfully',
      data: { organization },
    });
  } catch (error: any) {
    logger.error('Error inviting member:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to invite member',
    });
  }
};

// Remove member from organization
export const removeMember = async (req: Request, res: Response) => {
  try {
    const { organizationId, memberId } = req.params;
    const userId = req.user._id;

    const organization = await Organization.findById(organizationId);

    if (!organization) {
      return res.status(404).json({
        status: 'error',
        message: 'Organization not found',
      });
    }

    // Check permissions
    if (!organization.hasPermission(userId.toString(), 'remove_members')) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to remove members',
      });
    }

    // Cannot remove owner
    if (organization.owner.toString() === memberId) {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot remove organization owner',
      });
    }

    organization.removeMember(memberId);
    await organization.save();

    res.json({
      status: 'success',
      message: 'Member removed successfully',
    });
  } catch (error: any) {
    logger.error('Error removing member:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to remove member',
    });
  }
};

// Update member role
export const updateMemberRole = async (req: Request, res: Response) => {
  try {
    const { organizationId, memberId } = req.params;
    const { role, permissions, spendingLimit } = req.body;
    const userId = req.user._id;

    const organization = await Organization.findById(organizationId);

    if (!organization) {
      return res.status(404).json({
        status: 'error',
        message: 'Organization not found',
      });
    }

    // Check permissions
    if (!organization.hasPermission(userId.toString(), 'manage_roles')) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to manage roles',
      });
    }

    organization.updateMemberRole(memberId, role, permissions || [], spendingLimit);
    await organization.save();

    res.json({
      status: 'success',
      message: 'Member role updated successfully',
      data: { organization },
    });
  } catch (error: any) {
    logger.error('Error updating member role:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to update member role',
    });
  }
};

// Create budget approval request
export const createBudgetApproval = async (req: Request, res: Response) => {
  try {
    const { amount, description, projectId } = req.body;
    const userId = req.user._id;

    const approval = await BudgetApproval.create({
      amount,
      description,
      requestedBy: userId,
      project: projectId,
      status: 'pending',
    });

    res.status(201).json({
      status: 'success',
      data: { approval },
    });
  } catch (error) {
    logger.error('Error creating budget approval:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create budget approval request',
    });
  }
};

// Review budget approval
export const reviewBudgetApproval = async (req: Request, res: Response) => {
  try {
    const { approvalId } = req.params;
    const { status, rejectionReason } = req.body;
    const userId = req.user._id;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid status',
      });
    }

    const approval = await BudgetApproval.findById(approvalId);

    if (!approval) {
      return res.status(404).json({
        status: 'error',
        message: 'Budget approval not found',
      });
    }

    if (approval.status !== 'pending') {
      return res.status(400).json({
        status: 'error',
        message: 'Budget approval already reviewed',
      });
    }

    approval.status = status;
    approval.approvedBy = userId;
    approval.approvedAt = new Date();
    if (rejectionReason) {
      approval.rejectionReason = rejectionReason;
    }

    await approval.save();

    res.json({
      status: 'success',
      data: { approval },
    });
  } catch (error) {
    logger.error('Error reviewing budget approval:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to review budget approval',
    });
  }
};

// Get budget approvals
export const getBudgetApprovals = async (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    const userId = req.user._id;

    const query: any = {};
    if (status) query.status = status;

    // Get approvals where user is requester or approver
    query.$or = [{ requestedBy: userId }, { approvedBy: userId }];

    const approvals = await BudgetApproval.find(query)
      .populate('requestedBy', 'firstName lastName email')
      .populate('approvedBy', 'firstName lastName email')
      .populate('project', 'title')
      .sort({ createdAt: -1 });

    res.json({
      status: 'success',
      results: approvals.length,
      data: { approvals },
    });
  } catch (error) {
    logger.error('Error fetching budget approvals:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch budget approvals',
    });
  }
};

// Get user's organizations
export const getUserOrganizations = async (req: Request, res: Response) => {
  try {
    const userId = req.user._id;

    const organizations = await Organization.find({
      'members.user': userId,
    }).populate('owner', 'firstName lastName email');

    res.json({
      status: 'success',
      results: organizations.length,
      data: { organizations },
    });
  } catch (error) {
    logger.error('Error fetching user organizations:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch organizations',
    });
  }
};

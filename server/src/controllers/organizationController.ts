import { Request, Response } from 'express';
import { Organization } from '@/models/Organization';
import { User } from '@/models/User';
import { AuthRequest } from '@/types/auth';
import { createNotification } from './notificationController';

// Create organization
export const createOrganization = async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).user._id;
    const { name, description, logo, budget, settings } = req.body;

    const organization = await Organization.create({
      name,
      description,
      logo,
      owner: userId,
      members: [
        {
          user: userId,
          role: 'owner',
          permissions: ['all'],
          joinedAt: new Date(),
        },
      ],
      budget: budget || {
        total: 0,
        spent: 0,
        remaining: 0,
        currency: 'USD',
      },
      settings: settings || {
        requireApproval: true,
        maxProjectBudget: 0,
        allowedCategories: [],
      },
    });

    res.status(201).json({
      status: 'success',
      message: 'Organization created successfully',
      data: organization,
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to create organization',
      error: error.message,
    });
  }
};

// Get all organizations (user's organizations)
export const getOrganizations = async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).user._id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const organizations = await Organization.find({
      $or: [{ owner: userId }, { 'members.user': userId }],
      isActive: true,
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('owner', 'profile.firstName profile.lastName profile.avatar email')
      .populate('members.user', 'profile.firstName profile.lastName profile.avatar email');

    const total = await Organization.countDocuments({
      $or: [{ owner: userId }, { 'members.user': userId }],
      isActive: true,
    });

    res.status(200).json({
      status: 'success',
      data: organizations,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch organizations',
      error: error.message,
    });
  }
};

// Get organization by ID
export const getOrganizationById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as AuthRequest).user._id;

    const organization = await Organization.findById(id)
      .populate('owner', 'profile.firstName profile.lastName profile.avatar email')
      .populate('members.user', 'profile.firstName profile.lastName profile.avatar email role')
      .populate('projects', 'title status budget');

    if (!organization) {
      return res.status(404).json({
        status: 'error',
        message: 'Organization not found',
      });
    }

    // Check if user is a member
    const isMember =
      organization.owner.toString() === userId.toString() ||
      organization.members.some((m) => m.user._id.toString() === userId.toString());

    if (!isMember) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have access to this organization',
      });
    }

    res.status(200).json({
      status: 'success',
      data: organization,
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch organization',
      error: error.message,
    });
  }
};

// Update organization
export const updateOrganization = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as AuthRequest).user._id;
    const { name, description, logo, settings } = req.body;

    const organization = await Organization.findById(id);

    if (!organization) {
      return res.status(404).json({
        status: 'error',
        message: 'Organization not found',
      });
    }

    // Check if user is owner or admin
    const member = organization.members.find((m) => m.user.toString() === userId.toString());
    const canUpdate =
      organization.owner.toString() === userId.toString() ||
      (member && ['owner', 'admin'].includes(member.role));

    if (!canUpdate) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to update this organization',
      });
    }

    if (name) organization.name = name;
    if (description !== undefined) organization.description = description;
    if (logo !== undefined) organization.logo = logo;
    if (settings) organization.settings = { ...organization.settings, ...settings };

    await organization.save();

    res.status(200).json({
      status: 'success',
      message: 'Organization updated successfully',
      data: organization,
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to update organization',
      error: error.message,
    });
  }
};

// Delete organization
export const deleteOrganization = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as AuthRequest).user._id;

    const organization = await Organization.findById(id);

    if (!organization) {
      return res.status(404).json({
        status: 'error',
        message: 'Organization not found',
      });
    }

    // Only owner can delete
    if (organization.owner.toString() !== userId.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'Only the owner can delete this organization',
      });
    }

    organization.isActive = false;
    await organization.save();

    res.status(200).json({
      status: 'success',
      message: 'Organization deleted successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete organization',
      error: error.message,
    });
  }
};

// Add member to organization
export const addMember = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as AuthRequest).user._id;
    const { userEmail, role, permissions } = req.body;

    const organization = await Organization.findById(id);

    if (!organization) {
      return res.status(404).json({
        status: 'error',
        message: 'Organization not found',
      });
    }

    // Check if user can add members
    const member = organization.members.find((m) => m.user.toString() === userId.toString());
    const canAddMembers =
      organization.owner.toString() === userId.toString() ||
      (member && ['owner', 'admin'].includes(member.role));

    if (!canAddMembers) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to add members',
      });
    }

    // Find user by email
    const newUser = await User.findOne({ email: userEmail.toLowerCase() });

    if (!newUser) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found',
      });
    }

    // Check if user is already a member
    const existingMember = organization.members.find(
      (m) => m.user.toString() === newUser._id.toString()
    );

    if (existingMember) {
      return res.status(400).json({
        status: 'error',
        message: 'User is already a member of this organization',
      });
    }

    // Add member
    organization.members.push({
      user: newUser._id as any,
      role: role || 'member',
      permissions: permissions || [],
      joinedAt: new Date(),
    });

    await organization.save();

    // Create notification
    await createNotification({
      user: newUser._id.toString(),
      type: 'system',
      title: 'Added to Organization',
      message: `You have been added to ${organization.name}`,
      link: `/dashboard/organizations/${organization._id}`,
      priority: 'normal',
    });

    res.status(200).json({
      status: 'success',
      message: 'Member added successfully',
      data: organization,
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to add member',
      error: error.message,
    });
  }
};

// Remove member from organization
export const removeMember = async (req: Request, res: Response) => {
  try {
    const { id, userId: memberUserId } = req.params;
    const userId = (req as AuthRequest).user._id;

    const organization = await Organization.findById(id);

    if (!organization) {
      return res.status(404).json({
        status: 'error',
        message: 'Organization not found',
      });
    }

    // Check if user can remove members
    const member = organization.members.find((m) => m.user.toString() === userId.toString());
    const canRemoveMembers =
      organization.owner.toString() === userId.toString() ||
      (member && ['owner', 'admin'].includes(member.role));

    if (!canRemoveMembers) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to remove members',
      });
    }

    // Cannot remove owner
    if (organization.owner.toString() === memberUserId) {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot remove the organization owner',
      });
    }

    // Remove member
    organization.members = organization.members.filter(
      (m) => m.user.toString() !== memberUserId
    );

    await organization.save();

    // Create notification
    await createNotification({
      user: memberUserId,
      type: 'system',
      title: 'Removed from Organization',
      message: `You have been removed from ${organization.name}`,
      link: `/dashboard/organizations`,
      priority: 'normal',
    });

    res.status(200).json({
      status: 'success',
      message: 'Member removed successfully',
      data: organization,
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to remove member',
      error: error.message,
    });
  }
};

// Update organization budget
export const updateBudget = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as AuthRequest).user._id;
    const { total, spent } = req.body;

    const organization = await Organization.findById(id);

    if (!organization) {
      return res.status(404).json({
        status: 'error',
        message: 'Organization not found',
      });
    }

    // Check if user can update budget
    const member = organization.members.find((m) => m.user.toString() === userId.toString());
    const canUpdateBudget =
      organization.owner.toString() === userId.toString() ||
      (member && ['owner', 'admin'].includes(member.role));

    if (!canUpdateBudget) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to update budget',
      });
    }

    if (total !== undefined) organization.budget.total = total;
    if (spent !== undefined) organization.budget.spent = spent;

    await organization.save();

    res.status(200).json({
      status: 'success',
      message: 'Budget updated successfully',
      data: organization,
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to update budget',
      error: error.message,
    });
  }
};

// Get organization projects
export const getOrganizationProjects = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as AuthRequest).user._id;

    const organization = await Organization.findById(id).populate({
      path: 'projects',
      populate: [
        { path: 'client', select: 'profile.firstName profile.lastName profile.avatar' },
        { path: 'category', select: 'name' },
      ],
    });

    if (!organization) {
      return res.status(404).json({
        status: 'error',
        message: 'Organization not found',
      });
    }

    // Check if user is a member
    const isMember =
      organization.owner.toString() === userId.toString() ||
      organization.members.some((m) => m.user.toString() === userId.toString());

    if (!isMember) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have access to this organization',
      });
    }

    res.status(200).json({
      status: 'success',
      data: organization.projects,
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch organization projects',
      error: error.message,
    });
  }
};

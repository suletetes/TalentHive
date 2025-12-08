import { Request, Response } from 'express';
import { User } from '@/models/User';
import { ProfileSlugRedirect } from '@/models/ProfileSlugRedirect';
import {
  generateSlug,
  isSlugAvailable,
  validateSlugFormat,
  generateSlugSuggestions,
  sanitizeSlugInput,
} from '@/utils/slugUtils';

/**
 * Get user by slug (handles redirects)
 * GET /api/users/slug/:slug
 */
export const getUserBySlug = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const sanitizedSlug = sanitizeSlugInput(slug);

    // First, try to find user with this slug
    let user = await User.findOne({ profileSlug: sanitizedSlug })
      .select('-password -emailVerificationToken -passwordResetToken');

    // If not found, check if it's an old slug with a redirect
    if (!user) {
      const redirect = await ProfileSlugRedirect.findOne({ oldSlug: sanitizedSlug });
      
      if (redirect) {
        // Update redirect statistics
        await ProfileSlugRedirect.findByIdAndUpdate(redirect._id, {
          $inc: { redirectCount: 1 },
          lastRedirectedAt: new Date(),
        });

        // Find user with new slug
        user = await User.findOne({ profileSlug: redirect.newSlug })
          .select('-password -emailVerificationToken -passwordResetToken');

        if (user) {
          return res.json({
            success: true,
            data: user,
            redirected: true,
            newSlug: redirect.newSlug,
          });
        }
      }

      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      success: true,
      data: user,
      redirected: false,
    });
  } catch (error: any) {
    console.error('Get user by slug error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch user',
      error: error.message 
    });
  }
};

/**
 * Validate slug availability
 * POST /api/users/slug/validate
 */
export const validateSlug = async (req: Request, res: Response) => {
  try {
    const { slug } = req.body;
    const userId = req.user?._id;

    if (!slug) {
      return res.status(400).json({ message: 'Slug is required' });
    }

    const sanitizedSlug = sanitizeSlugInput(slug);

    // Validate format
    const formatValidation = validateSlugFormat(sanitizedSlug);
    if (!formatValidation.isValid) {
      return res.json({
        available: false,
        valid: false,
        error: formatValidation.error,
      });
    }

    // Check availability
    const available = await isSlugAvailable(sanitizedSlug, userId?.toString());

    res.json({
      available,
      valid: true,
      slug: sanitizedSlug,
    });
  } catch (error: any) {
    console.error('Validate slug error:', error);
    res.status(500).json({ 
      message: 'Failed to validate slug',
      error: error.message 
    });
  }
};

/**
 * Update user's profile slug
 * PATCH /api/users/profile/slug
 */
export const updateUserSlug = async (req: Request, res: Response) => {
  try {
    const { slug } = req.body;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!slug) {
      return res.status(400).json({ message: 'Slug is required' });
    }

    const sanitizedSlug = sanitizeSlugInput(slug);

    // Validate format
    const formatValidation = validateSlugFormat(sanitizedSlug);
    if (!formatValidation.isValid) {
      return res.status(400).json({ 
        message: formatValidation.error 
      });
    }

    // Check availability
    const available = await isSlugAvailable(sanitizedSlug, userId?.toString());
    if (!available) {
      return res.status(400).json({ 
        message: 'This slug is already taken',
        suggestions: await generateSlugSuggestions(sanitizedSlug),
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const oldSlug = user.profileSlug;

    // Update slug
    user.profileSlug = sanitizedSlug;

    // Add to slug history if there was an old slug
    if (oldSlug && oldSlug !== sanitizedSlug) {
      user.slugHistory.push({
        slug: oldSlug,
        changedAt: new Date(),
      } as any);

      // Create redirect from old slug to new slug
      await ProfileSlugRedirect.create({
        oldSlug,
        newSlug: sanitizedSlug,
        userId,
        createdAt: new Date(),
      });
    }

    await user.save();

    res.json({
      success: true,
      data: {
        slug: sanitizedSlug,
        profileUrl: `/${user.role}/${sanitizedSlug}`,
      },
    });
  } catch (error: any) {
    console.error('Update slug error:', error);
    res.status(500).json({ 
      message: 'Failed to update slug',
      error: error.message 
    });
  }
};

/**
 * Get slug suggestions
 * GET /api/users/slug/suggestions/:baseName
 */
export const getSlugSuggestions = async (req: Request, res: Response) => {
  try {
    const { baseName } = req.params;
    const count = parseInt(req.query.count as string) || 5;

    if (!baseName) {
      return res.status(400).json({ message: 'Base name is required' });
    }

    const baseSlug = generateSlug(baseName);
    const suggestions = await generateSlugSuggestions(baseSlug, count);

    res.json({
      success: true,
      data: suggestions,
    });
  } catch (error: any) {
    console.error('Get suggestions error:', error);
    res.status(500).json({ 
      message: 'Failed to generate suggestions',
      error: error.message 
    });
  }
};

/**
 * Search users by slug (autocomplete)
 * GET /api/users/slug/search
 */
export const searchBySlug = async (req: Request, res: Response) => {
  try {
    const { q, role, limit = 10 } = req.query;

    if (!q || typeof q !== 'string') {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const query: any = {
      profileSlug: { $regex: q, $options: 'i' },
      isActive: true,
    };

    if (role) {
      query.role = role;
    }

    const users = await User.find(query)
      .select('profileSlug profile.firstName profile.lastName role rating.average')
      .limit(parseInt(limit as string))
      .sort({ profileSlug: 1 });

    res.json({
      success: true,
      data: users,
    });
  } catch (error: any) {
    console.error('Search by slug error:', error);
    res.status(500).json({ 
      message: 'Failed to search users',
      error: error.message 
    });
  }
};

/**
 * Get slug change history
 * GET /api/users/:userId/slug-history
 */
export const getSlugHistory = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const requestingUserId = req.user?._id;
    const userRole = req.user?.role;

    // Only allow users to see their own history or admins to see any
    if (userId !== requestingUserId && userRole !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const user = await User.findById(userId)
      .select('profileSlug slugHistory');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Also get redirect records
    const redirects = await ProfileSlugRedirect.find({ userId })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        currentSlug: user.profileSlug,
        history: user.slugHistory,
        redirects,
      },
    });
  } catch (error: any) {
    console.error('Get slug history error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch slug history',
      error: error.message 
    });
  }
};

import { Router } from 'express';
import {
  getProfile,
  updateProfile,
  updateProfileValidation,
  getFreelancers,
  getFreelancerById,
  addSkill,
  removeSkill,
  updateAvailability,
  addPortfolioItem,
  updatePortfolioItem,
  deletePortfolioItem,
  changePassword,
  changePasswordValidation,
} from '@/controllers/userController';
import {
  uploadAvatar,
  uploadPortfolioImages,
  deletePortfolioImage,
} from '@/controllers/uploadController';
import {
  getUserBySlug,
  validateSlug,
  updateUserSlug,
  getSlugSuggestions,
  searchBySlug,
  getSlugHistory,
} from '@/controllers/slugController';
import {
  getFreelancerProfile,
  getClientProfile,
  getUserStats,
  trackProfileView,
  getProfileViewAnalytics,
  getProfileViewers,
} from '@/controllers/profileController';
import { authenticate, authorize } from '@/middleware/auth';
import { upload } from '@/utils/upload';
import { uploadRateLimiter } from '@/middleware/rateLimiter';

const router = Router();

// Profile management (requires authentication)
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfileValidation, updateProfile);
router.put('/change-password', authenticate, changePasswordValidation, changePassword);

// Public freelancer discovery
router.get('/freelancers', getFreelancers);
router.get('/freelancer/:id', getFreelancerById);

// File uploads (requires authentication and rate limiting)
router.post('/upload-avatar', authenticate, uploadRateLimiter, upload.single('avatar'), uploadAvatar);
router.post('/upload-portfolio', authenticate, uploadRateLimiter, upload.array('images', 10), uploadPortfolioImages);
router.delete('/delete-portfolio-image', authenticate, deletePortfolioImage);

// Freelancer-specific routes
router.post('/skills', authenticate, authorize('freelancer'), addSkill);
router.delete('/skills/:skill', authenticate, authorize('freelancer'), removeSkill);
router.put('/availability', authenticate, authorize('freelancer'), updateAvailability);

// Portfolio management
router.post('/portfolio', authenticate, authorize('freelancer'), addPortfolioItem);
router.put('/portfolio/:itemId', authenticate, authorize('freelancer'), updatePortfolioItem);
router.delete('/portfolio/:itemId', authenticate, authorize('freelancer'), deletePortfolioItem);

// Profile slug routes (must be before /:id routes to avoid conflicts)
router.get('/slug/search', searchBySlug); // Public search
router.get('/slug/suggestions/:baseName', getSlugSuggestions); // Public suggestions
router.get('/slug/:slug', getUserBySlug); // Public - get user by slug
router.post('/slug/validate', authenticate, validateSlug); // Validate slug availability
router.patch('/profile/slug', authenticate, updateUserSlug); // Update user's slug
router.get('/:userId/slug-history', authenticate, getSlugHistory); // Get slug history

// Enhanced profile routes
router.get('/freelancers/:slugOrId/profile', getFreelancerProfile); // Public freelancer profile
router.get('/clients/:slugOrId/profile', getClientProfile); // Public client profile
router.get('/:userId/stats', authenticate, getUserStats); // Get user statistics

// Profile view tracking
router.post('/:userId/profile-view', trackProfileView); // Track profile view (optional auth)
router.get('/:userId/profile-views', authenticate, getProfileViewAnalytics); // Get view analytics
router.get('/:userId/profile-viewers', authenticate, getProfileViewers); // Get viewers list

export default router;
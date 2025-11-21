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
router.get('/freelancers/:id', getFreelancerById);

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

export default router;
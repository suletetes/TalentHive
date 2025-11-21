import { Request, Response, NextFunction } from 'express';
import { User } from '@/models/User';
import { AppError, catchAsync } from '@/middleware/errorHandler';
import { uploadService } from '@/services/upload.service';
import { deleteCache } from '@/config/redis';

interface AuthRequest extends Request {
  user?: any;
}

export const uploadAvatar = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.file) {
    return next(new AppError('Please provide an image file', 400));
  }

  const userId = req.user._id;
  
  try {
    // Upload to Cloudinary using upload service
    const imageUrl = await uploadService.uploadAvatar(req.file.buffer, userId);

    // Update user avatar
    const user = await User.findByIdAndUpdate(
      userId,
      { 'profile.avatar': imageUrl },
      { new: true }
    );

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    // Clear user cache
    await deleteCache(`user:${userId}`);

    res.json({
      status: 'success',
      message: 'Avatar uploaded successfully',
      data: {
        avatar: imageUrl,
      },
    });
  } catch (error: any) {
    next(new AppError(error.message || 'Failed to upload avatar', 500));
  }
});

export const uploadPortfolioImages = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
    return next(new AppError('Please provide image files', 400));
  }

  const userId = req.user._id;
  
  if (req.user.role !== 'freelancer') {
    return next(new AppError('Only freelancers can upload portfolio images', 403));
  }

  try {
    const buffers = (req.files as Express.Multer.File[]).map(file => file.buffer);
    const imageUrls = await uploadService.uploadMultiple(
      buffers,
      'talenthive/portfolio',
      {
        transformation: [
          { width: 1200, height: 800, crop: 'limit' },
          { quality: 'auto:good' },
          { fetch_format: 'auto' },
        ],
      }
    );

    res.json({
      status: 'success',
      message: 'Portfolio images uploaded successfully',
      data: {
        images: imageUrls,
      },
    });
  } catch (error: any) {
    next(new AppError(error.message || 'Failed to upload portfolio images', 500));
  }
});

export const deletePortfolioImage = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { imageUrl } = req.body;
  const userId = req.user._id;

  if (req.user.role !== 'freelancer') {
    return next(new AppError('Only freelancers can delete portfolio images', 403));
  }

  if (!imageUrl) {
    return next(new AppError('Image URL is required', 400));
  }

  try {
    // Delete from Cloudinary using upload service
    await uploadService.deleteImage(imageUrl);

    res.json({
      status: 'success',
      message: 'Portfolio image deleted successfully',
    });
  } catch (error: any) {
    next(new AppError(error.message || 'Failed to delete portfolio image', 500));
  }
});
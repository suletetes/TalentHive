import { Request, Response, NextFunction } from 'express';
import { uploadToCloudinary, deleteFromCloudinary, formatFileSize } from '../utils/fileUpload';
import { AppError } from '../middleware/errorHandler';

/**
 * Upload single file
 */
export const uploadFile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.file) {
      return next(new AppError('No file uploaded', 400));
    }

    const folder = (req.body.folder as string) || 'talenthive/general';

    // Upload to Cloudinary
    const result = await uploadToCloudinary(req.file, folder);

    res.status(200).json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        url: result.url,
        publicId: result.publicId,
        format: result.format,
        size: result.size,
        sizeFormatted: formatFileSize(result.size),
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
      },
    });
  } catch (error: any) {
    console.error('Upload file error:', error);
    next(new AppError(error.message || 'Failed to upload file', 500));
  }
};

/**
 * Upload multiple files
 */
export const uploadMultipleFiles = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return next(new AppError('No files uploaded', 400));
    }

    const folder = (req.body.folder as string) || 'talenthive/general';

    // Upload all files to Cloudinary
    const uploadPromises = req.files.map((file) => uploadToCloudinary(file, folder));
    const results = await Promise.all(uploadPromises);

    const uploadedFiles = results.map((result, index) => ({
      url: result.url,
      publicId: result.publicId,
      format: result.format,
      size: result.size,
      sizeFormatted: formatFileSize(result.size),
      originalName: req.files![index].originalname,
      mimetype: req.files![index].mimetype,
    }));

    res.status(200).json({
      success: true,
      message: `${uploadedFiles.length} files uploaded successfully`,
      data: uploadedFiles,
    });
  } catch (error: any) {
    console.error('Upload multiple files error:', error);
    next(new AppError(error.message || 'Failed to upload files', 500));
  }
};

/**
 * Delete file
 */
export const deleteFile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { publicId } = req.body;

    if (!publicId) {
      return next(new AppError('Public ID is required', 400));
    }

    await deleteFromCloudinary(publicId);

    res.status(200).json({
      success: true,
      message: 'File deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete file error:', error);
    next(new AppError(error.message || 'Failed to delete file', 500));
  }
};

/**
 * Upload user avatar
 */
export const uploadAvatar = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.file) {
      return next(new AppError('No file uploaded', 400));
    }

    const userId = (req as any).user?._id;
    if (!userId) {
      return next(new AppError('User not authenticated', 401));
    }

    const folder = 'talenthive/avatars';

    // Upload to Cloudinary
    const result = await uploadToCloudinary(req.file, folder);

    // Update user profile with new avatar URL
    const { User } = await import('@/models/User');
    const user = await User.findByIdAndUpdate(
      userId,
      { 'profile.avatar': result.url },
      { new: true }
    ).select('profile.avatar');

    console.log('  [UPLOAD] Avatar updated in database for user:', userId);

    res.status(200).json({
      success: true,
      message: 'Avatar uploaded successfully',
      data: {
        url: result.url,
        publicId: result.publicId,
        avatar: result.url, // Add this for backward compatibility
      },
    });
  } catch (error: any) {
    console.error('Upload avatar error:', error);
    next(new AppError(error.message || 'Failed to upload avatar', 500));
  }
};

/**
 * Upload portfolio images
 */
export const uploadPortfolioImages = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return next(new AppError('No files uploaded', 400));
    }

    const folder = 'talenthive/portfolio';

    // Upload all files to Cloudinary
    const uploadPromises = req.files.map((file) => uploadToCloudinary(file, folder));
    const results = await Promise.all(uploadPromises);

    const uploadedFiles = results.map((result, index) => ({
      url: result.url,
      publicId: result.publicId,
      originalName: req.files![index].originalname,
    }));

    res.status(200).json({
      success: true,
      message: `${uploadedFiles.length} portfolio images uploaded successfully`,
      data: uploadedFiles,
    });
  } catch (error: any) {
    console.error('Upload portfolio images error:', error);
    next(new AppError(error.message || 'Failed to upload portfolio images', 500));
  }
};

/**
 * Delete portfolio image
 */
export const deletePortfolioImage = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { publicId } = req.body;

    if (!publicId) {
      return next(new AppError('Public ID is required', 400));
    }

    await deleteFromCloudinary(publicId);

    res.status(200).json({
      success: true,
      message: 'Portfolio image deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete portfolio image error:', error);
    next(new AppError(error.message || 'Failed to delete portfolio image', 500));
  }
};

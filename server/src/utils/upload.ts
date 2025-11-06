import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { Request } from 'express';
import { AppError } from '@/middleware/errorHandler';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Multer configuration for memory storage
const storage = multer.memoryStorage();

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Check file type
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new AppError('Only image files are allowed', 400));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

export const uploadToCloudinary = async (
  buffer: Buffer,
  folder: string,
  publicId?: string
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const uploadOptions: any = {
      folder,
      resource_type: 'auto',
      quality: 'auto:good',
      fetch_format: 'auto',
    };

    if (publicId) {
      uploadOptions.public_id = publicId;
      uploadOptions.overwrite = true;
    }

    cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          reject(new AppError('Failed to upload image', 500));
        } else {
          resolve(result!.secure_url);
        }
      }
    ).end(buffer);
  });
};

export const deleteFromCloudinary = async (publicId: string): Promise<void> => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    // Log error but don't throw - file might already be deleted
    console.error('Failed to delete image from Cloudinary:', error);
  }
};

export const extractPublicId = (url: string): string => {
  const parts = url.split('/');
  const filename = parts[parts.length - 1];
  return filename.split('.')[0];
};
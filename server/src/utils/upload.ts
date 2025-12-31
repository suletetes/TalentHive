import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { Request } from 'express';
import { AppError } from '@/middleware/errorHandler';

// Configure Cloudinary with validation
const hasCloudinaryConfig = process.env.CLOUDINARY_CLOUD_NAME && 
                           process.env.CLOUDINARY_API_KEY && 
                           process.env.CLOUDINARY_API_SECRET;

if (!hasCloudinaryConfig) {
  console.warn('⚠️ Cloudinary not configured - file upload features will be disabled');
  console.warn('To enable file uploads, set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET environment variables');
} else {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

// Multer configuration for memory storage
const storage = multer.memoryStorage();

// Allowed file types and their MIME types
const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/gif',
  'image/webp'
];

const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain'
];

const ALL_ALLOWED_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOCUMENT_TYPES];

// Maximum file sizes (in bytes)
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024; // 10MB

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Check if file type is allowed
  if (!ALL_ALLOWED_TYPES.includes(file.mimetype)) {
    return cb(new AppError(`File type ${file.mimetype} is not allowed. Allowed types: ${ALL_ALLOWED_TYPES.join(', ')}`, 400));
  }

  // Check file size based on type
  const isImage = ALLOWED_IMAGE_TYPES.includes(file.mimetype);
  const maxSize = isImage ? MAX_IMAGE_SIZE : MAX_DOCUMENT_SIZE;
  
  // Note: file.size is not available in fileFilter, size check happens in limits
  cb(null, true);
};

// Create different upload configurations for different use cases
export const uploadImage = multer({
  storage,
  fileFilter: (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      return cb(new AppError(`Only image files are allowed. Allowed types: ${ALLOWED_IMAGE_TYPES.join(', ')}`, 400));
    }
    cb(null, true);
  },
  limits: {
    fileSize: MAX_IMAGE_SIZE,
    files: 1,
  },
});

export const uploadDocument = multer({
  storage,
  fileFilter: (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (!ALLOWED_DOCUMENT_TYPES.includes(file.mimetype)) {
      return cb(new AppError(`Only document files are allowed. Allowed types: ${ALLOWED_DOCUMENT_TYPES.join(', ')}`, 400));
    }
    cb(null, true);
  },
  limits: {
    fileSize: MAX_DOCUMENT_SIZE,
    files: 1,
  },
});

// General upload (backward compatibility)
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_DOCUMENT_SIZE, // Use larger limit for general uploads
    files: 1,
  },
});

export const uploadToCloudinary = async (
  buffer: Buffer,
  folder: string,
  publicId?: string,
  fileType?: 'image' | 'document'
): Promise<string> => {
  // Check if Cloudinary is configured
  if (!hasCloudinaryConfig) {
    throw new AppError('File upload is not configured. Please contact support.', 503);
  }

  return new Promise((resolve, reject) => {
    // Additional security: scan buffer for malicious content
    if (buffer.length === 0) {
      return reject(new AppError('Empty file not allowed', 400));
    }

    // Check for common malicious file signatures
    const fileSignature = buffer.toString('hex', 0, 4);
    const maliciousSignatures = [
      '4d5a9000', // PE executable
      '504b0304', // ZIP (could contain malicious files)
    ];
    
    if (maliciousSignatures.includes(fileSignature)) {
      return reject(new AppError('File type not allowed for security reasons', 400));
    }

    const uploadOptions: any = {
      folder,
      resource_type: fileType === 'document' ? 'raw' : 'auto',
      quality: fileType === 'image' ? 'auto:good' : undefined,
      fetch_format: fileType === 'image' ? 'auto' : undefined,
      // Add security transformations for images
      transformation: fileType === 'image' ? [
        { quality: 'auto:good' },
        { fetch_format: 'auto' }
      ] : undefined,
    };

    if (publicId) {
      uploadOptions.public_id = publicId;
      uploadOptions.overwrite = true;
    }

    cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          reject(new AppError('Failed to upload file', 500));
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
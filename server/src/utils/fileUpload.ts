import multer from 'multer';
import path from 'path';
import { Request } from 'express';
import cloudinary from '../config/cloudinary';
import { Readable } from 'stream';

// File size limits (in bytes)
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Allowed file types
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
];
const ALLOWED_ARCHIVE_TYPES = ['application/zip', 'application/x-rar-compressed'];

const ALL_ALLOWED_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOCUMENT_TYPES, ...ALLOWED_ARCHIVE_TYPES];

// Multer configuration for memory storage
const storage = multer.memoryStorage();

// File filter
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (ALL_ALLOWED_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} is not allowed`));
  }
};

// Multer upload configuration
export const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter,
});

/**
 * Upload file to Cloudinary
 */
export const uploadToCloudinary = async (
  file: Express.Multer.File,
  folder: string = 'talenthive'
): Promise<{ url: string; publicId: string; format: string; size: number }> => {
  return new Promise((resolve, reject) => {
    console.log(`[CLOUDINARY] Starting upload for ${file.originalname} to folder ${folder}`);
    
    // Set a timeout for the upload
    const timeoutId = setTimeout(() => {
      console.error(`[CLOUDINARY] Upload timeout for ${file.originalname}`);
      reject(new Error(`Upload timeout for ${file.originalname} after 25 seconds`));
    }, 25000); // 25 second timeout

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'auto',
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt', 'zip'],
        timeout: 20000, // 20 second Cloudinary timeout
      },
      (error, result) => {
        clearTimeout(timeoutId); // Clear our timeout
        
        if (error) {
          console.error(`[CLOUDINARY] Upload error for ${file.originalname}:`, error);
          reject(error);
        } else if (result) {
          console.log(`[CLOUDINARY] Upload success for ${file.originalname}: ${result.secure_url}`);
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            format: result.format,
            size: result.bytes,
          });
        } else {
          console.error(`[CLOUDINARY] Upload failed for ${file.originalname}: No result returned`);
          reject(new Error('Upload failed - no result returned'));
        }
      }
    );

    // Convert buffer to stream and pipe to Cloudinary
    try {
      const bufferStream = new Readable();
      bufferStream.push(file.buffer);
      bufferStream.push(null);
      bufferStream.pipe(uploadStream);
      console.log(`[CLOUDINARY] Stream created and piped for ${file.originalname}`);
    } catch (streamError) {
      clearTimeout(timeoutId);
      console.error(`[CLOUDINARY] Stream error for ${file.originalname}:`, streamError);
      reject(streamError);
    }
  });
};

/**
 * Upload file to local storage (fallback)
 */
export const uploadToLocal = async (
  file: Express.Multer.File,
  folder: string = 'uploads'
): Promise<{ url: string; publicId: string; format: string; size: number }> => {
  const fs = await import('fs');
  const path = await import('path');
  
  // Create uploads directory if it doesn't exist
  const uploadDir = path.join(process.cwd(), 'uploads', folder);
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  
  // Generate unique filename
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const extension = path.extname(file.originalname);
  const filename = `${timestamp}_${randomString}${extension}`;
  const filepath = path.join(uploadDir, filename);
  
  // Write file
  fs.writeFileSync(filepath, file.buffer);
  
  // Return URL (assuming server serves static files from /uploads)
  const url = `${process.env.SERVER_URL || 'http://localhost:5000'}/uploads/${folder}/${filename}`;
  
  return {
    url,
    publicId: filename,
    format: extension.substring(1),
    size: file.size,
  };
};
export const deleteFromCloudinary = async (publicId: string): Promise<void> => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Error deleting file from Cloudinary:', error);
    throw error;
  }
};

/**
 * Validate file size
 */
export const validateFileSize = (size: number): boolean => {
  return size <= MAX_FILE_SIZE;
};

/**
 * Validate file type
 */
export const validateFileType = (mimetype: string): boolean => {
  return ALL_ALLOWED_TYPES.includes(mimetype);
};

/**
 * Get file extension from mimetype
 */
export const getFileExtension = (mimetype: string): string => {
  const mimeToExt: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'application/pdf': 'pdf',
    'application/msword': 'doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'application/vnd.ms-excel': 'xls',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
    'text/plain': 'txt',
    'application/zip': 'zip',
    'application/x-rar-compressed': 'rar',
  };
  return mimeToExt[mimetype] || 'bin';
};

/**
 * Format file size for display
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

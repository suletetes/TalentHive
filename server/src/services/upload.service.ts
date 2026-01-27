import { v2 as cloudinary } from 'cloudinary';
import { logger } from '@/utils/logger';
import streamifier from 'streamifier';

// Configure Cloudinary
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  logger.info('Cloudinary configured successfully');
} else {
  logger.warn('Cloudinary credentials not configured. Upload functionality will be disabled.');
}

interface UploadOptions {
  folder?: string;
  transformation?: any;
  format?: string;
  quality?: string | number;
}

class UploadService {
  private isConfigured: boolean;

  constructor() {
    this.isConfigured = !!(
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
    );
  }

  /**
   * Upload image from buffer
   */
  async uploadImage(
    buffer: Buffer,
    folder: string = 'talenthive',
    options: UploadOptions = {}
  ): Promise<string> {
    if (!this.isConfigured) {
      throw new Error('Cloudinary is not configured');
    }

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'image',
          transformation: options.transformation || [
            { quality: options.quality || 'auto' },
            { fetch_format: 'auto' },
          ],
          format: options.format,
        },
        (error, result) => {
          if (error) {
            logger.error('Cloudinary upload error:', error);
            reject(new Error(`Failed to upload image: ${error.message}`));
          } else if (result) {
            logger.info(`Image uploaded successfully: ${result.secure_url}`);
            resolve(result.secure_url);
          } else {
            reject(new Error('Upload failed: No result returned'));
          }
        }
      );

      streamifier.createReadStream(buffer).pipe(uploadStream);
    });
  }

  /**
   * Upload multiple images
   */
  async uploadMultiple(
    buffers: Buffer[],
    folder: string = 'talenthive',
    options: UploadOptions = {}
  ): Promise<string[]> {
    if (!this.isConfigured) {
      throw new Error('Cloudinary is not configured');
    }

    const uploadPromises = buffers.map(buffer => 
      this.uploadImage(buffer, folder, options)
    );

    return Promise.all(uploadPromises);
  }

  /**
   * Upload avatar with specific transformations
   */
  async uploadAvatar(buffer: Buffer, userId: string): Promise<string> {
    return this.uploadImage(buffer, 'talenthive/avatars', {
      transformation: [
        { width: 400, height: 400, crop: 'fill', gravity: 'face' },
        { quality: 'auto' },
        { fetch_format: 'auto' },
      ],
    });
  }

  /**
   * Upload portfolio image with optimizations
   */
  async uploadPortfolioImage(buffer: Buffer, userId: string): Promise<string> {
    return this.uploadImage(buffer, 'talenthive/portfolio', {
      transformation: [
        { width: 1200, height: 800, crop: 'limit' },
        { quality: 'auto:good' },
        { fetch_format: 'auto' },
      ],
    });
  }

  /**
   * Upload project attachment
   */
  async uploadProjectAttachment(buffer: Buffer, projectId: string): Promise<string> {
    return this.uploadImage(buffer, 'talenthive/projects', {
      transformation: [
        { width: 1600, crop: 'limit' },
        { quality: 'auto' },
        { fetch_format: 'auto' },
      ],
    });
  }

  /**
   * Delete image by URL
   */
  async deleteImage(imageUrl: string): Promise<void> {
    if (!this.isConfigured) {
      throw new Error('Cloudinary is not configured');
    }

    try {
      // Extract public ID from URL
      const publicId = this.extractPublicId(imageUrl);
      
      if (!publicId) {
        throw new Error('Invalid image URL');
      }

      await cloudinary.uploader.destroy(publicId);
      logger.info(`Image deleted successfully: ${publicId}`);
    } catch (error: any) {
      logger.error('Cloudinary delete error:', error);
      throw new Error(`Failed to delete image: ${error.message}`);
    }
  }

  /**
   * Delete multiple images
   */
  async deleteMultiple(imageUrls: string[]): Promise<void> {
    if (!this.isConfigured) {
      throw new Error('Cloudinary is not configured');
    }

    const deletePromises = imageUrls.map(url => this.deleteImage(url));
    await Promise.all(deletePromises);
  }

  /**
   * Extract public ID from Cloudinary URL
   */
  private extractPublicId(url: string): string | null {
    try {
      // Cloudinary URL format: https://res.cloudinary.com/{cloud_name}/image/upload/{transformations}/{public_id}.{format}
      const matches = url.match(/\/upload\/(?:v\d+\/)?(.+)\.\w+$/);
      return matches ? matches[1] : null;
    } catch (error) {
      logger.error('Error extracting public ID:', error);
      return null;
    }
  }

  /**
   * Generate transformation URL
   */
  transformImage(url: string, transformations: any): string {
    if (!this.isConfigured) {
      return url;
    }

    try {
      const publicId = this.extractPublicId(url);
      if (!publicId) {
        return url;
      }

      return cloudinary.url(publicId, {
        transformation: transformations,
        secure: true,
      });
    } catch (error) {
      logger.error('Error transforming image:', error);
      return url;
    }
  }

  /**
   * Compress image before upload
   */
  async compressAndUpload(
    buffer: Buffer,
    folder: string = 'talenthive',
    maxSizeKB: number = 500
  ): Promise<string> {
    // Check if image is too large
    const sizeKB = buffer.length / 1024;
    
    if (sizeKB > maxSizeKB) {
      // Upload with aggressive compression
      return this.uploadImage(buffer, folder, {
        quality: 'auto:low',
        transformation: [
          { quality: 'auto:low' },
          { fetch_format: 'auto' },
        ],
      });
    }

    // Upload with normal compression
    return this.uploadImage(buffer, folder);
  }
}

export const uploadService = new UploadService();

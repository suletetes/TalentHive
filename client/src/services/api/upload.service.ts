import { apiCore } from './core';

export interface UploadResponse {
  url: string;
  publicId: string;
  format: string;
  size: number;
}

export class UploadService {
  private basePath = '/upload';

  async uploadFile(
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<{ data: UploadResponse }> {
    const formData = new FormData();
    formData.append('file', file);

    const config = onProgress
      ? {
          onUploadProgress: (progressEvent: any) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            onProgress(percentCompleted);
          },
        }
      : undefined;

    return apiCore
      .getAxiosInstance()
      .post<{ data: UploadResponse }>(this.basePath, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        ...config,
      })
      .then((response) => response.data);
  }

  async uploadMultipleFiles(
    files: File[],
    onProgress?: (progress: number) => void
  ): Promise<{ data: UploadResponse[] }> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });

    const config = onProgress
      ? {
          onUploadProgress: (progressEvent: any) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            onProgress(percentCompleted);
          },
        }
      : undefined;

    return apiCore
      .getAxiosInstance()
      .post<{ data: UploadResponse[] }>(`${this.basePath}/multiple`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        ...config,
      })
      .then((response) => response.data);
  }

  async deleteFile(publicId: string): Promise<{ message: string }> {
    return apiCore.delete<{ message: string }>(`${this.basePath}/${publicId}`);
  }

  validateFile(file: File, options?: { maxSize?: number; allowedTypes?: string[] }): boolean {
    const maxSize = options?.maxSize || 10 * 1024 * 1024; // 10MB default
    const allowedTypes = options?.allowedTypes || [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    if (file.size > maxSize) {
      throw new Error(`File size exceeds ${maxSize / (1024 * 1024)}MB limit`);
    }

    if (!allowedTypes.includes(file.type)) {
      throw new Error(`File type ${file.type} is not allowed`);
    }

    return true;
  }
}

export const uploadService = new UploadService();

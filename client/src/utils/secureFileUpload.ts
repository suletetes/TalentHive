// Secure file upload utilities with comprehensive validation
import { ContentSanitizer } from './contentSanitization';
import { SecurityLogger, SecurityEventType } from '@/config/security';
import { toast } from 'react-hot-toast';

export interface FileUploadOptions {
  maxSize?: number; // in bytes
  allowedTypes?: string[];
  maxFiles?: number;
  validateContent?: boolean;
  sanitizeFilename?: boolean;
}

export interface FileValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  sanitizedFile?: File;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
  file: File;
}

export class SecureFileUpload {
  private static readonly DEFAULT_OPTIONS: Required<FileUploadOptions> = {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ],
    maxFiles: 5,
    validateContent: true,
    sanitizeFilename: true,
  };

  // Validate a single file
  static validateFile(file: File, options: FileUploadOptions = {}): FileValidationResult {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic file validation
    const basicValidation = ContentSanitizer.validateFileUpload(file);
    if (!basicValidation.isValid) {
      errors.push(basicValidation.error!);
    }

    // Size validation
    if (file.size > opts.maxSize) {
      errors.push(`File size (${this.formatFileSize(file.size)}) exceeds maximum allowed size (${this.formatFileSize(opts.maxSize)})`);
      SecurityLogger.logEvent(SecurityEventType.FILE_UPLOAD_REJECTED, {
        reason: 'size_exceeded',
        fileSize: file.size,
        maxSize: opts.maxSize,
        fileName: file.name,
      });
    }

    // Type validation
    if (!opts.allowedTypes.includes(file.type)) {
      errors.push(`File type "${file.type}" is not allowed`);
      SecurityLogger.logEvent(SecurityEventType.FILE_UPLOAD_REJECTED, {
        reason: 'type_not_allowed',
        fileType: file.type,
        allowedTypes: opts.allowedTypes,
        fileName: file.name,
      });
    }

    // Filename validation
    const filenameValidation = this.validateFilename(file.name);
    if (!filenameValidation.isValid) {
      errors.push(...filenameValidation.errors);
    }
    warnings.push(...filenameValidation.warnings);

    // Content validation (for text files)
    if (opts.validateContent && this.isTextFile(file)) {
      this.validateTextFileContent(file).then(contentValidation => {
        if (!contentValidation.isValid) {
          warnings.push(...contentValidation.warnings);
        }
      });
    }

    // Create sanitized file if needed
    let sanitizedFile = file;
    if (opts.sanitizeFilename && filenameValidation.sanitizedName) {
      sanitizedFile = new File([file], filenameValidation.sanitizedName, {
        type: file.type,
        lastModified: file.lastModified,
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      sanitizedFile: sanitizedFile !== file ? sanitizedFile : undefined,
    };
  }

  // Validate multiple files
  static validateFiles(files: FileList | File[], options: FileUploadOptions = {}): {
    isValid: boolean;
    results: FileValidationResult[];
    globalErrors: string[];
  } {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };
    const fileArray = Array.from(files);
    const globalErrors: string[] = [];

    // Check file count
    if (fileArray.length > opts.maxFiles) {
      globalErrors.push(`Too many files selected. Maximum allowed: ${opts.maxFiles}`);
    }

    // Validate each file
    const results = fileArray.map(file => this.validateFile(file, options));

    // Check total size
    const totalSize = fileArray.reduce((sum, file) => sum + file.size, 0);
    const maxTotalSize = opts.maxSize * opts.maxFiles;
    if (totalSize > maxTotalSize) {
      globalErrors.push(`Total file size (${this.formatFileSize(totalSize)}) exceeds maximum allowed (${this.formatFileSize(maxTotalSize)})`);
    }

    return {
      isValid: globalErrors.length === 0 && results.every(r => r.isValid),
      results,
      globalErrors,
    };
  }

  // Validate filename
  private static validateFilename(filename: string): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    sanitizedName?: string;
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for dangerous characters
    const dangerousChars = /[<>:"/\\|?*\x00-\x1f]/;
    if (dangerousChars.test(filename)) {
      errors.push('Filename contains invalid characters');
    }

    // Check for suspicious patterns
    const suspiciousPatterns = [
      /\.exe$/i,
      /\.bat$/i,
      /\.cmd$/i,
      /\.scr$/i,
      /\.vbs$/i,
      /\.js$/i,
      /\.jar$/i,
      /\.com$/i,
      /\.pif$/i,
    ];

    if (suspiciousPatterns.some(pattern => pattern.test(filename))) {
      errors.push('File extension is not allowed for security reasons');
      SecurityLogger.logEvent(SecurityEventType.FILE_UPLOAD_REJECTED, {
        reason: 'suspicious_extension',
        fileName: filename,
      });
    }

    // Check for double extensions
    const doubleExtension = /\.[a-zA-Z0-9]+\.[a-zA-Z0-9]+$/;
    if (doubleExtension.test(filename)) {
      warnings.push('File has multiple extensions, which may be suspicious');
    }

    // Check filename length
    if (filename.length > 255) {
      errors.push('Filename is too long (maximum 255 characters)');
    }

    // Create sanitized filename
    let sanitizedName = filename;
    if (dangerousChars.test(filename)) {
      sanitizedName = filename.replace(dangerousChars, '_');
      warnings.push('Filename was sanitized to remove invalid characters');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      sanitizedName: sanitizedName !== filename ? sanitizedName : undefined,
    };
  }

  // Validate text file content
  private static async validateTextFileContent(file: File): Promise<{
    isValid: boolean;
    warnings: string[];
  }> {
    const warnings: string[] = [];

    try {
      const content = await this.readFileAsText(file);
      
      // Check for suspicious content
      ContentSanitizer.logSuspiciousContent(content, `file_upload:${file.name}`);

      // Check for binary content in text files
      const binaryPattern = /[\x00-\x08\x0E-\x1F\x7F]/;
      if (binaryPattern.test(content)) {
        warnings.push('File appears to contain binary data despite being a text file');
      }

      // Check for extremely long lines (potential attack)
      const lines = content.split('\n');
      const maxLineLength = 10000;
      if (lines.some(line => line.length > maxLineLength)) {
        warnings.push('File contains extremely long lines which may be suspicious');
      }

    } catch (error) {
      warnings.push('Could not validate file content');
    }

    return {
      isValid: true, // Content validation only produces warnings
      warnings,
    };
  }

  // Check if file is a text file
  private static isTextFile(file: File): boolean {
    const textTypes = [
      'text/plain',
      'text/csv',
      'text/html',
      'text/css',
      'text/javascript',
      'application/json',
      'application/xml',
    ];
    return textTypes.includes(file.type);
  }

  // Read file as text
  private static readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
  }

  // Format file size for display
  private static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Upload files with progress tracking
  static async uploadFiles(
    files: File[],
    uploadUrl: string,
    options: {
      onProgress?: (progress: UploadProgress) => void;
      onComplete?: (file: File, response: any) => void;
      onError?: (file: File, error: any) => void;
      headers?: Record<string, string>;
    } = {}
  ): Promise<{
    successful: Array<{ file: File; response: any }>;
    failed: Array<{ file: File; error: any }>;
  }> {
    const successful: Array<{ file: File; response: any }> = [];
    const failed: Array<{ file: File; error: any }> = [];

    for (const file of files) {
      try {
        // Validate file before upload
        const validation = this.validateFile(file);
        if (!validation.isValid) {
          const error = new Error(validation.errors.join(', '));
          failed.push({ file, error });
          options.onError?.(file, error);
          continue;
        }

        // Use sanitized file if available
        const fileToUpload = validation.sanitizedFile || file;

        // Create form data
        const formData = new FormData();
        formData.append('file', fileToUpload);

        // Upload with progress tracking
        const response = await this.uploadSingleFile(
          formData,
          uploadUrl,
          {
            onProgress: (loaded, total) => {
              options.onProgress?.({
                loaded,
                total,
                percentage: Math.round((loaded / total) * 100),
                file: fileToUpload,
              });
            },
            headers: options.headers,
          }
        );

        successful.push({ file: fileToUpload, response });
        options.onComplete?.(fileToUpload, response);

      } catch (error) {
        failed.push({ file, error });
        options.onError?.(file, error);
        
        SecurityLogger.logEvent(SecurityEventType.FILE_UPLOAD_REJECTED, {
          reason: 'upload_failed',
          fileName: file.name,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return { successful, failed };
  }

  // Upload single file with progress
  private static uploadSingleFile(
    formData: FormData,
    url: string,
    options: {
      onProgress?: (loaded: number, total: number) => void;
      headers?: Record<string, string>;
    } = {}
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // Progress tracking
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          options.onProgress?.(event.loaded, event.total);
        }
      });

      // Success handler
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch {
            resolve(xhr.responseText);
          }
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      });

      // Error handler
      xhr.addEventListener('error', () => {
        reject(new Error('Upload failed due to network error'));
      });

      // Timeout handler
      xhr.addEventListener('timeout', () => {
        reject(new Error('Upload timed out'));
      });

      // Configure request
      xhr.open('POST', url);
      xhr.timeout = 60000; // 60 seconds timeout

      // Set headers
      if (options.headers) {
        Object.entries(options.headers).forEach(([key, value]) => {
          xhr.setRequestHeader(key, value);
        });
      }

      // Send request
      xhr.send(formData);
    });
  }

  // Create drag and drop handler with validation
  static createDropHandler(
    onFiles: (files: File[]) => void,
    options: FileUploadOptions = {}
  ) {
    return {
      onDragOver: (event: React.DragEvent) => {
        event.preventDefault();
        event.stopPropagation();
      },
      onDragEnter: (event: React.DragEvent) => {
        event.preventDefault();
        event.stopPropagation();
      },
      onDragLeave: (event: React.DragEvent) => {
        event.preventDefault();
        event.stopPropagation();
      },
      onDrop: (event: React.DragEvent) => {
        event.preventDefault();
        event.stopPropagation();

        const files = Array.from(event.dataTransfer.files);
        const validation = this.validateFiles(files, options);

        if (!validation.isValid) {
          const allErrors = [
            ...validation.globalErrors,
            ...validation.results.flatMap(r => r.errors),
          ];
          toast.error(`File validation failed: ${allErrors.join(', ')}`);
          return;
        }

        // Use sanitized files where available
        const sanitizedFiles = validation.results.map(r => r.sanitizedFile || files[validation.results.indexOf(r)]);
        onFiles(sanitizedFiles);
      },
    };
  }
}

// React hook for secure file uploads
export const useSecureFileUpload = (options: FileUploadOptions = {}) => {
  const [uploading, setUploading] = React.useState(false);
  const [progress, setProgress] = React.useState<Record<string, number>>({});

  const uploadFiles = async (files: File[], uploadUrl: string) => {
    setUploading(true);
    setProgress({});

    try {
      const result = await SecureFileUpload.uploadFiles(files, uploadUrl, {
        onProgress: (progressInfo) => {
          setProgress(prev => ({
            ...prev,
            [progressInfo.file.name]: progressInfo.percentage,
          }));
        },
        onError: (file, error) => {
          toast.error(`Failed to upload ${file.name}: ${error.message}`);
        },
        onComplete: (file) => {
          toast.success(`Successfully uploaded ${file.name}`);
        },
      });

      return result;
    } finally {
      setUploading(false);
      setProgress({});
    }
  };

  const validateFiles = (files: FileList | File[]) => {
    return SecureFileUpload.validateFiles(files, options);
  };

  const createDropHandler = (onFiles: (files: File[]) => void) => {
    return SecureFileUpload.createDropHandler(onFiles, options);
  };

  return {
    uploading,
    progress,
    uploadFiles,
    validateFiles,
    createDropHandler,
  };
};
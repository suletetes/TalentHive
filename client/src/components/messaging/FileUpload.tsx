import React, { useRef, useState } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Alert,
  Typography,
  LinearProgress,
} from '@mui/material';
import { CloudUpload as CloudUploadIcon, Close as CloseIcon } from '@mui/icons-material';

interface FileUploadProps {
  onFileSelect: (files: File[]) => void;
  maxSize?: number; // in MB
  acceptedTypes?: string[];
  multiple?: boolean;
  disabled?: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFileSelect,
  maxSize = 10,
  acceptedTypes = ['image/*', 'application/pdf', 'application/msword'],
  multiple = true,
  disabled = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [error, setError] = useState<string>('');
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setError('');

    // Validate files
    const validFiles: File[] = [];
    for (const file of files) {
      // Check file size
      if (file.size > maxSize * 1024 * 1024) {
        setError(`File ${file.name} exceeds ${maxSize}MB limit`);
        continue;
      }

      // Check file type
      const isAccepted = acceptedTypes.some((type) => {
        if (type.endsWith('/*')) {
          return file.type.startsWith(type.replace('/*', ''));
        }
        return file.type === type;
      });

      if (!isAccepted) {
        setError(`File type ${file.type} not accepted`);
        continue;
      }

      validFiles.push(file);
    }

    if (validFiles.length > 0) {
      if (multiple) {
        setSelectedFiles([...selectedFiles, ...validFiles]);
      } else {
        setSelectedFiles([validFiles[0]]);
      }
      onFileSelect(validFiles);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <Box>
      <input
        ref={fileInputRef}
        type="file"
        multiple={multiple}
        onChange={handleFileSelect}
        accept={acceptedTypes.join(',')}
        style={{ display: 'none' }}
        disabled={disabled || uploading}
      />

      <Button
        variant="outlined"
        startIcon={uploading ? <CircularProgress size={20} /> : <CloudUploadIcon />}
        onClick={handleUploadClick}
        disabled={disabled || uploading}
        fullWidth
      >
        {uploading ? 'Uploading...' : 'Choose Files'}
      </Button>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {selectedFiles.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Selected Files ({selectedFiles.length})
          </Typography>
          {selectedFiles.map((file, index) => (
            <Box
              key={index}
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                p: 1.5,
                mb: 1,
                backgroundColor: '#f5f5f5',
                borderRadius: 1,
              }}
            >
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" fontWeight="500">
                  {file.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatFileSize(file.size)}
                </Typography>
              </Box>
              <Button
                size="small"
                color="error"
                startIcon={<CloseIcon />}
                onClick={() => handleRemoveFile(index)}
              >
                Remove
              </Button>
            </Box>
          ))}
        </Box>
      )}

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
        Max file size: {maxSize}MB
      </Typography>
    </Box>
  );
};

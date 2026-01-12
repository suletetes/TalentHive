import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Box,
  Typography,
  Button,
  IconButton,
  CircularProgress,
  Alert,
} from '@mui/material';
import { CloudUpload, Delete, Image } from '@mui/icons-material';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { apiService } from '@/services/api';

interface ImageUploadProps {
  onUpload: (urls: string[]) => void;
  multiple?: boolean;
  maxFiles?: number;
  existingImages?: string[];
  folder?: 'avatar' | 'portfolio';
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  onUpload,
  multiple = false,
  maxFiles = 1,
  existingImages = [],
  folder = 'portfolio',
}) => {
  const [previews, setPreviews] = useState<string[]>(existingImages);

  const uploadMutation = useMutation({
    mutationFn: async (files: File[]) => {
      const formData = new FormData();
      
      if (folder === 'avatar') {
        formData.append('avatar', files[0]);
        return apiService.post('/users/upload-avatar', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        files.forEach((file) => {
          formData.append('images', file);
        });
        return apiService.post('/users/upload-portfolio', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
    },
    onSuccess: (response) => {
      console.log(' [UPLOAD] Full response:', JSON.stringify(response, null, 2));
      
      // Handle different response structures
      const urls = folder === 'avatar' 
        ? [response?.data?.url || response?.url || response?.data?.data?.avatar]
        : response?.data?.images || response?.images || response?.data?.data?.images || [];
      
      console.log(' [UPLOAD] Extracted URLs:', urls);
      
      setPreviews(prev => [...prev, ...urls]);
      onUpload(urls);
      toast.success('Images uploaded successfully!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Upload failed';
      toast.error(message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (imageUrl: string) => 
      apiService.delete('/users/delete-portfolio-image', { data: { imageUrl } }),
    onSuccess: () => {
      toast.success('Image deleted successfully!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Delete failed';
      toast.error(message);
    },
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    // Validate file types
    const validFiles = acceptedFiles.filter(file => 
      file.type.startsWith('image/')
    );

    if (validFiles.length !== acceptedFiles.length) {
      toast.error('Only image files are allowed');
      return;
    }

    // Validate file sizes (5MB limit)
    const oversizedFiles = validFiles.filter(file => file.size > 5 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      toast.error('File size must be less than 5MB');
      return;
    }

    // Check total file count
    if (previews.length + validFiles.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} images allowed`);
      return;
    }

    uploadMutation.mutate(validFiles);
  }, [previews.length, maxFiles, uploadMutation]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'],
    },
    multiple,
    maxFiles,
  });

  const handleDelete = (imageUrl: string, index: number) => {
    setPreviews(prev => prev.filter((_, i) => i !== index));
    
    if (existingImages.includes(imageUrl)) {
      deleteMutation.mutate(imageUrl);
    }
  };

  return (
    <Box>
      {/* Upload Area */}
      <Box
        {...getRootProps()}
        sx={{
          border: '2px dashed',
          borderColor: isDragActive ? 'primary.main' : 'grey.300',
          borderRadius: 2,
          p: 3,
          textAlign: 'center',
          cursor: 'pointer',
          bgcolor: isDragActive ? 'primary.50' : 'grey.50',
          transition: 'all 0.2s ease',
          '&:hover': {
            borderColor: 'primary.main',
            bgcolor: 'primary.50',
          },
        }}
      >
        <input {...getInputProps()} />
        
        {uploadMutation.isPending ? (
          <Box>
            <CircularProgress size={40} />
            <Typography variant="body2" sx={{ mt: 1 }}>
              Uploading...
            </Typography>
          </Box>
        ) : (
          <Box>
            <CloudUpload sx={{ fontSize: 48, color: 'grey.400', mb: 1 }} />
            <Typography variant="h6" gutterBottom>
              {isDragActive ? 'Drop images here' : 'Drag & drop images here'}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              or click to select files
            </Typography>
            <Button variant="outlined" size="small" sx={{ mt: 1 }}>
              Choose Files
            </Button>
            <Typography variant="caption" display="block" sx={{ mt: 1 }}>
              Max file size: 5MB • Formats: JPG, PNG, GIF, WebP
            </Typography>
          </Box>
        )}
      </Box>

      {/* Image Previews */}
      {previews.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            {folder === 'avatar' ? 'Avatar' : 'Portfolio Images'} ({previews.length})
          </Typography>
          
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
              gap: 2,
            }}
          >
            {previews.map((url, index) => (
              <Box
                key={index}
                sx={{
                  position: 'relative',
                  aspectRatio: '1',
                  borderRadius: 1,
                  overflow: 'hidden',
                  border: '1px solid',
                  borderColor: 'grey.300',
                }}
              >
                <Box
                  component="img"
                  src={url}
                  alt={`Preview ${index + 1}`}
                  sx={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
                
                <IconButton
                  size="small"
                  onClick={() => handleDelete(url, index)}
                  disabled={deleteMutation.isPending}
                  sx={{
                    position: 'absolute',
                    top: 4,
                    right: 4,
                    bgcolor: 'rgba(0,0,0,0.7)',
                    color: 'white',
                    '&:hover': {
                      bgcolor: 'rgba(0,0,0,0.9)',
                    },
                  }}
                >
                  <Delete fontSize="small" />
                </IconButton>
              </Box>
            ))}
          </Box>
        </Box>
      )}

      {/* Error Display */}
      {(uploadMutation.isError || deleteMutation.isError) && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {uploadMutation.error?.message || deleteMutation.error?.message || 'An error occurred'}
        </Alert>
      )}
    </Box>
  );
};
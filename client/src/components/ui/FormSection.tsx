import React from 'react';
import { Box, Typography, Divider } from '@mui/material';

interface FormSectionProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  divider?: boolean;
}

export const FormSection: React.FC<FormSectionProps> = ({ 
  title, 
  description, 
  children,
  divider = true,
}) => {
  return (
    <Box sx={{ mb: 4 }}>
      {title && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" gutterBottom fontWeight={600}>
            {title}
          </Typography>
          {description && (
            <Typography variant="body2" color="text.secondary">
              {description}
            </Typography>
          )}
        </Box>
      )}
      {children}
      {divider && <Divider sx={{ mt: 4 }} />}
    </Box>
  );
};

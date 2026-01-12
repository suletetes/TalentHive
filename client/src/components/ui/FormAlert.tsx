import React from 'react';
import { Alert, AlertProps, Collapse } from '@mui/material';

interface FormAlertProps extends Omit<AlertProps, 'severity'> {
  message?: string;
  type?: 'error' | 'success' | 'info' | 'warning';
  show?: boolean;
}

export const FormAlert: React.FC<FormAlertProps> = ({ 
  message, 
  type = 'error',
  show = true,
  ...props 
}) => {
  if (!message || !show) return null;

  return (
    <Collapse in={show}>
      <Alert 
        severity={type} 
        sx={{ mb: 2 }}
        {...props}
      >
        {message}
      </Alert>
    </Collapse>
  );
};

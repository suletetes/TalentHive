// Enhanced form validation components for consistent error display
import React from 'react';
import {
  Box,
  Typography,
  Alert,
  AlertTitle,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Fade,
  Collapse,
} from '@mui/material';
import {
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  CheckCircle as SuccessIcon,
} from '@mui/icons-material';
import { FormikErrors, FormikTouched } from 'formik';

export interface ValidationError {
  field: string;
  message: string;
  type: 'error' | 'warning' | 'info';
  code?: string;
}

export interface FormValidationProps {
  errors: FormikErrors<any>;
  touched: FormikTouched<any>;
  showSummary?: boolean;
  showFieldErrors?: boolean;
  maxErrors?: number;
  className?: string;
}

// Main form validation display component
export const FormValidation: React.FC<FormValidationProps> = ({
  errors,
  touched,
  showSummary = true,
  showFieldErrors = true,
  maxErrors = 10,
  className,
}) => {
  const validationErrors = React.useMemo(() => {
    return extractValidationErrors(errors, touched);
  }, [errors, touched]);

  const errorCount = validationErrors.filter(e => e.type === 'error').length;
  const warningCount = validationErrors.filter(e => e.type === 'warning').length;

  if (validationErrors.length === 0) {
    return null;
  }

  return (
    <Box className={className}>
      {showSummary && (
        <FormValidationSummary
          errors={validationErrors}
          errorCount={errorCount}
          warningCount={warningCount}
          maxErrors={maxErrors}
        />
      )}
      
      {showFieldErrors && (
        <FormFieldErrors
          errors={validationErrors.slice(0, maxErrors)}
        />
      )}
    </Box>
  );
};

// Form validation summary component
interface FormValidationSummaryProps {
  errors: ValidationError[];
  errorCount: number;
  warningCount: number;
  maxErrors: number;
}

const FormValidationSummary: React.FC<FormValidationSummaryProps> = ({
  errors,
  errorCount,
  warningCount,
  maxErrors,
}) => {
  if (errors.length === 0) return null;

  const severity = errorCount > 0 ? 'error' : warningCount > 0 ? 'warning' : 'info';
  const title = errorCount > 0 
    ? `${errorCount} error${errorCount > 1 ? 's' : ''} found`
    : `${warningCount} warning${warningCount > 1 ? 's' : ''} found`;

  return (
    <Fade in={true}>
      <Alert severity={severity} sx={{ mb: 2 }}>
        <AlertTitle>{title}</AlertTitle>
        <Typography variant="body2">
          Please review and correct the following issues before submitting:
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
          {errorCount > 0 && (
            <Chip
              size="small"
              color="error"
              variant="outlined"
              label={`${errorCount} error${errorCount > 1 ? 's' : ''}`}
              icon={<ErrorIcon />}
            />
          )}
          {warningCount > 0 && (
            <Chip
              size="small"
              color="warning"
              variant="outlined"
              label={`${warningCount} warning${warningCount > 1 ? 's' : ''}`}
              icon={<WarningIcon />}
            />
          )}
          {errors.length > maxErrors && (
            <Chip
              size="small"
              variant="outlined"
              label={`+${errors.length - maxErrors} more`}
            />
          )}
        </Box>
      </Alert>
    </Fade>
  );
};

// Individual field errors component
interface FormFieldErrorsProps {
  errors: ValidationError[];
}

const FormFieldErrors: React.FC<FormFieldErrorsProps> = ({ errors }) => {
  if (errors.length === 0) return null;

  return (
    <List dense sx={{ mt: 1 }}>
      {errors.map((error, index) => (
        <Fade in={true} key={`${error.field}-${index}`} timeout={300 + index * 100}>
          <ListItem sx={{ pl: 0 }}>
            <ListItemIcon sx={{ minWidth: 32 }}>
              {getErrorIcon(error.type)}
            </ListItemIcon>
            <ListItemText
              primary={
                <Typography variant="body2" color={getErrorColor(error.type)}>
                  <strong>{formatFieldName(error.field)}:</strong> {error.message}
                </Typography>
              }
            />
          </ListItem>
        </Fade>
      ))}
    </List>
  );
};

// Individual field error component
interface FieldErrorProps {
  name: string;
  error?: string;
  touched?: boolean;
  showIcon?: boolean;
  variant?: 'standard' | 'outlined' | 'filled';
}

export const FieldError: React.FC<FieldErrorProps> = ({
  name,
  error,
  touched = false,
  showIcon = true,
  variant = 'standard',
}) => {
  const shouldShow = touched && error;

  if (!shouldShow) return null;

  return (
    <Collapse in={shouldShow}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          mt: 0.5,
          color: 'error.main',
        }}
      >
        {showIcon && <ErrorIcon sx={{ fontSize: 16 }} />}
        <Typography variant="caption" color="error">
          {error}
        </Typography>
      </Box>
    </Collapse>
  );
};

// Field validation status indicator
interface FieldValidationStatusProps {
  name: string;
  error?: string;
  touched?: boolean;
  value?: any;
  required?: boolean;
}

export const FieldValidationStatus: React.FC<FieldValidationStatusProps> = ({
  name,
  error,
  touched = false,
  value,
  required = false,
}) => {
  const hasError = touched && error;
  const hasValue = value !== undefined && value !== null && value !== '';
  const isValid = touched && !error && hasValue;
  const isEmpty = required && (!hasValue || (typeof value === 'string' && value.trim() === ''));

  if (hasError) {
    return <ErrorIcon color="error" sx={{ fontSize: 20 }} />;
  }

  if (isValid) {
    return <SuccessIcon color="success" sx={{ fontSize: 20 }} />;
  }

  if (isEmpty) {
    return <WarningIcon color="warning" sx={{ fontSize: 20 }} />;
  }

  return null;
};

// Form validation progress indicator
interface FormValidationProgressProps {
  errors: FormikErrors<any>;
  touched: FormikTouched<any>;
  requiredFields: string[];
  totalFields: number;
}

export const FormValidationProgress: React.FC<FormValidationProgressProps> = ({
  errors,
  touched,
  requiredFields,
  totalFields,
}) => {
  const validationErrors = extractValidationErrors(errors, touched);
  const errorCount = validationErrors.filter(e => e.type === 'error').length;
  const touchedCount = Object.keys(touched).length;
  const completedFields = touchedCount - errorCount;
  const progress = totalFields > 0 ? (completedFields / totalFields) * 100 : 0;

  return (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="body2" color="text.secondary">
          Form Completion
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {Math.round(progress)}%
        </Typography>
      </Box>
      
      <Box
        sx={{
          width: '100%',
          height: 8,
          backgroundColor: 'grey.200',
          borderRadius: 4,
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            width: `${progress}%`,
            height: '100%',
            backgroundColor: errorCount > 0 ? 'error.main' : 'success.main',
            transition: 'width 0.3s ease-in-out',
          }}
        />
      </Box>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
        <Typography variant="caption" color="text.secondary">
          {completedFields} of {totalFields} fields completed
        </Typography>
        {errorCount > 0 && (
          <Typography variant="caption" color="error">
            {errorCount} error{errorCount > 1 ? 's' : ''} to fix
          </Typography>
        )}
      </Box>
    </Box>
  );
};

// Utility functions
function extractValidationErrors(
  errors: FormikErrors<any>,
  touched: FormikTouched<any>
): ValidationError[] {
  const validationErrors: ValidationError[] = [];

  const processErrors = (
    errorObj: any,
    touchedObj: any,
    prefix: string = ''
  ) => {
    Object.keys(errorObj).forEach(key => {
      const fieldName = prefix ? `${prefix}.${key}` : key;
      const error = errorObj[key];
      const isTouched = touchedObj && touchedObj[key];

      if (typeof error === 'string' && isTouched) {
        validationErrors.push({
          field: fieldName,
          message: error,
          type: 'error',
        });
      } else if (typeof error === 'object' && error !== null) {
        processErrors(error, isTouched, fieldName);
      }
    });
  };

  processErrors(errors, touched);
  return validationErrors;
}

function getErrorIcon(type: ValidationError['type']) {
  switch (type) {
    case 'error':
      return <ErrorIcon color="error" sx={{ fontSize: 20 }} />;
    case 'warning':
      return <WarningIcon color="warning" sx={{ fontSize: 20 }} />;
    case 'info':
      return <InfoIcon color="info" sx={{ fontSize: 20 }} />;
    default:
      return <ErrorIcon color="error" sx={{ fontSize: 20 }} />;
  }
}

function getErrorColor(type: ValidationError['type']) {
  switch (type) {
    case 'error':
      return 'error.main';
    case 'warning':
      return 'warning.main';
    case 'info':
      return 'info.main';
    default:
      return 'error.main';
  }
}

function formatFieldName(fieldName: string): string {
  return fieldName
    .split('.')
    .pop()
    ?.replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim() || fieldName;
}

// Hook for form validation
export const useFormValidation = () => {
  const [showValidation, setShowValidation] = React.useState(false);

  const validateAndShow = (errors: FormikErrors<any>, touched: FormikTouched<any>) => {
    const hasErrors = Object.keys(errors).length > 0;
    const hasTouched = Object.keys(touched).length > 0;
    
    setShowValidation(hasErrors && hasTouched);
    return !hasErrors;
  };

  const hideValidation = () => {
    setShowValidation(false);
  };

  return {
    showValidation,
    validateAndShow,
    hideValidation,
  };
};
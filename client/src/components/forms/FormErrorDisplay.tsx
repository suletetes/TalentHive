// Enhanced form validation error display components
import React from 'react';
import {
  Alert,
  Box,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Collapse,
  IconButton,
  Chip,
  FormHelperText,
} from '@mui/material';
import {
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { FormikErrors, FormikTouched } from 'formik';

export interface FormError {
  field: string;
  message: string;
  type: 'error' | 'warning' | 'info';
  code?: string;
}

export interface FormErrorSummaryProps {
  errors: FormError[];
  title?: string;
  collapsible?: boolean;
  showFieldNames?: boolean;
  onDismiss?: () => void;
  maxHeight?: number;
}

export const FormErrorSummary: React.FC<FormErrorSummaryProps> = ({
  errors,
  title = 'Please fix the following issues:',
  collapsible = false,
  showFieldNames = true,
  onDismiss,
  maxHeight = 300,
}) => {
  const [expanded, setExpanded] = React.useState(!collapsible);

  if (errors.length === 0) return null;

  const errorCount = errors.filter(e => e.type === 'error').length;
  const warningCount = errors.filter(e => e.type === 'warning').length;
  const infoCount = errors.filter(e => e.type === 'info').length;

  const getSeverity = () => {
    if (errorCount > 0) return 'error';
    if (warningCount > 0) return 'warning';
    return 'info';
  };

  const getIcon = (type: FormError['type']) => {
    switch (type) {
      case 'error':
        return <ErrorIcon color="error" fontSize="small" />;
      case 'warning':
        return <WarningIcon color="warning" fontSize="small" />;
      case 'info':
        return <InfoIcon color="info" fontSize="small" />;
    }
  };

  const formatFieldName = (field: string) => {
    return field
      .split('.')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' → ');
  };

  return (
    <Alert
      severity={getSeverity()}
      sx={{ mb: 2 }}
      action={
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {collapsible && (
            <IconButton
              size="small"
              onClick={() => setExpanded(!expanded)}
              aria-label={expanded ? 'collapse' : 'expand'}
            >
              {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          )}
          {onDismiss && (
            <IconButton size="small" onClick={onDismiss} aria-label="dismiss">
              <CloseIcon />
            </IconButton>
          )}
        </Box>
      }
    >
      <Box>
        <Typography variant="body2" sx={{ fontWeight: 'medium', mb: 1 }}>
          {title}
        </Typography>

        <Box sx={{ display: 'flex', gap: 1, mb: expanded ? 2 : 0 }}>
          {errorCount > 0 && (
            <Chip
              label={`${errorCount} error${errorCount > 1 ? 's' : ''}`}
              color="error"
              size="small"
              variant="outlined"
            />
          )}
          {warningCount > 0 && (
            <Chip
              label={`${warningCount} warning${warningCount > 1 ? 's' : ''}`}
              color="warning"
              size="small"
              variant="outlined"
            />
          )}
          {infoCount > 0 && (
            <Chip
              label={`${infoCount} info`}
              color="info"
              size="small"
              variant="outlined"
            />
          )}
        </Box>

        <Collapse in={expanded}>
          <List
            dense
            sx={{
              maxHeight,
              overflow: 'auto',
              '& .MuiListItem-root': {
                paddingLeft: 0,
                paddingRight: 0,
              },
            }}
          >
            {errors.map((error, index) => (
              <ListItem key={`${error.field}-${index}`}>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  {getIcon(error.type)}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box>
                      {showFieldNames && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: 'block', fontWeight: 'medium' }}
                        >
                          {formatFieldName(error.field)}
                        </Typography>
                      )}
                      <Typography variant="body2">
                        {error.message}
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        </Collapse>
      </Box>
    </Alert>
  );
};

// Field-level error display component
export interface FieldErrorProps {
  error?: string;
  touched?: boolean;
  warning?: string;
  info?: string;
  showIcon?: boolean;
  variant?: 'standard' | 'outlined' | 'filled';
}

export const FieldError: React.FC<FieldErrorProps> = ({
  error,
  touched,
  warning,
  info,
  showIcon = true,
  variant = 'standard',
}) => {
  const hasError = touched && error;
  const hasWarning = warning && !hasError;
  const hasInfo = info && !hasError && !hasWarning;

  if (!hasError && !hasWarning && !hasInfo) return null;

  const getMessage = () => {
    if (hasError) return error;
    if (hasWarning) return warning;
    if (hasInfo) return info;
    return '';
  };

  const getColor = () => {
    if (hasError) return 'error';
    if (hasWarning) return 'warning';
    return 'info';
  };

  const getIcon = () => {
    if (!showIcon) return null;
    if (hasError) return <ErrorIcon fontSize="small" />;
    if (hasWarning) return <WarningIcon fontSize="small" />;
    return <InfoIcon fontSize="small" />;
  };

  return (
    <FormHelperText
      error={hasError}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 0.5,
        color: hasWarning ? 'warning.main' : hasInfo ? 'info.main' : undefined,
        mt: 0.5,
      }}
    >
      {getIcon()}
      {getMessage()}
    </FormHelperText>
  );
};

// Hook for converting Formik errors to FormError array
export const useFormErrors = <T extends Record<string, any>>(
  errors: FormikErrors<T>,
  touched: FormikTouched<T>
): FormError[] => {
  return React.useMemo(() => {
    const formErrors: FormError[] = [];

    const processErrors = (
      errorObj: any,
      touchedObj: any,
      prefix = ''
    ) => {
      Object.keys(errorObj).forEach(key => {
        const fieldPath = prefix ? `${prefix}.${key}` : key;
        const error = errorObj[key];
        const isTouched = touchedObj?.[key];

        if (typeof error === 'string' && isTouched) {
          formErrors.push({
            field: fieldPath,
            message: error,
            type: 'error',
          });
        } else if (typeof error === 'object' && error !== null) {
          processErrors(error, isTouched, fieldPath);
        }
      });
    };

    processErrors(errors, touched);
    return formErrors;
  }, [errors, touched]);
};

// Enhanced form validation hook with better error handling
export const useFormValidation = <T extends Record<string, any>>() => {
  const [validationErrors, setValidationErrors] = React.useState<FormError[]>([]);
  const [isValidating, setIsValidating] = React.useState(false);

  const validateField = React.useCallback(async (
    fieldName: string,
    value: any,
    validator: (value: any) => Promise<string | undefined> | string | undefined
  ): Promise<string | undefined> => {
    setIsValidating(true);
    
    try {
      const error = await validator(value);
      
      // Update validation errors
      setValidationErrors(prev => {
        const filtered = prev.filter(e => e.field !== fieldName);
        if (error) {
          filtered.push({
            field: fieldName,
            message: error,
            type: 'error',
          });
        }
        return filtered;
      });
      
      return error;
    } catch (validationError) {
      const errorMessage = validationError instanceof Error 
        ? validationError.message 
        : 'Validation failed';
      
      setValidationErrors(prev => {
        const filtered = prev.filter(e => e.field !== fieldName);
        filtered.push({
          field: fieldName,
          message: errorMessage,
          type: 'error',
        });
        return filtered;
      });
      
      return errorMessage;
    } finally {
      setIsValidating(false);
    }
  }, []);

  const clearFieldError = React.useCallback((fieldName: string) => {
    setValidationErrors(prev => prev.filter(e => e.field !== fieldName));
  }, []);

  const clearAllErrors = React.useCallback(() => {
    setValidationErrors([]);
  }, []);

  const addWarning = React.useCallback((fieldName: string, message: string) => {
    setValidationErrors(prev => {
      const filtered = prev.filter(e => !(e.field === fieldName && e.type === 'warning'));
      filtered.push({
        field: fieldName,
        message,
        type: 'warning',
      });
      return filtered;
    });
  }, []);

  const addInfo = React.useCallback((fieldName: string, message: string) => {
    setValidationErrors(prev => {
      const filtered = prev.filter(e => !(e.field === fieldName && e.type === 'info'));
      filtered.push({
        field: fieldName,
        message,
        type: 'info',
      });
      return filtered;
    });
  }, []);

  return {
    validationErrors,
    isValidating,
    validateField,
    clearFieldError,
    clearAllErrors,
    addWarning,
    addInfo,
  };
};

// Form section error boundary
export const FormSectionErrorBoundary: React.FC<{
  children: React.ReactNode;
  sectionName: string;
  onError?: (error: Error) => void;
}> = ({ children, sectionName, onError }) => {
  const [hasError, setHasError] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      setHasError(true);
      setError(new Error(event.message));
      onError?.(new Error(event.message));
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, [onError]);

  if (hasError) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        <Typography variant="body2">
          <strong>Error in {sectionName}:</strong> {error?.message}
        </Typography>
        <Box sx={{ mt: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Please refresh the page or contact support if this persists.
          </Typography>
        </Box>
      </Alert>
    );
  }

  return <>{children}</>;
};
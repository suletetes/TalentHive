// Comprehensive loading state components with consistent patterns
import React from 'react';
import {
  Box,
  CircularProgress,
  Typography,
  Skeleton,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Fade,
  Button,
  Alert,
} from '@mui/material';
import { Refresh as RefreshIcon, ErrorOutline as ErrorIcon } from '@mui/icons-material';

// Loading state types for consistency
export type LoadingSize = 'small' | 'medium' | 'large';
export type LoadingVariant = 'spinner' | 'skeleton' | 'progress' | 'overlay';

// Enhanced loading spinner with customizable options
interface LoadingSpinnerProps {
  message?: string;
  size?: LoadingSize | number;
  color?: 'primary' | 'secondary' | 'inherit';
  fullScreen?: boolean;
  overlay?: boolean;
  variant?: 'circular' | 'linear';
}

const getSizeValue = (size: LoadingSize | number): number => {
  if (typeof size === 'number') return size;
  switch (size) {
    case 'small': return 24;
    case 'medium': return 40;
    case 'large': return 56;
    default: return 40;
  }
};

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = 'Loading...',
  size = 'medium',
  color = 'primary',
  fullScreen = false,
  overlay = false,
  variant = 'circular',
}) => {
  const sizeValue = getSizeValue(size);
  
  const content = (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      gap={2}
      sx={{
        minHeight: fullScreen ? '100vh' : '200px',
        padding: 2,
        ...(overlay && {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(2px)',
          zIndex: 1000,
        }),
      }}
    >
      {variant === 'circular' ? (
        <CircularProgress size={sizeValue} color={color} />
      ) : (
        <Box sx={{ width: '100%', maxWidth: 300 }}>
          <LinearProgress color={color} />
        </Box>
      )}
      {message && (
        <Typography 
          variant={size === 'small' ? 'caption' : 'body2'} 
          color="text.secondary"
          textAlign="center"
        >
          {message}
        </Typography>
      )}
    </Box>
  );

  return overlay ? (
    <Fade in={true} timeout={300}>
      {content}
    </Fade>
  ) : (
    content
  );
};

// Page-level loading component with consistent styling
interface PageLoadingProps {
  message?: string;
  showProgress?: boolean;
  progress?: number;
}

export const PageLoading: React.FC<PageLoadingProps> = ({ 
  message = 'Loading page...', 
  showProgress = false,
  progress 
}) => (
  <Box
    display="flex"
    flexDirection="column"
    alignItems="center"
    justifyContent="center"
    minHeight="100vh"
    gap={3}
    sx={{ padding: 3 }}
  >
    <CircularProgress size={60} color="primary" />
    <Typography variant="h6" color="text.secondary">
      {message}
    </Typography>
    {showProgress && progress !== undefined && (
      <Box sx={{ width: '100%', maxWidth: 400 }}>
        <LinearProgress 
          variant="determinate" 
          value={progress} 
          sx={{ height: 8, borderRadius: 4 }}
        />
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', textAlign: 'center' }}>
          {Math.round(progress)}%
        </Typography>
      </Box>
    )}
  </Box>
);

// Enhanced grid skeleton with better animations
interface GridSkeletonProps {
  items?: number;
  columns?: number;
  height?: number;
  showActions?: boolean;
  variant?: 'card' | 'list';
}

export const GridSkeleton: React.FC<GridSkeletonProps> = ({
  items = 6,
  columns = 3,
  height = 200,
  showActions = true,
  variant = 'card',
}) => {
  if (variant === 'list') {
    return (
      <Box>
        {Array.from({ length: items }).map((_, index) => (
          <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, p: 2 }}>
            <Skeleton variant="circular" width={48} height={48} />
            <Box sx={{ flex: 1 }}>
              <Skeleton variant="text" height={24} width="60%" />
              <Skeleton variant="text" height={20} width="40%" />
            </Box>
            {showActions && (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Skeleton variant="rectangular" width={80} height={32} />
                <Skeleton variant="rectangular" width={60} height={32} />
              </Box>
            )}
          </Box>
        ))}
      </Box>
    );
  }

  return (
    <Grid container spacing={3}>
      {Array.from({ length: items }).map((_, index) => (
        <Grid item xs={12} sm={6} md={12 / columns} key={index}>
          <Card>
            <Skeleton variant="rectangular" height={height} animation="wave" />
            <CardContent>
              <Skeleton variant="text" height={28} animation="wave" />
              <Skeleton variant="text" height={20} width="60%" animation="wave" />
              <Box sx={{ mt: 2 }}>
                <Skeleton variant="text" height={16} animation="wave" />
                <Skeleton variant="text" height={16} width="80%" animation="wave" />
              </Box>
              {showActions && (
                <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                  <Skeleton variant="rectangular" width={80} height={32} animation="wave" />
                  <Skeleton variant="rectangular" width={60} height={32} animation="wave" />
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

// Enhanced table skeleton
interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  showHeader?: boolean;
  showActions?: boolean;
}

export const TableSkeleton: React.FC<TableSkeletonProps> = ({ 
  rows = 5, 
  columns = 4, 
  showHeader = true,
  showActions = true 
}) => (
  <Box>
    {showHeader && (
      <Box sx={{ display: 'flex', gap: 2, mb: 2, pb: 1, borderBottom: 1, borderColor: 'divider' }}>
        {Array.from({ length: columns }).map((_, colIndex) => (
          <Skeleton
            key={colIndex}
            variant="text"
            height={24}
            width={colIndex === 0 ? '30%' : '20%'}
            sx={{ flex: colIndex === 0 ? 2 : 1 }}
          />
        ))}
        {showActions && <Skeleton variant="text" height={24} width="15%" />}
      </Box>
    )}
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <Box key={rowIndex} sx={{ display: 'flex', gap: 2, mb: 1.5, alignItems: 'center' }}>
        {Array.from({ length: columns }).map((_, colIndex) => (
          <Skeleton
            key={colIndex}
            variant="text"
            height={20}
            sx={{ flex: colIndex === 0 ? 2 : 1 }}
            animation="wave"
          />
        ))}
        {showActions && (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Skeleton variant="rectangular" width={32} height={32} />
            <Skeleton variant="rectangular" width={32} height={32} />
          </Box>
        )}
      </Box>
    ))}
  </Box>
);

// Enhanced profile skeleton
interface ProfileSkeletonProps {
  showBio?: boolean;
  showStats?: boolean;
  showActions?: boolean;
}

export const ProfileSkeleton: React.FC<ProfileSkeletonProps> = ({ 
  showBio = true, 
  showStats = true,
  showActions = true 
}) => (
  <Card>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 3 }}>
        <Skeleton variant="circular" width={80} height={80} sx={{ mr: 3 }} />
        <Box sx={{ flex: 1 }}>
          <Skeleton variant="text" height={32} width="60%" />
          <Skeleton variant="text" height={24} width="40%" />
          <Skeleton variant="text" height={20} width="80%" />
          {showActions && (
            <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
              <Skeleton variant="rectangular" width={100} height={36} />
              <Skeleton variant="rectangular" width={80} height={36} />
            </Box>
          )}
        </Box>
      </Box>
      {showBio && (
        <Box sx={{ mb: 3 }}>
          <Skeleton variant="text" height={20} />
          <Skeleton variant="text" height={20} />
          <Skeleton variant="text" height={20} width="70%" />
        </Box>
      )}
      {showStats && (
        <Box sx={{ display: 'flex', gap: 4 }}>
          {Array.from({ length: 3 }).map((_, index) => (
            <Box key={index} sx={{ textAlign: 'center' }}>
              <Skeleton variant="text" height={32} width={40} />
              <Skeleton variant="text" height={20} width={60} />
            </Box>
          ))}
        </Box>
      )}
    </CardContent>
  </Card>
);

// Enhanced form skeleton
interface FormSkeletonProps {
  fields?: number;
  showButtons?: boolean;
  showTextArea?: boolean;
}

export const FormSkeleton: React.FC<FormSkeletonProps> = ({ 
  fields = 4, 
  showButtons = true,
  showTextArea = true 
}) => (
  <Box>
    {Array.from({ length: fields }).map((_, index) => (
      <Box key={index} sx={{ mb: 3 }}>
        <Skeleton variant="text" height={20} width="30%" sx={{ mb: 1 }} />
        <Skeleton variant="rectangular" height={56} />
      </Box>
    ))}
    {showTextArea && (
      <Box sx={{ mb: 3 }}>
        <Skeleton variant="text" height={20} width="25%" sx={{ mb: 1 }} />
        <Skeleton variant="rectangular" height={120} />
      </Box>
    )}
    {showButtons && (
      <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
        <Skeleton variant="rectangular" height={40} width={120} />
        <Skeleton variant="rectangular" height={40} width={80} />
      </Box>
    )}
  </Box>
);

// Enhanced progress bar
interface ProgressBarProps {
  progress: number;
  message?: string;
  showPercentage?: boolean;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  size?: 'small' | 'medium' | 'large';
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  message,
  showPercentage = true,
  color = 'primary',
  size = 'medium',
}) => {
  const height = size === 'small' ? 4 : size === 'large' ? 12 : 8;
  
  return (
    <Box sx={{ width: '100%', mb: 2 }}>
      {message && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {message}
        </Typography>
      )}
      <LinearProgress
        variant="determinate"
        value={Math.min(100, Math.max(0, progress))}
        color={color}
        sx={{ height, borderRadius: height / 2 }}
      />
      {showPercentage && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          {Math.round(progress)}%
        </Typography>
      )}
    </Box>
  );
};

// Inline loading for buttons and small components
interface InlineLoadingProps {
  size?: LoadingSize | number;
  color?: 'primary' | 'secondary' | 'inherit';
  message?: string;
}

export const InlineLoading: React.FC<InlineLoadingProps> = ({
  size = 'small',
  color = 'inherit',
  message,
}) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
    <CircularProgress size={getSizeValue(size)} color={color} />
    {message && (
      <Typography variant="caption" color="text.secondary">
        {message}
      </Typography>
    )}
  </Box>
);

// Loading overlay for existing content
interface LoadingOverlayProps {
  loading: boolean;
  children: React.ReactNode;
  message?: string;
  blur?: boolean;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  loading,
  children,
  message = 'Loading...',
  blur = true,
}) => (
  <Box sx={{ position: 'relative' }}>
    {children}
    {loading && (
      <LoadingSpinner 
        overlay 
        message={message} 
        size="medium"
      />
    )}
  </Box>
);

// Suspense fallback component
export const SuspenseFallback: React.FC = () => (
  <LoadingSpinner message="Loading component..." size="medium" />
);

// Enhanced error state with better UX
interface ErrorStateProps {
  message?: string;
  description?: string;
  onRetry?: () => void;
  showRetry?: boolean;
  retryLabel?: string;
  severity?: 'error' | 'warning' | 'info';
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  message = 'Something went wrong',
  description,
  onRetry,
  showRetry = true,
  retryLabel = 'Try Again',
  severity = 'error',
}) => (
  <Box
    display="flex"
    flexDirection="column"
    alignItems="center"
    justifyContent="center"
    minHeight="200px"
    gap={2}
    sx={{ padding: 3 }}
  >
    <ErrorIcon color={severity} sx={{ fontSize: 48 }} />
    <Typography variant="h6" color={`${severity}.main`} textAlign="center">
      {message}
    </Typography>
    {description && (
      <Typography variant="body2" color="text.secondary" textAlign="center">
        {description}
      </Typography>
    )}
    {showRetry && onRetry && (
      <Button
        variant="outlined"
        color={severity}
        startIcon={<RefreshIcon />}
        onClick={onRetry}
        sx={{ mt: 1 }}
      >
        {retryLabel}
      </Button>
    )}
  </Box>
);

// Enhanced empty state
interface EmptyStateProps {
  title?: string;
  message?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  size?: 'small' | 'medium' | 'large';
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No data found',
  message,
  action,
  icon,
  size = 'medium',
}) => {
  const minHeight = size === 'small' ? '150px' : size === 'large' ? '300px' : '200px';
  
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight={minHeight}
      gap={2}
      sx={{ padding: 3 }}
    >
      {icon}
      <Typography 
        variant={size === 'large' ? 'h5' : 'h6'} 
        color="text.secondary" 
        textAlign="center"
      >
        {title}
      </Typography>
      {message && (
        <Typography variant="body2" color="text.secondary" textAlign="center">
          {message}
        </Typography>
      )}
      {action}
    </Box>
  );
};

// Loading state wrapper component for consistent patterns
interface LoadingWrapperProps {
  loading: boolean;
  error?: string | null;
  empty?: boolean;
  children: React.ReactNode;
  loadingComponent?: React.ReactNode;
  errorComponent?: React.ReactNode;
  emptyComponent?: React.ReactNode;
  onRetry?: () => void;
}

export const LoadingWrapper: React.FC<LoadingWrapperProps> = ({
  loading,
  error,
  empty = false,
  children,
  loadingComponent,
  errorComponent,
  emptyComponent,
  onRetry,
}) => {
  if (loading) {
    return <>{loadingComponent || <LoadingSpinner />}</>;
  }

  if (error) {
    return <>{errorComponent || <ErrorState message={error} onRetry={onRetry} />}</>;
  }

  if (empty) {
    return <>{emptyComponent || <EmptyState />}</>;
  }

  return <>{children}</>;
};
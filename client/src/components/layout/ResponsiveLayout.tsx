import React from 'react';
import { Box, Container, ContainerProps } from '@mui/material';
import { useResponsive } from '@/hooks/useResponsive';

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  maxWidth?: ContainerProps['maxWidth'];
  disableGutters?: boolean;
  fullHeight?: boolean;
  centerContent?: boolean;
  variant?: 'default' | 'dashboard' | 'auth' | 'landing';
}

/**
 * A responsive layout wrapper that provides consistent spacing and behavior
 * across different screen sizes
 */
export const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({
  children,
  maxWidth = 'lg',
  disableGutters = false,
  fullHeight = false,
  centerContent = false,
  variant = 'default',
}) => {
  const { isMobile, getSpacing } = useResponsive();

  const getVariantStyles = () => {
    const baseSpacing = getSpacing();
    
    switch (variant) {
      case 'dashboard':
        return {
          py: { xs: 2, sm: 3, md: 4 },
          px: disableGutters ? 0 : { xs: 2, sm: 3 },
        };
      case 'auth':
        return {
          py: { xs: 4, sm: 6, md: 8 },
          px: disableGutters ? 0 : { xs: 2, sm: 3 },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
        };
      case 'landing':
        return {
          py: 0,
          px: 0,
        };
      default:
        return {
          py: { xs: baseSpacing, sm: baseSpacing + 1, md: baseSpacing + 2 },
          px: disableGutters ? 0 : { xs: 2, sm: 3 },
        };
    }
  };

  const containerStyles = getVariantStyles();

  if (variant === 'landing') {
    return (
      <Box
        sx={{
          width: '100%',
          ...(fullHeight && { minHeight: '100vh' }),
          ...(centerContent && {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }),
        }}
      >
        {children}
      </Box>
    );
  }

  return (
    <Container
      maxWidth={maxWidth}
      disableGutters={disableGutters}
      sx={{
        ...containerStyles,
        ...(fullHeight && { minHeight: '100vh' }),
        ...(centerContent && {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }),
      }}
    >
      {children}
    </Container>
  );
};
import React from 'react';
import { Box, Container, ContainerProps } from '@mui/material';
import { SxProps, Theme } from '@mui/material/styles';

interface ResponsiveLayoutProps extends Omit<ContainerProps, 'sx'> {
  children: React.ReactNode;
  sx?: SxProps<Theme>;
  noPadding?: boolean;
  fullWidth?: boolean;
}

/**
 * ResponsiveLayout - A wrapper component that ensures consistent responsive behavior
 * across the application with proper padding, margins, and overflow handling.
 */
export const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({
  children,
  sx = {},
  noPadding = false,
  fullWidth = false,
  maxWidth = 'lg',
  ...containerProps
}) => {
  return (
    <Container
      maxWidth={fullWidth ? false : maxWidth}
      sx={{
        py: noPadding ? 0 : { xs: 2, sm: 4 },
        px: noPadding ? 0 : { xs: 1, sm: 2 },
        width: '100%',
        maxWidth: fullWidth ? '100%' : undefined,
        overflow: 'hidden', // Prevent horizontal scrolling
        ...sx,
      }}
      {...containerProps}
    >
      {children}
    </Container>
  );
};

interface ResponsiveFlexProps {
  children: React.ReactNode;
  direction?: 'row' | 'column';
  align?: 'flex-start' | 'center' | 'flex-end' | 'stretch';
  justify?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around' | 'space-evenly';
  gap?: number | string;
  wrap?: boolean;
  sx?: SxProps<Theme>;
  breakpoint?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

/**
 * ResponsiveFlex - A flexible container that adapts its layout based on screen size
 */
export const ResponsiveFlex: React.FC<ResponsiveFlexProps> = ({
  children,
  direction = 'row',
  align = 'flex-start',
  justify = 'flex-start',
  gap = 2,
  wrap = true,
  breakpoint = 'sm',
  sx = {},
}) => {
  const responsiveDirection = direction === 'row' 
    ? { xs: 'column', [breakpoint]: 'row' }
    : { xs: 'row', [breakpoint]: 'column' };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: responsiveDirection,
        alignItems: { xs: 'center', [breakpoint]: align },
        justifyContent: { xs: 'center', [breakpoint]: justify },
        gap,
        flexWrap: wrap ? 'wrap' : 'nowrap',
        width: '100%',
        minWidth: 0, // Prevent flex items from overflowing
        ...sx,
      }}
    >
      {children}
    </Box>
  );
};

interface ResponsiveTextProps {
  children: React.ReactNode;
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'body1' | 'body2' | 'caption';
  align?: 'left' | 'center' | 'right';
  sx?: SxProps<Theme>;
  component?: React.ElementType;
}

/**
 * ResponsiveText - Text component that adapts font sizes and alignment for different screen sizes
 */
export const ResponsiveText: React.FC<ResponsiveTextProps> = ({
  children,
  variant = 'body1',
  align = 'left',
  sx = {},
  component,
}) => {
  const getFontSize = (variant: string) => {
    const fontSizes = {
      h1: { xs: '2rem', sm: '2.5rem', md: '3rem' },
      h2: { xs: '1.75rem', sm: '2.125rem', md: '2.5rem' },
      h3: { xs: '1.5rem', sm: '1.875rem', md: '2.125rem' },
      h4: { xs: '1.25rem', sm: '1.5rem', md: '1.875rem' },
      h5: { xs: '1.125rem', sm: '1.25rem', md: '1.5rem' },
      h6: { xs: '1rem', sm: '1.125rem', md: '1.25rem' },
      body1: { xs: '0.875rem', sm: '1rem' },
      body2: { xs: '0.75rem', sm: '0.875rem' },
      caption: { xs: '0.625rem', sm: '0.75rem' },
    };
    return fontSizes[variant as keyof typeof fontSizes] || fontSizes.body1;
  };

  const getTextAlign = (align: string) => {
    if (align === 'center') return 'center';
    if (align === 'right') return { xs: 'center', sm: 'right' };
    return { xs: 'center', sm: 'left' };
  };

  return (
    <Box
      component={component || 'div'}
      sx={{
        fontSize: getFontSize(variant),
        textAlign: getTextAlign(align),
        wordBreak: 'break-word',
        hyphens: 'auto',
        ...sx,
      }}
    >
      {children}
    </Box>
  );
};

interface ResponsiveCardProps {
  children: React.ReactNode;
  sx?: SxProps<Theme>;
  padding?: boolean;
}

/**
 * ResponsiveCard - Card component with responsive padding and proper overflow handling
 */
export const ResponsiveCard: React.FC<ResponsiveCardProps> = ({
  children,
  sx = {},
  padding = true,
}) => {
  return (
    <Box
      sx={{
        bgcolor: 'background.paper',
        borderRadius: 1,
        boxShadow: 1,
        p: padding ? { xs: 2, sm: 3 } : 0,
        width: '100%',
        minWidth: 0,
        overflow: 'hidden',
        ...sx,
      }}
    >
      {children}
    </Box>
  );
};
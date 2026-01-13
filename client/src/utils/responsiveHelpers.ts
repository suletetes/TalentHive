import { SxProps, Theme } from '@mui/material/styles';

/**
 * Responsive utility functions and common styles
 */

// Common responsive container styles
export const responsiveContainer: SxProps<Theme> = {
  width: '100%',
  maxWidth: '100%',
  overflow: 'hidden',
  px: { xs: 1, sm: 2 },
  py: { xs: 2, sm: 4 },
};

// Responsive flex container
export const responsiveFlex: SxProps<Theme> = {
  display: 'flex',
  flexDirection: { xs: 'column', sm: 'row' },
  alignItems: { xs: 'center', sm: 'flex-start' },
  gap: { xs: 2, sm: 3 },
  width: '100%',
  minWidth: 0,
};

// Responsive text alignment
export const responsiveTextAlign: SxProps<Theme> = {
  textAlign: { xs: 'center', sm: 'left' },
};

// Responsive card padding
export const responsiveCardPadding: SxProps<Theme> = {
  p: { xs: 2, sm: 3, md: 4 },
};

// Responsive grid spacing
export const responsiveGridSpacing = { xs: 2, sm: 3, md: 4 };

// Responsive typography sizes
export const responsiveTypography = {
  h1: { fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' } },
  h2: { fontSize: { xs: '1.75rem', sm: '2.125rem', md: '2.5rem' } },
  h3: { fontSize: { xs: '1.5rem', sm: '1.875rem', md: '2.125rem' } },
  h4: { fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.875rem' } },
  h5: { fontSize: { xs: '1.125rem', sm: '1.25rem', md: '1.5rem' } },
  h6: { fontSize: { xs: '1rem', sm: '1.125rem', md: '1.25rem' } },
  body1: { fontSize: { xs: '0.875rem', sm: '1rem' } },
  body2: { fontSize: { xs: '0.75rem', sm: '0.875rem' } },
};

// Responsive button sizes
export const responsiveButton = {
  size: { xs: 'small', sm: 'medium' } as const,
  sx: {
    fontSize: { xs: '0.75rem', sm: '0.875rem' },
    px: { xs: 2, sm: 3 },
    py: { xs: 1, sm: 1.5 },
  },
};

// Responsive avatar sizes
export const responsiveAvatar = {
  sx: {
    width: { xs: 80, sm: 100, md: 120 },
    height: { xs: 80, sm: 100, md: 120 },
  },
};

// Responsive table styles
export const responsiveTable: SxProps<Theme> = {
  overflowX: 'auto',
  '& .MuiTable-root': {
    minWidth: { xs: 600, sm: 'auto' },
  },
  '& .MuiTableCell-root': {
    whiteSpace: { xs: 'nowrap', sm: 'normal' },
    minWidth: { xs: 80, sm: 'auto' },
  },
};

// Responsive form styles
export const responsiveForm: SxProps<Theme> = {
  '& .MuiTextField-root': {
    mb: { xs: 2, sm: 3 },
  },
  '& .MuiFormControl-root': {
    mb: { xs: 2, sm: 3 },
  },
};

// Responsive dialog styles
export const responsiveDialog = {
  fullScreen: { xs: true, sm: false },
  maxWidth: 'md' as const,
  fullWidth: true,
};

// Responsive drawer width
export const responsiveDrawerWidth = {
  xs: '100vw',
  sm: 280,
};

// Helper function to prevent horizontal overflow
export const preventOverflow: SxProps<Theme> = {
  width: '100%',
  maxWidth: '100%',
  minWidth: 0,
  overflow: 'hidden',
  wordBreak: 'break-word',
  hyphens: 'auto',
};

// Helper function for responsive spacing
export const getResponsiveSpacing = (base: number = 2) => ({
  xs: base,
  sm: base * 1.5,
  md: base * 2,
});

// Helper function for responsive margins
export const getResponsiveMargin = (direction: 'x' | 'y' | 'all' = 'all', base: number = 2) => {
  const spacing = getResponsiveSpacing(base);
  
  switch (direction) {
    case 'x':
      return { mx: spacing };
    case 'y':
      return { my: spacing };
    default:
      return { m: spacing };
  }
};

// Helper function for responsive padding
export const getResponsivePadding = (direction: 'x' | 'y' | 'all' = 'all', base: number = 2) => {
  const spacing = getResponsiveSpacing(base);
  
  switch (direction) {
    case 'x':
      return { px: spacing };
    case 'y':
      return { py: spacing };
    default:
      return { p: spacing };
  }
};
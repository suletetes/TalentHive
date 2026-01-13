import { useTheme, useMediaQuery, Breakpoint } from '@mui/material';

/**
 * Custom hook for responsive design utilities
 */
export const useResponsive = () => {
  const theme = useTheme();
  
  // Breakpoint queries
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const isLargeDesktop = useMediaQuery(theme.breakpoints.up('lg'));
  
  // Specific breakpoint checks
  const isXs = useMediaQuery(theme.breakpoints.only('xs'));
  const isSm = useMediaQuery(theme.breakpoints.only('sm'));
  const isMd = useMediaQuery(theme.breakpoints.only('md'));
  const isLg = useMediaQuery(theme.breakpoints.only('lg'));
  const isXl = useMediaQuery(theme.breakpoints.only('xl'));
  
  // Utility functions
  const up = (breakpoint: Breakpoint) => useMediaQuery(theme.breakpoints.up(breakpoint));
  const down = (breakpoint: Breakpoint) => useMediaQuery(theme.breakpoints.down(breakpoint));
  const between = (start: Breakpoint, end: Breakpoint) => 
    useMediaQuery(theme.breakpoints.between(start, end));
  const only = (breakpoint: Breakpoint) => useMediaQuery(theme.breakpoints.only(breakpoint));
  
  // Get responsive values
  const getResponsiveValue = <T>(values: {
    xs?: T;
    sm?: T;
    md?: T;
    lg?: T;
    xl?: T;
  }): T | undefined => {
    if (isXl && values.xl !== undefined) return values.xl;
    if (isLg && values.lg !== undefined) return values.lg;
    if (isMd && values.md !== undefined) return values.md;
    if (isSm && values.sm !== undefined) return values.sm;
    if (isXs && values.xs !== undefined) return values.xs;
    
    // Fallback to the largest available value
    return values.xl || values.lg || values.md || values.sm || values.xs;
  };
  
  // Get grid columns based on screen size
  const getGridColumns = (config?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  }) => {
    const defaultConfig = { xs: 1, sm: 2, md: 3, lg: 4, xl: 5 };
    const finalConfig = { ...defaultConfig, ...config };
    return getResponsiveValue(finalConfig) || 1;
  };
  
  // Get spacing based on screen size
  const getSpacing = (config?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  }) => {
    const defaultConfig = { xs: 1, sm: 2, md: 3, lg: 4, xl: 4 };
    const finalConfig = { ...defaultConfig, ...config };
    return getResponsiveValue(finalConfig) || 2;
  };
  
  return {
    // Breakpoint booleans
    isMobile,
    isTablet,
    isDesktop,
    isLargeDesktop,
    isXs,
    isSm,
    isMd,
    isLg,
    isXl,
    
    // Utility functions
    up,
    down,
    between,
    only,
    getResponsiveValue,
    getGridColumns,
    getSpacing,
    
    // Theme reference
    theme,
  };
};

/**
 * Hook for responsive container maxWidth
 */
export const useResponsiveContainer = () => {
  const { isMobile, isTablet } = useResponsive();
  
  if (isMobile) return 'sm';
  if (isTablet) return 'md';
  return 'lg';
};

/**
 * Hook for responsive dialog fullScreen
 */
export const useResponsiveDialog = () => {
  const { isMobile } = useResponsive();
  return { fullScreen: isMobile };
};
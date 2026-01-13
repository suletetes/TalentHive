import { Theme } from '@mui/material/styles';

/**
 * Utility functions for theme-aware styling
 */

/**
 * Get theme-aware background color for content areas
 */
export const getContentBackground = (theme: Theme, variant: 'light' | 'medium' | 'dark' = 'light') => {
  const isDark = theme.palette.mode === 'dark';
  
  switch (variant) {
    case 'light':
      return isDark ? 'grey.800' : 'grey.50';
    case 'medium':
      return isDark ? 'grey.700' : 'grey.100';
    case 'dark':
      return isDark ? 'grey.600' : 'grey.200';
    default:
      return isDark ? 'grey.800' : 'grey.50';
  }
};

/**
 * Get theme-aware text color for content areas
 */
export const getContentTextColor = (theme: Theme, variant: 'primary' | 'secondary' = 'primary') => {
  const isDark = theme.palette.mode === 'dark';
  
  switch (variant) {
    case 'primary':
      return isDark ? 'grey.100' : 'grey.900';
    case 'secondary':
      return isDark ? 'grey.300' : 'grey.600';
    default:
      return isDark ? 'grey.100' : 'grey.900';
  }
};

/**
 * Get theme-aware border color
 */
export const getBorderColor = (theme: Theme, variant: 'light' | 'medium' | 'dark' = 'light') => {
  const isDark = theme.palette.mode === 'dark';
  
  switch (variant) {
    case 'light':
      return isDark ? 'grey.700' : 'grey.200';
    case 'medium':
      return isDark ? 'grey.600' : 'grey.300';
    case 'dark':
      return isDark ? 'grey.500' : 'grey.400';
    default:
      return isDark ? 'grey.700' : 'grey.200';
  }
};

/**
 * Get theme-aware hover background color
 */
export const getHoverBackground = (theme: Theme, variant: 'light' | 'medium' | 'dark' = 'light') => {
  const isDark = theme.palette.mode === 'dark';
  
  switch (variant) {
    case 'light':
      return isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)';
    case 'medium':
      return isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';
    case 'dark':
      return isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)';
    default:
      return isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)';
  }
};

/**
 * Get theme-aware code/pre background color
 */
export const getCodeBackground = (theme: Theme) => {
  return theme.palette.mode === 'dark' ? 'grey.800' : 'grey.100';
};

/**
 * Get theme-aware code/pre text color
 */
export const getCodeTextColor = (theme: Theme) => {
  return theme.palette.mode === 'dark' ? 'grey.100' : 'grey.900';
};

/**
 * Get theme-aware error background color
 */
export const getErrorBackground = (theme: Theme, opacity: number = 0.1) => {
  const isDark = theme.palette.mode === 'dark';
  return isDark 
    ? `rgba(244, 67, 54, ${opacity})` // Dark red with opacity
    : theme.palette.error.lighter || `rgba(244, 67, 54, ${opacity})`;
};

/**
 * Get theme-aware success background color
 */
export const getSuccessBackground = (theme: Theme, opacity: number = 0.1) => {
  const isDark = theme.palette.mode === 'dark';
  return isDark 
    ? `rgba(76, 175, 80, ${opacity})` // Dark green with opacity
    : theme.palette.success.lighter || `rgba(76, 175, 80, ${opacity})`;
};

/**
 * Get theme-aware warning background color
 */
export const getWarningBackground = (theme: Theme, opacity: number = 0.1) => {
  const isDark = theme.palette.mode === 'dark';
  return isDark 
    ? `rgba(255, 152, 0, ${opacity})` // Dark orange with opacity
    : theme.palette.warning.lighter || `rgba(255, 152, 0, ${opacity})`;
};

/**
 * Get theme-aware info background color
 */
export const getInfoBackground = (theme: Theme, opacity: number = 0.1) => {
  const isDark = theme.palette.mode === 'dark';
  return isDark 
    ? `rgba(33, 150, 243, ${opacity})` // Dark blue with opacity
    : theme.palette.info.lighter || `rgba(33, 150, 243, ${opacity})`;
};

/**
 * Common theme-aware styles for components
 */
export const themeAwareStyles = {
  contentBox: (theme: Theme) => ({
    bgcolor: getContentBackground(theme, 'light'),
    color: getContentTextColor(theme, 'primary'),
    border: 1,
    borderColor: getBorderColor(theme, 'light'),
  }),
  
  codeBlock: (theme: Theme) => ({
    bgcolor: getCodeBackground(theme),
    color: getCodeTextColor(theme),
    fontFamily: 'monospace',
    p: 2,
    borderRadius: 1,
    overflow: 'auto',
  }),
  
  errorBox: (theme: Theme) => ({
    bgcolor: getErrorBackground(theme),
    color: 'error.main',
    border: 1,
    borderColor: 'error.light',
    p: 2,
    borderRadius: 1,
  }),
  
  successBox: (theme: Theme) => ({
    bgcolor: getSuccessBackground(theme),
    color: 'success.main',
    border: 1,
    borderColor: 'success.light',
    p: 2,
    borderRadius: 1,
  }),
  
  warningBox: (theme: Theme) => ({
    bgcolor: getWarningBackground(theme),
    color: 'warning.main',
    border: 1,
    borderColor: 'warning.light',
    p: 2,
    borderRadius: 1,
  }),
  
  infoBox: (theme: Theme) => ({
    bgcolor: getInfoBackground(theme),
    color: 'info.main',
    border: 1,
    borderColor: 'info.light',
    p: 2,
    borderRadius: 1,
  }),
};
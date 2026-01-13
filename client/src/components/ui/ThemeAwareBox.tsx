import React from 'react';
import { Box, BoxProps } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { getContentBackground, getContentTextColor, getBorderColor } from '@/utils/themeUtils';

interface ThemeAwareBoxProps extends BoxProps {
  children: React.ReactNode;
  variant?: 'light' | 'medium' | 'dark';
  withBorder?: boolean;
  colorVariant?: 'primary' | 'secondary';
}

/**
 * A Box component that automatically adapts its background and text colors
 * based on the current theme mode (light/dark)
 */
export const ThemeAwareBox: React.FC<ThemeAwareBoxProps> = ({
  children,
  variant = 'light',
  withBorder = false,
  colorVariant = 'primary',
  sx,
  ...props
}) => {
  const theme = useTheme();

  const themeAwareStyles = {
    bgcolor: getContentBackground(theme, variant),
    color: getContentTextColor(theme, colorVariant),
    ...(withBorder && {
      border: 1,
      borderColor: getBorderColor(theme, 'light'),
    }),
  };

  return (
    <Box
      sx={{
        ...themeAwareStyles,
        ...sx,
      }}
      {...props}
    >
      {children}
    </Box>
  );
};
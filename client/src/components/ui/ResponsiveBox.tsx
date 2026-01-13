import React from 'react';
import { Box, BoxProps } from '@mui/material';

interface ResponsiveBoxProps extends BoxProps {
  children: React.ReactNode;
  variant?: 'card' | 'section' | 'flex' | 'grid';
}

/**
 * A responsive box component with common responsive patterns
 */
export const ResponsiveBox: React.FC<ResponsiveBoxProps> = ({
  children,
  variant = 'section',
  sx,
  ...props
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'card':
        return {
          p: { xs: 2, sm: 3 },
          borderRadius: 2,
          boxShadow: 1,
        };
      case 'flex':
        return {
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: { xs: 2, sm: 3 },
          alignItems: { xs: 'stretch', sm: 'center' },
        };
      case 'grid':
        return {
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(3, 1fr)',
          },
          gap: { xs: 2, sm: 3 },
        };
      default:
        return {
          mb: { xs: 2, sm: 3 },
        };
    }
  };

  return (
    <Box
      sx={{
        ...getVariantStyles(),
        ...sx,
      }}
      {...props}
    >
      {children}
    </Box>
  );
};
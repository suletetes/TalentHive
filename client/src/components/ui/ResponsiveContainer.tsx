import React from 'react';
import { Container, ContainerProps } from '@mui/material';

interface ResponsiveContainerProps extends ContainerProps {
  children: React.ReactNode;
}

/**
 * A responsive container that adjusts maxWidth based on screen size
 * and provides consistent padding
 */
export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  maxWidth = 'lg',
  sx,
  ...props
}) => {
  return (
    <Container
      maxWidth={maxWidth}
      sx={{
        px: { xs: 2, sm: 3, md: 4 },
        py: { xs: 2, sm: 3, md: 4 },
        ...sx,
      }}
      {...props}
    >
      {children}
    </Container>
  );
};
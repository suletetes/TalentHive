import React from 'react';
import { Grid, GridProps } from '@mui/material';
import { useResponsive } from '@/hooks/useResponsive';

interface ResponsiveGridProps extends Omit<GridProps, 'xs' | 'sm' | 'md' | 'lg' | 'xl'> {
  children: React.ReactNode;
  columns?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  spacing?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
}

/**
 * A responsive grid component that automatically adjusts columns and spacing
 * based on screen size
 */
export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  columns,
  spacing,
  container = true,
  ...props
}) => {
  const { getResponsiveValue, getSpacing } = useResponsive();

  const responsiveColumns = columns ? getResponsiveValue(columns) : undefined;
  const responsiveSpacing = spacing ? getResponsiveValue(spacing) : getSpacing();

  if (container) {
    return (
      <Grid
        container
        spacing={responsiveSpacing}
        {...props}
      >
        {React.Children.map(children, (child, index) => (
          <Grid
            item
            xs={responsiveColumns ? 12 / responsiveColumns : 12}
            key={index}
          >
            {child}
          </Grid>
        ))}
      </Grid>
    );
  }

  return (
    <Grid {...props}>
      {children}
    </Grid>
  );
};

interface ResponsiveGridItemProps extends GridProps {
  children: React.ReactNode;
  breakpoints?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
}

/**
 * A responsive grid item with automatic breakpoint handling
 */
export const ResponsiveGridItem: React.FC<ResponsiveGridItemProps> = ({
  children,
  breakpoints = { xs: 12, sm: 6, md: 4, lg: 3 },
  ...props
}) => {
  return (
    <Grid
      item
      xs={breakpoints.xs}
      sm={breakpoints.sm}
      md={breakpoints.md}
      lg={breakpoints.lg}
      xl={breakpoints.xl}
      {...props}
    >
      {children}
    </Grid>
  );
};
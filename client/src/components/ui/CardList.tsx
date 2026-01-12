import React from 'react';
import { Grid, Box, Skeleton } from '@mui/material';

interface CardListProps {
  children: React.ReactNode;
  loading?: boolean;
  columns?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  spacing?: number;
  skeletonCount?: number;
}

export const CardList: React.FC<CardListProps> = ({
  children,
  loading = false,
  columns = { xs: 12, sm: 6, md: 4 },
  spacing = 3,
  skeletonCount = 6,
}) => {
  if (loading) {
    return (
      <Grid container spacing={spacing}>
        {Array.from({ length: skeletonCount }).map((_, index) => (
          <Grid item {...columns} key={index}>
            <Box sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
              <Skeleton variant="rectangular" height={200} />
              <Skeleton variant="text" sx={{ mt: 2 }} />
              <Skeleton variant="text" width="60%" />
            </Box>
          </Grid>
        ))}
      </Grid>
    );
  }

  return (
    <Grid container spacing={spacing}>
      {React.Children.map(children, (child) => (
        <Grid item {...columns}>
          {child}
        </Grid>
      ))}
    </Grid>
  );
};

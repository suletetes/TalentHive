import React from 'react';
import { Box, CircularProgress, Skeleton, Typography, Grid } from '@mui/material';

// Page loading component
export const PageLoading: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => (
  <Box
    display="flex"
    flexDirection="column"
    alignItems="center"
    justifyContent="center"
    minHeight="50vh"
    p={3}
  >
    <CircularProgress size={60} sx={{ mb: 2 }} />
    <Typography variant="h6" color="text.secondary">
      {message}
    </Typography>
  </Box>
);

// List skeleton
export const ListSkeleton: React.FC<{
  items?: number;
  height?: number;
}> = ({ items = 5, height = 60 }) => (
  <Box>
    {Array.from({ length: items }).map((_, index) => (
      <Skeleton key={index} variant="rectangular" width="100%" height={height} sx={{ mb: 1 }} />
    ))}
  </Box>
);

// Grid skeleton
export const GridSkeleton: React.FC<{
  items?: number;
  columns?: number;
  height?: number;
}> = ({ items = 6, columns = 3, height = 200 }) => (
  <Grid container spacing={2}>
    {Array.from({ length: items }).map((_, index) => (
      <Grid item xs={12} sm={6} md={12 / columns} key={index}>
        <Skeleton variant="rectangular" width="100%" height={height} />
      </Grid>
    ))}
  </Grid>
);

import React, { useEffect } from 'react';
import { Box, Pagination as MuiPagination, Typography } from '@mui/material';

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  loading?: boolean;
  totalItems?: number;
  itemsPerPage?: number;
}

export const Pagination: React.FC<PaginationProps> = ({
  page,
  totalPages,
  onPageChange,
  loading = false,
  totalItems,
  itemsPerPage,
}) => {
  // Scroll to top when page changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [page]);

  if (totalPages <= 1) {
    return null;
  }

  const handleChange = (event: React.ChangeEvent<unknown>, value: number) => {
    onPageChange(value);
  };

  const getItemRange = () => {
    if (!totalItems || !itemsPerPage) return null;
    const start = (page - 1) * itemsPerPage + 1;
    const end = Math.min(page * itemsPerPage, totalItems);
    return `${start}-${end} of ${totalItems}`;
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 2,
        mt: 4,
        mb: 2,
      }}
    >
      {getItemRange() && (
        <Typography variant="body2" color="text.secondary">
          Showing {getItemRange()}
        </Typography>
      )}
      <MuiPagination
        count={totalPages}
        page={page}
        onChange={handleChange}
        disabled={loading}
        color="primary"
        size="large"
        showFirstButton
        showLastButton
        sx={{ ml: 'auto' }}
      />
    </Box>
  );
};

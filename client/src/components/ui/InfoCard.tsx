import React from 'react';
import { Card, CardProps, CardContent, Typography, Box, Skeleton } from '@mui/material';

interface InfoCardProps extends CardProps {
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  loading?: boolean;
  children?: React.ReactNode;
  action?: React.ReactNode;
}

export const InfoCard: React.FC<InfoCardProps> = ({
  title,
  subtitle,
  icon,
  loading = false,
  children,
  action,
  ...cardProps
}) => {
  return (
    <Card
      {...cardProps}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.3s ease',
        '&:hover': {
          boxShadow: 4,
        },
        ...cardProps.sx,
      }}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        {loading ? (
          <>
            <Skeleton variant="text" width="60%" height={32} />
            <Skeleton variant="text" width="80%" />
            <Skeleton variant="rectangular" height={100} sx={{ mt: 2 }} />
          </>
        ) : (
          <>
            {(title || icon) && (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {icon && (
                    <Box sx={{ color: 'primary.main' }}>
                      {icon}
                    </Box>
                  )}
                  {title && (
                    <Typography variant="h6" component="h3" fontWeight={600}>
                      {title}
                    </Typography>
                  )}
                </Box>
                {action}
              </Box>
            )}
            {subtitle && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {subtitle}
              </Typography>
            )}
            {children}
          </>
        )}
      </CardContent>
    </Card>
  );
};

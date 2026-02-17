import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  List,
  Alert,
  LinearProgress,
  Chip,
  Button
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { verificationService } from '@/services/api/verification.service';
import { VerificationRequestItem } from './VerificationRequestItem';

export const VerificationQueue: React.FC = () => {
  const [selectedBadgeType, setSelectedBadgeType] = useState<string>('all');
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['pendingVerifications', selectedBadgeType],
    queryFn: () =>
      verificationService.getPendingVerifications({
        badgeType: selectedBadgeType === 'all' ? undefined : selectedBadgeType,
        page: 1,
        limit: 50
      })
  });

  const { data: statsData } = useQuery({
    queryKey: ['verificationStats'],
    queryFn: () => verificationService.getVerificationStats()
  });

  const handleRefresh = () => {
    refetch();
    queryClient.invalidateQueries({ queryKey: ['verificationStats'] });
  };

  const requests = data?.data?.requests || [];
  const stats = statsData?.data;

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Verification Requests</Typography>
          <Button
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            size="small"
            variant="outlined"
          >
            Refresh
          </Button>
        </Box>

        {stats && (
          <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
            <Chip
              label={`Pending: ${stats.pending.total}`}
              color="warning"
              size="small"
            />
            <Chip
              label={`Approved: ${stats.approved.total}`}
              color="success"
              size="small"
            />
            <Chip
              label={`Rejected: ${stats.rejected.total}`}
              color="error"
              size="small"
            />
          </Box>
        )}

        <Tabs
          value={selectedBadgeType}
          onChange={(e, v) => setSelectedBadgeType(v)}
          sx={{ mb: 2 }}
        >
          <Tab label={`All (${stats?.pending.total || 0})`} value="all" />
          <Tab label={`Identity (${stats?.pending.identity || 0})`} value="identity" />
          <Tab label={`Skills (${stats?.pending.skills || 0})`} value="skills" />
          <Tab label={`Trusted (${stats?.pending.trusted || 0})`} value="trusted" />
        </Tabs>

        {isLoading && <LinearProgress />}

        {error && (
          <Alert severity="error">
            Failed to load verification requests
          </Alert>
        )}

        {!isLoading && !error && requests.length === 0 && (
          <Alert severity="info">
            No pending verification requests
          </Alert>
        )}

        {!isLoading && !error && requests.length > 0 && (
          <List>
            {requests.map(request => (
              <VerificationRequestItem
                key={request.requestId}
                request={request}
                onReviewComplete={handleRefresh}
              />
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );
};

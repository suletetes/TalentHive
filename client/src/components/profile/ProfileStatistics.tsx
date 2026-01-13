import { Box, Card, CardContent, Grid, Typography, Button } from '@mui/material';
import {
  Work,
  Star,
  CheckCircle,
  Schedule,
  AttachMoney,
  TrendingUp,
  Visibility,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { usersService } from '@/services/api/users.service';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface ProfileStatisticsProps {
  userId: string;
  role: 'freelancer' | 'client' | 'admin';
}

export const ProfileStatistics = ({ userId, role }: ProfileStatisticsProps) => {
  const navigate = useNavigate();

  const { data: statsData, isLoading } = useQuery({
    queryKey: ['userStats', userId],
    queryFn: () => usersService.getUserStats(userId),
    enabled: !!userId,
  });

  if (isLoading) {
    return <LoadingSpinner />;
  }

  // The API service already extracts .data, so statsData is the actual stats object
  const stats = statsData || {};

  const statItems = role === 'freelancer' 
    ? [
        { icon: Work, label: 'Total Projects', value: stats.totalProjects || 0, color: 'primary.main' },
        { icon: CheckCircle, label: 'Completed', value: stats.completedProjects || 0, color: 'success.main' },
        { icon: TrendingUp, label: 'Completion Rate', value: `${stats.completionRate || 0}%`, color: 'info.main' },
        { icon: Star, label: 'Average Rating', value: `${stats.averageRating?.toFixed(1) || 0}/5.0`, color: 'warning.main' },
        { icon: Schedule, label: 'Response Time', value: stats.responseTime || 'N/A', color: 'secondary.main' },
        { icon: AttachMoney, label: 'Total Earnings', value: `$${stats.totalEarnings?.toLocaleString() || 0}`, color: 'success.main' },
        { icon: Visibility, label: 'Profile Views', value: stats.profileViews || 0, color: 'info.main' },
      ]
    : [
        { icon: Work, label: 'Projects Posted', value: stats.totalProjectsPosted || 0, color: 'primary.main' },
        { icon: CheckCircle, label: 'Active Contracts', value: stats.activeContracts || 0, color: 'success.main' },
        { icon: Star, label: 'Average Rating', value: `${stats.averageRating?.toFixed(1) || 0}/5.0`, color: 'warning.main' },
        { icon: Visibility, label: 'Profile Views', value: stats.profileViews || 0, color: 'info.main' },
      ];

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Statistics
          </Typography>
          <Button
            size="small"
            startIcon={<Visibility />}
            onClick={() => navigate('/dashboard/profile/analytics')}
          >
            View Analytics
          </Button>
        </Box>
        <Grid container spacing={2}>
          {statItems.map((item, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                p: { xs: 1, sm: 1.5 }, 
                bgcolor: 'background.default', 
                borderRadius: 1,
                minHeight: { xs: 60, sm: 70 }
              }}>
                <item.icon sx={{ 
                  color: item.color, 
                  mr: { xs: 1, sm: 1.5 }, 
                  fontSize: { xs: 24, sm: 28 },
                  flexShrink: 0
                }} />
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography variant="body2" color="text.secondary" sx={{
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    lineHeight: 1.2
                  }}>
                    {item.label}
                  </Typography>
                  <Typography variant="h6" sx={{ 
                    fontWeight: 600,
                    fontSize: { xs: '1rem', sm: '1.25rem' },
                    lineHeight: 1.2,
                    wordBreak: 'break-word'
                  }}>
                    {item.value}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
};

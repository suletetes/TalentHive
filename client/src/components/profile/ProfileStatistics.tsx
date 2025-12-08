import { Box, Card, CardContent, Grid, Typography } from '@mui/material';
import {
  Work,
  Star,
  CheckCircle,
  Schedule,
  AttachMoney,
  TrendingUp,
} from '@mui/icons-material';';

interface ProfileStatisticsProps {
  stats: {
    totalProjects?: number;
    completedProjects?: number;
    activeContracts?: number;
    completionRate?: number;
    averageRating?: number;
    totalReviews?: number;
    responseTime?: string;
    onTimeDelivery?: number;
    totalEarnings?: number;
    totalSpent?: number;
    profileViews?: number;
  };
  role: 'freelancer' | 'client';
}

export const ProfileStatistics = ({ stats, role }: ProfileStatisticsProps) => {
  const statItems = role === 'freelancer' 
    ? [
        { icon: Work, label: 'Total Projects', value: stats.totalProjects || 0, color: 'primary.main' },
        { icon: CheckCircle, label: 'Completed', value: stats.completedProjects || 0, color: 'success.main' },
        { icon: TrendingUp, label: 'Completion Rate', value: `${stats.completionRate || 0}%`, color: 'info.main' },
        { icon: Star, label: 'Average Rating', value: `${stats.averageRating?.toFixed(1) || 0} (${stats.totalReviews || 0})`, color: 'warning.main' },
        { icon: Schedule, label: 'Response Time', value: stats.responseTime || 'N/A', color: 'secondary.main' },
        { icon: AttachMoney, label: 'Total Earnings', value: `$${stats.totalEarnings?.toLocaleString() || 0}`, color: 'success.main' },
      ]
    : [
        { icon: Work, label: 'Projects Posted', value: stats.totalProjects || 0, color: 'primary.main' },
        { icon: CheckCircle, label: 'Active Contracts', value: stats.activeContracts || 0, color: 'success.main' },
        { icon: Star, label: 'Average Rating', value: `${stats.averageRating?.toFixed(1) || 0} (${stats.totalReviews || 0})`, color: 'warning.main' },
        { icon: AttachMoney, label: 'Total Spent', value: `$${stats.totalSpent?.toLocaleString() || 0}`, color: 'info.main' },
      ];

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
        Statistics
      </Typography>
      <Grid container spacing={2}>
        {statItems.map((item, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card sx={{ height: '100%', '&:hover': { boxShadow: 3 } }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <item.icon sx={{ color: item.color, mr: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    {item.label}
                  </Typography>
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                  {item.value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

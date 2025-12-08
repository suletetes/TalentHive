import { Box, Typography, LinearProgress, Paper } from '@mui/material';
import { Star } from '@mui/icons-material';

interface RatingDistributionProps {
  ratings: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  totalReviews: number;
  averageRating: number;
}

export const RatingDistribution = ({
  ratings,
  totalReviews,
  averageRating,
}: RatingDistributionProps) => {
  const ratingLevels = [5, 4, 3, 2, 1];

  const getPercentage = (count: number) => {
    return totalReviews > 0 ? (count / totalReviews) * 100 : 0;
  };

  const getColor = (level: number) => {
    if (level >= 4) return 'success.main';
    if (level === 3) return 'warning.main';
    return 'error.main';
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
        Rating Distribution
      </Typography>

      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Box sx={{ textAlign: 'center', mr: 4 }}>
          <Typography variant="h3" sx={{ fontWeight: 600, color: 'warning.main' }}>
            {averageRating.toFixed(1)}
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 1 }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                sx={{
                  color: star <= Math.round(averageRating) ? 'warning.main' : 'grey.300',
                  fontSize: 20,
                }}
              />
            ))}
          </Box>
          <Typography variant="body2" color="text.secondary">
            {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}
          </Typography>
        </Box>

        <Box sx={{ flex: 1 }}>
          {ratingLevels.map((level) => {
            const count = ratings[level as keyof typeof ratings] || 0;
            const percentage = getPercentage(count);

            return (
              <Box key={level} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" sx={{ minWidth: 60 }}>
                  {level} <Star sx={{ fontSize: 14, verticalAlign: 'middle' }} />
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={percentage}
                  sx={{
                    flex: 1,
                    mx: 2,
                    height: 8,
                    borderRadius: 4,
                    bgcolor: 'grey.200',
                    '& .MuiLinearProgress-bar': {
                      bgcolor: getColor(level),
                      borderRadius: 4,
                    },
                  }}
                />
                <Typography variant="body2" sx={{ minWidth: 50, textAlign: 'right' }}>
                  {count} ({percentage.toFixed(0)}%)
                </Typography>
              </Box>
            );
          })}
        </Box>
      </Box>
    </Paper>
  );
};

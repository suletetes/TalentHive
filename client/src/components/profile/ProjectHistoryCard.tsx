import { Card, CardContent, Typography, Box, Chip, Avatar } from '@mui/material';
import { Star, CalendarToday, AttachMoney } from '@mui/icons-material';
import { format } from 'date-fns';

interface ProjectHistoryCardProps {
  project: {
    _id: string;
    title: string;
    description: string;
    status: string;
    budget: number;
    client?: {
      _id: string;
      firstName: string;
      lastName: string;
      avatar?: string;
    };
    freelancer?: {
      _id: string;
      firstName: string;
      lastName: string;
      avatar?: string;
    };
    rating?: number;
    review?: string;
    completedAt?: string;
    createdAt: string;
  };
  role: 'freelancer' | 'client';
}

export const ProjectHistoryCard = ({ project, role }: ProjectHistoryCardProps) => {
  const otherUser = role === 'freelancer' ? project.client : project.freelancer;
  const statusColors: Record<string, string> = {
    completed: 'success',
    'in-progress': 'info',
    open: 'warning',
    cancelled: 'error',
  };

  return (
    <Card sx={{ mb: 2, '&:hover': { boxShadow: 3 }, transition: 'box-shadow 0.3s' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>
              {project.title}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {project.description.length > 150
                ? `${project.description.substring(0, 150)}...`
                : project.description}
            </Typography>
          </Box>
          <Chip
            label={project.status}
            color={statusColors[project.status] as any || 'default'}
            size="small"
            sx={{ ml: 2 }}
          />
        </Box>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
          {otherUser && (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Avatar
                src={otherUser.avatar}
                sx={{ width: 32, height: 32, mr: 1 }}
              >
                {otherUser.firstName[0]}
              </Avatar>
              <Typography variant="body2">
                {otherUser.firstName} {otherUser.lastName}
              </Typography>
            </Box>
          )}

          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <AttachMoney sx={{ fontSize: 18, mr: 0.5, color: 'success.main' }} />
            <Typography variant="body2">${project.budget.toLocaleString()}</Typography>
          </Box>

          {project.rating && (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Star sx={{ fontSize: 18, mr: 0.5, color: 'warning.main' }} />
              <Typography variant="body2">{project.rating.toFixed(1)}</Typography>
            </Box>
          )}

          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <CalendarToday sx={{ fontSize: 18, mr: 0.5, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary">
              {project.completedAt
                ? format(new Date(project.completedAt), 'MMM dd, yyyy')
                : format(new Date(project.createdAt), 'MMM dd, yyyy')}
            </Typography>
          </Box>
        </Box>

        {project.review && (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
              "{project.review}"
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

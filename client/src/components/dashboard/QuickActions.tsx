import React from 'react';
import { Card, CardContent, Typography, Button, Stack } from '@mui/material';
import { Add, Work, Send, Message, Payment } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';

export const QuickActions: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);

  const getActions = () => {
    if (user?.role === 'client') {
      return [
        {
          label: 'Post New Project',
          icon: <Add />,
          onClick: () => navigate('/dashboard/projects/new'),
          color: 'primary' as const,
        },
        {
          label: 'Find Freelancers',
          icon: <Work />,
          onClick: () => navigate('/freelancers'),
          color: 'secondary' as const,
        },
        {
          label: 'View Contracts',
          icon: <Payment />,
          onClick: () => navigate('/dashboard/contracts'),
          color: 'info' as const,
        },
        {
          label: 'Messages',
          icon: <Message />,
          onClick: () => navigate('/dashboard/messages'),
          color: 'success' as const,
        },
      ];
    } else if (user?.role === 'freelancer') {
      return [
        {
          label: 'Find Work',
          icon: <Work />,
          onClick: () => navigate('/projects'),
          color: 'primary' as const,
        },
        {
          label: 'My Proposals',
          icon: <Send />,
          onClick: () => navigate('/dashboard/proposals'),
          color: 'secondary' as const,
        },
        {
          label: 'View Contracts',
          icon: <Payment />,
          onClick: () => navigate('/dashboard/contracts'),
          color: 'info' as const,
        },
        {
          label: 'Messages',
          icon: <Message />,
          onClick: () => navigate('/dashboard/messages'),
          color: 'success' as const,
        },
      ];
    }
    return [];
  };

  const actions = getActions();

  if (actions.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Quick Actions
        </Typography>
        <Stack spacing={2}>
          {actions.map((action, index) => (
            <Button
              key={index}
              variant="outlined"
              color={action.color}
              startIcon={action.icon}
              onClick={action.onClick}
              fullWidth
              sx={{ justifyContent: 'flex-start' }}
            >
              {action.label}
            </Button>
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
};

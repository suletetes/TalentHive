import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Chip,
  LinearProgress,
  Button,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';

interface Milestone {
  _id: string;
  title: string;
  description: string;
  amount: number;
  dueDate: string;
  status: string;
  approvedAt?: string;
  submittedAt?: string;
}

interface ContractTimelineProps {
  milestones: Milestone[];
  onMilestoneClick?: (milestone: Milestone) => void;
}

export const ContractTimeline: React.FC<ContractTimelineProps> = ({
  milestones,
  onMilestoneClick,
}) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
      case 'paid':
        return <CheckCircleIcon sx={{ color: 'success.main' }} />;
      case 'pending':
      case 'in_progress':
        return <ScheduleIcon sx={{ color: 'info.main' }} />;
      case 'rejected':
        return <ErrorIcon sx={{ color: 'error.main' }} />;
      default:
        return <ScheduleIcon sx={{ color: 'text.secondary' }} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
      case 'paid':
        return 'success';
      case 'submitted':
        return 'warning';
      case 'rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  const completedMilestones = milestones.filter(
    (m) => m.status === 'approved' || m.status === 'paid'
  ).length;
  const progress = (completedMilestones / milestones.length) * 100;

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Project Timeline
        </Typography>

        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Progress
            </Typography>
            <Typography variant="body2" fontWeight="bold">
              {completedMilestones}/{milestones.length} Completed
            </Typography>
          </Box>
          <LinearProgress variant="determinate" value={progress} sx={{ height: 8, borderRadius: 4 }} />
        </Box>

        <Stepper orientation="vertical">
          {milestones.map((milestone, _index) => (
            <Step key={milestone._id} active={true}>
              <StepLabel
                icon={getStatusIcon(milestone.status)}
                sx={{ cursor: 'pointer' }}
                onClick={() => onMilestoneClick?.(milestone)}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle2" fontWeight="bold">
                      {milestone.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Due: {new Date(milestone.dueDate).toLocaleDateString()}
                    </Typography>
                  </Box>
                  <Chip
                    label={milestone.status.toUpperCase()}
                    color={getStatusColor(milestone.status)}
                    size="small"
                  />
                  <Typography variant="body2" fontWeight="bold">
                    ${milestone.amount.toLocaleString()}
                  </Typography>
                </Box>
              </StepLabel>
              <StepContent>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {milestone.description}
                </Typography>
                {milestone.submittedAt && (
                  <Typography variant="caption" color="text.secondary">
                    Submitted: {new Date(milestone.submittedAt).toLocaleDateString()}
                  </Typography>
                )}
                {milestone.approvedAt && (
                  <Typography variant="caption" color="success.main" display="block">
                    Approved: {new Date(milestone.approvedAt).toLocaleDateString()}
                  </Typography>
                )}
                {onMilestoneClick && (
                  <Button
                    size="small"
                    onClick={() => onMilestoneClick(milestone)}
                    sx={{ mt: 1 }}
                  >
                    View Details
                  </Button>
                )}
              </StepContent>
            </Step>
          ))}
        </Stepper>
      </CardContent>
    </Card>
  );
};

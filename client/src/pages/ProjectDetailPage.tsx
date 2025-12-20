import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Chip,
  Button,
  Avatar,
  Divider,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  IconButton,
  Stack,
} from '@mui/material';
import {
  AccessTime,
  AttachMoney,
  LocationOn,
  CalendarToday,
  Close as CloseIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { useProject } from '@/hooks/api/useProjects';
import { proposalsService } from '@/services/api/proposals.service';
import { projectsService } from '@/services/api/projects.service';
import { MessageButton } from '@/components/messaging/MessageButton';
import { format, isValid, parseISO } from 'date-fns';
import toast from 'react-hot-toast';

// Helper function to get category display name
const getCategoryDisplay = (category: any): string => {
  if (!category) return 'General';
  
  // If category is an object with name property (populated)
  if (typeof category === 'object' && category?.name) {
    return category.name;
  }
  
  // If category is a string
  if (typeof category === 'string') {
    // Check if it looks like a MongoDB ObjectId (24 hex characters)
    const isObjectId = /^[a-f\d]{24}$/i.test(category);
    if (isObjectId) {
      return 'General'; // Return default instead of showing ID
    }
    // It's a regular string (category name)
    return category;
  }
  
  return 'General';
};

// Helper function to get skill display name
const getSkillDisplay = (skill: any): string => {
  if (!skill) return '';
  
  // If skill is an object with name property (populated)
  if (typeof skill === 'object' && skill?.name) {
    return skill.name;
  }
  
  // If skill is a string
  if (typeof skill === 'string') {
    // Check if it looks like a MongoDB ObjectId (24 hex characters)
    const isObjectId = /^[a-f\d]{24}$/i.test(skill);
    if (isObjectId) {
      return ''; // Return empty to filter out
    }
    return skill;
  }
  
  return '';
};

interface Milestone {
  title: string;
  description: string;
  amount: number;
  duration: number;
}

export const ProjectDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const queryClient = useQueryClient();
  const { data: projectResponse, isLoading, error } = useProject(id || '');

  const [proposalDialogOpen, setProposalDialogOpen] = useState(false);
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [bidAmount, setBidAmount] = useState('');
  const [duration, setDuration] = useState('');
  const [milestones, setMilestones] = useState<Milestone[]>([]);

  // Submit proposal mutation
  const submitProposalMutation = useMutation({
    mutationFn: (data: any) => {
      if (isEditMode && userProposal?._id) {
        return proposalsService.updateProposal(userProposal._id, data);
      }
      return proposalsService.createProposal(id || '', data);
    },
    onSuccess: async () => {
      // Close dialog and show success message first
      setProposalDialogOpen(false);
      resetForm();
      toast.success(isEditMode ? 'Proposal updated successfully!' : 'Proposal submitted successfully!');
      
      // Small delay to ensure backend has updated
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Invalidate and refetch project detail cache
      await queryClient.invalidateQueries({ queryKey: ['projects', 'detail', id] });
      await queryClient.refetchQueries({ queryKey: ['projects', 'detail', id] });
      queryClient.invalidateQueries({ queryKey: ['my-proposals'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to submit proposal');
    },
  });

  // Withdraw proposal mutation
  const withdrawProposalMutation = useMutation({
    mutationFn: () => proposalsService.withdrawProposal(userProposal?._id),
    onSuccess: async () => {
      // Close dialog and show success message first
      setWithdrawDialogOpen(false);
      toast.success('Proposal withdrawn successfully');
      
      // Small delay to ensure backend has updated
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Invalidate and refetch project detail cache
      await queryClient.invalidateQueries({ queryKey: ['projects', 'detail', id] });
      await queryClient.refetchQueries({ queryKey: ['projects', 'detail', id] });
      queryClient.invalidateQueries({ queryKey: ['my-proposals'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to withdraw proposal');
    },
  });

  // Toggle proposal acceptance mutation
  const toggleProposalsMutation = useMutation({
    mutationFn: (projectId: string) => projectsService.toggleProposalAcceptance(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', 'detail', id] });
      toast.success('Proposal acceptance updated');
    },
    onError: () => {
      toast.error('Failed to update proposal acceptance');
    },
  });

  const resetForm = () => {
    setCoverLetter('');
    setBidAmount('');
    setDuration('');
    setMilestones([]);
    setIsEditMode(false);
  };

  const openEditDialog = () => {
    if (userProposal) {
      setCoverLetter(userProposal.coverLetter || '');
      // Use bidAmount from backend
      setBidAmount(userProposal.bidAmount?.toString() || '');
      setDuration(userProposal.timeline?.duration?.toString() || '');
      setMilestones(userProposal.milestones || []);
      setIsEditMode(true);
      setProposalDialogOpen(true);
    }
  };

  const openNewProposalDialog = () => {
    resetForm();
    setProposalDialogOpen(true);
  };

  const handleAddMilestone = () => {
    setMilestones([...milestones, { title: '', description: '', amount: 0, duration: 0 }]);
  };

  const handleRemoveMilestone = (index: number) => {
    setMilestones(milestones.filter((_, i) => i !== index));
  };

  const handleMilestoneChange = (index: number, field: keyof Milestone, value: any) => {
    const updated = [...milestones];
    updated[index] = { ...updated[index], [field]: value };
    setMilestones(updated);
  };

  const validateProposal = (): boolean => {
    const project = projectResponse?.data;
    const bid = parseFloat(bidAmount);
    const dur = parseInt(duration);

    if (!coverLetter.trim()) {
      toast.error('Please write a cover letter');
      return false;
    }

    if (coverLetter.trim().length < 50) {
      toast.error('Cover letter must be at least 50 characters');
      return false;
    }

    if (!bidAmount || isNaN(bid) || bid <= 0) {
      toast.error('Please enter a valid bid amount');
      return false;
    }

    // Validate bid is within project budget range
    if (project?.budget?.min && bid < project.budget.min) {
      toast.error(`Bid amount must be at least $${project.budget.min} (project minimum)`);
      return false;
    }

    if (project?.budget?.max && bid > project.budget.max) {
      toast.error(`Bid amount cannot exceed $${project.budget.max} (project maximum)`);
      return false;
    }

    if (!duration || isNaN(dur) || dur <= 0) {
      toast.error('Please enter a valid duration');
      return false;
    }

    if (dur > 365) {
      toast.error('Duration cannot exceed 365 days');
      return false;
    }

    // Validate milestones if provided
    if (milestones.length > 0) {
      const totalMilestoneAmount = milestones.reduce((sum, m) => sum + (m.amount || 0), 0);
      
      for (let i = 0; i < milestones.length; i++) {
        const m = milestones[i];
        if (!m.title.trim()) {
          toast.error(`Milestone ${i + 1}: Title is required`);
          return false;
        }
        if (!m.amount || m.amount <= 0) {
          toast.error(`Milestone ${i + 1}: Amount must be greater than 0`);
          return false;
        }
        if (!m.duration || m.duration <= 0) {
          toast.error(`Milestone ${i + 1}: Duration must be greater than 0`);
          return false;
        }
      }

      if (Math.abs(totalMilestoneAmount - bid) > 0.01) {
        toast.error(`Milestone amounts ($${totalMilestoneAmount}) must equal your bid amount ($${bid})`);
        return false;
      }
    }

    return true;
  };

  const handleSubmitProposal = () => {
    if (!validateProposal()) {
      return;
    }

    submitProposalMutation.mutate({
      coverLetter,
      bidAmount: parseFloat(bidAmount),
      timeline: {
        duration: parseInt(duration),
        unit: 'days',
      },
      milestones: milestones.length > 0 ? milestones : undefined,
    });
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading project details..." />;
  }

  if (error || !projectResponse?.data) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <ErrorState error={error} onRetry={() => window.location.reload()} />
      </Container>
    );
  }

  const project = projectResponse.data;
  
  const isFreelancer = user?.role === 'freelancer';
  const isClient = user?.role === 'client';
  
  // Check if user already applied (exclude withdrawn proposals)
  const userProposal = project.proposals?.find((p: any) => {
    const proposalFreelancerId = typeof p.freelancer === 'object' ? p.freelancer?._id : p.freelancer;
    return proposalFreelancerId === user?._id && p.status !== 'withdrawn';
  });
  const hasApplied = !!userProposal;



  // Helper function to safely format dates
  const formatDate = (dateString: string | Date | undefined, formatStr: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
      return isValid(date) ? format(date, formatStr) : 'N/A';
    } catch {
      return 'N/A';
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Paper sx={{ p: 4, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Box flex={1}>
            <Typography variant="h4" gutterBottom>
              {project.title}
            </Typography>
            <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
              <Chip label={getCategoryDisplay(project.category)} color="primary" size="small" />
              <Chip
                label={project.status?.replace('_', ' ').toUpperCase()}
                color={project.status === 'open' ? 'success' : 'default'}
                size="small"
              />
              <Chip
                icon={<CalendarToday />}
                label={`Posted ${formatDate(project.createdAt, 'MMM dd, yyyy')}`}
                variant="outlined"
                size="small"
              />
            </Box>
          </Box>
        </Box>

        {/* Key Info Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={4}>
            <Card variant="outlined">
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <AttachMoney color="primary" />
                  <Typography variant="subtitle2" color="text.secondary">
                    Budget
                  </Typography>
                </Box>
                <Typography variant="h6">
                  ${project.budget?.min} - ${project.budget?.max}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {project.budget?.type === 'fixed' ? 'Fixed Price' : 'Hourly Rate'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card variant="outlined">
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <AccessTime color="primary" />
                  <Typography variant="subtitle2" color="text.secondary">
                    Timeline
                  </Typography>
                </Box>
                <Typography variant="h6">
                  {project.timeline?.duration} {project.timeline?.unit}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Project Duration
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card variant="outlined">
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <LocationOn color="primary" />
                  <Typography variant="subtitle2" color="text.secondary">
                    Location
                  </Typography>
                </Box>
                <Typography variant="h6">Remote</Typography>
                <Typography variant="caption" color="text.secondary">
                  Work from anywhere
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Action Button */}
        {isFreelancer && project.status === 'open' && (
          <>
            {!hasApplied ? (
              <Button
                variant="contained"
                size="large"
                fullWidth
                onClick={openNewProposalDialog}
              >
                Submit Proposal
              </Button>
            ) : (
              <Box sx={{ display: 'flex', gap: 1, flexDirection: 'column' }}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="outlined"
                    size="large"
                    fullWidth
                    onClick={() => navigate(`/dashboard/proposals`)}
                  >
                    View Proposal
                  </Button>
                  <Button
                    variant="outlined"
                    size="large"
                    fullWidth
                    onClick={openEditDialog}
                  >
                    Edit
                  </Button>
                </Box>
                <Button
                  variant="outlined"
                  color="error"
                  size="large"
                  fullWidth
                  onClick={() => setWithdrawDialogOpen(true)}
                >
                  Withdraw Proposal
                </Button>
              </Box>
            )}
          </>
        )}
        
        {isClient && user?._id === project.client?._id && (
          <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
            <Button
              variant="outlined"
              size="large"
              fullWidth
              onClick={() => navigate(`/dashboard/projects/${id}/edit`)}
            >
              Edit Project
            </Button>
            <Button
              variant="contained"
              size="large"
              fullWidth
              onClick={() => navigate(`/dashboard/projects/${id}/proposals`)}
            >
              View Proposals ({project.proposals?.filter((p: any) => p.status === 'submitted' || p.status === 'accepted').length || 0})
            </Button>
            <Button
              variant={project.acceptingProposals ? 'outlined' : 'contained'}
              color={project.acceptingProposals ? 'error' : 'success'}
              size="large"
              fullWidth
              onClick={() => toggleProposalsMutation.mutate(project._id)}
              disabled={toggleProposalsMutation.isPending}
            >
              {project.acceptingProposals ? 'Close Proposals' : 'Open Proposals'}
            </Button>
          </Box>
        )}
      </Paper>

      <Grid container spacing={3}>
        {/* Main Content */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Project Description
            </Typography>
            <Typography variant="body1" paragraph sx={{ whiteSpace: 'pre-wrap' }}>
              {project.description}
            </Typography>
          </Paper>

          {project.requirements && project.requirements.length > 0 && (
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Requirements
              </Typography>
              <Box component="ul" sx={{ pl: 2 }}>
                {project.requirements.map((req, index) => (
                  <li key={index}>
                    <Typography variant="body1" paragraph>
                      {req}
                    </Typography>
                  </li>
                ))}
              </Box>
            </Paper>
          )}

          {project.skills && project.skills.length > 0 && (
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Required Skills
              </Typography>
              <Box display="flex" gap={1} flexWrap="wrap">
                {project.skills
                  .map((skill) => getSkillDisplay(skill))
                  .filter((s) => s) // Filter out empty strings (ObjectIds)
                  .map((skillName) => (
                    <Chip 
                      key={skillName} 
                      label={skillName} 
                      variant="outlined" 
                    />
                  ))}
              </Box>
            </Paper>
          )}
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          {project.client && (
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                About the Client
              </Typography>
              <Box 
                display="flex" 
                alignItems="center" 
                gap={2} 
                mb={2}
                sx={{ cursor: 'pointer' }}
                onClick={() => navigate(`/client/${project.client.profileSlug || project.client._id}`)}
              >
                <Avatar
                  src={project.client?.profile?.avatar}
                  sx={{ width: 56, height: 56 }}
                >
                  {project.client?.profile?.firstName?.[0]}
                </Avatar>
                <Box flex={1}>
                  <Typography variant="subtitle1" fontWeight="medium" color="primary">
                    {project.client?.profile?.firstName} {project.client?.profile?.lastName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Click to view profile
                  </Typography>
                </Box>
              </Box>
              {user?.role === 'freelancer' && project.client?._id && (
                <Box sx={{ display: 'flex', gap: 1, flexDirection: 'column' }}>
                  <Button
                    variant="outlined"
                    size="small"
                    fullWidth
                    onClick={() => navigate(`/client/${project.client.profileSlug || project.client._id}`)}
                  >
                    View Profile
                  </Button>
                  <MessageButton 
                    userId={project.client._id} 
                    fullWidth 
                    size="small"
                  />
                </Box>
              )}
            </Paper>
          )}

          {project.organization && (
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Organization
              </Typography>
              <Box display="flex" alignItems="center" gap={2} mb={2}>
                {project.organization?.logo && (
                  <Avatar
                    src={project.organization.logo}
                    sx={{ width: 56, height: 56 }}
                  >
                    {project.organization?.name?.[0]}
                  </Avatar>
                )}
                <Box flex={1}>
                  <Typography variant="subtitle1" fontWeight="medium">
                    {project.organization?.name}
                  </Typography>
                  {project.organization?.budget && (
                    <Typography variant="caption" color="text.secondary">
                      Budget: ${project.organization.budget.spent} / ${project.organization.budget.total}
                    </Typography>
                  )}
                </Box>
              </Box>
            </Paper>
          )}

          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Project Activity
            </Typography>
            <Stack spacing={2}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Proposals
                </Typography>
                <Typography variant="h6">{project.proposals?.length || 0}</Typography>
              </Box>
              <Divider />
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Posted
                </Typography>
                <Typography variant="body1">
                  {formatDate(project.createdAt, 'MMMM dd, yyyy')}
                </Typography>
              </Box>
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      {/* Withdraw Confirmation Dialog */}
      <Dialog
        open={withdrawDialogOpen}
        onClose={() => setWithdrawDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Withdraw Proposal</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to withdraw your proposal? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setWithdrawDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={() => withdrawProposalMutation.mutate()}
            color="error"
            variant="contained"
            disabled={withdrawProposalMutation.isPending}
          >
            {withdrawProposalMutation.isPending ? 'Withdrawing...' : 'Withdraw'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Submit/Edit Proposal Dialog */}
      <Dialog
        open={proposalDialogOpen}
        onClose={() => setProposalDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">{isEditMode ? 'Edit Proposal' : 'Submit Proposal'}</Typography>
            <IconButton onClick={() => setProposalDialogOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Alert severity="info" sx={{ mb: 3 }}>
            Write a compelling proposal that highlights your skills and experience relevant to this project.
          </Alert>

          <TextField
            label="Cover Letter"
            multiline
            rows={6}
            fullWidth
            value={coverLetter}
            onChange={(e) => setCoverLetter(e.target.value)}
            placeholder="Explain why you're the best fit for this project..."
            sx={{ mb: 3 }}
          />

          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Bid Amount ($)"
                type="number"
                fullWidth
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                placeholder={project?.budget?.min?.toString() || '5000'}
                helperText={
                  project?.budget?.min && project?.budget?.max
                    ? `Project budget: $${project.budget.min} - $${project.budget.max}`
                    : 'Enter your proposed amount'
                }
                inputProps={{ min: project?.budget?.min || 0, max: project?.budget?.max }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Duration (days)"
                type="number"
                fullWidth
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder={project?.timeline?.duration?.toString() || '30'}
                helperText={
                  project?.timeline?.duration
                    ? `Project timeline: ${project.timeline.duration} ${project.timeline.unit}`
                    : 'Enter estimated completion time'
                }
                inputProps={{ min: 1, max: 365 }}
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">Milestones (Optional)</Typography>
            <Button
              startIcon={<AddIcon />}
              onClick={handleAddMilestone}
              size="small"
            >
              Add Milestone
            </Button>
          </Box>

          {milestones.map((milestone, index) => (
            <Card key={index} variant="outlined" sx={{ mb: 2 }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="subtitle2">Milestone {index + 1}</Typography>
                  <IconButton
                    size="small"
                    onClick={() => handleRemoveMilestone(index)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      label="Title"
                      fullWidth
                      size="small"
                      value={milestone.title}
                      onChange={(e) => handleMilestoneChange(index, 'title', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="Description"
                      fullWidth
                      size="small"
                      multiline
                      rows={2}
                      value={milestone.description}
                      onChange={(e) => handleMilestoneChange(index, 'description', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      label="Amount ($)"
                      type="number"
                      fullWidth
                      size="small"
                      value={milestone.amount}
                      onChange={(e) => handleMilestoneChange(index, 'amount', parseFloat(e.target.value) || 0)}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      label="Duration (days)"
                      type="number"
                      fullWidth
                      size="small"
                      value={milestone.duration}
                      onChange={(e) => handleMilestoneChange(index, 'duration', parseInt(e.target.value) || 0)}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          ))}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setProposalDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmitProposal}
            variant="contained"
            disabled={submitProposalMutation.isPending}
          >
            {submitProposalMutation.isPending
              ? isEditMode
                ? 'Updating...'
                : 'Submitting...'
              : isEditMode
                ? 'Update Proposal'
                : 'Submit Proposal'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

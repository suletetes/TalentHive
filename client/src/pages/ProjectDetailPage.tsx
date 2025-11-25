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
  const [coverLetter, setCoverLetter] = useState('');
  const [bidAmount, setBidAmount] = useState('');
  const [duration, setDuration] = useState('');
  const [milestones, setMilestones] = useState<Milestone[]>([]);

  // Submit proposal mutation
  const submitProposalMutation = useMutation({
    mutationFn: (data: any) => proposalsService.createProposal(id || '', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-proposals'] });
      toast.success('Proposal submitted successfully!');
      setProposalDialogOpen(false);
      resetForm();
      navigate('/dashboard/proposals');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to submit proposal');
    },
  });

  const resetForm = () => {
    setCoverLetter('');
    setBidAmount('');
    setDuration('');
    setMilestones([]);
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

  const handleSubmitProposal = () => {
    if (!coverLetter.trim()) {
      toast.error('Please write a cover letter');
      return;
    }
    if (!bidAmount || parseFloat(bidAmount) <= 0) {
      toast.error('Please enter a valid bid amount');
      return;
    }
    if (!duration || parseInt(duration) <= 0) {
      toast.error('Please enter a valid duration');
      return;
    }

    submitProposalMutation.mutate({
      coverLetter,
      proposedBudget: {
        amount: parseFloat(bidAmount),
        type: 'fixed',
      },
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
  
  // Check if user already applied
  const userProposal = project.proposals?.find((p: any) => {
    const proposalFreelancerId = typeof p.freelancer === 'object' ? p.freelancer?._id : p.freelancer;
    return proposalFreelancerId === user?._id;
  });
  const hasApplied = !!userProposal;

  console.log(`[PROJECT DETAIL] ========== START PROJECT DEBUG ==========`);
  console.log(`[PROJECT DETAIL] User ID: ${user?._id}`);
  console.log(`[PROJECT DETAIL] User role: ${user?.role}`);
  console.log(`[PROJECT DETAIL] Is freelancer: ${isFreelancer}`);
  console.log(`[PROJECT DETAIL] Is client: ${isClient}`);
  console.log(`[PROJECT DETAIL] Project ID: ${project._id}`);
  console.log(`[PROJECT DETAIL] Project status: ${project.status}`);
  console.log(`[PROJECT DETAIL] Project category:`, project.category);
  console.log(`[PROJECT DETAIL] Category type:`, typeof project.category);
  if (typeof project.category === 'object') {
    console.log(`[PROJECT DETAIL] Category name:`, project.category?.name);
    console.log(`[PROJECT DETAIL] Category ID:`, project.category?._id);
  }
  console.log(`[PROJECT DETAIL] Project skills:`, project.skills);
  console.log(`[PROJECT DETAIL] Skills type:`, typeof project.skills);
  console.log(`[PROJECT DETAIL] Project proposals count: ${project.proposals?.length || 0}`);
  if (project.proposals && project.proposals.length > 0) {
    console.log(`[PROJECT DETAIL] First proposal:`, project.proposals[0]);
    console.log(`[PROJECT DETAIL] First proposal freelancer:`, project.proposals[0].freelancer);
    console.log(`[PROJECT DETAIL] First proposal freelancer type:`, typeof project.proposals[0].freelancer);
  }
  console.log(`[PROJECT DETAIL] User proposal found:`, userProposal);
  console.log(`[PROJECT DETAIL] User has applied: ${hasApplied}`);
  console.log(`[PROJECT DETAIL] ========== END PROJECT DEBUG ==========`);

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
                onClick={() => setProposalDialogOpen(true)}
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
                    onClick={() => setProposalDialogOpen(true)}
                  >
                    Edit
                  </Button>
                </Box>
                <Button
                  variant="outlined"
                  color="error"
                  size="large"
                  fullWidth
                  onClick={() => {
                    if (window.confirm('Are you sure you want to withdraw your proposal?')) {
                      console.log(`[PROJECT DETAIL] Withdrawing proposal: ${userProposal?._id}`);
                      // TODO: Implement withdraw proposal functionality
                      toast.success('Proposal withdrawn');
                    }
                  }}
                >
                  Withdraw Proposal
                </Button>
              </Box>
            )}
          </>
        )}
        
        {isClient && (
          <Button
            variant="contained"
            size="large"
            fullWidth
            onClick={() => navigate(`/dashboard/projects/${id}/proposals`)}
          >
            View Proposals ({project.proposals?.length || 0})
          </Button>
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
              <Box display="flex" alignItems="center" gap={2} mb={2}>
                <Avatar
                  src={project.client?.profile?.avatar}
                  sx={{ width: 56, height: 56 }}
                >
                  {project.client?.profile?.firstName?.[0]}
                </Avatar>
                <Box flex={1}>
                  <Typography variant="subtitle1" fontWeight="medium">
                    {project.client?.profile?.firstName} {project.client?.profile?.lastName}
                  </Typography>
                </Box>
              </Box>
              {user?.role === 'freelancer' && project.client?._id && (
                <MessageButton 
                  userId={project.client._id} 
                  fullWidth 
                  size="small"
                />
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
                <Typography variant="h6">0</Typography>
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

      {/* Submit Proposal Dialog */}
      <Dialog
        open={proposalDialogOpen}
        onClose={() => setProposalDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Submit Proposal</Typography>
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
                placeholder="5000"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Duration (days)"
                type="number"
                fullWidth
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="30"
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
            {submitProposalMutation.isPending ? 'Submitting...' : 'Submit Proposal'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

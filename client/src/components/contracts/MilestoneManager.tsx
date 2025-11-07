import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress,
  Divider,
  Grid,
} from '@mui/material';
import {
  CheckCircle,
  Schedule,
  AttachMoney,
  ExpandMore,
  Upload,
  Visibility,
  ThumbUp,
  ThumbDown,
  Edit,
  Add,
  Delete,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { apiService } from '@/services/api';

interface MilestoneManagerProps {
  contract: {
    _id: string;
    status: string;
    milestones: Array<{
      _id: string;
      title: string;
      description: string;
      amount: number;
      dueDate: string;
      status: 'pending' | 'in_progress' | 'submitted' | 'approved' | 'rejected' | 'paid';
      submittedAt?: string;
      approvedAt?: string;
      rejectedAt?: string;
      clientFeedback?: string;
      freelancerNotes?: string;
      deliverables: Array<{
        _id: string;
        title: string;
        description: string;
        type: 'file' | 'link' | 'text' | 'code';
        content: string;
        status: string;
        submittedAt?: string;
        metadata?: {
          fileSize?: number;
          fileType?: string;
          originalName?: string;
        };
      }>;
    }>;
  };
  userRole: 'client' | 'freelancer';
}

export const MilestoneManager: React.FC<MilestoneManagerProps> = ({
  contract,
  userRole,
}) => {
  const [selectedMilestone, setSelectedMilestone] = useState<any>(null);
  const [actionType, setActionType] = useState<'submit' | 'approve' | 'reject' | null>(null);
  const [feedback, setFeedback] = useState('');
  const [deliverables, setDeliverables] = useState<any[]>([]);
  const [newDeliverable, setNewDeliverable] = useState({
    title: '',
    description: '',
    type: 'text' as 'file' | 'link' | 'text' | 'code',
    content: '',
  });

  const queryClient = useQueryClient();

  const submitMilestoneMutation = useMutation({
    mutationFn: (data: any) => 
      apiService.post(`/contracts/${contract._id}/milestones/${selectedMilestone._id}/submit`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      toast.success('Milestone submitted successfully!');
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to submit milestone');
    },
  });

  const approveMilestoneMutation = useMutation({
    mutationFn: (data: any) => 
      apiService.post(`/contracts/${contract._id}/milestones/${selectedMilestone._id}/approve`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      toast.success('Milestone approved successfully!');
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to approve milestone');
    },
  });

  const rejectMilestoneMutation = useMutation({
    mutationFn: (data: any) => 
      apiService.post(`/contracts/${contract._id}/milestones/${selectedMilestone._id}/reject`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      toast.success('Milestone rejected');
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to reject milestone');
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'default';
      case 'in_progress': return 'primary';
      case 'submitted': return 'warning';
      case 'approved': return 'success';
      case 'rejected': return 'error';
      case 'paid': return 'success';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
      case 'paid':
        return <CheckCircle color="success" />;
      case 'submitted':
        return <Schedule color="warning" />;
      default:
        return <Schedule />;
    }
  };

  const canSubmit = (milestone: any) => {
    return userRole === 'freelancer' && 
           ['pending', 'in_progress', 'rejected'].includes(milestone.status);
  };

  const canApprove = (milestone: any) => {
    return userRole === 'client' && milestone.status === 'submitted';
  };

  const handleAction = (milestone: any, action: 'submit' | 'approve' | 'reject') => {
    setSelectedMilestone(milestone);
    setActionType(action);
    setFeedback('');
    
    if (action === 'submit') {
      setDeliverables(milestone.deliverables || []);
    }
  };

  const handleCloseDialog = () => {
    setSelectedMilestone(null);
    setActionType(null);
    setFeedback('');
    setDeliverables([]);
    setNewDeliverable({
      title: '',
      description: '',
      type: 'text',
      content: '',
    });
  };

  const handleSubmitAction = () => {
    const data: any = {};

    if (actionType === 'submit') {
      data.deliverables = deliverables;
      data.freelancerNotes = feedback;
      submitMilestoneMutation.mutate(data);
    } else if (actionType === 'approve') {
      data.clientFeedback = feedback;
      approveMilestoneMutation.mutate(data);
    } else if (actionType === 'reject') {
      data.clientFeedback = feedback;
      rejectMilestoneMutation.mutate(data);
    }
  };

  const addDeliverable = () => {
    if (newDeliverable.title && newDeliverable.content) {
      setDeliverables([...deliverables, { ...newDeliverable, _id: Date.now().toString() }]);
      setNewDeliverable({
        title: '',
        description: '',
        type: 'text',
        content: '',
      });
    }
  };

  const removeDeliverable = (index: number) => {
    setDeliverables(deliverables.filter((_, i) => i !== index));
  };

  const getOverallProgress = () => {
    const completedMilestones = contract.milestones.filter(
      m => ['approved', 'paid'].includes(m.status)
    ).length;
    return Math.round((completedMilestones / contract.milestones.length) * 100);
  };

  return (
    <Box>
      {/* Progress Overview */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Project Progress
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <LinearProgress 
              variant="determinate" 
              value={getOverallProgress()} 
              sx={{ flex: 1, height: 8, borderRadius: 4 }}
            />
            <Typography variant="body2" color="text.secondary">
              {getOverallProgress()}%
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            {contract.milestones.filter(m => ['approved', 'paid'].includes(m.status)).length} of {contract.milestones.length} milestones completed
          </Typography>
        </CardContent>
      </Card>

      {/* Milestones List */}
      <Typography variant="h6" gutterBottom>
        Milestones ({contract.milestones.length})
      </Typography>

      {contract.milestones.map((milestone, index) => (
        <Card key={milestone._id} sx={{ mb: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" gutterBottom>
                  {milestone.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {milestone.description}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {getStatusIcon(milestone.status)}
                <Chip
                  label={milestone.status.replace('_', ' ').toUpperCase()}
                  color={getStatusColor(milestone.status) as any}
                  size="small"
                />
              </Box>
            </Box>

            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12} sm={4}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <AttachMoney fontSize="small" />
                  <Typography variant="body2">
                    ${milestone.amount}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Schedule fontSize="small" />
                  <Typography variant="body2">
                    Due: {format(new Date(milestone.dueDate), 'MMM dd, yyyy')}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                {milestone.status === 'paid' && (
                  <Chip label="PAID" color="success" size="small" />
                )}
              </Grid>
            </Grid>

            {/* Deliverables */}
            {milestone.deliverables && milestone.deliverables.length > 0 && (
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="body2">
                    Deliverables ({milestone.deliverables.length})
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <List dense>
                    {milestone.deliverables.map((deliverable) => (
                      <ListItem key={deliverable._id}>
                        <ListItemIcon>
                          {deliverable.type === 'file' ? <Upload /> : <Visibility />}
                        </ListItemIcon>
                        <ListItemText
                          primary={deliverable.title}
                          secondary={
                            <Box>
                              <Typography variant="body2">{deliverable.description}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                Type: {deliverable.type} | Status: {deliverable.status}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </AccordionDetails>
              </Accordion>
            )}

            {/* Feedback */}
            {milestone.clientFeedback && (
              <Box sx={{ mt: 2, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
                <Typography variant="body2" fontWeight="medium" gutterBottom>
                  Client Feedback:
                </Typography>
                <Typography variant="body2">
                  {milestone.clientFeedback}
                </Typography>
              </Box>
            )}

            {milestone.freelancerNotes && (
              <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                <Typography variant="body2" fontWeight="medium" gutterBottom>
                  Freelancer Notes:
                </Typography>
                <Typography variant="body2">
                  {milestone.freelancerNotes}
                </Typography>
              </Box>
            )}

            {/* Timestamps */}
            <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              {milestone.submittedAt && (
                <Typography variant="caption" color="text.secondary">
                  Submitted: {format(new Date(milestone.submittedAt), 'MMM dd, yyyy')}
                </Typography>
              )}
              {milestone.approvedAt && (
                <Typography variant="caption" color="text.secondary">
                  Approved: {format(new Date(milestone.approvedAt), 'MMM dd, yyyy')}
                </Typography>
              )}
              {milestone.rejectedAt && (
                <Typography variant="caption" color="text.secondary">
                  Rejected: {format(new Date(milestone.rejectedAt), 'MMM dd, yyyy')}
                </Typography>
              )}
            </Box>
          </CardContent>

          <CardActions>
            {canSubmit(milestone) && (
              <Button
                startIcon={<Upload />}
                onClick={() => handleAction(milestone, 'submit')}
                variant="contained"
                size="small"
              >
                Submit Milestone
              </Button>
            )}

            {canApprove(milestone) && (
              <>
                <Button
                  startIcon={<ThumbUp />}
                  onClick={() => handleAction(milestone, 'approve')}
                  variant="contained"
                  color="success"
                  size="small"
                >
                  Approve
                </Button>
                <Button
                  startIcon={<ThumbDown />}
                  onClick={() => handleAction(milestone, 'reject')}
                  variant="outlined"
                  color="error"
                  size="small"
                >
                  Reject
                </Button>
              </>
            )}
          </CardActions>
        </Card>
      ))}

      {/* Action Dialog */}
      <Dialog open={Boolean(selectedMilestone)} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {actionType === 'submit' && 'Submit Milestone'}
          {actionType === 'approve' && 'Approve Milestone'}
          {actionType === 'reject' && 'Reject Milestone'}
        </DialogTitle>

        <DialogContent>
          {selectedMilestone && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {selectedMilestone.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                {selectedMilestone.description}
              </Typography>

              {actionType === 'submit' && (
                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    Deliverables
                  </Typography>
                  
                  {/* Add Deliverable Form */}
                  <Card sx={{ mb: 2, bgcolor: 'grey.50' }}>
                    <CardContent>
                      <Typography variant="body2" gutterBottom>
                        Add Deliverable
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Title"
                            value={newDeliverable.title}
                            onChange={(e) => setNewDeliverable({ ...newDeliverable, title: e.target.value })}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            size="small"
                            select
                            label="Type"
                            value={newDeliverable.type}
                            onChange={(e) => setNewDeliverable({ ...newDeliverable, type: e.target.value as any })}
                            SelectProps={{ native: true }}
                          >
                            <option value="text">Text</option>
                            <option value="link">Link</option>
                            <option value="file">File</option>
                            <option value="code">Code</option>
                          </TextField>
                        </Grid>
                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Description"
                            value={newDeliverable.description}
                            onChange={(e) => setNewDeliverable({ ...newDeliverable, description: e.target.value })}
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Content"
                            multiline
                            rows={3}
                            value={newDeliverable.content}
                            onChange={(e) => setNewDeliverable({ ...newDeliverable, content: e.target.value })}
                            placeholder={
                              newDeliverable.type === 'link' ? 'Enter URL...' :
                              newDeliverable.type === 'file' ? 'File URL or description...' :
                              'Enter content...'
                            }
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <Button
                            startIcon={<Add />}
                            onClick={addDeliverable}
                            variant="outlined"
                            size="small"
                            disabled={!newDeliverable.title || !newDeliverable.content}
                          >
                            Add Deliverable
                          </Button>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>

                  {/* Deliverables List */}
                  {deliverables.length > 0 && (
                    <List>
                      {deliverables.map((deliverable, index) => (
                        <ListItem key={index}>
                          <ListItemText
                            primary={deliverable.title}
                            secondary={`${deliverable.type}: ${deliverable.description}`}
                          />
                          <IconButton onClick={() => removeDeliverable(index)} size="small">
                            <Delete />
                          </IconButton>
                        </ListItem>
                      ))}
                    </List>
                  )}

                  <Divider sx={{ my: 2 }} />
                </Box>
              )}

              <TextField
                fullWidth
                label={
                  actionType === 'submit' ? 'Notes (Optional)' :
                  actionType === 'approve' ? 'Approval Message (Optional)' :
                  'Rejection Reason'
                }
                multiline
                rows={4}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder={
                  actionType === 'submit' ? 'Add any notes about this milestone submission...' :
                  actionType === 'approve' ? 'Provide feedback about the approved work...' :
                  'Explain why this milestone is being rejected and what needs to be changed...'
                }
                required={actionType === 'reject'}
              />
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSubmitAction}
            variant="contained"
            color={
              actionType === 'approve' ? 'success' :
              actionType === 'reject' ? 'error' :
              'primary'
            }
            disabled={
              (actionType === 'reject' && !feedback) ||
              submitMilestoneMutation.isPending ||
              approveMilestoneMutation.isPending ||
              rejectMilestoneMutation.isPending
            }
          >
            {actionType === 'submit' && 'Submit Milestone'}
            {actionType === 'approve' && 'Approve Milestone'}
            {actionType === 'reject' && 'Reject Milestone'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
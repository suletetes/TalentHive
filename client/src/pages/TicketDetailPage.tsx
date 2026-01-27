import React, { useEffect, useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  Chip,
  Button,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Card,
  CardContent,
  Grid,
} from '@mui/material';
import { 
  ArrowBack, 
  Edit, 
  Assignment, 
  CheckCircle, 
  Person,
  AdminPanelSettings,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTicketById, addMessage } from '@/store/slices/supportTicketSlice';
import { RootState, AppDispatch } from '@/store';
import { TicketConversation } from '@/components/support/TicketConversation';
import { TicketConversationErrorBoundary } from '@/components/support/TicketConversationErrorBoundary';
import { TicketMessageInput } from '@/components/support/TicketMessageInput';
import { TicketStatusBadge } from '@/components/support/TicketStatusBadge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { supportTicketService } from '@/services/api/supportTicket.service';
import { formatDistanceToNow } from 'date-fns';
import { toastHelper } from '@/utils/toast';

export const TicketDetailPage: React.FC = () => {
  const { ticketId } = useParams<{ ticketId: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { currentTicket, loading, error } = useSelector((state: RootState) => state.supportTicket);
  const { user } = useSelector((state: RootState) => state.auth);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Admin controls state
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [tagsDialogOpen, setTagsDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [tags, setTags] = useState('');
  const [adminLoading, setAdminLoading] = useState(false);

  useEffect(() => {
    if (ticketId) {
      dispatch(fetchTicketById(ticketId));
    }
  }, [dispatch, ticketId]);

  // Initialize admin form values when ticket loads
  useEffect(() => {
    if (currentTicket) {
      setNewStatus(currentTicket.status);
      // Handle assignedAdminId which might be a string or populated object
      const adminId = typeof currentTicket.assignedAdminId === 'object' && currentTicket.assignedAdminId !== null
        ? currentTicket.assignedAdminId._id
        : currentTicket.assignedAdminId || '';
      setAssigneeId(adminId);
      setTags(currentTicket.tags?.join(', ') || '');
    }
  }, [currentTicket]);

  const handleSendMessage = async (message: string) => {
    if (!ticketId) return;

    setIsSubmitting(true);
    try {
      await dispatch(addMessage({ ticketId, data: { message } })).unwrap();
      toastHelper.success('Message sent successfully');
    } catch (err: any) {
      toastHelper.error(err.message || 'Failed to send message');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Determine if we're in admin view based on current path
  const isAdminView = window.location.pathname.startsWith('/admin') && user?.role === 'admin';
  const backPath = isAdminView ? '/admin/support' : '/dashboard/support';

  // Admin action handlers
  const handleStatusUpdate = async () => {
    if (!currentTicket || newStatus === currentTicket.status) {
      setStatusDialogOpen(false);
      return;
    }

    setAdminLoading(true);
    try {
      await supportTicketService.updateStatus(currentTicket.ticketId, { status: newStatus as any });
      toastHelper.success(`Ticket status updated to ${newStatus}`);
      setStatusDialogOpen(false);
      // Refresh ticket data
      dispatch(fetchTicketById(ticketId!));
    } catch (error: any) {
      toastHelper.error(error.response?.data?.message || 'Failed to update status');
    } finally {
      setAdminLoading(false);
    }
  };

  const handleAssignTicket = async () => {
    if (!currentTicket || !assigneeId) {
      toastHelper.error('Please enter an admin ID to assign');
      return;
    }

    setAdminLoading(true);
    try {
      await supportTicketService.assignTicket(currentTicket.ticketId, { adminId: assigneeId });
      toastHelper.success('Ticket assigned successfully');
      setAssignDialogOpen(false);
      // Refresh ticket data
      dispatch(fetchTicketById(ticketId!));
    } catch (error: any) {
      toastHelper.error(error.response?.data?.message || 'Failed to assign ticket');
    } finally {
      setAdminLoading(false);
    }
  };

  const handleUpdateTags = async () => {
    if (!currentTicket) return;

    const tagArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
    
    setAdminLoading(true);
    try {
      await supportTicketService.updateTags(currentTicket.ticketId, { tags: tagArray });
      toastHelper.success('Tags updated successfully');
      setTagsDialogOpen(false);
      // Refresh ticket data
      dispatch(fetchTicketById(ticketId!));
    } catch (error: any) {
      toastHelper.error(error.response?.data?.message || 'Failed to update tags');
    } finally {
      setAdminLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'error';
      case 'high':
        return 'warning';
      case 'medium':
        return 'info';
      case 'low':
        return 'default';
      default:
        return 'default';
    }
  };

  if (loading && !currentTicket) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <LoadingSpinner />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <ErrorState message={error} />
      </Container>
    );
  }

  if (!currentTicket) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <ErrorState message="Ticket not found" />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate(backPath)}
        sx={{ mb: 3 }}
      >
        Back to Tickets
      </Button>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h5" gutterBottom>
              {currentTicket.subject}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Ticket ID: {currentTicket.ticketId}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TicketStatusBadge status={currentTicket.status} />
            {isAdminView && (
              <Chip
                icon={<AdminPanelSettings />}
                label="Admin View"
                size="small"
                color="primary"
                variant="outlined"
              />
            )}
          </Box>
        </Box>

        {/* Admin Controls */}
        {isAdminView && (
          <>
            <Divider sx={{ my: 2 }} />
            <Card variant="outlined" sx={{ mb: 2, bgcolor: 'primary.50' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AdminPanelSettings color="primary" />
                  Admin Controls
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<CheckCircle />}
                      onClick={() => setStatusDialogOpen(true)}
                    >
                      Change Status
                    </Button>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<Assignment />}
                      onClick={() => setAssignDialogOpen(true)}
                    >
                      Assign Ticket
                    </Button>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<Edit />}
                      onClick={() => setTagsDialogOpen(true)}
                    >
                      Edit Tags
                    </Button>
                  </Grid>
                </Grid>
                {currentTicket.assignedAdminId && (
                  <Box sx={{ mt: 2, p: 1, bgcolor: 'success.50', borderRadius: 1 }}>
                    <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Person color="success" />
                      Assigned to: {
                        typeof currentTicket.assignedAdminId === 'object' && 
                        currentTicket.assignedAdminId !== null &&
                        'profile' in currentTicket.assignedAdminId &&
                        currentTicket.assignedAdminId.profile
                          ? `${currentTicket.assignedAdminId.profile.firstName} ${currentTicket.assignedAdminId.profile.lastName}`
                          : String(currentTicket.assignedAdminId)
                      }
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </>
        )}

        <Divider sx={{ my: 2 }} />

        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
          <Box>
            <Typography variant="caption" color="text.secondary" display="block">
              Priority
            </Typography>
            <Chip
              label={currentTicket.priority}
              size="small"
              color={getPriorityColor(currentTicket.priority) as any}
              sx={{ textTransform: 'capitalize', mt: 0.5 }}
            />
          </Box>

          <Box>
            <Typography variant="caption" color="text.secondary" display="block">
              Category
            </Typography>
            <Chip
              label={currentTicket.category}
              size="small"
              variant="outlined"
              sx={{ textTransform: 'capitalize', mt: 0.5 }}
            />
          </Box>

          <Box>
            <Typography variant="caption" color="text.secondary" display="block">
              Created
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              {formatDistanceToNow(new Date(currentTicket.createdAt), { addSuffix: true })}
            </Typography>
          </Box>

          {currentTicket.lastResponseAt && (
            <Box>
              <Typography variant="caption" color="text.secondary" display="block">
                Last Response
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                {formatDistanceToNow(new Date(currentTicket.lastResponseAt), { addSuffix: true })}
              </Typography>
            </Box>
          )}
        </Box>

        {currentTicket.tags && currentTicket.tags.length > 0 && (
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {currentTicket.tags.map((tag) => (
              <Chip key={tag} label={tag} size="small" variant="outlined" />
            ))}
          </Box>
        )}
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Conversation
        </Typography>
        <Divider sx={{ mb: 3 }} />
        <TicketConversationErrorBoundary 
          onRetry={() => {
            // Retry by refetching the ticket data
            if (ticketId) {
              dispatch(fetchTicketById(ticketId));
            }
          }}
        >
          <TicketConversation messages={currentTicket.messages} currentUserId={user?._id || ''} />
        </TicketConversationErrorBoundary>
      </Paper>

      {currentTicket.status !== 'closed' && (
        <TicketMessageInput
          onSendMessage={handleSendMessage}
          isSubmitting={isSubmitting}
          placeholder="Type your reply..."
        />
      )}

      {currentTicket.status === 'closed' && (
        <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'background.default' }}>
          <Typography variant="body2" color="text.secondary">
            This ticket is closed. Contact support if you need to reopen it.
          </Typography>
        </Paper>
      )}

      {/* Admin Dialogs */}
      {isAdminView && (
        <>
          {/* Status Update Dialog */}
          <Dialog open={statusDialogOpen} onClose={() => setStatusDialogOpen(false)}>
            <DialogTitle>Update Ticket Status</DialogTitle>
            <DialogContent>
              <FormControl fullWidth sx={{ mt: 2 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={newStatus}
                  label="Status"
                  onChange={(e) => setNewStatus(e.target.value)}
                >
                  <MenuItem value="open">Open</MenuItem>
                  <MenuItem value="in-progress">In Progress</MenuItem>
                  <MenuItem value="resolved">Resolved</MenuItem>
                  <MenuItem value="closed">Closed</MenuItem>
                </Select>
              </FormControl>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setStatusDialogOpen(false)}>Cancel</Button>
              <Button 
                onClick={handleStatusUpdate} 
                variant="contained"
                disabled={adminLoading}
              >
                {adminLoading ? 'Updating...' : 'Update Status'}
              </Button>
            </DialogActions>
          </Dialog>

          {/* Assign Ticket Dialog */}
          <Dialog open={assignDialogOpen} onClose={() => setAssignDialogOpen(false)}>
            <DialogTitle>Assign Ticket</DialogTitle>
            <DialogContent>
              <TextField
                fullWidth
                label="Admin ID"
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                sx={{ mt: 2 }}
                helperText="Enter the admin user ID to assign this ticket"
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setAssignDialogOpen(false)}>Cancel</Button>
              <Button 
                onClick={handleAssignTicket} 
                variant="contained"
                disabled={adminLoading}
              >
                {adminLoading ? 'Assigning...' : 'Assign Ticket'}
              </Button>
            </DialogActions>
          </Dialog>

          {/* Tags Update Dialog */}
          <Dialog open={tagsDialogOpen} onClose={() => setTagsDialogOpen(false)}>
            <DialogTitle>Edit Tags</DialogTitle>
            <DialogContent>
              <TextField
                fullWidth
                label="Tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                sx={{ mt: 2 }}
                helperText="Enter tags separated by commas (e.g., urgent, billing, follow-up)"
                multiline
                rows={3}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setTagsDialogOpen(false)}>Cancel</Button>
              <Button 
                onClick={handleUpdateTags} 
                variant="contained"
                disabled={adminLoading}
              >
                {adminLoading ? 'Updating...' : 'Update Tags'}
              </Button>
            </DialogActions>
          </Dialog>
        </>
      )}
    </Container>
  );
};

export default TicketDetailPage;

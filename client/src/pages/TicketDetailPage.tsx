import React, { useEffect, useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  Chip,
  Button,
  Divider,
  CircularProgress,
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTicketById, addMessage } from '@/store/slices/supportTicketSlice';
import { RootState, AppDispatch } from '@/store';
import { TicketConversation } from '@/components/support/TicketConversation';
import { TicketMessageInput } from '@/components/support/TicketMessageInput';
import { TicketStatusBadge } from '@/components/support/TicketStatusBadge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

export const TicketDetailPage: React.FC = () => {
  const { ticketId } = useParams<{ ticketId: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { currentTicket, loading, error } = useSelector((state: RootState) => state.supportTicket);
  const { user } = useSelector((state: RootState) => state.auth);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (ticketId) {
      dispatch(fetchTicketById(ticketId));
    }
  }, [dispatch, ticketId]);

  const handleSendMessage = async (message: string) => {
    if (!ticketId) return;

    setIsSubmitting(true);
    try {
      await dispatch(addMessage({ ticketId, data: { message } })).unwrap();
      toast.success('Message sent successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to send message');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Determine if we're in admin view based on current path
  const isAdminView = window.location.pathname.startsWith('/admin');
  const backPath = isAdminView ? '/admin/support' : '/dashboard/support';

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
          <TicketStatusBadge status={currentTicket.status} />
        </Box>

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
        <TicketConversation messages={currentTicket.messages} currentUserId={user?._id || ''} />
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
    </Container>
  );
};

export default TicketDetailPage;

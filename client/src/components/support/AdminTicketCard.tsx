import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  TextField,
  Divider,
} from '@mui/material';
import {
  AccessTime,
  Message,
  MoreVert,
  CheckCircle,
  Cancel,
  Assignment,
  Edit,
  Person,
} from '@mui/icons-material';
import { SupportTicket } from '@/services/api/supportTicket.service';
import { TicketStatusBadge } from './TicketStatusBadge';
import { formatDistanceToNow } from 'date-fns';
import { supportTicketService } from '@/services/api/supportTicket.service';
import toast from 'react-hot-toast';

interface AdminTicketCardProps {
  ticket: SupportTicket;
  onClick: (ticketId: string) => void;
  onUpdate?: () => void;
}

export const AdminTicketCard: React.FC<AdminTicketCardProps> = ({ 
  ticket, 
  onClick, 
  onUpdate 
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [tagsDialogOpen, setTagsDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState(ticket.status);
  const [assigneeId, setAssigneeId] = useState(ticket.assignedAdminId || '');
  const [tags, setTags] = useState(ticket.tags?.join(', ') || '');
  const [loading, setLoading] = useState(false);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleStatusUpdate = async () => {
    if (newStatus === ticket.status) {
      setStatusDialogOpen(false);
      return;
    }

    setLoading(true);
    try {
      await supportTicketService.updateStatus(ticket.ticketId, { status: newStatus });
      toast.success(`Ticket status updated to ${newStatus}`);
      setStatusDialogOpen(false);
      onUpdate?.();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignTicket = async () => {
    if (!assigneeId) {
      toast.error('Please select an admin to assign');
      return;
    }

    setLoading(true);
    try {
      await supportTicketService.assignTicket(ticket.ticketId, { adminId: assigneeId });
      toast.success('Ticket assigned successfully');
      setAssignDialogOpen(false);
      onUpdate?.();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to assign ticket');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTags = async () => {
    const tagArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
    
    setLoading(true);
    try {
      await supportTicketService.updateTags(ticket.ticketId, { tags: tagArray });
      toast.success('Tags updated successfully');
      setTagsDialogOpen(false);
      onUpdate?.();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update tags');
    } finally {
      setLoading(false);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'warning';
      case 'in-progress':
        return 'info';
      case 'resolved':
        return 'success';
      case 'closed':
        return 'default';
      default:
        return 'default';
    }
  };

  return (
    <>
      <Card
        sx={{
          cursor: 'pointer',
          transition: 'all 0.2s',
          '&:hover': {
            boxShadow: 3,
            transform: 'translateY(-2px)',
          },
        }}
        onClick={() => onClick(ticket.ticketId)}
      >
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" sx={{ mb: 0.5 }}>
                {ticket.subject}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {ticket.ticketId}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TicketStatusBadge status={ticket.status} />
              <IconButton
                size="small"
                onClick={handleMenuClick}
                sx={{ ml: 1 }}
              >
                <MoreVert />
              </IconButton>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
            <Chip
              label={ticket.priority}
              size="small"
              color={getPriorityColor(ticket.priority) as any}
              sx={{ textTransform: 'capitalize' }}
            />
            <Chip
              label={ticket.category}
              size="small"
              variant="outlined"
              sx={{ textTransform: 'capitalize' }}
            />
            {ticket.assignedAdminId && (
              <Chip
                icon={<Person />}
                label="Assigned"
                size="small"
                color="primary"
                variant="outlined"
              />
            )}
            {ticket.tags?.map((tag) => (
              <Chip key={tag} label={tag} size="small" variant="outlined" />
            ))}
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Message sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary">
                {ticket.messages.length} {ticket.messages.length === 1 ? 'message' : 'messages'}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <AccessTime sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary">
                {formatDistanceToNow(new Date(ticket.lastResponseAt || ticket.createdAt), {
                  addSuffix: true,
                })}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Admin Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        onClick={(e) => e.stopPropagation()}
      >
        <MenuItem onClick={() => { setStatusDialogOpen(true); handleMenuClose(); }}>
          <CheckCircle sx={{ mr: 1 }} />
          Change Status
        </MenuItem>
        <MenuItem onClick={() => { setAssignDialogOpen(true); handleMenuClose(); }}>
          <Assignment sx={{ mr: 1 }} />
          Assign Ticket
        </MenuItem>
        <MenuItem onClick={() => { setTagsDialogOpen(true); handleMenuClose(); }}>
          <Edit sx={{ mr: 1 }} />
          Edit Tags
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => onClick(ticket.ticketId)}>
          <Message sx={{ mr: 1 }} />
          View Details
        </MenuItem>
      </Menu>

      {/* Status Update Dialog */}
      <Dialog open={statusDialogOpen} onClose={() => setStatusDialogOpen(false)}>
        <DialogTitle>Update Ticket Status</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={newStatus}
              label="Status"
              onChange={(e) => setNewStatus(e.target.value as any)}
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
            disabled={loading}
          >
            {loading ? 'Updating...' : 'Update Status'}
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
            disabled={loading}
          >
            {loading ? 'Assigning...' : 'Assign Ticket'}
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
            disabled={loading}
          >
            {loading ? 'Updating...' : 'Update Tags'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
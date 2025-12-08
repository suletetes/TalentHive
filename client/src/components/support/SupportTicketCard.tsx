import React from 'react';
import { Card, CardContent, Typography, Box, Chip, Avatar } from '@mui/material';
import { AccessTime, Message } from '@mui/icons-material';
import { SupportTicket } from '@/services/api/supportTicket.service';
import { TicketStatusBadge } from './TicketStatusBadge';
import { formatDistanceToNow } from 'date-fns';

interface SupportTicketCardProps {
  ticket: SupportTicket;
  onClick: (ticketId: string) => void;
}

export const SupportTicketCard: React.FC<SupportTicketCardProps> = ({ ticket, onClick }) => {
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

  return (
    <Card
      sx={{
        cursor: 'pointer',
        transition: 'all 0.2s',
        '&:hover': {
          boxShadow: 3,
          transform: 'translateY(-2px)',
        },
      }}
      onClick={() => onClick(ticket._id)}
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
          <TicketStatusBadge status={ticket.status} />
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
  );
};

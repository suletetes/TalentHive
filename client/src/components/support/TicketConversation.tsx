import React, { useRef, useEffect } from 'react';
import { Box, Paper, Typography, Avatar, Chip } from '@mui/material';
import { formatDistanceToNow } from 'date-fns';
import { TicketMessage } from '@/services/api/supportTicket.service';
import { AdminBadge } from './AdminBadge';

interface TicketConversationProps {
  messages: TicketMessage[];
  currentUserId: string;
}

export const TicketConversation: React.FC<TicketConversationProps> = ({
  messages,
  currentUserId,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (messages.length === 0) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'background.default' }}>
        <Typography variant="body2" color="text.secondary">
          No messages yet
        </Typography>
      </Paper>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {messages.map((message) => {
        const isCurrentUser = message.senderId._id === currentUserId;
        const isAdmin = message.isAdminResponse;

        return (
          <Box
            key={message._id}
            sx={{
              display: 'flex',
              justifyContent: isCurrentUser ? 'flex-end' : 'flex-start',
              gap: 1,
            }}
          >
            {!isCurrentUser && (
              <Avatar
                src={message.senderId.profile.avatar}
                alt={`${message.senderId.profile.firstName} ${message.senderId.profile.lastName}`}
                sx={{ width: 40, height: 40 }}
              >
                {message.senderId.profile.firstName[0]}
                {message.senderId.profile.lastName[0]}
              </Avatar>
            )}

            <Paper
              sx={{
                p: 2,
                maxWidth: '70%',
                bgcolor: isCurrentUser ? 'primary.main' : 'background.paper',
                color: isCurrentUser ? 'primary.contrastText' : 'text.primary',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Typography variant="subtitle2" fontWeight={600}>
                  {message.senderId.profile.firstName} {message.senderId.profile.lastName}
                </Typography>
                {isAdmin && <AdminBadge size="small" />}
              </Box>

              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', mb: 1 }}>
                {message.message}
              </Typography>

              {message.attachments && message.attachments.length > 0 && (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
                  {message.attachments.map((attachment, index) => (
                    <Chip
                      key={index}
                      label={attachment.filename}
                      size="small"
                      component="a"
                      href={attachment.url}
                      target="_blank"
                      clickable
                      sx={{
                        bgcolor: isCurrentUser ? 'primary.dark' : 'action.hover',
                        color: isCurrentUser ? 'primary.contrastText' : 'text.primary',
                        '&:hover': {
                          bgcolor: isCurrentUser ? 'primary.dark' : 'action.selected',
                        },
                      }}
                    />
                  ))}
                </Box>
              )}

              <Typography
                variant="caption"
                sx={{
                  display: 'block',
                  opacity: 0.7,
                  fontSize: '0.7rem',
                }}
              >
                {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
              </Typography>
            </Paper>

            {isCurrentUser && (
              <Avatar
                src={message.senderId.profile.avatar}
                alt={`${message.senderId.profile.firstName} ${message.senderId.profile.lastName}`}
                sx={{ width: 40, height: 40 }}
              >
                {message.senderId.profile.firstName[0]}
                {message.senderId.profile.lastName[0]}
              </Avatar>
            )}
          </Box>
        );
      })}
      <div ref={messagesEndRef} />
    </Box>
  );
};

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
      {messages.map((message, index) => {
        // Debug logging to understand the exact data structure
        console.log(`[TICKET CONVERSATION] Message ${index}:`, message);
        console.log(`[TICKET CONVERSATION] SenderId structure:`, message.senderId);
        
        // Safety checks for message data
        if (!message || !message._id) {
          console.warn('Invalid message object:', message);
          return null;
        }

        // Handle cases where senderId might be malformed or have unexpected structure
        const sender = message.senderId;
        if (!sender || typeof sender !== 'object') {
          console.warn('Invalid sender object:', sender);
          return null;
        }

        // Extract sender information safely with multiple fallback strategies
        let senderId = '';
        let firstName = 'Unknown';
        let lastName = 'User';
        let avatar = '';

        try {
          // CRITICAL: Only use _id, never the virtual 'id' field
          senderId = sender._id ? String(sender._id) : '';
          
          // Handle different possible structures for profile data
          if (sender.profile && typeof sender.profile === 'object') {
            // Standard structure: sender.profile.firstName
            const profile = sender.profile;
            firstName = profile.firstName ? String(profile.firstName) : 'Unknown';
            lastName = profile.lastName ? String(profile.lastName) : 'User';
            avatar = profile.avatar ? String(profile.avatar) : '';
          } else {
            // If profile is missing or malformed, try direct properties
            firstName = sender.firstName ? String(sender.firstName) : 'Unknown';
            lastName = sender.lastName ? String(sender.lastName) : 'User';
            avatar = sender.avatar ? String(sender.avatar) : '';
          }

          // Final safety check - ensure we have valid strings
          if (typeof firstName !== 'string') firstName = 'Unknown';
          if (typeof lastName !== 'string') lastName = 'User';
          if (typeof avatar !== 'string') avatar = '';
          if (typeof senderId !== 'string') senderId = '';

        } catch (error) {
          console.error('Error processing sender data:', error, sender);
          firstName = 'Unknown';
          lastName = 'User';
          avatar = '';
          senderId = '';
        }
        
        const isCurrentUser = senderId === currentUserId;
        const isAdmin = Boolean(message.isAdminResponse);

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
                src={avatar}
                alt={`${firstName} ${lastName}`}
                sx={{ width: 40, height: 40 }}
              >
                {firstName.charAt(0)}{lastName.charAt(0)}
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
                  {firstName} {lastName}
                </Typography>
                {isAdmin && <AdminBadge size="small" />}
              </Box>

              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', mb: 1 }}>
                {String(message.message || '')}
              </Typography>

              {message.attachments && message.attachments.length > 0 && (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
                  {message.attachments.map((attachment, index) => (
                    <Chip
                      key={index}
                      label={String(attachment.filename || 'Attachment')}
                      size="small"
                      component="a"
                      href={String(attachment.url || '#')}
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
                src={avatar}
                alt={`${firstName} ${lastName}`}
                sx={{ width: 40, height: 40 }}
              >
                {firstName.charAt(0)}{lastName.charAt(0)}
              </Avatar>
            )}
          </Box>
        );
      }).filter(Boolean)}
      <div ref={messagesEndRef} />
    </Box>
  );
};

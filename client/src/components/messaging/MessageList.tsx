import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Avatar,
  IconButton,
  AppBar,
  Toolbar,
  CircularProgress,
  Chip,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { messagesService, Conversation, Message } from '@/services/api/messages.service';
import { socketService } from '@/services/socket';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { format, isToday, isYesterday } from 'date-fns';
import { MessageAttachment } from './MessageAttachment';

interface MessageListProps {
  conversation: Conversation | null;
  onBack?: () => void;
}

export const MessageList: React.FC<MessageListProps> = ({ conversation, onBack }) => {
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useQuery({
    queryKey: ['messages', conversation?._id, page],
    queryFn: async () => {
      if (!conversation?._id) return { data: [], pagination: {} };
      const response = await messagesService.getMessages(conversation._id, { page, limit: 50 });
      return response;
    },
    enabled: !!conversation?._id,
  });

  const currentUserId = currentUser?.id || currentUser?._id;
  const otherParticipant = conversation?.participants?.find((p) => p._id !== currentUserId);

  useEffect(() => {
    if (!conversation?._id) return;
    
    // Mark messages as read when viewing conversation
    messagesService.markAsRead(conversation._id);

    // Listen for new messages
    const handleNewMessage = (data: any) => {
      if (data.conversationId === conversation._id) {
        queryClient.invalidateQueries({ queryKey: ['messages', conversation._id] });
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
        // Mark as read immediately
        messagesService.markAsRead(conversation._id);
      }
    };

    socketService.on('new_message', handleNewMessage);

    return () => {
      socketService.off('new_message', handleNewMessage);
    };
  }, [conversation?._id, queryClient]);

  useEffect(() => {
    // Scroll to bottom when messages load or new message arrives
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [data?.data]);

  const formatMessageTime = (date: Date) => {
    const messageDate = new Date(date);
    if (isToday(messageDate)) {
      return format(messageDate, 'h:mm a');
    } else if (isYesterday(messageDate)) {
      return `Yesterday ${format(messageDate, 'h:mm a')}`;
    } else {
      return format(messageDate, 'MMM d, h:mm a');
    }
  };

  const renderMessage = (message: Message, index: number) => {
    const isOwnMessage = message.sender._id === currentUser?._id;
    const showAvatar = !isOwnMessage;

    return (
      <Box
        key={message._id}
        sx={{
          display: 'flex',
          justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
          mb: 2,
          px: 2,
        }}
      >
        {showAvatar && (
          <Avatar
            src={message.sender.profile.avatar}
            alt={`${message.sender.profile.firstName} ${message.sender.profile.lastName}`}
            sx={{ width: 32, height: 32, mr: 1 }}
          >
            {message.sender.profile.firstName[0]}
          </Avatar>
        )}
        <Box
          sx={{
            maxWidth: '70%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: isOwnMessage ? 'flex-end' : 'flex-start',
          }}
        >
          <Box>
            {(message as any).sender?.role === 'admin' && (
              <Chip 
                label="Support" 
                size="small" 
                color="primary" 
                sx={{ mb: 0.5 }}
              />
            )}
            <Paper
              elevation={1}
              sx={{
                p: 1.5,
                bgcolor: isOwnMessage ? 'primary.main' : 'background.paper',
                color: isOwnMessage ? 'primary.contrastText' : 'text.primary',
                borderRadius: 2,
                borderTopRightRadius: isOwnMessage ? 0 : 2,
                borderTopLeftRadius: isOwnMessage ? 2 : 0,
              }}
            >
              {message.content && (
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {message.content}
                </Typography>
              )}
              
              {/* Attachments */}
              {message.attachments && message.attachments.length > 0 && (
                <Box sx={{ mt: message.content ? 1 : 0 }}>
                  {message.attachments.map((attachment, idx) => (
                    <Box key={idx} sx={{ mb: idx < message.attachments!.length - 1 ? 1 : 0 }}>
                      {attachment.type === 'image' ? (
                        <Box
                          component="img"
                          src={attachment.url}
                          alt={attachment.filename}
                          sx={{
                            maxWidth: '100%',
                            maxHeight: 300,
                            borderRadius: 1,
                            cursor: 'pointer',
                          }}
                          onClick={() => window.open(attachment.url, '_blank')}
                        />
                      ) : (
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            p: 1,
                            bgcolor: isOwnMessage ? 'rgba(255,255,255,0.2)' : 'action.hover',
                            borderRadius: 1,
                            cursor: 'pointer',
                            '&:hover': {
                              bgcolor: isOwnMessage ? 'rgba(255,255,255,0.3)' : 'action.selected',
                            },
                          }}
                          onClick={() => window.open(attachment.url, '_blank')}
                        >
                          <Typography variant="caption" sx={{ flex: 1, wordBreak: 'break-word' }}>
                            📎 {attachment.filename}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  ))}
                </Box>
              )}

              {message.isEdited && (
                <Typography variant="caption" sx={{ display: 'block', mt: 0.5, opacity: 0.7 }}>
                  (edited)
                </Typography>
              )}
            </Paper>
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, px: 1 }}>
            {formatMessageTime(message.createdAt)}
          </Typography>
        </Box>
      </Box>
    );
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <AppBar position="static" color="default" elevation={1} sx={{ flexShrink: 0 }}>
        <Toolbar variant="dense">
          {onBack && (
            <IconButton edge="start" onClick={onBack} sx={{ mr: 2 }}>
              <ArrowBackIcon />
            </IconButton>
          )}
          <Avatar
            src={otherParticipant?.profile?.avatar}
            alt={otherParticipant ? `${otherParticipant.profile.firstName} ${otherParticipant.profile.lastName}` : 'New Chat'}
            sx={{ width: 36, height: 36, mr: 2 }}
          >
            {otherParticipant?.profile?.firstName?.[0] || '?'}
            {otherParticipant?.profile?.lastName?.[0] || ''}
          </Avatar>
          <Box>
            <Typography variant="subtitle2" fontWeight={600}>
              {otherParticipant 
                ? `${otherParticipant.profile.firstName} ${otherParticipant.profile.lastName}`
                : 'New Conversation'
              }
            </Typography>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Messages */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          py: 1,
          bgcolor: 'background.default',
          minHeight: 0,
        }}
      >
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress />
          </Box>
        ) : data?.data && data.data.length > 0 ? (
          <>
            {data.data.map((message, index) => renderMessage(message, index))}
            <div ref={messagesEndRef} />
          </>
        ) : (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <Typography variant="body2" color="text.secondary">
              No messages yet. Start the conversation!
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

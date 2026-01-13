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
          mb: 1.5,
          px: 2,
        }}
      >
        {showAvatar && (
          <Avatar
            src={message.sender.profile.avatar}
            alt={`${message.sender.profile.firstName} ${message.sender.profile.lastName}`}
            sx={{ width: 32, height: 32, mr: 1.5, mt: 0.5 }}
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
                sx={{ mb: 0.5, height: 20, fontSize: '11px' }}
              />
            )}
            <Paper
              elevation={0}
              sx={{
                p: 1.5,
                bgcolor: isOwnMessage ? 'primary.main' : 'grey.100',
                color: isOwnMessage ? 'primary.contrastText' : 'text.primary',
                borderRadius: 2.5,
                borderTopRightRadius: isOwnMessage ? 0.5 : 2.5,
                borderTopLeftRadius: isOwnMessage ? 2.5 : 0.5,
                border: isOwnMessage ? 'none' : '1px solid',
                borderColor: isOwnMessage ? 'transparent' : 'grey.200',
                boxShadow: isOwnMessage 
                  ? '0 2px 8px rgba(25, 118, 210, 0.15)' 
                  : '0 1px 3px rgba(0,0,0,0.1)',
              }}
            >
              {message.content && (
                <Typography 
                  variant="body2" 
                  sx={{ 
                    whiteSpace: 'pre-wrap', 
                    wordBreak: 'break-word',
                    lineHeight: 1.4,
                    fontSize: '14px'
                  }}
                >
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
                            borderRadius: 1.5,
                            cursor: 'pointer',
                            transition: 'transform 0.2s',
                            '&:hover': {
                              transform: 'scale(1.02)',
                            }
                          }}
                          onClick={() => window.open(attachment.url, '_blank')}
                        />
                      ) : (
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            p: 1.5,
                            bgcolor: isOwnMessage ? 'rgba(255,255,255,0.15)' : 'action.hover',
                            borderRadius: 1.5,
                            cursor: 'pointer',
                            transition: 'background-color 0.2s',
                            '&:hover': {
                              bgcolor: isOwnMessage ? 'rgba(255,255,255,0.25)' : 'action.selected',
                            },
                          }}
                          onClick={() => window.open(attachment.url, '_blank')}
                        >
                          <Typography variant="body2" sx={{ flex: 1, wordBreak: 'break-word', fontSize: '13px' }}>
                            📎 {attachment.filename}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  ))}
                </Box>
              )}

              {message.isEdited && (
                <Typography variant="caption" sx={{ display: 'block', mt: 0.5, opacity: 0.7, fontSize: '11px' }}>
                  (edited)
                </Typography>
              )}
            </Paper>
          </Box>
          <Typography 
            variant="caption" 
            color="text.secondary" 
            sx={{ 
              mt: 0.5, 
              px: 1,
              fontSize: '11px',
              opacity: 0.7
            }}
          >
            {formatMessageTime(message.createdAt)}
          </Typography>
        </Box>
      </Box>
    );
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <AppBar 
        position="static" 
        color="default" 
        elevation={0} 
        sx={{ 
          flexShrink: 0,
          bgcolor: 'background.paper',
          borderBottom: 1,
          borderColor: 'divider'
        }}
      >
        <Toolbar variant="dense" sx={{ minHeight: '64px' }}>
          {onBack && (
            <IconButton 
              edge="start" 
              onClick={onBack} 
              sx={{ 
                mr: 2,
                bgcolor: 'action.hover',
                '&:hover': {
                  bgcolor: 'action.selected',
                }
              }}
            >
              <ArrowBackIcon />
            </IconButton>
          )}
          <Avatar
            src={otherParticipant?.profile?.avatar}
            alt={otherParticipant ? `${otherParticipant.profile.firstName} ${otherParticipant.profile.lastName}` : 'New Chat'}
            sx={{ 
              width: 40, 
              height: 40, 
              mr: 2,
              border: '2px solid',
              borderColor: 'primary.light'
            }}
          >
            {otherParticipant?.profile?.firstName?.[0] || '?'}
            {otherParticipant?.profile?.lastName?.[0] || ''}
          </Avatar>
          <Box>
            <Typography variant="subtitle1" fontWeight={600} sx={{ color: 'text.primary' }}>
              {otherParticipant 
                ? `${otherParticipant.profile.firstName} ${otherParticipant.profile.lastName}`
                : 'New Conversation'
              }
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {otherParticipant ? 'Active now' : 'Start a conversation'}
            </Typography>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Messages */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          py: 2,
          bgcolor: 'grey.50',
          minHeight: 0,
          '&::-webkit-scrollbar': {
            width: '6px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'rgba(0,0,0,0.2)',
            borderRadius: '3px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: 'rgba(0,0,0,0.3)',
          },
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
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100%',
            flexDirection: 'column',
            gap: 1
          }}>
            <Typography variant="body2" color="text.secondary">
              No messages yet. Start the conversation!
            </Typography>
            <Typography variant="caption" color="text.disabled">
              Send a message to begin chatting
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

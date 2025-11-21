import React, { useEffect } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  Badge,
  Divider,
  CircularProgress,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { messagesService, Conversation } from '@/services/api/messages.service';
import { socketService } from '@/services/socket';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { formatDistanceToNow } from 'date-fns';
import { EmptyState } from '@/components/ui/EmptyState';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';

interface ConversationListProps {
  selectedConversation: Conversation | null;
  onSelectConversation: (conversation: Conversation) => void;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  selectedConversation,
  onSelectConversation,
}) => {
  const currentUser = useSelector((state: RootState) => state.auth.user);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const response = await messagesService.getConversations();
      return response.data;
    },
  });

  useEffect(() => {
    // Listen for new messages to update conversation list
    const handleNewMessage = () => {
      refetch();
    };

    socketService.on('new_message', handleNewMessage);
    socketService.on('messages_read', handleNewMessage);

    return () => {
      socketService.off('new_message', handleNewMessage);
      socketService.off('messages_read', handleNewMessage);
    };
  }, [refetch]);

  const getOtherParticipant = (conversation: Conversation) => {
    return conversation.participants.find((p) => p._id !== currentUser?._id);
  };

  const getUnreadCount = (conversation: Conversation) => {
    // Handle case where unreadCount might be an object/Map from backend
    if (typeof conversation.unreadCount === 'number') {
      return conversation.unreadCount;
    }
    // If it's an object (Map), get the count for current user
    if (conversation.unreadCount && typeof conversation.unreadCount === 'object' && currentUser?._id) {
      const unreadMap = conversation.unreadCount as any;
      return unreadMap[currentUser._id] || 0;
    }
    return 0;
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3 }}>
        <EmptyState
          icon={<ChatBubbleOutlineIcon sx={{ fontSize: 64 }} />}
          title="No Conversations"
          description="Start a conversation by messaging a freelancer or client from their profile"
        />
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', overflow: 'auto' }}>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6">Messages</Typography>
      </Box>
      <List sx={{ p: 0 }}>
        {data.map((conversation, index) => {
          const otherParticipant = getOtherParticipant(conversation);
          const unreadCount = getUnreadCount(conversation);
          const isSelected = selectedConversation?._id === conversation._id;

          if (!otherParticipant) return null;

          return (
            <React.Fragment key={conversation._id}>
              <ListItem disablePadding>
                <ListItemButton
                  selected={isSelected}
                  onClick={() => onSelectConversation(conversation)}
                  sx={{
                    py: 2,
                    '&.Mui-selected': {
                      bgcolor: 'action.selected',
                    },
                  }}
                >
                  <ListItemAvatar>
                    <Badge
                      badgeContent={unreadCount}
                      color="primary"
                      overlap="circular"
                    >
                      <Avatar
                        src={otherParticipant.profile.avatar}
                        alt={`${otherParticipant.profile.firstName} ${otherParticipant.profile.lastName}`}
                      >
                        {otherParticipant.profile.firstName[0]}
                        {otherParticipant.profile.lastName[0]}
                      </Avatar>
                    </Badge>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography
                        variant="subtitle2"
                        fontWeight={unreadCount > 0 ? 600 : 400}
                      >
                        {otherParticipant.profile.firstName} {otherParticipant.profile.lastName}
                      </Typography>
                    }
                    secondary={
                      <Box component="span" sx={{ display: 'block' }}>
                        <Typography
                          component="span"
                          variant="body2"
                          color="text.secondary"
                          noWrap
                          sx={{
                            display: 'block',
                            fontWeight: unreadCount > 0 ? 500 : 400,
                          }}
                        >
                          {conversation.lastMessage?.content || 'No messages yet'}
                        </Typography>
                        <Typography component="span" variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                          {conversation.lastMessage
                            ? formatDistanceToNow(new Date(conversation.lastMessage.createdAt), {
                                addSuffix: true,
                              })
                            : ''}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItemButton>
              </ListItem>
              {index < data.length - 1 && <Divider />}
            </React.Fragment>
          );
        })}
      </List>
    </Box>
  );
};

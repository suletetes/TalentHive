import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  useTheme,
  useMediaQuery,
  Drawer,
} from '@mui/material';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ConversationList } from './ConversationList';
import { MessageList } from './MessageList';
import { MessageComposer } from './MessageComposer';
import { Conversation, messagesService } from '@/services/api/messages.service';
import { EmptyState } from '@/components/ui/EmptyState';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';

export const MessagingInterface: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [searchParams] = useSearchParams();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Fetch conversations to find the one from URL
  const { data: conversations, isLoading, error } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const response = await messagesService.getConversations();
      return response.data;
    },
  });

  // Auto-select conversation from URL parameter
  useEffect(() => {
    const conversationId = searchParams.get('conversation');
    
    if (conversationId && conversationId !== selectedConversationId) {
      setSelectedConversationId(conversationId);
      
      // Always create a temporary conversation to ensure UI renders
      const tempConversation: Conversation = {
        _id: conversationId,
        participants: [],
        unreadCount: 0,
        updatedAt: new Date(),
      };
      setSelectedConversation(tempConversation);
    } else if (!conversationId && selectedConversationId) {
      // Don't clear the selection if URL param disappears - this might be a navigation issue
      // Keep the conversation selected to prevent UI flickering
    }
  }, [searchParams.get('conversation')]); // Only depend on the actual conversation ID
  
  // Separate effect to update conversation details when conversations load
  useEffect(() => {
    if (selectedConversationId && conversations) {
      const realConversation = conversations.find(c => c._id === selectedConversationId);
      if (realConversation) {
        setSelectedConversation(realConversation);
      }
    }
  }, [conversations, selectedConversationId]);

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setSelectedConversationId(conversation._id);
    if (isMobile) {
      setMobileDrawerOpen(false);
    }
  };

  const handleBackToList = () => {
    setSelectedConversation(null);
    setSelectedConversationId(null);
    if (isMobile) {
      setMobileDrawerOpen(true);
    }
  };

  useEffect(() => {
    if (isMobile) {
      // On mobile, close drawer when conversation is selected, open when none selected
      const hasSelection = selectedConversation || selectedConversationId;
      setMobileDrawerOpen(!hasSelection);
    }
  }, [isMobile, selectedConversation, selectedConversationId]);

  return (
    <Box sx={{ 
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      
      {isMobile ? (
        <>
          <Drawer
            anchor="left"
            open={mobileDrawerOpen}
            onClose={() => setMobileDrawerOpen(false)}
            sx={{
              '& .MuiDrawer-paper': {
                width: '80%',
                maxWidth: 360,
              },
            }}
          >
            <ConversationList
              selectedConversation={selectedConversation}
              onSelectConversation={handleSelectConversation}
            />
          </Drawer>
          {selectedConversation || selectedConversationId ? (
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <Box sx={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
                <MessageList
                  conversation={selectedConversation}
                  onBack={handleBackToList}
                />
              </Box>
              {selectedConversationId && (
                <Box sx={{ flexShrink: 0 }}>
                  <MessageComposer conversationId={selectedConversationId} />
                </Box>
              )}
            </Box>
          ) : (
            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <EmptyState
                icon={<ChatBubbleOutlineIcon sx={{ fontSize: 64 }} />}
                title="No Conversation Selected"
                description="Select a conversation from the menu to start messaging"
                actionLabel="Open Conversations"
                onAction={() => setMobileDrawerOpen(true)}
              />
            </Box>
          )}
        </>
      ) : (
        <Box sx={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
          <Box sx={{ 
            width: '33.333333%', // Equivalent to md={4}
            borderRight: 1, 
            borderColor: 'divider',
            overflow: 'hidden'
          }}>
            <ConversationList
              selectedConversation={selectedConversation}
              onSelectConversation={handleSelectConversation}
            />
          </Box>
          <Box sx={{ 
            flex: 1, // Equivalent to md={8}
            display: 'flex', 
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            {selectedConversation || selectedConversationId ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
                <Box sx={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
                  <MessageList conversation={selectedConversation} />
                </Box>
                {selectedConversationId && (
                  <Box sx={{ flexShrink: 0 }}>
                    <MessageComposer conversationId={selectedConversationId} />
                  </Box>
                )}
              </Box>
            ) : (
              <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <EmptyState
                  icon={<ChatBubbleOutlineIcon sx={{ fontSize: 64 }} />}
                  title="No Conversation Selected"
                  description="Select a conversation from the list to start messaging"
                />
              </Box>
            )}
          </Box>
        </Box>
      )}
    </Box>
  );
};

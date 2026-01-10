import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
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
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Fetch conversations to find the one from URL
  const { data: conversations, isLoading, error } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      console.log('  Fetching conversations...');
      const response = await messagesService.getConversations();
      console.log('  Conversations fetched:', response.data);
      return response.data;
    },
  });

  // Auto-select conversation from URL parameter
  useEffect(() => {
    const conversationId = searchParams.get('conversation');
    console.log(' URL conversation parameter:', conversationId);
    console.log(' Available conversations:', conversations);
    console.log(' Currently selected:', selectedConversation);
    
    if (conversationId && conversations) {
      console.log(' Looking for conversation with ID:', conversationId);
      const conversation = conversations.find(c => c._id === conversationId);
      
      if (conversation) {
        console.log('  Found conversation, selecting:', conversation);
        setSelectedConversation(conversation);
        console.log(' State update called - conversation should now be selected');
      } else {
        console.warn('  Conversation not found in list. Available IDs:', conversations.map(c => c._id));
      }
    } else {
      if (!conversationId) console.log('  No conversation ID in URL');
      if (!conversations) console.log('  Conversations not loaded yet');
    }
  }, [searchParams, conversations]);

  // Log when selected conversation changes
  useEffect(() => {
    console.log(' Selected conversation changed to:', selectedConversation);
  }, [selectedConversation]);

  // Log when conversations load
  useEffect(() => {
    if (isLoading) console.log(' Loading conversations...');
    if (error) console.error('  Error loading conversations:', error);
  }, [isLoading, error]);

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    if (isMobile) {
      setMobileDrawerOpen(false);
    }
  };

  const handleBackToList = () => {
    setSelectedConversation(null);
    if (isMobile) {
      setMobileDrawerOpen(true);
    }
  };

  useEffect(() => {
    if (isMobile) {
      setMobileDrawerOpen(!selectedConversation);
    }
  }, [isMobile, selectedConversation]);

  console.log(' RENDERING MessagingInterface - selectedConversation:', selectedConversation);
  console.log(' isMobile:', isMobile);

  return (
    <Box sx={{ height: 'calc(100vh - 120px)', display: 'flex' }}>
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
          {selectedConversation ? (
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <MessageList
                conversation={selectedConversation}
                onBack={handleBackToList}
              />
              <MessageComposer conversationId={selectedConversation._id} />
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
        <Grid container sx={{ height: '100%' }}>
          <Grid item xs={12} md={4} sx={{ height: '100%', borderRight: 1, borderColor: 'divider' }}>
            <ConversationList
              selectedConversation={selectedConversation}
              onSelectConversation={handleSelectConversation}
            />
          </Grid>
          <Grid item xs={12} md={8} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {selectedConversation ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <MessageList conversation={selectedConversation} />
                <MessageComposer conversationId={selectedConversation._id} />
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
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

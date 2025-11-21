import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  useTheme,
  useMediaQuery,
  Drawer,
} from '@mui/material';
import { ConversationList } from './ConversationList';
import { MessageList } from './MessageList';
import { MessageComposer } from './MessageComposer';
import { Conversation } from '@/services/api/messages.service';
import { EmptyState } from '@/components/ui/EmptyState';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';

export const MessagingInterface: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

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
              <>
                <MessageList conversation={selectedConversation} />
                <MessageComposer conversationId={selectedConversation._id} />
              </>
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

import React from 'react';
import { Button, IconButton, Tooltip } from '@mui/material';
import MessageIcon from '@mui/icons-material/Message';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { messagesService } from '@/services/api/messages.service';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

interface MessageButtonProps {
  userId: string;
  variant?: 'button' | 'icon';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
}

export const MessageButton: React.FC<MessageButtonProps> = ({
  userId,
  variant = 'button',
  size = 'medium',
  fullWidth = false,
}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const createConversationMutation = useMutation({
    mutationFn: async () => {
      console.log(' Creating conversation with user:', userId);
      const response = await messagesService.createConversation(userId);
      console.log(' Raw API response:', response);
      return response;
    },
    onSuccess: async (response) => {
      console.log('  Conversation mutation successful');
      console.log('  Response structure:', {
        hasData: !!response.data,
        dataKeys: response.data ? Object.keys(response.data) : [],
        fullResponse: response
      });
      
      const conversation = response.data;
      
      if (conversation && conversation._id) {
        // Invalidate and refetch conversations cache to ensure the new conversation appears in the list
        console.log(' Invalidating and refetching conversations cache...');
        await queryClient.invalidateQueries({ queryKey: ['conversations'] });
        await queryClient.refetchQueries({ queryKey: ['conversations'] });
        
        // Small delay to ensure the cache is updated
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const url = `/dashboard/messages?conversation=${conversation._id}`;
        console.log(' Navigating to:', url);
        navigate(url);
      } else {
        console.warn(' No conversation ID found, navigating without parameter');
        console.log('Response.data:', conversation);
        navigate('/dashboard/messages');
      }
    },
    onError: (error: any) => {
      console.error('  Conversation creation failed');
      console.error('Error details:', {
        message: error.message,
        response: error.response,
        status: error.response?.status,
        data: error.response?.data
      });
      toast.error(error.response?.data?.message || 'Failed to start conversation');
    },
  });

  const handleClick = () => {
    createConversationMutation.mutate();
  };

  if (variant === 'icon') {
    return (
      <Tooltip title="Send Message">
        <IconButton
          onClick={handleClick}
          disabled={createConversationMutation.isPending}
          size={size}
          color="primary"
        >
          <MessageIcon />
        </IconButton>
      </Tooltip>
    );
  }

  return (
    <Button
      variant="outlined"
      startIcon={<MessageIcon />}
      onClick={handleClick}
      disabled={createConversationMutation.isPending}
      size={size}
      fullWidth={fullWidth}
    >
      {createConversationMutation.isPending ? 'Loading...' : 'Send Message'}
    </Button>
  );
};

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
      const response = await messagesService.createConversation(userId);
      return response;
    },
    onSuccess: async (response) => {
      const conversation = response.data;
      
      if (conversation && conversation._id) {
        // Invalidate and refetch conversations cache to ensure the new conversation appears in the list
        await queryClient.invalidateQueries({ queryKey: ['conversations'] });
        
        // Navigate immediately - don't wait for refetch
        const url = `/dashboard/messages?conversation=${conversation._id}`;
        navigate(url);
        
        // Refetch in background to update the conversation list
        queryClient.refetchQueries({ queryKey: ['conversations'] });
      } else {
        navigate('/dashboard/messages');
      }
    },
    onError: (error: any) => {
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

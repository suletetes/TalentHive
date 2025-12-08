import React, { useState } from 'react';
import { Box, TextField, IconButton, Paper } from '@mui/material';
import { Send } from '@mui/icons-material';
import { LoadingButton } from '@/components/ui/LoadingButton';

interface TicketMessageInputProps {
  onSendMessage: (message: string) => Promise<void>;
  isSubmitting?: boolean;
  placeholder?: string;
}

export const TicketMessageInput: React.FC<TicketMessageInputProps> = ({
  onSendMessage,
  isSubmitting = false,
  placeholder = 'Type your message...',
}) => {
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() || isSubmitting) {
      return;
    }

    await onSendMessage(message.trim());
    setMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <Paper
      component="form"
      onSubmit={handleSubmit}
      sx={{
        p: 2,
        display: 'flex',
        gap: 1,
        alignItems: 'flex-end',
        bgcolor: 'background.paper',
      }}
    >
      <TextField
        fullWidth
        multiline
        maxRows={4}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder={placeholder}
        disabled={isSubmitting}
        variant="outlined"
        size="small"
      />
      <LoadingButton
        type="submit"
        variant="contained"
        loading={isSubmitting}
        disabled={!message.trim() || isSubmitting}
        sx={{ minWidth: 100 }}
        startIcon={<Send />}
      >
        Send
      </LoadingButton>
    </Paper>
  );
};

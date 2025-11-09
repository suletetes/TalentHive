import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  TextField,
  IconButton,
  Typography,
} from '@mui/material';
import { Send } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { apiService } from '@/services/api';
// import io, { Socket } from 'socket.io-client';

interface ChatInterfaceProps {
  conversationId: string;
  currentUserId: string;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  conversationId,
  currentUserId,
}) => {
  const [message, setMessage] = useState('');
  // const [socket, setSocket] = useState<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: messagesData } = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
      const response = await apiService.get(`/messages/conversations/${conversationId}/messages`);
      return response.data.data;
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: (content: string) =>
      apiService.post(`/messages/conversations/${conversationId}/messages`, { content }),
    onSuccess: () => {
      setMessage('');
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
    },
  });

  useEffect(() => {
    // const token = localStorage.getItem('token');
    // const newSocket = io(import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000', {
    //   auth: { token },
    // });

    // newSocket.on('connect', () => {
    //   newSocket.emit('join_conversation', conversationId);
    // });

    // newSocket.on('new_message', () => {
    //   queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
    // });

    // setSocket(newSocket);

    // return () => {
    //   newSocket.emit('leave_conversation', conversationId);
    //   newSocket.disconnect();
    // };
  }, [conversationId]);

  const handleSend = () => {
    if (message.trim()) {
      sendMessageMutation.mutate(message);
    }
  };

  const messages = messagesData?.messages || [];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '600px' }}>
      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        {messages.map((msg: any) => (
          <Box
            key={msg._id}
            sx={{
              display: 'flex',
              justifyContent: msg.sender._id === currentUserId ? 'flex-end' : 'flex-start',
              mb: 2,
            }}
          >
            <Paper
              sx={{
                p: 1.5,
                maxWidth: '70%',
                bgcolor: msg.sender._id === currentUserId ? 'primary.main' : 'grey.100',
                color: msg.sender._id === currentUserId ? 'white' : 'text.primary',
              }}
            >
              <Typography variant="body2">{msg.content}</Typography>
              <Typography variant="caption" sx={{ opacity: 0.7 }}>
                {format(new Date(msg.createdAt), 'HH:mm')}
              </Typography>
            </Paper>
          </Box>
        ))}
        <div ref={messagesEndRef} />
      </Box>

      {/* <Divider /> */}

      <Box sx={{ p: 2, display: 'flex', gap: 1 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Type a message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
        />
        <IconButton color="primary" onClick={handleSend}>
          <Send />
        </IconButton>
      </Box>
    </Box>
  );
};
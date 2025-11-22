import React, { useState, useRef } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Paper,
  CircularProgress,
  Chip,
  Stack,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import CloseIcon from '@mui/icons-material/Close';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { messagesService, Attachment } from '@/services/api/messages.service';
import toast from 'react-hot-toast';

interface MessageComposerProps {
  conversationId: string;
}

export const MessageComposer: React.FC<MessageComposerProps> = ({ conversationId }) => {
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async (files: File[]) => {
      return messagesService.uploadAttachments(files);
    },
    onSuccess: (data) => {
      setAttachments((prev) => [...prev, ...data.data]);
      setSelectedFiles([]);
      toast.success(`${data.data.length} file(s) uploaded`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to upload files');
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async () => {
      const trimmedMessage = message.trim();
      if (!trimmedMessage && attachments.length === 0) {
        throw new Error('Message content or attachments required');
      }
      return messagesService.sendMessage(conversationId, {
        content: trimmedMessage,
        attachments: attachments.length > 0 ? attachments : undefined,
      });
    },
    onSuccess: () => {
      setMessage('');
      setAttachments([]);
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to send message');
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    // Validate files
    const validFiles: File[] = [];
    for (const file of files) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`File ${file.name} exceeds 10MB limit`);
        continue;
      }

      // Check file type
      const allowedTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ];

      if (!allowedTypes.includes(file.type)) {
        toast.error(`File type ${file.type} not supported`);
        continue;
      }

      validFiles.push(file);
    }

    if (validFiles.length > 0) {
      setSelectedFiles(validFiles);
      uploadMutation.mutate(validFiles);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSend = () => {
    sendMessageMutation.mutate();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isLoading = sendMessageMutation.isPending || uploadMutation.isPending;
  const canSend = (message.trim().length > 0 || attachments.length > 0) && !isLoading;

  return (
    <Paper
      elevation={3}
      sx={{
        p: 2,
        borderTop: 1,
        borderColor: 'divider',
      }}
    >
      {/* Attachments preview */}
      {attachments.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {attachments.map((attachment, index) => (
              <Chip
                key={index}
                label={attachment.filename}
                onDelete={() => handleRemoveAttachment(index)}
                size="small"
                icon={attachment.type === 'image' ? undefined : undefined}
              />
            ))}
          </Stack>
        </Box>
      )}

      {/* Input area */}
      <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1 }}>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          style={{ display: 'none' }}
          disabled={isLoading}
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
        />
        
        <IconButton
          color="primary"
          onClick={handleAttachClick}
          disabled={isLoading}
          size="small"
          title="Attach files"
        >
          {uploadMutation.isPending ? (
            <CircularProgress size={24} />
          ) : (
            <AttachFileIcon />
          )}
        </IconButton>

        <TextField
          fullWidth
          multiline
          maxRows={4}
          placeholder="Type a message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={isLoading}
          variant="outlined"
          size="small"
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 3,
            },
          }}
        />

        <IconButton
          color="primary"
          onClick={handleSend}
          disabled={!canSend}
          sx={{
            bgcolor: 'primary.main',
            color: 'white',
            '&:hover': {
              bgcolor: 'primary.dark',
            },
            '&.Mui-disabled': {
              bgcolor: 'action.disabledBackground',
            },
          }}
        >
          {isLoading ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            <SendIcon />
          )}
        </IconButton>
      </Box>
    </Paper>
  );
};

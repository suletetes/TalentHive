import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Download as DownloadIcon,
  Close as CloseIcon,
  Image as ImageIcon,
  Description as DescriptionIcon,
} from '@mui/icons-material';

interface MessageAttachmentProps {
  url: string;
  name: string;
  type?: string;
  size?: number;
  onRemove?: () => void;
}

export const MessageAttachment: React.FC<MessageAttachmentProps> = ({
  url,
  name,
  type = 'file',
  size,
  onRemove,
}) => {
  const isImage = type.startsWith('image/');
  const isPdf = type === 'application/pdf';

  const getIcon = () => {
    if (isImage) return <ImageIcon />;
    if (isPdf) return <DescriptionIcon />;
    return <DescriptionIcon />;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  if (isImage) {
    return (
      <Box sx={{ position: 'relative', display: 'inline-block' }}>
        <Box
          component="img"
          src={url}
          alt={name}
          sx={{
            maxWidth: '100%',
            maxHeight: 300,
            borderRadius: 1,
            cursor: 'pointer',
          }}
          onClick={() => window.open(url, '_blank')}
        />
        {onRemove && (
          <IconButton
            size="small"
            onClick={onRemove}
            sx={{
              position: 'absolute',
              top: -8,
              right: -8,
              backgroundColor: 'error.main',
              color: 'white',
              '&:hover': { backgroundColor: 'error.dark' },
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        )}
      </Box>
    );
  }

  return (
    <Card variant="outlined" sx={{ mb: 1 }}>
      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 1.5 }}>
        <Box sx={{ color: 'primary.main' }}>{getIcon()}</Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="body2"
            fontWeight="500"
            noWrap
            sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
            onClick={() => window.open(url, '_blank')}
          >
            {name}
          </Typography>
          {size && (
            <Typography variant="caption" color="text.secondary">
              {formatFileSize(size)}
            </Typography>
          )}
        </Box>
        <Tooltip title="Download">
          <IconButton
            size="small"
            href={url}
            download={name}
            target="_blank"
            rel="noopener noreferrer"
          >
            <DownloadIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        {onRemove && (
          <Tooltip title="Remove">
            <IconButton size="small" onClick={onRemove} color="error">
              <CloseIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </CardContent>
    </Card>
  );
};

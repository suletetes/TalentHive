import React from 'react';
import {
  Box,
  Avatar,
  AvatarGroup,
  Tooltip,
  Typography,
  Popover,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
} from '@mui/material';
import { Done as DoneIcon, DoneAll as DoneAllIcon } from '@mui/icons-material';

interface ReadReceipt {
  user: {
    _id: string;
    profile: {
      firstName: string;
      lastName: string;
      avatar?: string;
    };
  };
  readAt: string;
}

interface ReadReceiptsProps {
  readBy: ReadReceipt[];
  totalRecipients: number;
}

export const ReadReceipts: React.FC<ReadReceiptsProps> = ({ readBy, totalRecipients }) => {
  const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(null);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);
  const unreadCount = totalRecipients - readBy.length;
  const allRead = unreadCount === 0;

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
      {allRead ? (
        <DoneAllIcon sx={{ fontSize: 16, color: 'primary.main' }} />
      ) : (
        <DoneIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
      )}

      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
        onClick={handleClick}
      >
        {readBy.length} of {totalRecipients} read
      </Typography>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
      >
        <Box sx={{ p: 2, minWidth: 300 }}>
          <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
            Read by ({readBy.length})
          </Typography>
          <List dense>
            {readBy.map((receipt) => (
              <ListItem key={receipt.user._id}>
                <ListItemAvatar>
                  <Avatar
                    src={receipt.user.profile.avatar}
                    alt={`${receipt.user.profile.firstName} ${receipt.user.profile.lastName}`}
                  />
                </ListItemAvatar>
                <ListItemText
                  primary={`${receipt.user.profile.firstName} ${receipt.user.profile.lastName}`}
                  secondary={new Date(receipt.readAt).toLocaleString()}
                />
              </ListItem>
            ))}
          </List>
        </Box>
      </Popover>
    </Box>
  );
};

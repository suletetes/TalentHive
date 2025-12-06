import React from 'react';
import { IconButton, Tooltip } from '@mui/material';
import { Brightness4, Brightness7 } from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import { toggleTheme } from '@/store/slices/uiSlice';

export const ThemeToggle: React.FC = () => {
  const dispatch = useDispatch();
  const theme = useSelector((state: RootState) => state.ui.theme);

  const handleToggle = () => {
    dispatch(toggleTheme());
  };

  return (
    <Tooltip title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}>
      <IconButton onClick={handleToggle} color="inherit">
        {theme === 'light' ? <Brightness4 /> : <Brightness7 />}
      </IconButton>
    </Tooltip>
  );
};

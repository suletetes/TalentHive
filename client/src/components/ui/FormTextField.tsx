import React from 'react';
import { TextField, TextFieldProps } from '@mui/material';

export const FormTextField: React.FC<TextFieldProps> = (props) => {
  return (
    <TextField
      fullWidth
      variant="outlined"
      margin="normal"
      {...props}
      sx={{
        '& .MuiOutlinedInput-root': {
          '&:hover fieldset': {
            borderColor: 'primary.main',
          },
        },
        ...props.sx,
      }}
    />
  );
};

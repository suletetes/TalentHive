import React from 'react';
import { Box, Typography, Chip } from '@mui/material';
import { Lightbulb } from '@mui/icons-material';

interface SlugSuggestionsProps {
  suggestions: string[];
  onSelect: (slug: string) => void;
}

export const SlugSuggestions: React.FC<SlugSuggestionsProps> = ({ suggestions, onSelect }) => {
  if (suggestions.length === 0) {
    return null;
  }

  return (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <Lightbulb sx={{ fontSize: 18, color: 'warning.main' }} />
        <Typography variant="body2" fontWeight={600}>
          Available alternatives:
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {suggestions.map((suggestion) => (
          <Chip
            key={suggestion}
            label={suggestion}
            onClick={() => onSelect(suggestion)}
            clickable
            variant="outlined"
            sx={{
              '&:hover': {
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                borderColor: 'primary.main',
              },
            }}
          />
        ))}
      </Box>
    </Box>
  );
};

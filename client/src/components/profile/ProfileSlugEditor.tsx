import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  InputAdornment,
  Paper,
} from '@mui/material';
import { Check, Close, Link as LinkIcon } from '@mui/icons-material';
import { useDebounce } from '@/hooks/useDebounce';
import { slugService } from '@/services/api/slug.service';
import { SlugSuggestions } from './SlugSuggestions';

interface ProfileSlugEditorProps {
  currentSlug: string;
  onSlugChange: (slug: string) => void;
  disabled?: boolean;
}

export const ProfileSlugEditor: React.FC<ProfileSlugEditorProps> = ({
  currentSlug,
  onSlugChange,
  disabled = false,
}) => {
  const [slug, setSlug] = useState(currentSlug);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    available: boolean;
    message: string;
    suggestions?: string[];
  } | null>(null);
  const debouncedSlug = useDebounce(slug, 500);

  useEffect(() => {
    setSlug(currentSlug);
  }, [currentSlug]);

  useEffect(() => {
    const validateSlug = async () => {
      if (!debouncedSlug || debouncedSlug === currentSlug) {
        setValidationResult(null);
        return;
      }

      // Basic validation
      const slugRegex = /^[a-z0-9-]+$/;
      if (!slugRegex.test(debouncedSlug)) {
        setValidationResult({
          available: false,
          message: 'Slug can only contain lowercase letters, numbers, and hyphens',
        });
        return;
      }

      if (debouncedSlug.length < 3) {
        setValidationResult({
          available: false,
          message: 'Slug must be at least 3 characters long',
        });
        return;
      }

      if (debouncedSlug.length > 50) {
        setValidationResult({
          available: false,
          message: 'Slug must be at most 50 characters long',
        });
        return;
      }

      setIsValidating(true);
      try {
        const result = await slugService.validateSlug(debouncedSlug);
        setValidationResult(result);
        if (result.available) {
          onSlugChange(debouncedSlug);
        }
      } catch (error: any) {
        setValidationResult({
          available: false,
          message: error.response?.data?.message || 'Failed to validate slug',
        });
      } finally {
        setIsValidating(false);
      }
    };

    validateSlug();
  }, [debouncedSlug, currentSlug, onSlugChange]);

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setSlug(value);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSlug(suggestion);
  };

  const getValidationIcon = () => {
    if (isValidating) {
      return <CircularProgress size={20} />;
    }
    if (validationResult) {
      return validationResult.available ? (
        <Check color="success" />
      ) : (
        <Close color="error" />
      );
    }
    return null;
  };

  const baseUrl = `${window.location.origin}/freelancer/`;

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Profile URL
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Customize your profile URL to make it easy to share
      </Typography>

      <TextField
        fullWidth
        value={slug}
        onChange={handleSlugChange}
        disabled={disabled}
        placeholder="your-custom-slug"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <LinkIcon sx={{ color: 'text.secondary' }} />
            </InputAdornment>
          ),
          endAdornment: isValidating || validationResult ? (
            <InputAdornment position="end">{getValidationIcon()}</InputAdornment>
          ) : null,
        }}
        sx={{ mb: 2 }}
      />

      <Box sx={{ mb: 2 }}>
        <Typography variant="caption" color="text.secondary">
          Your profile will be available at:
        </Typography>
        <Typography
          variant="body2"
          sx={{
            mt: 0.5,
            p: 1,
            bgcolor: 'action.hover',
            borderRadius: 1,
            fontFamily: 'monospace',
            wordBreak: 'break-all',
          }}
        >
          {baseUrl}
          <strong>{slug || 'your-slug'}</strong>
        </Typography>
      </Box>

      {validationResult && (
        <Alert severity={validationResult.available ? 'success' : 'error'} sx={{ mb: 2 }}>
          {validationResult.message}
        </Alert>
      )}

      {validationResult?.suggestions && validationResult.suggestions.length > 0 && (
        <SlugSuggestions
          suggestions={validationResult.suggestions}
          onSelect={handleSuggestionClick}
        />
      )}

      <Alert severity="info" sx={{ mt: 2 }}>
        <Typography variant="caption">
          • Slug can only contain lowercase letters, numbers, and hyphens
          <br />
          • Must be between 3-50 characters
          <br />• Changing your slug will create a redirect from your old URL
        </Typography>
      </Alert>
    </Paper>
  );
};

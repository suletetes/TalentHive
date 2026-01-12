import React, { useState, useEffect } from 'react';
import {
  TextField,
  Autocomplete,
  InputAdornment,
  CircularProgress,
} from '@mui/material';
import { Search } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { apiService } from '@/services/api';

interface SearchBarProps {
  type?: 'projects' | 'skills';
  placeholder?: string;
  onSearch?: (query: string) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  type = 'projects',
  placeholder = 'Search...',
  onSearch,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [debouncedValue, setDebouncedValue] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(inputValue);
    }, 300);

    return () => clearTimeout(timer);
  }, [inputValue]);

  const { data, isLoading } = useQuery({
    queryKey: ['search-suggestions', type, debouncedValue],
    queryFn: async () => {
      if (debouncedValue.length < 2) return { suggestions: [] };
      const response = await apiService.get(`/search/suggestions?q=${debouncedValue}&type=${type}`);
      return response.data.data;
    },
    enabled: debouncedValue.length >= 2,
  });

  const handleSearch = (value: string) => {
    if (value) {
      if (onSearch) {
        onSearch(value);
      } else {
        navigate(`/search?q=${encodeURIComponent(value)}&type=${type}`);
      }
    }
  };

  return (
    <Autocomplete
      freeSolo
      options={data?.suggestions || []}
      inputValue={inputValue}
      onInputChange={(_, newValue) => setInputValue(newValue)}
      onChange={(_, value) => {
        if (value) handleSearch(value as string);
      }}
      loading={isLoading}
      renderInput={(params) => (
        <TextField
          {...params}
          placeholder={placeholder}
          variant="outlined"
          size="small"
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleSearch(inputValue);
            }
          }}
          InputProps={{
            ...params.InputProps,
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
            endAdornment: (
              <>
                {isLoading ? <CircularProgress size={20} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
    />
  );
};
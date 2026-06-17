import React, { useState, useEffect, useRef } from 'react';
import { TextField, InputAdornment } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

const DebouncedSearchInput = ({ 
  onSearch, 
  delay = 500, 
  placeholder = "Search...",
  value = "",
  ...props 
}) => {
  const [searchTerm, setSearchTerm] = useState(value);
  const abortControllerRef = useRef(null);

  useEffect(() => {
    setSearchTerm(value);
  }, [value]);

  const onSearchRef = useRef(onSearch);
  useEffect(() => {
    onSearchRef.current = onSearch;
  }, [onSearch]);

  useEffect(() => {
    const handler = setTimeout(() => {
      // Cancel previous request if any
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create a new AbortController for the upcoming request
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      onSearchRef.current(searchTerm, abortController.signal);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm, delay]);

  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return (
    <TextField
      variant="outlined"
      size="small"
      placeholder={placeholder}
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon />
          </InputAdornment>
        ),
      }}
      {...props}
    />
  );
};

export default DebouncedSearchInput;

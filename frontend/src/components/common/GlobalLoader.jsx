import React from 'react';
import { LinearProgress, Box } from '@mui/material';
import { useGlobalLoader } from '../../context/GlobalLoaderContext';

const GlobalLoader = () => {
  const { isLoading } = useGlobalLoader();

  if (!isLoading) return null;

  return (
    <Box sx={{ width: '100%', position: 'fixed', top: 0, left: 0, zIndex: 9999 }}>
      <LinearProgress color="primary" />
    </Box>
  );
};

export default GlobalLoader;

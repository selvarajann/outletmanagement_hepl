import React from 'react';
import { Button, CircularProgress } from '@mui/material';

const ActionButton = ({ 
  children, 
  onClick, 
  loading = false, 
  disabled = false, 
  type = 'button',
  variant = 'contained',
  color = 'primary',
  ...props 
}) => {
  return (
    <Button
      type={type}
      variant={variant}
      color={color}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
      sx={{
        position: 'relative',
        ...props.sx
      }}
    >
      {loading && (
        <CircularProgress
          size={24}
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            marginTop: '-12px',
            marginLeft: '-12px',
          }}
        />
      )}
      <span style={{ visibility: loading ? 'hidden' : 'visible' }}>
        {children}
      </span>
    </Button>
  );
};

export default ActionButton;

import React from 'react';
import { Chip } from '@mui/material';

const ReturnStatusBadge = ({ status }) => {
  let color = 'default';
  
  switch (status) {
    case 'PENDING':
      color = 'warning';
      break;
    case 'SUBMITTED':
    case 'APPROVED':
    case 'ACKNOWLEDGED':
      color = 'info';
      break;
    case 'PICKED_UP':
      color = 'secondary';
      break;
    case 'COMPLETED':
      color = 'success';
      break;
    case 'FAILED':
    case 'REJECTED':
      color = 'error';
      break;
    default:
      color = 'default';
  }

  return <Chip label={status} color={color} size="small" />;
};

export default ReturnStatusBadge;

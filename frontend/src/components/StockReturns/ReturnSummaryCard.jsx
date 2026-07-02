import React from 'react';
import { Card, CardContent, Typography, Box, Divider } from '@mui/material';
import ReturnStatusBadge from './ReturnStatusBadge';
import { formatDate } from '../../utils/formatters';

const ReturnSummaryCard = ({ data }) => {
  return (
    <Card sx={{ height: '100%', borderRadius: 2, boxShadow: '0 4px 6px rgba(0,0,0,0.04)' }}>
      <CardContent>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Return Summary</Typography>
        <Divider sx={{ mb: 2 }} />
        
        <Box display="flex" flexDirection="column" gap={1.5}>
          <Box display="flex" justifyContent="space-between">
            <Typography variant="body2" color="text.secondary">Return Code:</Typography>
            <Typography variant="body2" fontWeight={600}>{data.returnCode}</Typography>
          </Box>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="body2" color="text.secondary">Status:</Typography>
            <ReturnStatusBadge status={data.status} />
          </Box>
          <Box display="flex" justifyContent="space-between">
            <Typography variant="body2" color="text.secondary">Reason:</Typography>
            <Typography variant="body2">{data.reason}</Typography>
          </Box>
          <Box display="flex" justifyContent="space-between">
            <Typography variant="body2" color="text.secondary">Created Date:</Typography>
            <Typography variant="body2">{formatDate(data.createdAt)}</Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ReturnSummaryCard;

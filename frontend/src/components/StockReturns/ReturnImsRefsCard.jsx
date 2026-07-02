import React from 'react';
import { Card, CardContent, Typography, Box, Divider } from '@mui/material';

const ReturnImsRefsCard = ({ data }) => {
  return (
    <Card sx={{ height: '100%', borderRadius: 2, boxShadow: '0 4px 6px rgba(0,0,0,0.04)' }}>
      <CardContent>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>IMS References</Typography>
        <Divider sx={{ mb: 2 }} />
        
        <Box display="flex" flexDirection="column" gap={1.5}>
          <Box display="flex" justifyContent="space-between">
            <Typography variant="body2" color="text.secondary">Ack Code:</Typography>
            <Typography variant="body2" fontWeight={500} color={data.imsAckCode ? 'text.primary' : 'text.disabled'}>
              {data.imsAckCode || 'N/A'}
            </Typography>
          </Box>
          <Box display="flex" justifyContent="space-between">
            <Typography variant="body2" color="text.secondary">Pickup Reference:</Typography>
            <Typography variant="body2" fontWeight={500} color={data.pickupReferenceCode ? 'text.primary' : 'text.disabled'}>
              {data.pickupReferenceCode || 'N/A'}
            </Typography>
          </Box>
          <Box display="flex" justifyContent="space-between">
            <Typography variant="body2" color="text.secondary">Completion Reference:</Typography>
            <Typography variant="body2" fontWeight={500} color={data.completionReferenceCode ? 'text.primary' : 'text.disabled'}>
              {data.completionReferenceCode || 'N/A'}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ReturnImsRefsCard;

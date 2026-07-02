import React from 'react';
import { Card, CardContent, Typography, Box, Divider } from '@mui/material';

const ReturnBatchInfoCard = ({ data }) => {
  // If multiple items exist, we summarize them or show the first one depending on requirements.
  // Assuming Phase B calls for showing general batch info and total quantity.
  const totalQuantity = data.items?.reduce((sum, item) => sum + item.quantityReturned, 0) || 0;
  const productName = data.items?.length > 0 ? data.items[0].productName : 'N/A';

  return (
    <Card sx={{ height: '100%', borderRadius: 2, boxShadow: '0 4px 6px rgba(0,0,0,0.04)' }}>
      <CardContent>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Batch Information</Typography>
        <Divider sx={{ mb: 2 }} />
        
        <Box display="flex" flexDirection="column" gap={1.5}>
          <Box display="flex" justifyContent="space-between">
            <Typography variant="body2" color="text.secondary">Batch Code:</Typography>
            <Typography variant="body2" fontWeight={600}>{data.batchCode}</Typography>
          </Box>
          <Box display="flex" justifyContent="space-between">
            <Typography variant="body2" color="text.secondary">Product Name:</Typography>
            <Typography variant="body2">{data.items?.length > 1 ? `${productName} (+${data.items.length - 1} more)` : productName}</Typography>
          </Box>
          <Box display="flex" justifyContent="space-between">
            <Typography variant="body2" color="text.secondary">Total Quantity Returned:</Typography>
            <Typography variant="body2" fontWeight={600}>{totalQuantity}</Typography>
          </Box>
          <Box display="flex" justifyContent="space-between">
            <Typography variant="body2" color="text.secondary">Outlet:</Typography>
            <Typography variant="body2">{data.outletName}</Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ReturnBatchInfoCard;

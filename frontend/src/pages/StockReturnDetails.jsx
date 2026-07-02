import React from 'react';
import { C } from "../theme/colors";
import { Box, Grid, CircularProgress, Typography } from '@mui/material';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import PageHeader from '../components/shared/PageHeader';
import { GetStockReturnById } from '../services/StockReturnService';
import ReturnTimeline from '../components/StockReturns/ReturnTimeline';
import ReturnSummaryCard from '../components/StockReturns/ReturnSummaryCard';
import ReturnBatchInfoCard from '../components/StockReturns/ReturnBatchInfoCard';
import ReturnImsRefsCard from '../components/StockReturns/ReturnImsRefsCard';
import ReturnAuditLogs from '../components/StockReturns/ReturnAuditLogs';

const StockReturnDetails = () => {
  const { id } = useParams();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['stockReturnDetails', id],
    queryFn: () => GetStockReturnById(id),
  });

  if (isLoading) {
    return (
    <Box sx={{ p: 3, backgroundColor: C.surface, minHeight: "100vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError || !data) {
    return (
      <Box p={3}>
        <PageHeader 
          title="Return Details" 
          subtitle="Failed to load return details." 
        />
        <Typography color="error">The requested return could not be found or an error occurred.</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader 
        title={`Return Details: ${data.returnCode}`} 
        subtitle="View complete return lifecycle and metadata" 
        breadcrumbs={[
          { label: 'Home', path: '/dashboard' },
          { label: 'Stock Returns', path: '/stock-returns' },
          { label: 'Details', path: '' }
        ]}
      />
      
      <Box sx={{ p: 3 }}>
        <ReturnTimeline currentStatus={data.status} />
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <ReturnSummaryCard data={data} />
              </Grid>
              <Grid item xs={12}>
                <ReturnBatchInfoCard data={data} />
              </Grid>
              <Grid item xs={12}>
                <ReturnImsRefsCard data={data} />
              </Grid>
            </Grid>
          </Grid>
          
          <Grid item xs={12} md={8}>
            <ReturnAuditLogs returnCode={data.returnCode} />
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default StockReturnDetails;

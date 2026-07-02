import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, Typography, Box } from '@mui/material';
import EnterpriseTable from '../shared/EnterpriseTable';
import TablePagination from '../shared/TablePagination';
import { GetAuditLogs } from '../../services/AuditLogService';
import { formatDate } from '../../utils/formatters';

const ReturnAuditLogs = ({ returnCode }) => {
  const [params, setParams] = useState({ page: 0, size: 10 });

  const { data, isLoading, isError } = useQuery({
    queryKey: ['auditLogs', 'StockReturn', returnCode, params],
    queryFn: () => GetAuditLogs({ entity: 'StockReturn', businessKey: returnCode, ...params }),
    enabled: !!returnCode,
  });

  const columns = [
    { key: 'action', label: 'Action', sortable: false },
    { key: 'username', label: 'Username', sortable: false },
    { 
      key: 'createdAt', 
      label: 'Date', 
      sortable: false,
      render: (row) => formatDate(row.createdAt)
    }
  ];

  return (
    <Card sx={{ borderRadius: 2, boxShadow: '0 4px 6px rgba(0,0,0,0.04)' }}>
      <CardContent>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Audit Logs</Typography>
        
        <EnterpriseTable 
          columns={columns}
          data={data?.rows || []}
          isLoading={isLoading}
          error={isError ? "Failed to load audit logs" : null}
        />
        
        <Box mt={2}>
          <TablePagination
            page={params.page}
            totalPages={data?.totalPages || 0}
            onPageChange={(page) => setParams(p => ({ ...p, page }))}
          />
        </Box>
      </CardContent>
    </Card>
  );
};

export default ReturnAuditLogs;

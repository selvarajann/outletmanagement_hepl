import React, { useState } from 'react';
import { Box, Chip, Button } from '@mui/material';
import PageHeader from '../shared/PageHeader';
import EnterpriseTable from '../shared/EnterpriseTable';
import TablePagination from '../shared/TablePagination';
import SearchFilter from '../shared/SearchFilter';
import { GetStockReturns, ApproveReturn, RejectReturn } from '../../services/StockReturnService';
import { useQuery, useMutation } from '@tanstack/react-query';

const StockReturns = () => {
  const [params, setParams] = useState({ page: 0, size: 10, sortBy: 'createdAt', direction: 'desc', keyword: '', status: '' });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['stockReturns', params],
    queryFn: ({ signal }) => GetStockReturns(params, signal),
  });

  const approveMutation = useMutation({
    mutationFn: (id) => ApproveReturn(id),
    onSuccess: () => refetch()
  });

  const rejectMutation = useMutation({
    mutationFn: (id) => RejectReturn(id, "Rejected by Admin"),
    onSuccess: () => refetch()
  });

  const columns = [
    { id: 'returnCode', label: 'Return Code' },
    { id: 'batchCode', label: 'Batch' },
    { id: 'reason', label: 'Reason' },
    {
      id: 'status',
      label: 'Status',
      renderCell: (row) => {
        let color = 'default';
        if (row.status === 'PENDING') color = 'warning';
        if (row.status === 'APPROVED' || row.status === 'SUBMITTED') color = 'info';
        if (row.status === 'COMPLETED') color = 'success';
        if (row.status === 'REJECTED') color = 'error';
        return <Chip label={row.status} color={color} size="small" />;
      }
    },
    {
      id: 'actions',
      label: 'Actions',
      renderCell: (row) => (
        <Box display="flex" gap={1}>
          {row.status === 'PENDING' && (
            <>
              <Button size="small" variant="contained" color="primary" onClick={() => approveMutation.mutate(row.id)}>Approve</Button>
              <Button size="small" variant="outlined" color="error" onClick={() => rejectMutation.mutate(row.id)}>Reject</Button>
            </>
          )}
        </Box>
      )
    }
  ];

  return (
    <Box>
      <PageHeader title="Active Stock Returns" subtitle="Manage defective or expired items returning to IMS" />
      <Box sx={{ p: 3 }}>
        <SearchFilter
          searchTerm={params.keyword}
          onSearchChange={(val) => setParams(p => ({ ...p, keyword: val, page: 0 }))}
          filterOptions={[
            { label: 'All', value: '' }, 
            { label: 'Pending', value: 'PENDING' }, 
            { label: 'Approved', value: 'APPROVED' },
            { label: 'Submitted', value: 'SUBMITTED' }
          ]}
          currentFilter={params.status}
          onFilterChange={(val) => setParams(p => ({ ...p, status: val, page: 0 }))}
          placeholder="Search by code or reason..."
        />
        <EnterpriseTable columns={columns} data={data?.rows || []} loading={isLoading} />
        <TablePagination
          page={params.page}
          size={params.size}
          totalElements={data?.totalPages * params.size || 0}
          onPageChange={(page) => setParams(p => ({ ...p, page }))}
          onRowsPerPageChange={(size) => setParams(p => ({ ...p, size, page: 0 }))}
        />
      </Box>
    </Box>
  );
};
export default StockReturns;

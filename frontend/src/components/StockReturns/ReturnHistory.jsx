import React, { useState } from 'react';
import { Box, Chip } from '@mui/material';
import PageHeader from '../shared/PageHeader';
import EnterpriseTable from '../shared/EnterpriseTable';
import TablePagination from '../shared/TablePagination';
import SearchFilter from '../shared/SearchFilter';
import { GetStockReturns } from '../../services/StockReturnService';
import { useQuery } from '@tanstack/react-query';

const ReturnHistory = () => {
  const [params, setParams] = useState({ page: 0, size: 10, sortBy: 'createdAt', direction: 'desc', keyword: '', status: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['returnHistory', params],
    queryFn: ({ signal }) => GetStockReturns(params, signal),
  });

  const columns = [
    { id: 'returnCode', label: 'Return Code' },
    { id: 'imsAckCode', label: 'IMS ACK Code' },
    { id: 'batchCode', label: 'Batch' },
    {
      id: 'status',
      label: 'Status',
      renderCell: (row) => {
        let color = 'default';
        if (row.status === 'COMPLETED') color = 'success';
        if (row.status === 'REJECTED') color = 'error';
        if (row.status === 'PENDING' || row.status === 'APPROVED' || row.status === 'SUBMITTED') color = 'warning';
        return <Chip label={row.status} color={color} size="small" />;
      }
    }
  ];

  return (
    <Box>
      <PageHeader title="Return History" subtitle="View history of all completed and rejected returns" />
      <Box sx={{ p: 3 }}>
        <SearchFilter
          searchTerm={params.keyword}
          onSearchChange={(val) => setParams(p => ({ ...p, keyword: val, page: 0 }))}
          filterOptions={[
            { label: 'All', value: '' }, 
            { label: 'Completed', value: 'COMPLETED' }, 
            { label: 'Rejected', value: 'REJECTED' }
          ]}
          currentFilter={params.status}
          onFilterChange={(val) => setParams(p => ({ ...p, status: val, page: 0 }))}
          placeholder="Search by code or ACK..."
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
export default ReturnHistory;

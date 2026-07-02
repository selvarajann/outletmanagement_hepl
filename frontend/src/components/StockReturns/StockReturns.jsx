import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button } from '@mui/material';
import AssignmentReturnIcon from '@mui/icons-material/AssignmentReturn';
import PageHeader from '../shared/PageHeader';
import EnterpriseTable from '../shared/EnterpriseTable';
import TablePagination from '../shared/TablePagination';
import SearchFilter from '../shared/SearchFilter';
import ReturnStatusBadge from './ReturnStatusBadge';
import CreateReturnModal from './CreateReturnModal';
import { GetStockReturns } from '../../services/StockReturnService';
import { useQuery } from '@tanstack/react-query';
import { C } from '../../theme/colors';

const StockReturns = () => {
  const navigate = useNavigate();
  const [params, setParams] = useState({ page: 0, size: 10, sortBy: 'createdAt', direction: 'desc', keyword: '', status: '' });
  const [createOpen, setCreateOpen] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['stockReturns', params],
    queryFn: ({ signal }) => GetStockReturns(params, signal),
  });

  const columns = [
    { key: 'returnCode', label: 'Return Code' },
    { key: 'batchCode', label: 'Batch' },
    { key: 'reason', label: 'Reason' },
    {
      key: 'imsStatus',
      label: 'IMS Status',
      render: (row) => (
        <Box sx={{
          display: 'inline-flex', alignItems: 'center', px: 1.5, py: 0.5,
          borderRadius: '20px', fontSize: 11, fontWeight: 700,
          bgcolor: row.imsSyncStatus === 'SYNCED' ? C.emeraldLight
                  : row.imsSyncStatus === 'FAILED' ? C.redLight
                  : C.amberLight,
          color: row.imsSyncStatus === 'SYNCED' ? C.emerald
               : row.imsSyncStatus === 'FAILED' ? C.red
               : C.amber,
        }}>
          {row.imsSyncStatus || 'PENDING'}
        </Box>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <ReturnStatusBadge status={row.status} />
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <Button
          size="small" variant="outlined"
          onClick={() => navigate(`/stock-returns/${row.id}`)}
          sx={{ textTransform: 'none', fontWeight: 600, fontSize: 12, borderRadius: '8px', borderColor: C.border, color: C.navy, '&:hover': { borderColor: C.navy, bgcolor: C.bgMuted } }}
        >
          View
        </Button>
      )
    }
  ];

  return (
    <Box sx={{ p: 3, backgroundColor: C.surface, minHeight: '100vh' }}>
      {/* Header with action button */}
      <PageHeader 
        title="Stock Returns" 
        subtitle="Manage defective or expired items returning to IMS" 
        onAdd={() => setCreateOpen(true)}
        addLabel="New Stock Return"
      />

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

      <EnterpriseTable columns={columns} data={data?.rows || []} />
      <TablePagination
        page={params.page}
        totalPages={data?.totalPages || 0}
        onPageChange={(page) => setParams(p => ({ ...p, page }))}
      />

      <CreateReturnModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={() => { setCreateOpen(false); refetch(); }}
      />
    </Box>
  );
};
export default StockReturns;

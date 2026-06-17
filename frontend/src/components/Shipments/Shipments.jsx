import React, { useState } from 'react';
import { Box, Chip, Button } from '@mui/material';
import PageHeader from '../shared/PageHeader';
import EnterpriseTable from '../shared/EnterpriseTable';
import TablePagination from '../shared/TablePagination';
import SearchFilter from '../shared/SearchFilter';
import { GetShipments } from '../../services/ShipmentService';
import { useQuery } from '@tanstack/react-query';
import ReceiveShipmentDialog from './ReceiveShipmentDialog';
import ShipmentDetails from './ShipmentDetails';

const Shipments = () => {
  const [params, setParams] = useState({ page: 0, size: 10, sortBy: 'createdAt', direction: 'desc', keyword: '', status: '' });
  const [receiveDialog, setReceiveDialog] = useState({ open: false, id: null });
  const [detailsDialog, setDetailsDialog] = useState({ open: false, id: null });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['shipments', params],
    queryFn: ({ signal }) => GetShipments(params, signal),
  });

  const columns = [
    { id: 'shipmentCode', label: 'Shipment Code' },
    { id: 'imsReferenceCode', label: 'IMS Reference' },
    { id: 'outletName', label: 'Outlet' },
    { id: 'dispatchDate', label: 'Dispatch Date' },
    {
      id: 'status',
      label: 'Status',
      renderCell: (row) => {
        let color = 'default';
        if (row.status === 'IN_TRANSIT') color = 'warning';
        if (row.status === 'RECEIVED') color = 'success';
        if (row.status === 'PARTIALLY_RECEIVED') color = 'info';
        return <Chip label={row.status} color={color} size="small" />;
      }
    },
    {
      id: 'actions',
      label: 'Actions',
      renderCell: (row) => (
        <Box display="flex" gap={1}>
          <Button size="small" variant="outlined" onClick={() => setDetailsDialog({ open: true, id: row.id })}>View</Button>
          {row.status === 'IN_TRANSIT' && (
            <Button size="small" variant="contained" color="primary" onClick={() => setReceiveDialog({ open: true, id: row.id })}>Receive</Button>
          )}
        </Box>
      )
    }
  ];

  return (
    <Box>
      <PageHeader title="Incoming Shipments" subtitle="Manage stock arriving from the IMS" />
      <Box sx={{ p: 3 }}>
        <SearchFilter
          searchTerm={params.keyword}
          onSearchChange={(val) => setParams(p => ({ ...p, keyword: val, page: 0 }))}
          filterOptions={[
            { label: 'All', value: '' }, 
            { label: 'In Transit', value: 'IN_TRANSIT' }, 
            { label: 'Received', value: 'RECEIVED' },
            { label: 'Partially Received', value: 'PARTIALLY_RECEIVED' }
          ]}
          currentFilter={params.status}
          onFilterChange={(val) => setParams(p => ({ ...p, status: val, page: 0 }))}
          placeholder="Search by code or notes..."
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

      {receiveDialog.open && (
        <ReceiveShipmentDialog
          open={receiveDialog.open}
          shipmentId={receiveDialog.id}
          onClose={() => setReceiveDialog({ open: false, id: null })}
          onSuccess={() => {
            setReceiveDialog({ open: false, id: null });
            refetch();
          }}
        />
      )}

      {detailsDialog.open && (
        <ShipmentDetails
          open={detailsDialog.open}
          shipmentId={detailsDialog.id}
          onClose={() => setDetailsDialog({ open: false, id: null })}
        />
      )}
    </Box>
  );
};
export default Shipments;

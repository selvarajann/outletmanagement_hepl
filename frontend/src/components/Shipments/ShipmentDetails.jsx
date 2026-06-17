import React from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import ViewDialog from '../shared/ViewDialog';
import { useQuery } from '@tanstack/react-query';
import { GetShipmentById } from '../../services/ShipmentService';

const ShipmentDetails = ({ open, shipmentId, onClose }) => {
  const { data: shipment, isLoading } = useQuery({
    queryKey: ['shipmentDetails', shipmentId],
    queryFn: ({ signal }) => GetShipmentById(shipmentId, signal),
    enabled: !!shipmentId,
  });

  return (
    <ViewDialog open={open} onClose={onClose} title="Shipment Details" loading={isLoading} maxWidth="md">
      {shipment && (
        <Box>
          <Box display="flex" justifyContent="space-between" mb={2}>
            <Box>
              <Typography variant="subtitle2" color="textSecondary">Shipment Code</Typography>
              <Typography>{shipment.shipmentCode}</Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" color="textSecondary">IMS Reference</Typography>
              <Typography>{shipment.imsReferenceCode}</Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" color="textSecondary">Status</Typography>
              <Typography>{shipment.status}</Typography>
            </Box>
          </Box>

          <Typography variant="subtitle2" color="textSecondary" mb={1}>Items Dispatched</Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Product Code</TableCell>
                <TableCell>Product Name</TableCell>
                <TableCell>Dispatched Qty</TableCell>
                <TableCell>Received Qty</TableCell>
                <TableCell>Mfg Date</TableCell>
                <TableCell>Expiry Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {shipment.items?.map(item => (
                <TableRow key={item.id}>
                  <TableCell>{item.productCode}</TableCell>
                  <TableCell>{item.productName}</TableCell>
                  <TableCell>{item.quantityDispatched}</TableCell>
                  <TableCell>{item.quantityReceived || 0}</TableCell>
                  <TableCell>{item.mfgDate}</TableCell>
                  <TableCell>{item.expiryDate}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      )}
    </ViewDialog>
  );
};
export default ShipmentDetails;

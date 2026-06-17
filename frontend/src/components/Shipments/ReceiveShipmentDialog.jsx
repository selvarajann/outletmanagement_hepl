import React, { useState, useEffect } from 'react';
import { TextField, Table, TableBody, TableCell, TableHead, TableRow, Alert } from '@mui/material';
import FormDialog from '../shared/FormDialog';
import { useQuery, useMutation } from '@tanstack/react-query';
import { GetShipmentById, ReceiveShipment } from '../../services/ShipmentService';

const ReceiveShipmentDialog = ({ open, shipmentId, onClose, onSuccess }) => {
  const [items, setItems] = useState([]);

  const { data: shipment, isLoading } = useQuery({
    queryKey: ['shipmentForReceive', shipmentId],
    queryFn: ({ signal }) => GetShipmentById(shipmentId, signal),
    enabled: !!shipmentId,
  });

  useEffect(() => {
    if (shipment?.items) {
      setItems(shipment.items.map(i => ({ 
        id: i.id, 
        productId: i.productId, 
        quantityDispatched: i.quantityDispatched, 
        quantityReceived: i.quantityDispatched 
      })));
    }
  }, [shipment]);

  const handleQtyChange = (id, val) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, quantityReceived: parseInt(val) || 0 } : i));
  };

  const receiveMutation = useMutation({
    mutationFn: (payload) => ReceiveShipment(shipmentId, payload, 'Current_User'),
    onSuccess: () => onSuccess(),
  });

  const handleSubmit = () => {
    // Submit only items with a modified or confirmed received quantity
    receiveMutation.mutate({ items, notes: "Received via portal" });
  };

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      title={`Receive Shipment ${shipment?.shipmentCode || ''}`}
      onSubmit={handleSubmit}
      loading={isLoading}
      submitting={receiveMutation.isPending}
      maxWidth="md"
    >
      {receiveMutation.isError && <Alert severity="error" sx={{ mb: 2 }}>Failed to receive shipment</Alert>}
      <Alert severity="info" sx={{ mb: 2 }}>Adjust the Received Qty if the physical count differs from the dispatched amount.</Alert>
      
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Product</TableCell>
            <TableCell>Dispatched Qty</TableCell>
            <TableCell width="25%">Received Qty</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {shipment?.items?.map(item => (
            <TableRow key={item.id}>
              <TableCell>{item.productName} ({item.productCode})</TableCell>
              <TableCell>{item.quantityDispatched}</TableCell>
              <TableCell>
                <TextField 
                  size="small" 
                  type="number"
                  fullWidth
                  value={items.find(i => i.id === item.id)?.quantityReceived ?? ''}
                  onChange={(e) => handleQtyChange(item.id, e.target.value)}
                  inputProps={{ min: 0, max: item.quantityDispatched }}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </FormDialog>
  );
};
export default ReceiveShipmentDialog;

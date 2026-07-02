import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Box, Button, Typography, TextField, MenuItem,
  FormControl, InputLabel, Select, Divider, Chip,
  IconButton, CircularProgress, Alert, Stepper, Step, StepLabel,
  Table, TableHead, TableRow, TableCell, TableBody, Checkbox,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AssignmentReturnIcon from '@mui/icons-material/AssignmentReturn';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { toast } from 'react-toastify';
import { C } from '../../theme/colors';
import { GetBatches, GetBatchById } from '../../services/BatchService';
import { CreateStockReturn } from '../../services/StockReturnService';

const REASONS = [
  'Expired Product',
  'Defective / Damaged',
  'Wrong Product Delivered',
  'Quality Issue',
  'Excess Stock',
  'Customer Rejection',
  'Other',
];

const STEPS = ['Select Batch', 'Select Items', 'Confirm & Submit'];

export default function CreateReturnModal({ open, onClose, onSuccess }) {
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Step 0: batch selection
  const [batches, setBatches] = useState([]);
  const [batchLoading, setBatchLoading] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [batchDetail, setBatchDetail] = useState(null);
  const [batchDetailLoading, setBatchDetailLoading] = useState(false);

  // Step 1: item selection
  const [selectedItems, setSelectedItems] = useState({}); // { batchItemId: { qty, defect } }

  // Step 2: metadata
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');

  // Load received batches when modal opens
  useEffect(() => {
    if (!open) return;
    setBatchLoading(true);
    GetBatches({ status: 'RECEIVED', size: 100, page: 0 })
      .then((d) => setBatches(d.rows || []))
      .catch(() => toast.error('Failed to load batches'))
      .finally(() => setBatchLoading(false));
  }, [open]);

  // Load batch items when a batch is selected
  useEffect(() => {
    if (!selectedBatchId) { setBatchDetail(null); return; }
    setBatchDetailLoading(true);
    GetBatchById(selectedBatchId)
      .then(setBatchDetail)
      .catch(() => toast.error('Failed to load batch items'))
      .finally(() => setBatchDetailLoading(false));
  }, [selectedBatchId]);

  const reset = () => {
    setStep(0);
    setSelectedBatchId('');
    setBatchDetail(null);
    setSelectedItems({});
    setReason('');
    setNotes('');
  };

  const handleClose = () => { reset(); onClose(); };

  // ── Step 1 helpers ──────────────────────────────────────────────────────────
  const toggleItem = (item) => {
    setSelectedItems((prev) => {
      const copy = { ...prev };
      if (copy[item.id]) { delete copy[item.id]; }
      else { copy[item.id] = { qty: item.quantity, defect: '' }; }
      return copy;
    });
  };

  const updateQty = (itemId, val) =>
    setSelectedItems((prev) => ({ ...prev, [itemId]: { ...prev[itemId], qty: Math.max(1, Number(val)) } }));

  const updateDefect = (itemId, val) =>
    setSelectedItems((prev) => ({ ...prev, [itemId]: { ...prev[itemId], defect: val } }));

  const selectedCount = Object.keys(selectedItems).length;

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!reason) { toast.error('Please select a return reason'); return; }
    if (selectedCount === 0) { toast.error('Please select at least one item'); return; }

    const payload = {
      batchId: selectedBatchId,
      reason,
      notes: notes || null,
      items: Object.entries(selectedItems).map(([id, v]) => ({
        batchItemId: Number(id),
        quantityReturned: v.qty,
        defectDescription: v.defect || null,
      })),
    };

    setSubmitting(true);
    try {
      await CreateStockReturn(payload);
      toast.success('Stock return created & pushed to IMS!');
      handleClose();
      onSuccess?.();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to create return');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        elevation: 0,
        sx: {
          borderRadius: '20px',
          overflow: 'hidden',
          border: `1px solid ${C.border}`,
          boxShadow: '0 24px 64px rgba(15,23,42,0.14)',
        },
      }}
    >
      {/* Header */}
      <Box sx={{ px: 3.5, py: 2.5, borderBottom: `1px solid ${C.border}`, bgcolor: C.white, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box display="flex" alignItems="center" gap={1.5}>
          <Box sx={{ width: 36, height: 36, borderRadius: '10px', bgcolor: `color-mix(in srgb, ${C.rose} 12%, transparent)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AssignmentReturnIcon sx={{ fontSize: 20, color: C.rose }} />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: 16, color: C.navy }}>Create Stock Return</Typography>
            <Typography sx={{ fontSize: 12, color: C.slateMid }}>Return defective or excess stock to IMS</Typography>
          </Box>
        </Box>
        <IconButton onClick={handleClose} sx={{ borderRadius: '10px', color: C.slateMid, '&:hover': { bgcolor: C.bgMuted } }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Stepper */}
      <Box sx={{ px: 4, py: 2.5, bgcolor: C.bgMuted, borderBottom: `1px solid ${C.border}` }}>
        <Stepper activeStep={step} alternativeLabel>
          {STEPS.map((label) => (
            <Step key={label}><StepLabel>{label}</StepLabel></Step>
          ))}
        </Stepper>
      </Box>

      <DialogContent sx={{ p: 0, bgcolor: C.white }}>
        <Box sx={{ px: 4, py: 3 }}>

          {/* ── STEP 0: Select Batch ─────────────────────────────────────── */}
          {step === 0 && (
            <Box>
              <Typography sx={{ fontWeight: 700, fontSize: 14, color: C.navy, mb: 2 }}>
                Select a received batch to return items from
              </Typography>
              {batchLoading ? (
                <Box display="flex" justifyContent="center" py={4}><CircularProgress size={28} /></Box>
              ) : batches.length === 0 ? (
                <Alert severity="info" sx={{ borderRadius: 2 }}>No received batches found. Stock must be received before creating a return.</Alert>
              ) : (
                <Box display="grid" gap={1.5}>
                  {batches.map((b) => (
                    <Box
                      key={b.id}
                      onClick={() => setSelectedBatchId(b.id)}
                      sx={{
                        p: 2, borderRadius: 2,
                        border: `2px solid ${selectedBatchId === b.id ? C.rose : C.border}`,
                        bgcolor: selectedBatchId === b.id ? `color-mix(in srgb, ${C.rose} 5%, transparent)` : C.white,
                        cursor: 'pointer', transition: 'all 0.2s',
                        '&:hover': { borderColor: C.rose, bgcolor: `color-mix(in srgb, ${C.rose} 4%, transparent)` },
                        display: 'flex', alignItems: 'center', gap: 2,
                      }}
                    >
                      <LocalShippingIcon sx={{ color: selectedBatchId === b.id ? C.rose : C.slateMid, fontSize: 22 }} />
                      <Box flex={1}>
                        <Typography sx={{ fontWeight: 700, fontSize: 14, color: C.navy }}>{b.batchCode}</Typography>
                        <Typography sx={{ fontSize: 12, color: C.slateMid }}>
                          Outlet: {b.outletName} &bull; Items: {b.itemCount} &bull; Value: ₹{(b.totalValue || 0).toLocaleString('en-IN')}
                        </Typography>
                      </Box>
                      <Chip label="RECEIVED" size="small" sx={{ bgcolor: C.emeraldLight, color: C.emerald, fontWeight: 700, fontSize: 10 }} />
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          )}

          {/* ── STEP 1: Select Items ─────────────────────────────────────── */}
          {step === 1 && (
            <Box>
              <Typography sx={{ fontWeight: 700, fontSize: 14, color: C.navy, mb: 0.5 }}>
                Select items and quantities to return
              </Typography>
              <Typography sx={{ fontSize: 12, color: C.slateMid, mb: 2 }}>
                Batch: <strong>{batchDetail?.batchCode}</strong> · Outlet: {batchDetail?.outletName}
              </Typography>
              {batchDetailLoading ? (
                <Box display="flex" justifyContent="center" py={4}><CircularProgress size={28} /></Box>
              ) : !batchDetail?.items?.length ? (
                <Alert severity="warning" sx={{ borderRadius: 2 }}>This batch has no items.</Alert>
              ) : (
                <Table size="small" sx={{ '& th': { fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px', color: C.slateMid, bgcolor: C.bgMuted, py: 1.5 } }}>
                  <TableHead>
                    <TableRow>
                      <TableCell padding="checkbox" />
                      <TableCell>Product</TableCell>
                      <TableCell align="center">Available</TableCell>
                      <TableCell align="center">Return Qty</TableCell>
                      <TableCell>Defect Notes</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {batchDetail.items.map((item) => {
                      const checked = !!selectedItems[item.id];
                      return (
                        <TableRow key={item.id} hover selected={checked}>
                          <TableCell padding="checkbox">
                            <Checkbox
                              checked={checked}
                              onChange={() => toggleItem(item)}
                              sx={{ color: C.rose, '&.Mui-checked': { color: C.rose } }}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography sx={{ fontWeight: 600, fontSize: 13, color: C.navy }}>{item.productName}</Typography>
                            <Typography sx={{ fontSize: 11, color: C.slateMid }}>{item.productCode}</Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Chip label={item.quantity} size="small" sx={{ fontWeight: 700, bgcolor: C.blueLight, color: C.blue }} />
                          </TableCell>
                          <TableCell align="center">
                            <TextField
                              size="small"
                              type="number"
                              disabled={!checked}
                              value={selectedItems[item.id]?.qty ?? item.quantity}
                              onChange={(e) => updateQty(item.id, e.target.value)}
                              inputProps={{ min: 1, max: item.quantity }}
                              sx={{ width: 72, '& input': { textAlign: 'center', fontWeight: 700, py: 0.5 } }}
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              disabled={!checked}
                              placeholder="Optional defect note…"
                              value={selectedItems[item.id]?.defect ?? ''}
                              onChange={(e) => updateDefect(item.id, e.target.value)}
                              sx={{ width: '100%', '& input': { fontSize: 12 } }}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </Box>
          )}

          {/* ── STEP 2: Confirm & Submit ─────────────────────────────────── */}
          {step === 2 && (
            <Box>
              <Typography sx={{ fontWeight: 700, fontSize: 14, color: C.navy, mb: 2 }}>Review and confirm the return</Typography>

              {/* Summary box */}
              <Box sx={{ p: 2.5, borderRadius: 2, border: `1px solid ${C.border}`, bgcolor: C.bgMuted, mb: 2.5 }}>
                <Typography sx={{ fontSize: 12, color: C.slateMid, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', mb: 1.5 }}>Return Summary</Typography>
                <Box display="flex" gap={2} flexWrap="wrap">
                  <Box>
                    <Typography sx={{ fontSize: 11, color: C.slateMid }}>Batch</Typography>
                    <Chip label={batchDetail?.batchCode} size="small" sx={{ fontWeight: 700, bgcolor: C.blueLight, color: C.blue, mt: 0.5 }} />
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: 11, color: C.slateMid }}>Items</Typography>
                    <Chip label={`${selectedCount} product${selectedCount !== 1 ? 's' : ''}`} size="small" sx={{ fontWeight: 700, bgcolor: C.amberLight, color: C.amber, mt: 0.5 }} />
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: 11, color: C.slateMid }}>Total Units</Typography>
                    <Chip label={Object.values(selectedItems).reduce((s, v) => s + (v.qty || 0), 0)} size="small" sx={{ fontWeight: 700, bgcolor: C.roseLight, color: C.rose, mt: 0.5 }} />
                  </Box>
                </Box>
              </Box>

              {/* Reason */}
              <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                <InputLabel>Return Reason *</InputLabel>
                <Select value={reason} label="Return Reason *" onChange={(e) => setReason(e.target.value)}>
                  {REASONS.map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
                </Select>
              </FormControl>

              {/* Notes */}
              <TextField
                fullWidth
                multiline
                rows={3}
                size="small"
                label="Additional Notes (optional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                sx={{ mb: 2 }}
              />

              <Alert icon={<CheckCircleOutlineIcon fontSize="small" />} severity="info" sx={{ borderRadius: 2 }}>
                Submitting will create the return record and immediately push it to IMS via the DevTunnel API.
              </Alert>
            </Box>
          )}
        </Box>
      </DialogContent>

      {/* Footer actions */}
      <Box sx={{ px: 4, py: 2.5, borderTop: `1px solid ${C.border}`, bgcolor: C.bgMuted, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button
          variant="outlined"
          onClick={step === 0 ? handleClose : () => setStep((s) => s - 1)}
          sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '10px', borderColor: C.border, color: C.slateMid, '&:hover': { borderColor: C.slate, bgcolor: C.white } }}
        >
          {step === 0 ? 'Cancel' : 'Back'}
        </Button>

        {step < 2 ? (
          <Button
            variant="contained"
            disabled={step === 0 ? !selectedBatchId : selectedCount === 0}
            onClick={() => setStep((s) => s + 1)}
            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '10px', bgcolor: C.navy, color: C.bg, '&:hover': { bgcolor: C.navy, opacity: 0.9 }, '&.Mui-disabled': { bgcolor: C.border } }}
          >
            Continue →
          </Button>
        ) : (
          <Button
            variant="contained"
            disabled={submitting || !reason}
            onClick={handleSubmit}
            startIcon={submitting ? <CircularProgress size={16} sx={{ color: C.bg }} /> : <AssignmentReturnIcon sx={{ fontSize: 18 }} />}
            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '10px', bgcolor: C.rose, color: C.bg, px: 3, '&:hover': { bgcolor: C.red }, '&.Mui-disabled': { bgcolor: C.border } }}
          >
            {submitting ? 'Submitting…' : 'Submit Return to IMS'}
          </Button>
        )}
      </Box>
    </Dialog>
  );
}

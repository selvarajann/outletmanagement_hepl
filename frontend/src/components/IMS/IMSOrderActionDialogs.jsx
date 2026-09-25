import React, { useState } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Box, Typography, Divider, Chip
} from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import CancelIcon from "@mui/icons-material/Cancel";
import { C } from "../../theme/colors";

// ── Approve Dialog ────────────────────────────────────────────────────────────
export function ApproveDialog({ open, order, onClose, onConfirm, loading }) {
  const [notes, setNotes] = useState("");
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <CheckCircleOutlineIcon sx={{ color: C.emerald }} />
        <Typography fontWeight={700}>Approve Order</Typography>
      </DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" color="text.secondary" mb={2}>
          Approve <strong>{order?.orderCode}</strong> for dispatch. The outlet will be notified.
        </Typography>
        <TextField
          fullWidth label="Notes (optional)" multiline rows={2} size="small"
          value={notes} onChange={(e) => setNotes(e.target.value)}
        />
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} sx={{ color: C.slate }}>Cancel</Button>
        <Button onClick={() => onConfirm({ notes })} variant="contained" disabled={loading}
          sx={{ bgcolor: C.emerald, "&:hover": { bgcolor: "#059669" } }}>
          Approve
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Reject Dialog ─────────────────────────────────────────────────────────────
export function RejectDialog({ open, order, onClose, onConfirm, loading }) {
  const [reason, setReason] = useState("");
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <CancelIcon sx={{ color: "#ef4444" }} />
        <Typography fontWeight={700}>Reject Order</Typography>
      </DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" color="text.secondary" mb={2}>
          Reject <strong>{order?.orderCode}</strong>. Please provide a reason.
        </Typography>
        <TextField
          fullWidth label="Reason *" size="small" required
          value={reason} onChange={(e) => setReason(e.target.value)}
          error={!reason}
          helperText={!reason ? "Reason is required" : ""}
        />
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} sx={{ color: C.slate }}>Cancel</Button>
        <Button onClick={() => onConfirm({ reason })} variant="contained" disabled={loading || !reason}
          sx={{ bgcolor: "#ef4444", "&:hover": { bgcolor: "#dc2626" } }}>
          Reject
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Dispatch Dialog ───────────────────────────────────────────────────────────
export function DispatchDialog({ open, order, onClose, onConfirm, loading }) {
  const [carrier, setCarrier] = useState("BlueDart");
  const [trackingNumber, setTrackingNumber] = useState(`TRK-${Math.floor(Math.random() * 1e7)}`);

  React.useEffect(() => {
    if (open) setTrackingNumber(`TRK-${Math.floor(Math.random() * 1e7)}`);
  }, [open]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <LocalShippingIcon sx={{ color: C.blue }} />
        <Typography fontWeight={700}>Dispatch Order: {order?.orderCode}</Typography>
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ p: 1.5, bgcolor: C.blueLight, borderRadius: 2, mb: 2 }}>
          <Typography variant="body2" sx={{ color: C.blueDark, fontWeight: 600 }}>
            This will simulate an IMS dispatch webhook and create a shipment for the outlet.
          </Typography>
        </Box>

        {/* Order Items Preview */}
        {order?.items?.length > 0 && (
          <Box mb={2}>
            <Typography variant="caption" fontWeight={700} color="text.secondary">ORDER ITEMS</Typography>
            <Box mt={0.5} sx={{ border: `1px solid ${C.border}`, borderRadius: 2, overflow: "hidden" }}>
              {order.items.map((item, i) => (
                <Box key={i} sx={{ display: "flex", justifyContent: "space-between", px: 2, py: 1,
                  borderBottom: i < order.items.length - 1 ? `1px solid ${C.border}` : "none",
                  bgcolor: i % 2 === 0 ? C.surface : "white" }}>
                  <Typography variant="body2">{item.productName} <Chip label={item.productCode} size="small" sx={{ fontSize: 10 }} /></Typography>
                  <Typography variant="body2" fontWeight={700}>Qty: {item.quantityRequested}</Typography>
                </Box>
              ))}
            </Box>
          </Box>
        )}

        <TextField fullWidth label="Carrier" size="small" sx={{ mb: 2 }}
          value={carrier} onChange={(e) => setCarrier(e.target.value)} required />
        <TextField fullWidth label="Tracking Number" size="small"
          value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} required />
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} sx={{ color: C.slate }}>Cancel</Button>
        <Button onClick={() => onConfirm({ carrier, trackingNumber })}
          variant="contained" disabled={loading || !carrier || !trackingNumber}
          sx={{ bgcolor: C.blue, "&:hover": { bgcolor: C.blueDark || C.blue } }}>
          Confirm Dispatch
        </Button>
      </DialogActions>
    </Dialog>
  );
}

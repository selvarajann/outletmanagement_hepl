import React, { useState } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Typography, Box
} from "@mui/material";
import InventoryIcon from "@mui/icons-material/Inventory";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { C } from "../../theme/colors";

const colors = {
  acknowledge: { bg: C.amberLight, text: "#d97706", icon: <InventoryIcon sx={{ color: "#d97706" }} />, label: "Acknowledge Return" },
  pickup:      { bg: C.blueLight,  text: C.blue,    icon: <LocalShippingIcon sx={{ color: C.blue }} />, label: "Initiate Pickup"  },
  complete:    { bg: C.emeraldLight, text: C.emerald, icon: <CheckCircleIcon sx={{ color: C.emerald }} />, label: "Complete Return" },
};

export function ReturnActionDialog({ open, type, returnCode, onClose, onConfirm, loading }) {
  const [notes, setNotes] = useState("");
  const cfg = colors[type] || colors.acknowledge;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        {cfg.icon}
        <Typography fontWeight={700}>{cfg.label}</Typography>
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ p: 1.5, bgcolor: cfg.bg, borderRadius: 2, mb: 2 }}>
          <Typography variant="body2" sx={{ color: cfg.text, fontWeight: 600 }}>
            Return Code: <strong>{returnCode}</strong>
          </Typography>
        </Box>
        <TextField fullWidth label="Notes (optional)" multiline rows={2} size="small"
          value={notes} onChange={(e) => setNotes(e.target.value)} />
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} sx={{ color: C.slate }}>Cancel</Button>
        <Button onClick={() => onConfirm({ notes })} variant="contained" disabled={loading}
          sx={{ bgcolor: cfg.text, color: "#fff", "&:hover": { opacity: 0.85 } }}>
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  );
}

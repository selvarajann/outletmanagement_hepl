import React from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Grid, Typography, Box } from "@mui/material";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import { C } from "../../theme/colors";

export default function IMSDispatchDialog({ open, onClose, onDispatch, order }) {
  const [carrier, setCarrier] = React.useState("FedEx");
  const [trackingNumber, setTrackingNumber] = React.useState("");

  React.useEffect(() => {
    if (open) {
      setTrackingNumber(`TRK-${Math.floor(Math.random() * 1000000)}`);
      setCarrier("FedEx");
    }
  }, [open]);

  const handleSubmit = () => {
    onDispatch({ carrier, trackingNumber });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1, color: C.emerald }}>
        <LocalShippingIcon />
        Dispatch Order: {order?.orderCode}
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ p: 1, backgroundColor: C.surface, borderRadius: 2, mb: 3 }}>
          <Typography variant="body2" color="textSecondary">
            Simulate IMS dispatch process. This will generate a webhook payload back to the OMS, automatically creating a shipment.
          </Typography>
        </Box>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Carrier Name"
              value={carrier}
              onChange={(e) => setCarrier(e.target.value)}
              size="small"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Tracking Number"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              size="small"
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ p: 2, backgroundColor: C.surface }}>
        <Button onClick={onClose} sx={{ color: C.slate }}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" sx={{ backgroundColor: C.emerald, "&:hover": { backgroundColor: "#059669" } }}>
          Confirm Dispatch
        </Button>
      </DialogActions>
    </Dialog>
  );
}

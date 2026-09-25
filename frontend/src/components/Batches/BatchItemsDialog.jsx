import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography, Divider, IconButton, Chip, CircularProgress } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { C } from "../../theme/colors";
import EnterpriseTable from "../shared/EnterpriseTable";

export default function BatchItemsDialog({ open, onClose, batch, loading }) {
  const items = batch?.items || [];
  const totalValue = items.reduce((sum, i) => sum + (parseFloat(i.lineTotal) || 0), 0);
  const totalProfit = items.reduce((sum, i) => sum + (parseFloat(i.lineProfit) || 0), 0);

  const columns = [
    { label: "#", render: (item, idx) => <Typography sx={{ fontSize: 12 }}>{idx + 1}</Typography> },
    { label: "Product", render: (item) => (
      <Box>
        <Typography variant="body2" sx={{ fontWeight: 600, fontSize: 13 }}>{item.productName}</Typography>
        <Typography variant="caption" color="textSecondary">{item.productCode}</Typography>
      </Box>
    ) },
    { label: "Division", render: (item) => <Chip label={item.divisionName || "—"} size="small" sx={{ fontSize: 10, backgroundColor: C.slateLight, color: C.slate }} /> },
    { label: "Qty", render: (item) => <Typography sx={{ fontSize: 12 }}>{item.quantity}</Typography> },
    { label: "Remaining", render: (item) => <Typography sx={{ fontSize: 12, fontWeight: 700, color: item.remainingQuantity === 0 ? C.red : C.emerald }}>{item.remainingQuantity ?? "—"}</Typography> },
    { label: "Mfg Date", render: (item) => <Typography sx={{ fontSize: 12 }}>{item.mfgDate || "—"}</Typography> },
    { label: "Expiry Date", render: (item) => <Typography sx={{ fontSize: 12, fontWeight: 600, color: item.expiryDate ? C.amber : C.muted }}>{item.expiryDate || "—"}</Typography> },
    { label: "MRP", render: (item) => <Typography sx={{ fontSize: 12 }}>₹{parseFloat(item.mrp || 0).toLocaleString()}</Typography> },
    { label: "Purchase", render: (item) => <Typography sx={{ fontSize: 12 }}>₹{parseFloat(item.purchasePrice || 0).toLocaleString()}</Typography> },
    { label: "Selling", render: (item) => <Typography sx={{ fontSize: 12 }}>₹{parseFloat(item.sellingPrice || 0).toLocaleString()}</Typography> },
    { label: "Line Total", render: (item) => <Typography sx={{ fontSize: 12, fontWeight: 700, color: C.blue }}>₹{parseFloat(item.lineTotal || 0).toLocaleString()}</Typography> },
    { label: "Profit", render: (item) => <Typography sx={{ fontSize: 12, fontWeight: 700, color: parseFloat(item.lineProfit) >= 0 ? C.emerald : C.red }}>₹{parseFloat(item.lineProfit || 0).toLocaleString()}</Typography> },
  ];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xl" fullWidth
      PaperProps={{ sx: { borderRadius: 3, border: `1px solid ${C.border}` } }}>
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pb: 1, pt: 2.5, px: 3 }}>
        <Box>
          <Typography fontWeight={800} fontSize={16} color={C.navy}>Batch Items</Typography>
          {batch && (
            <Typography variant="caption" color="textSecondary">
              {batch.batchCode} • {batch.outletName}
              {batch.receivedBy && ` • Received by: ${batch.receivedBy}`}
            </Typography>
          )}
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ color: C.slate }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ px: 3, py: 2.5 }}>
        {loading ? (
          <Box display="flex" justifyContent="center" py={4}><CircularProgress size={28} /></Box>
        ) : (
          <>
            <EnterpriseTable columns={columns} data={items} emptyMessage="No items found" />
            <Box display="flex" justifyContent="flex-end" gap={2} mt={2}>
              <Box sx={{ p: 1.5, backgroundColor: C.tealLight, borderRadius: 2, border: "1px solid #ccfbf1", minWidth: 180, textAlign: "right" }}>
                <Typography sx={{ fontSize: 11, fontWeight: 700, color: C.teal }}>TOTAL BATCH VALUE</Typography>
                <Typography sx={{ fontSize: 18, fontWeight: 800, color: C.teal }}>₹{totalValue.toLocaleString()}</Typography>
              </Box>
              <Box sx={{ p: 1.5, backgroundColor: "#f0fdf4", borderRadius: 2, border: "1px solid #dcfce7", minWidth: 180, textAlign: "right" }}>
                <Typography sx={{ fontSize: 11, fontWeight: 700, color: "#166534" }}>TOTAL PROFIT</Typography>
                <Typography sx={{ fontSize: 18, fontWeight: 800, color: "#166534" }}>₹{totalProfit.toLocaleString()}</Typography>
              </Box>
            </Box>
          </>
        )}
      </DialogContent>
      <Divider />
      <DialogActions sx={{ px: 3, py: 1.5 }}>
        <Button onClick={onClose} variant="outlined" size="small"
          sx={{ textTransform: "none", borderRadius: 2, borderColor: C.border, color: C.slate, "&:hover": { borderColor: C.slate } }}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}

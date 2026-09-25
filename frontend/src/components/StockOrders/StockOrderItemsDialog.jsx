import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography, Divider, IconButton, Chip, CircularProgress } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { C } from "../../theme/colors";
import EnterpriseTable from "../shared/EnterpriseTable";

export default function StockOrderItemsDialog({ open, onClose, order, loading }) {
  const items = order?.items || [];
  const total = items.reduce((sum, i) => sum + (parseFloat(i.lineTotal) || 0), 0);

  const columns = [
    { label: "#", render: (row, idx) => <Typography sx={{ fontSize: 12 }}>{idx + 1}</Typography> },
    { label: "Product", render: (row) => <Typography variant="body2" sx={{ fontWeight: 600, fontSize: 13 }}>{row.productName}</Typography> },
    { label: "Code", render: (row) => <Chip label={row.productCode} size="small" sx={{ fontSize: 10, backgroundColor: C.blueLight, color: C.blue }} /> },
    { label: "Qty Requested", render: (row) => <Typography sx={{ fontSize: 12 }}>{row.quantityRequested}</Typography> },
    { label: "Unit Price", render: (row) => <Typography sx={{ fontSize: 12 }}>₹{parseFloat(row.unitPriceAtOrder || 0).toLocaleString()}</Typography> },
    { label: "Line Total", render: (row) => <Typography sx={{ fontSize: 12, fontWeight: 700, color: C.blue }}>₹{parseFloat(row.lineTotal || 0).toLocaleString()}</Typography> },
  ];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth
      PaperProps={{ sx: { borderRadius: 3, border: `1px solid ${C.border}` } }}>
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pb: 1, pt: 2.5, px: 3 }}>
        <Box>
          <Typography fontWeight={800} fontSize={16} color={C.navy}>Order Items</Typography>
          {order && (
            <Typography variant="caption" color="textSecondary">
              {order.orderCode} • {order.outletName}
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
        ) : items.length === 0 ? (
          <Box py={4} textAlign="center">
            <Typography variant="body2" color="textSecondary">No items found</Typography>
          </Box>
        ) : (
          <>
            <EnterpriseTable columns={columns} data={items} emptyMessage="No items found" />
            <Box display="flex" justifyContent="flex-end" mt={2}>
              <Box sx={{ p: 1.5, backgroundColor: C.tealLight, borderRadius: 2, border: "1px solid #ccfbf1", minWidth: 200, textAlign: "right" }}>
                <Typography sx={{ fontSize: 11, fontWeight: 700, color: C.teal }}>ORDER TOTAL</Typography>
                <Typography sx={{ fontSize: 18, fontWeight: 800, color: C.teal }}>₹{total.toLocaleString()}</Typography>
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

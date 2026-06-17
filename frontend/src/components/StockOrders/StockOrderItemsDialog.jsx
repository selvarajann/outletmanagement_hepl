import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography, Divider, IconButton, Table, TableHead, TableRow, TableCell, TableBody, Chip, CircularProgress } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { C } from "../../theme/colors";

const cellSx = { fontSize: 12, py: 1.2, px: 1.5, borderBottom: `1px solid ${C.border}` };

export default function StockOrderItemsDialog({ open, onClose, order, loading }) {
  const items = order?.items || [];
  const total = items.reduce((sum, i) => sum + (parseFloat(i.lineTotal) || 0), 0);

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
            <Table size="small" sx={{ border: `1px solid ${C.border}`, borderRadius: 2, overflow: "hidden" }}>
              <TableHead sx={{ backgroundColor: C.navy }}>
                <TableRow>
                  {["#", "Product", "Code", "Qty Requested", "Unit Price", "Line Total"].map((h) => (
                    <TableCell key={h} sx={{ ...cellSx, color: "#94a3b8", fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.7, borderBottom: "none" }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((item, idx) => (
                  <TableRow key={item.id ?? idx} sx={{ "&:hover": { backgroundColor: "#f8fafc" } }}>
                    <TableCell sx={cellSx}>{idx + 1}</TableCell>
                    <TableCell sx={cellSx}>
                      <Typography variant="body2" sx={{ fontWeight: 600, fontSize: 13 }}>{item.productName}</Typography>
                    </TableCell>
                    <TableCell sx={cellSx}>
                      <Chip label={item.productCode} size="small" sx={{ fontSize: 10, backgroundColor: C.blueLight, color: C.blue }} />
                    </TableCell>
                    <TableCell sx={cellSx}>{item.quantityRequested}</TableCell>
                    <TableCell sx={cellSx}>₹{parseFloat(item.unitPriceAtOrder || 0).toLocaleString()}</TableCell>
                    <TableCell sx={{ ...cellSx, fontWeight: 700, color: C.blue }}>₹{parseFloat(item.lineTotal || 0).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Box display="flex" justifyContent="flex-end" mt={2}>
              <Box sx={{ p: 1.5, backgroundColor: "#f0fdfa", borderRadius: 2, border: "1px solid #ccfbf1", minWidth: 200, textAlign: "right" }}>
                <Typography sx={{ fontSize: 11, fontWeight: 700, color: "#0f766e" }}>ORDER TOTAL</Typography>
                <Typography sx={{ fontSize: 18, fontWeight: 800, color: "#0f766e" }}>₹{total.toLocaleString()}</Typography>
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

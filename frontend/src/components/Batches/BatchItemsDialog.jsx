import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography, Divider, IconButton, Table, TableHead, TableRow, TableCell, TableBody, Chip, CircularProgress } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { C } from "../../theme/colors";

const cellSx = { fontSize: 12, py: 1.2, px: 1.5, borderBottom: `1px solid ${C.border}` };

export default function BatchItemsDialog({ open, onClose, batch, loading }) {
  const items = batch?.items || [];
  const totalValue = items.reduce((sum, i) => sum + (parseFloat(i.lineTotal) || 0), 0);
  const totalProfit = items.reduce((sum, i) => sum + (parseFloat(i.lineProfit) || 0), 0);

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
        ) : items.length === 0 ? (
          <Box py={4} textAlign="center">
            <Typography variant="body2" color="textSecondary">No items found</Typography>
          </Box>
        ) : (
          <>
            <Table size="small" sx={{ border: `1px solid ${C.border}`, borderRadius: 2, overflow: "hidden" }}>
              <TableHead sx={{ backgroundColor: C.navy }}>
                <TableRow>
                  {["#", "Product", "Division", "Qty", "Remaining", "Mfg Date", "Expiry Date", "MRP", "Purchase", "Selling", "Line Total", "Profit"].map((h) => (
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
                      <Typography variant="caption" color="textSecondary">{item.productCode}</Typography>
                    </TableCell>
                    <TableCell sx={cellSx}>
                      <Chip label={item.divisionName || "—"} size="small" sx={{ fontSize: 10, backgroundColor: C.slateLight, color: C.slate }} />
                    </TableCell>
                    <TableCell sx={cellSx}>{item.quantity}</TableCell>
                    <TableCell sx={{ ...cellSx, fontWeight: 700, color: item.remainingQuantity === 0 ? C.red : C.emerald }}>
                      {item.remainingQuantity ?? "—"}
                    </TableCell>
                    <TableCell sx={cellSx}>{item.mfgDate || "—"}</TableCell>
                    <TableCell sx={{ ...cellSx, fontWeight: 600, color: item.expiryDate ? C.amber : C.muted }}>
                      {item.expiryDate || "—"}
                    </TableCell>
                    <TableCell sx={cellSx}>₹{parseFloat(item.mrp || 0).toLocaleString()}</TableCell>
                    <TableCell sx={cellSx}>₹{parseFloat(item.purchasePrice || 0).toLocaleString()}</TableCell>
                    <TableCell sx={cellSx}>₹{parseFloat(item.sellingPrice || 0).toLocaleString()}</TableCell>
                    <TableCell sx={{ ...cellSx, fontWeight: 700, color: C.blue }}>₹{parseFloat(item.lineTotal || 0).toLocaleString()}</TableCell>
                    <TableCell sx={{ ...cellSx, fontWeight: 700, color: parseFloat(item.lineProfit) >= 0 ? C.emerald : C.red }}>
                      ₹{parseFloat(item.lineProfit || 0).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Box display="flex" justifyContent="flex-end" gap={2} mt={2}>
              <Box sx={{ p: 1.5, backgroundColor: "#f0fdfa", borderRadius: 2, border: "1px solid #ccfbf1", minWidth: 180, textAlign: "right" }}>
                <Typography sx={{ fontSize: 11, fontWeight: 700, color: "#0f766e" }}>TOTAL BATCH VALUE</Typography>
                <Typography sx={{ fontSize: 18, fontWeight: 800, color: "#0f766e" }}>₹{totalValue.toLocaleString()}</Typography>
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

import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Box, Typography, Divider, IconButton,
  Table, TableHead, TableRow, TableCell, TableBody,
  TextField, Alert
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import { toast } from "react-toastify";
import { C } from "../../theme/colors";

const cellSx = { fontSize: 12, py: 1.2, px: 1.5, borderBottom: `1px solid ${C.border}` };
const dateSx = {
  "& .MuiOutlinedInput-root": { borderRadius: 1.5, fontSize: 12, height: 34 },
  "& .MuiInputLabel-root": { fontSize: 12 },
  width: 150
};

export default function BatchReceiveDialog({ open, batch, dateMap, setDateMap, onClose, onSubmit, submitting }) {
  const items = batch?.items || [];

  const handleDateChange = (productId, field, value) => {
    setDateMap((prev) => ({
      ...prev,
      [productId]: { ...(prev[productId] || {}), [field]: value }
    }));
  };

  const validate = () => {
    for (const item of items) {
      const dates = dateMap[item.productId] || {};
      if (dates.expiryDate && dates.mfgDate && dates.expiryDate < dates.mfgDate) {
        return `Expiry date cannot be before manufacturing date for "${item.productName}"`;
      }
    }
    return null;
  };

  const handleSubmit = () => {
    const error = validate();
    if (error) { toast.error(error); return; }
    onSubmit();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth
      PaperProps={{ sx: { borderRadius: 3, border: `1px solid ${C.border}` } }}>
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pb: 1, pt: 2.5, px: 3 }}>
        <Box>
          <Typography fontWeight={800} fontSize={16} color={C.navy}>Mark Batch as Received</Typography>
          {batch && (
            <Typography variant="caption" color="textSecondary">
              {batch.batchCode} • {batch.outletName}
            </Typography>
          )}
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ color: C.slate }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <Divider />

      <DialogContent sx={{ px: 3, py: 2.5 }}>
        <Alert severity="info" sx={{ mb: 2, fontSize: 12, borderRadius: 2 }}>
          Enter the manufacturing and expiry dates for each product. After saving, stock will be automatically updated
          and products will be available for sale using <strong>FEFO</strong> (First Expiry First Out) order.
        </Alert>

        <Table size="small" sx={{ border: `1px solid ${C.border}`, borderRadius: 2, overflow: "hidden" }}>
          <TableHead sx={{ backgroundColor: C.navy }}>
            <TableRow>
              {["#", "Product", "Code", "Qty", "Mfg Date", "Expiry Date"].map((h) => (
                <TableCell key={h} sx={{ ...cellSx, color: "#94a3b8", fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.7, borderBottom: "none" }}>
                  {h}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item, idx) => {
              const dates = dateMap[item.productId] || {};
              return (
                <TableRow key={item.id ?? idx} sx={{ "&:hover": { backgroundColor: "#f8fafc" } }}>
                  <TableCell sx={cellSx}>{idx + 1}</TableCell>
                  <TableCell sx={cellSx}>
                    <Typography variant="body2" sx={{ fontWeight: 600, fontSize: 13 }}>{item.productName}</Typography>
                  </TableCell>
                  <TableCell sx={{ ...cellSx, color: C.slateMid, fontFamily: "monospace" }}>{item.productCode}</TableCell>
                  <TableCell sx={{ ...cellSx, fontWeight: 700 }}>{item.quantity}</TableCell>
                  <TableCell sx={cellSx}>
                    <TextField
                      type="date"
                      size="small"
                      value={dates.mfgDate || ""}
                      onChange={(e) => handleDateChange(item.productId, "mfgDate", e.target.value)}
                      sx={dateSx}
                      InputLabelProps={{ shrink: true }}
                      inputProps={{ max: new Date().toISOString().split("T")[0] }}
                    />
                  </TableCell>
                  <TableCell sx={cellSx}>
                    <TextField
                      type="date"
                      size="small"
                      value={dates.expiryDate || ""}
                      onChange={(e) => handleDateChange(item.productId, "expiryDate", e.target.value)}
                      sx={dateSx}
                      InputLabelProps={{ shrink: true }}
                      inputProps={{ min: new Date().toISOString().split("T")[0] }}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        <Box display="flex" alignItems="center" gap={1} mt={2} sx={{ p: 1.5, backgroundColor: C.amberLight, borderRadius: 2, border: `1px solid ${C.amberMid}` }}>
          <CalendarTodayIcon sx={{ fontSize: 14, color: C.amber }} />
          <Typography sx={{ fontSize: 11, color: C.amber, fontWeight: 600 }}>
            Products without an expiry date will be deducted last in FEFO order.
          </Typography>
        </Box>
      </DialogContent>

      <Divider />
      <DialogActions sx={{ px: 3, py: 1.5, gap: 1 }}>
        <Button onClick={onClose} variant="outlined" size="small"
          sx={{ textTransform: "none", borderRadius: 2, borderColor: C.border, color: C.slate }}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          size="small"
          disabled={submitting}
          startIcon={<CheckCircleIcon sx={{ fontSize: 15 }} />}
          sx={{ textTransform: "none", borderRadius: 2, backgroundColor: C.emerald, "&:hover": { backgroundColor: "#047857" } }}>
          {submitting ? "Saving..." : "Confirm Receipt & Update Stock"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

import { useState, useEffect } from "react";
import {
  Box, TextField, MenuItem, Select, InputLabel, FormControl,
  IconButton, Button, Typography, Grid, Divider
} from "@mui/material";
import { toast } from "react-toastify";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import FormDialog from "../shared/FormDialog";
import { GetOutletById } from "../../services/OutletService";
import { useOutlets } from "../../hooks/useMasterData";
import { C } from "../../theme/colors";

const fieldSx = { "& .MuiOutlinedInput-root": { borderRadius: 2, fontSize: 13 } };

export default function StockOrderForm({ open, form, setForm, errors, selectedId, onClose, onSubmit }) {
  const { outlets } = useOutlets();
  const [availableProducts, setAvailableProducts] = useState([]);

  // outlets list now comes from cache — no fetch needed on open

  // Load products when outletId changes
  useEffect(() => {
    if (!form.outletId) { setAvailableProducts([]); return; }
    const controller = new AbortController();
    GetOutletById(form.outletId, controller.signal)
      .then((r) => {
        const allProducts = r.divisions?.flatMap((d) => d.products || []) || [];
        setAvailableProducts(allProducts);
      })
      .catch(() => {});
    return () => controller.abort();
  }, [form.outletId]);

  const handleAddItem = () =>
    setForm({ ...form, items: [...form.items, { productId: "", quantityRequested: 1, unitPrice: 0 }] });

  const handleRemoveItem = (index) =>
    setForm({ ...form, items: form.items.filter((_, i) => i !== index) });

  const handleItemChange = (index, field, value) => {
    const newItems = [...form.items];
    newItems[index][field] = value;
    if (field === "productId") {
      const prod = availableProducts.find((p) => String(p.id) === String(value));
      if (prod) newItems[index].unitPrice = parseFloat(prod.sellingPrice) || 0;
    }
    setForm({ ...form, items: newItems });
  };

  const handleQtyChange = (index, value) => {
    const raw = value.replace(/[^0-9]/g, "");
    if (value !== raw) { toast.warn("Quantity must be a whole number"); }
    const qty = parseInt(raw) || 1;
    if (qty < 1) { toast.warn("Quantity must be at least 1"); return; }
    handleItemChange(index, "quantityRequested", qty);
  };

  const totalValue = form.items.reduce((sum, item) => sum + (parseInt(item.quantityRequested) || 0) * (parseFloat(item.unitPrice) || 0), 0);

  // Normalize outletId to string to avoid MUI out-of-range warning
  const outletIdValue = form.outletId !== undefined && form.outletId !== null ? String(form.outletId) : "";

  return (
    <FormDialog
      open={open}
      title={selectedId ? "Edit Stock Order" : "New Stock Order"}
      submitLabel={selectedId ? "Update Order" : "Create Order"}
      onClose={onClose}
      onSubmit={onSubmit}
      maxWidth="md"
    >
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: C.slate }}>Order Details</Typography>
        </Grid>

        {/* OUTLET */}
        <Grid item xs={6}>
          <FormControl fullWidth size="small" sx={fieldSx} error={!!errors.outletId}>
            <InputLabel>Outlet</InputLabel>
            <Select
              value={outletIdValue}
              label="Outlet"
              disabled={!!selectedId}
              onChange={(e) => setForm({ ...form, outletId: e.target.value, items: [] })}
            >
              {outlets.map((o) => (
                <MenuItem key={o.id} value={String(o.id)}>{o.outletName}</MenuItem>
              ))}
            </Select>
            {errors.outletId && <Typography variant="caption" color="error">{errors.outletId}</Typography>}
          </FormControl>
        </Grid>

        {/* REQUEST DATE */}
        <Grid item xs={6}>
          <TextField fullWidth label="Requested Date" type="date" size="small" sx={fieldSx}
            value={form.requestedDate}
            onChange={(e) => setForm({ ...form, requestedDate: e.target.value })}
            InputLabelProps={{ shrink: true }}
            error={!!errors.requestedDate}
            helperText={errors.requestedDate}
          />
        </Grid>

        {/* NOTES */}
        <Grid item xs={12}>
          <TextField fullWidth label="Notes" multiline rows={2} size="small" sx={fieldSx}
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        </Grid>

        {/* PRODUCTS SECTION */}
        <Grid item xs={12}>
          <Divider sx={{ my: 1 }} />
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: C.slate }}>Products</Typography>
            <Button size="small" startIcon={<AddIcon />} onClick={handleAddItem}
              sx={{ textTransform: "none", fontSize: 12 }}>
              Add Product
            </Button>
          </Box>
          {errors.items && <Typography variant="caption" color="error">{errors.items}</Typography>}
        </Grid>

        {/* PRODUCT ITEMS */}
        {form.items.map((item, index) => (
          <Grid item xs={12} key={index}>
            <Box display="flex" gap={1.5} alignItems="flex-start">
              <FormControl fullWidth size="small" sx={fieldSx}>
                <InputLabel>Product</InputLabel>
                <Select
                  value={item.productId !== undefined && item.productId !== null ? String(item.productId) : ""}
                  label="Product"
                  onChange={(e) => handleItemChange(index, "productId", e.target.value)}
                >
                  {availableProducts.map((p) => (
                    <MenuItem key={p.id} value={String(p.id)}>{p.name} ({p.productCode})</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField label="Qty" type="number" size="small" sx={{ ...fieldSx, width: 100 }}
                value={item.quantityRequested}
                onChange={(e) => handleQtyChange(index, e.target.value)}
                inputProps={{ min: 1 }}
              />

              <TextField label="Price" size="small" sx={{ ...fieldSx, width: 120 }}
                value={item.unitPrice || 0} disabled />

              <TextField label="Total" size="small" sx={{ ...fieldSx, width: 120 }}
                value={((parseInt(item.quantityRequested) || 0) * (parseFloat(item.unitPrice) || 0)).toLocaleString()} disabled />

              <IconButton size="small" onClick={() => handleRemoveItem(index)} sx={{ color: C.red, mt: 0.5 }}>
                <RemoveIcon />
              </IconButton>
            </Box>
          </Grid>
        ))}

        {/* LIVE TOTAL */}
        <Grid item xs={12}>
          <Box sx={{ mt: 2, p: 1.5, backgroundColor: "#f0fdfa", borderRadius: 2, border: "1px solid #ccfbf1", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#0f766e" }}>LIVE TOTAL</Typography>
            <Typography sx={{ fontSize: 16, fontWeight: 800, color: "#0f766e" }}>₹{totalValue.toLocaleString()}</Typography>
          </Box>
        </Grid>
      </Grid>
    </FormDialog>
  );
}

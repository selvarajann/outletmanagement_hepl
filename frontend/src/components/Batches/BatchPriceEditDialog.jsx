import { Box, TextField, Typography } from "@mui/material";
import { toast } from "react-toastify";
import FormDialog from "../shared/FormDialog";
import { C } from "../../theme/colors";
import EnterpriseTable from "../shared/EnterpriseTable";

const inputSx = { "& .MuiOutlinedInput-root": { borderRadius: 1.5, fontSize: 12, height: 32 } };

export default function BatchPriceEditDialog({ open, batch, items, setItems, onClose, onSubmit }) {
  const handlePriceChange = (index, field, value) => {
    if (value !== "" && !/^\d*\.?\d*$/.test(value)) {
      toast.warn("Only numeric values allowed for prices"); return;
    }
    if (parseFloat(value) < 0) {
      toast.warn("Price cannot be negative"); return;
    }
    const newItems = [...items];
    newItems[index][field] = parseFloat(value) || 0;
    setItems(newItems);
  };

  const columns = [
    { label: "Product", render: (item) => (
      <Box>
        <Typography variant="body2" sx={{ fontWeight: 600, fontSize: 13 }}>{item.productName}</Typography>
        <Typography variant="caption" color="textSecondary">{item.productCode}</Typography>
      </Box>
    ) },
    { label: "Qty", render: (item) => <Typography sx={{ fontSize: 12 }}>{item.quantity}</Typography> },
    { label: "MRP", render: (item, index) => (
        <TextField size="small" value={item.mrp} sx={inputSx} onChange={(e) => handlePriceChange(index, "mrp", e.target.value)} />
    ) },
    { label: "Purchase", render: (item, index) => (
        <TextField size="small" value={item.purchasePrice} sx={inputSx} onChange={(e) => handlePriceChange(index, "purchasePrice", e.target.value)} />
    ) },
    { label: "Selling", render: (item, index) => (
        <TextField size="small" value={item.sellingPrice} sx={inputSx} onChange={(e) => handlePriceChange(index, "sellingPrice", e.target.value)} />
    ) },
    { label: "UIM", render: (item, index) => (
        <TextField size="small" value={item.uimPrice} sx={inputSx} onChange={(e) => handlePriceChange(index, "uimPrice", e.target.value)} />
    ) },
    { label: "Total", align: "right", render: (item) => (
        <Typography sx={{ fontSize: 12, fontWeight: 700 }}>₹{(item.sellingPrice * item.quantity).toLocaleString()}</Typography>
    ) }
  ];

  return (
    <FormDialog open={open} title={`Edit Prices: ${batch?.batchCode}`} onClose={onClose} onSubmit={onSubmit} submitLabel="Save Prices" maxWidth="lg">
      <Box sx={{ mb: 2 }}>
        <Typography variant="caption" sx={{ color: C.slate, fontWeight: 700, textTransform: "uppercase" }}>Batch Information</Typography>
        <Box display="flex" gap={4} mt={0.5}>
          <Box><Typography variant="caption" color="textSecondary">Outlet</Typography><Typography variant="body2" sx={{ fontWeight: 600 }}>{batch?.outletName}</Typography></Box>
          <Box><Typography variant="caption" color="textSecondary">Status</Typography><Typography variant="body2" sx={{ fontWeight: 600, color: C.amber }}>{batch?.status}</Typography></Box>
        </Box>
      </Box>

      <EnterpriseTable columns={columns} data={items} emptyMessage="No items found." />
      
      <Box display="flex" justifyContent="flex-end" mt={2}>
        <Box sx={{ p: 1.5, backgroundColor: "#f0fdf4", borderRadius: 2, border: `1px solid #dcfce7`, minWidth: 200, textAlign: "right" }}>
          <Typography sx={{ fontSize: 11, fontWeight: 700, color: "#166534" }}>TOTAL BATCH VALUE</Typography>
          <Typography sx={{ fontSize: 18, fontWeight: 800, color: "#166534" }}>
            ₹{items.reduce((sum, i) => sum + (i.sellingPrice * i.quantity), 0).toLocaleString()}
          </Typography>
        </Box>
      </Box>
    </FormDialog>
  );
}

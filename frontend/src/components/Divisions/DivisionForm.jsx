import { useEffect, useState } from "react";
import { TextField, FormControl, FormHelperText, Box, Typography, Checkbox, Avatar, Dialog, DialogContent } from "@mui/material";
import { GetProducts } from "../../services/ProductService";
import FormDialog from "../shared/FormDialog";
import { C } from "../../theme/colors";

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: 2, fontSize: 14,
    "& fieldset": { borderColor: C.border },
    "&:hover fieldset": { borderColor: C.blue },
    "&.Mui-focused fieldset": { borderColor: C.blue },
  },
  "& .MuiInputLabel-root.Mui-focused": { color: C.blue },
};

const SubDialog = ({ open, onClose, title, onConfirm, children }) => (
  <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth
    PaperProps={{ sx: { borderRadius: 3, overflow: "hidden" } }}>
    <Box sx={{ px: 3, py: 2, backgroundColor: C.navy }}>
      <Typography fontWeight="700" fontSize={14} color={C.white}>{title}</Typography>
    </Box>
    <DialogContent sx={{ px: 2, py: 1.5 }}>{children}</DialogContent>
    <Box sx={{ px: 3, py: 2, borderTop: `1px solid ${C.border}`, display: "flex", justifyContent: "flex-end", gap: 1.5, backgroundColor: C.surface }}>
      <Box component="button" onClick={onClose}
        sx={{ textTransform: "none", fontWeight: 600, color: C.slate, border: `1px solid ${C.border}`, borderRadius: 2, px: 2.5, py: 0.75, cursor: "pointer", backgroundColor: C.white, fontSize: 13 }}>
        Cancel
      </Box>
      <Box component="button" onClick={onConfirm}
        sx={{ textTransform: "none", fontWeight: 600, color: C.white, backgroundColor: C.blue, border: "none", borderRadius: 2, px: 2.5, py: 0.75, cursor: "pointer", fontSize: 13, "&:hover": { backgroundColor: C.blueDark } }}>
        Confirm
      </Box>
    </Box>
  </Dialog>
);

export default function DivisionForm({ open, form, setForm, errors = {}, selectedId, onClose, onSubmit }) {
  const [products, setProducts] = useState([]);
  const [productDialog, setProductDialog] = useState(false);
  const [tempProducts, setTempProducts] = useState([]);

  useEffect(() => {
    if (!open) return;
    GetProducts({ page: 0, size: 100 }).then((r) => setProducts(r.products));
  }, [open]);

  const selectedProducts = products.filter((p) => (form.productIds || []).includes(p.id));

  return (
    <>
      <FormDialog open={open} onClose={onClose} onSubmit={onSubmit} maxWidth="sm"
        title={selectedId ? "Edit Division" : "Add Division"}
        submitLabel={selectedId ? "Update" : "Add Division"}>

        <TextField label="Division Name" value={form.name || ""}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          error={!!errors.name} helperText={errors.name} fullWidth sx={fieldSx} autoFocus />

        <FormControl fullWidth error={!!errors.productIds}>
          <TextField label="Products" value={selectedProducts.map((p) => p.name).join(", ")}
            onClick={() => { setTempProducts(form.productIds || []); setProductDialog(true); }}
            InputProps={{ readOnly: true }}
            placeholder="Click to select products"
            sx={{ ...fieldSx, cursor: "pointer" }} />
          {errors.productIds && <FormHelperText>{errors.productIds}</FormHelperText>}
        </FormControl>
      </FormDialog>

      <SubDialog open={productDialog} onClose={() => setProductDialog(false)} title="Select Products"
        onConfirm={() => { setForm({ ...form, productIds: tempProducts }); setProductDialog(false); }}>
        {products.map((p) => (
          <Box key={p.id} display="flex" alignItems="center" gap={1.5} py={0.75} px={1}
            onClick={() => setTempProducts(tempProducts.includes(p.id) ? tempProducts.filter((id) => id !== p.id) : [...tempProducts, p.id])}
            sx={{ cursor: "pointer", borderRadius: 2, "&:hover": { backgroundColor: C.blueLight }, backgroundColor: tempProducts.includes(p.id) ? C.blueLight : "transparent" }}>
            <Checkbox checked={tempProducts.includes(p.id)} size="small"
              sx={{ color: C.blue, "&.Mui-checked": { color: C.blue }, p: 0 }} />
            <Avatar sx={{ width: 28, height: 28, fontSize: 12, backgroundColor: C.blue, borderRadius: 1 }}>
              {p.name?.[0]?.toUpperCase()}
            </Avatar>
            <Box>
              <Typography fontSize={13} fontWeight={tempProducts.includes(p.id) ? 700 : 400} color={C.navy}>{p.name}</Typography>
              <Typography fontSize={11} sx={{ color: C.slate }}>{p.productCode}</Typography>
            </Box>
          </Box>
        ))}
      </SubDialog>
    </>
  );
}

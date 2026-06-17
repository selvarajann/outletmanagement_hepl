import { useEffect, useState } from "react";
import { TextField, FormControl, FormHelperText, Box, Typography, Checkbox, Avatar, Dialog, DialogContent, Button } from "@mui/material";
import { toast } from "react-toastify";
import { GetProducts } from "../../services/ProductService";
import FormDialog from "../shared/FormDialog";
import { C } from "../../theme/colors";
import { DEFAULT_PAGE_SIZE } from "../../constants/pagination";

const validateName = (val) => {
  if (!val.trim()) return "Division name is required";
  if (/\d/.test(val)) return "Numbers are not allowed in division name";
  if (val.trim().length < 2) return "Must be at least 2 characters";
  return "";
};

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
    <DialogContent sx={{ px: 2, py: 1.5, maxHeight: 320, overflowY: "auto" }}>{children}</DialogContent>
    <Box sx={{ px: 3, py: 2, borderTop: `1px solid ${C.border}`, display: "flex", justifyContent: "flex-end", gap: 1.5, backgroundColor: C.surface }}>
      <Button onClick={onClose}
        sx={{ textTransform: "none", fontWeight: 600, color: C.slate, border: `1px solid ${C.border}`, borderRadius: 2, px: 2.5, "&:hover": { backgroundColor: C.slateLight } }}>
        Cancel
      </Button>
      <Button onClick={onConfirm} variant="contained"
        sx={{ textTransform: "none", fontWeight: 600, borderRadius: 2, px: 2.5, backgroundColor: C.blue, boxShadow: "none", "&:hover": { backgroundColor: C.blueDark, boxShadow: "none" } }}>
        Confirm
      </Button>
    </Box>
  </Dialog>
);

export default function DivisionForm({ open, form, setForm, errors = {}, setErrors, selectedId, onClose, onSubmit }) {
  const [products, setProducts] = useState([]);
  const [productDialog, setProductDialog] = useState(false);
  const [tempProducts, setTempProducts] = useState([]);

  useEffect(() => {
    if (!open) return;
    GetProducts({ page: 0, size: DEFAULT_PAGE_SIZE }).then((r) => setProducts(r.products));
  }, [open]);

  const selectedProducts = products.filter((p) => (form.productIds || []).includes(p.id));

  const handleNameChange = (e) => {
    const val = e.target.value;
    if (/\d/.test(val.slice(-1))) { toast.warn("Numbers are not allowed in division name"); return; }
    const newForm = { ...form, name: val };
    setForm(newForm);
    if (setErrors) setErrors((prev) => ({ ...prev, name: validateName(val) || undefined }));
  };

  return (
    <>
      <FormDialog open={open} onClose={onClose} onSubmit={onSubmit} maxWidth="sm"
        title={selectedId ? "Edit Division" : "Add Division"}
        submitLabel={selectedId ? "Update" : "Add Division"}>

        <TextField label="Division Name" value={form.name || ""}
          onChange={handleNameChange}
          error={!!errors.name} helperText={errors.name || "Only letters and spaces allowed"} fullWidth sx={fieldSx} autoFocus
          inputProps={{ maxLength: 60 }} />

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

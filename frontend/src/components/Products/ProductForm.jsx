import { TextField, MenuItem, Select, InputLabel, FormControl, FormHelperText, Grid } from "@mui/material";
import { toast } from "react-toastify";
import { useDivisions } from "../../hooks/useMasterData";
import FormDialog from "../shared/FormDialog";
import { C } from "../../theme/colors";
import { useCallback, memo } from "react";

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: 2,
    fontSize: 14,
    "& fieldset": { borderColor: C.border },
    "&:hover fieldset": { borderColor: C.blue },
    "&.Mui-focused fieldset": { borderColor: C.blue },
  },
  "& .MuiInputLabel-root.Mui-focused": { color: C.blue },
};

const validateField = (field, val) => {
  switch (field) {
    case "name":
      if (!String(val).trim()) return "Product name is required";
      if (/\d/.test(val)) return "Numbers are not allowed in product name";
      if (String(val).trim().length < 2) return "Must be at least 2 characters";
      return "";
    case "productCode":
      if (!String(val).trim()) return "Product code is required";
      if (!/^[A-Za-z0-9_-]+$/.test(val)) return "Only letters, numbers, - and _ allowed";
      return "";
    case "uimPrice": case "mrp": case "sellingPrice": case "purchasePrice":
      if (val === "" || val === null) return "This field is required";
      if (isNaN(val) || Number(val) < 0) return "Must be a positive number";
      return "";
    default: return "";
  }
};

const ProductForm = memo(({ open, form, setForm, errors = {}, setErrors, selectedId, onClose, onSubmit }) => {
  const { divisions } = useDivisions();

  const handleChange = useCallback((field) => (e) => {
    const val = e.target.value;
    if (field === "name" && /\d/.test(val.slice(-1))) {
      toast.warn("Numbers are not allowed in product name"); return;
    }
    if (["uimPrice", "mrp", "sellingPrice", "purchasePrice"].includes(field)) {
      if (val !== "" && !/^\d*\.?\d*$/.test(val)) {
        toast.warn("Only numeric values allowed for prices"); return;
      }
    }
    setForm(prev => ({ ...prev, [field]: val }));
    if (setErrors) {
      const err = validateField(field, val);
      setErrors((prev) => ({ ...prev, [field]: err || undefined }));
    }
  }, [setForm, setErrors]);

  const f = useCallback((field) => ({
    value: form[field] ?? "",
    onChange: handleChange(field),
    error: !!errors[field],
    helperText: errors[field],
    fullWidth: true,
    sx: fieldSx,
  }), [form, errors, handleChange]);

  return (
    <FormDialog
      open={open} onClose={onClose} onSubmit={onSubmit}
      title={selectedId ? "Edit Product" : "Add Product"}
      submitLabel={selectedId ? "Update" : "Add Product"}
    >
      <Grid container spacing={2}>
        <Grid item xs={12} sm={8}>
          <TextField label="Product Name" {...f("name")} />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField label="Product Code" {...f("productCode")} />
        </Grid>
      </Grid>

      <FormControl fullWidth error={!!errors.divisionId} sx={fieldSx}>
        <InputLabel>Division</InputLabel>
        <Select value={form.divisionId || ""} label="Division"
          onChange={(e) => setForm(prev => ({ ...prev, divisionId: e.target.value }))}
          sx={{ borderRadius: 2, fontSize: 14 }}>
          {divisions.map((d) => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
        </Select>
        {errors.divisionId && <FormHelperText>{errors.divisionId}</FormHelperText>}
      </FormControl>

      <Grid container spacing={2}>
        <Grid item xs={6}>
          <TextField label="UIM Price" type="number" {...f("uimPrice")} />
        </Grid>
        <Grid item xs={6}>
          <TextField label="MRP" type="number" {...f("mrp")} />
        </Grid>
        <Grid item xs={6}>
          <TextField label="Selling Price" type="number" {...f("sellingPrice")} />
        </Grid>
        <Grid item xs={6}>
          <TextField label="Purchase Price" type="number" {...f("purchasePrice")} />
        </Grid>
      </Grid>
    </FormDialog>
  );
});

export default ProductForm;

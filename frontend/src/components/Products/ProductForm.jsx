import { useEffect, useState } from "react";
import { TextField, MenuItem, Select, InputLabel, FormControl, FormHelperText, Grid } from "@mui/material";
import { GetDivisions } from "../../services/DivisionService";
import FormDialog from "../shared/FormDialog";
import { C } from "../../theme/colors";

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

export default function ProductForm({ open, form, setForm, errors = {}, selectedId, onClose, onSubmit }) {
  const [divisions, setDivisions] = useState([]);

  useEffect(() => {
    if (!open) return;
    GetDivisions({ page: 0, size: 100 }).then((r) => setDivisions(r.divisions));
  }, [open]);

  const f = (field) => ({ value: form[field] ?? "", onChange: (e) => setForm({ ...form, [field]: e.target.value }), error: !!errors[field], helperText: errors[field], fullWidth: true, sx: fieldSx });

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
          onChange={(e) => setForm({ ...form, divisionId: e.target.value })}
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
}

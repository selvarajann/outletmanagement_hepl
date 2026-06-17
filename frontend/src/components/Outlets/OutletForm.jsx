import { useState } from "react";
import {
  TextField, MenuItem, Select, InputLabel, FormControl, FormHelperText,
  Checkbox, Typography, Divider, Box, Dialog, DialogContent, Button, Avatar
} from "@mui/material";
import { toast } from "react-toastify";
import { useLocations, useDivisions } from "../../hooks/useMasterData";
import FormDialog from "../shared/FormDialog";
import { C } from "../../theme/colors";

const OUTLET_TYPES = ["Wholesale", "Distribution", "Franchise", "Warehouse"];

const validateField = (field, val) => {
  switch (field) {
    case "outletName":
      if (!String(val).trim()) return "Outlet name is required";
      if (/\d/.test(val)) return "Numbers are not allowed in outlet name";
      if (String(val).trim().length < 2) return "Must be at least 2 characters";
      return "";
    case "ownerName":
      if (!String(val).trim()) return "Owner name is required";
      if (/\d/.test(val)) return "Numbers are not allowed in owner name";
      if (String(val).trim().length < 2) return "Must be at least 2 characters";
      return "";
    case "address":
      if (!String(val).trim()) return "Address is required";
      if (String(val).trim().length < 5) return "Address must be at least 5 characters";
      return "";
    default: return "";
  }
};

const validate = (form) => {
  const e = {};
  const n = validateField("outletName", form.outletName); if (n) e.outletName = n;
  if (!form.locationId) e.locationId = "Location is required";
  if (!form.outletType) e.outletType = "Outlet type is required";
  const o = validateField("ownerName", form.ownerName); if (o) e.ownerName = o;
  const a = validateField("address", form.address); if (a) e.address = a;
  if (!form.divisionIds.length) e.divisionIds = "Select at least one division";
  return e;
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
    <DialogContent sx={{ px: 2, py: 1.5, maxHeight: 320, overflowY: "auto" }}>
      {children}
    </DialogContent>
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

export default function OutletForm({ open, form, setForm, errors, setErrors, selectedId, onClose, onSubmit }) {
  const { locations } = useLocations();
  const { divisions: allDivisions } = useDivisions();
  const [locationDialog, setLocationDialog] = useState(false);
  const [tempLocation, setTempLocation] = useState(null);
  const [divisionDialog, setDivisionDialog] = useState(false);
  const [tempDivisions, setTempDivisions] = useState([]);
  const [productDialog, setProductDialog] = useState(false);
  const [tempProducts, setTempProducts] = useState([]);

  const selectedDivisions = allDivisions.filter((d) => (form.divisionIds || []).includes(d.id));
  const availableProducts = selectedDivisions
    .flatMap((d) => d.products || [])
    .filter((p, i, arr) => arr.findIndex((x) => x.id === p.id) === i);

  const selectedProductNames = availableProducts
    .filter((p) => (form.productIds || []).includes(p.id))
    .map((p) => p.name)
    .join(", ");

  const handleTextChange = (field) => (e) => {
    const val = e.target.value;
    if ((field === "outletName" || field === "ownerName") && /\d/.test(val.slice(-1))) {
      toast.warn(`Numbers are not allowed in ${field === "outletName" ? "outlet name" : "owner name"}`); return;
    }
    const newForm = { ...form, [field]: val };
    setForm(newForm);
    const err = validateField(field, val);
    setErrors((prev) => ({ ...prev, [field]: err || undefined }));
  };

  const handleSubmit = () => {
    const e = validate(form);
    if (Object.keys(e).length) { setErrors(e); return; }
    const mappings = [];
    for (const div of selectedDivisions)
      for (const p of (div.products || []))
        if ((form.productIds || []).includes(p.id))
          mappings.push({ divisionId: div.id, productId: p.id });
    if (!mappings.length) { setErrors({ divisionIds: "Select at least one product from the selected divisions" }); return; }
    onSubmit({ outletName: form.outletName, locationId: form.locationId, outletType: form.outletType, ownerName: form.ownerName, address: form.address, mappings });
  };

  return (
    <>
      <FormDialog open={open} onClose={onClose} onSubmit={handleSubmit}
        title={selectedId ? "Edit Outlet" : "Add Outlet"}
        submitLabel={selectedId ? "Update" : "Add Outlet"}>

        <TextField label="Outlet Name" value={form.outletName || ""}
          onChange={handleTextChange("outletName")}
          error={!!errors.outletName} helperText={errors.outletName || "Only letters and spaces allowed"}
          fullWidth sx={fieldSx} inputProps={{ maxLength: 80 }} />

        {/* Location */}
        <FormControl fullWidth error={!!errors.locationId}>
          <TextField label="Location"
            value={locations.find((l) => l.id === form.locationId)?.name || ""}
            onClick={() => { setTempLocation(form.locationId); setLocationDialog(true); }}
            InputProps={{ readOnly: true }} sx={{ ...fieldSx, cursor: "pointer" }} />
          {errors.locationId && <FormHelperText>{errors.locationId}</FormHelperText>}
        </FormControl>

        {/* Outlet Type */}
        <FormControl fullWidth error={!!errors.outletType} sx={fieldSx}>
          <InputLabel>Outlet Type</InputLabel>
          <Select value={form.outletType || ""} label="Outlet Type"
            onChange={(e) => setForm({ ...form, outletType: e.target.value })}
            sx={{ borderRadius: 2, fontSize: 14 }}>
            {OUTLET_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
          </Select>
          {errors.outletType && <FormHelperText>{errors.outletType}</FormHelperText>}
        </FormControl>

        {/* Divisions */}
        <FormControl fullWidth error={!!errors.divisionIds}>
          <TextField label="Divisions"
            value={selectedDivisions.map((d) => d.name).join(", ")}
            onClick={() => { setTempDivisions(form.divisionIds || []); setDivisionDialog(true); }}
            InputProps={{ readOnly: true }} sx={{ ...fieldSx, cursor: "pointer" }} />
          {errors.divisionIds && <FormHelperText>{errors.divisionIds}</FormHelperText>}
        </FormControl>

        {/* Products — dialog picker, only shown when divisions are selected */}
        {availableProducts.length > 0 && (
          <>
            <Divider sx={{ borderColor: C.border }} />
            <Typography variant="caption" sx={{ color: C.slate, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.6, fontSize: 10 }}>
              Products from selected divisions
            </Typography>
            <FormControl fullWidth>
              <TextField label="Products"
                value={selectedProductNames}
                onClick={() => { setTempProducts(form.productIds || []); setProductDialog(true); }}
                InputProps={{ readOnly: true }}
                placeholder="Click to select products"
                sx={{ ...fieldSx, cursor: "pointer" }} />
            </FormControl>
          </>
        )}

        <TextField label="Owner Name" value={form.ownerName || ""}
          onChange={handleTextChange("ownerName")}
          error={!!errors.ownerName} helperText={errors.ownerName || "Only letters and spaces allowed"}
          fullWidth sx={fieldSx} inputProps={{ maxLength: 80 }} />

        <TextField label="Address" value={form.address || ""}
          onChange={handleTextChange("address")}
          error={!!errors.address} helperText={errors.address || "Min 5 characters"}
          fullWidth multiline rows={2} sx={fieldSx} />
      </FormDialog>

      {/* Location Sub-Dialog */}
      <SubDialog open={locationDialog} onClose={() => setLocationDialog(false)} title="Select Location"
        onConfirm={() => { setForm({ ...form, locationId: tempLocation }); setLocationDialog(false); }}>
        {locations.map((l) => (
          <Box key={l.id} display="flex" alignItems="center" gap={1.5} py={0.75} px={1}
            onClick={() => setTempLocation(l.id)}
            sx={{ cursor: "pointer", borderRadius: 2, "&:hover": { backgroundColor: C.blueLight }, backgroundColor: tempLocation === l.id ? C.blueLight : "transparent" }}>
            <Checkbox checked={tempLocation === l.id} size="small" sx={{ color: C.blue, "&.Mui-checked": { color: C.blue }, p: 0 }} />
            <Avatar sx={{ width: 28, height: 28, fontSize: 12, backgroundColor: C.amber, borderRadius: 1 }}>
              {l.name?.[0]?.toUpperCase()}
            </Avatar>
            <Typography fontSize={13} fontWeight={tempLocation === l.id ? 700 : 400} color={C.navy}>{l.name}</Typography>
          </Box>
        ))}
      </SubDialog>

      {/* Division Sub-Dialog */}
      <SubDialog open={divisionDialog} onClose={() => setDivisionDialog(false)} title="Select Divisions"
        onConfirm={() => { setForm({ ...form, divisionIds: tempDivisions, productIds: [] }); setDivisionDialog(false); }}>
        {allDivisions.map((d) => (
          <Box key={d.id} display="flex" alignItems="center" gap={1.5} py={0.75} px={1}
            onClick={() => setTempDivisions(tempDivisions.includes(d.id) ? tempDivisions.filter((id) => id !== d.id) : [...tempDivisions, d.id])}
            sx={{ cursor: "pointer", borderRadius: 2, "&:hover": { backgroundColor: C.blueLight }, backgroundColor: tempDivisions.includes(d.id) ? C.blueLight : "transparent" }}>
            <Checkbox checked={tempDivisions.includes(d.id)} size="small" sx={{ color: C.blue, "&.Mui-checked": { color: C.blue }, p: 0 }} />
            <Avatar sx={{ width: 28, height: 28, fontSize: 12, backgroundColor: C.emerald, borderRadius: 1 }}>
              {d.name?.[0]?.toUpperCase()}
            </Avatar>
            <Typography fontSize={13} fontWeight={tempDivisions.includes(d.id) ? 700 : 400} color={C.navy}>{d.name}</Typography>
          </Box>
        ))}
      </SubDialog>

      {/* Product Sub-Dialog */}
      <SubDialog open={productDialog} onClose={() => setProductDialog(false)} title="Select Products"
        onConfirm={() => { setForm({ ...form, productIds: tempProducts }); setProductDialog(false); }}>
        {availableProducts.map((p) => (
          <Box key={p.id} display="flex" alignItems="center" gap={1.5} py={0.75} px={1}
            onClick={() => setTempProducts(tempProducts.includes(p.id) ? tempProducts.filter((id) => id !== p.id) : [...tempProducts, p.id])}
            sx={{ cursor: "pointer", borderRadius: 2, "&:hover": { backgroundColor: C.blueLight }, backgroundColor: tempProducts.includes(p.id) ? C.blueLight : "transparent" }}>
            <Checkbox checked={tempProducts.includes(p.id)} size="small" sx={{ color: C.blue, "&.Mui-checked": { color: C.blue }, p: 0 }} />
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

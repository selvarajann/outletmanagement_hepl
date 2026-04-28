import { useEffect, useState } from "react";
import {
  TextField, MenuItem, Select, InputLabel, FormControl, FormHelperText,
  Checkbox, ListItemText, OutlinedInput, Typography, Divider, Box,
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Chip, Avatar
} from "@mui/material";
import { GetLocations } from "../../services/LocationService";
import { GetDivisions } from "../../services/DivisionService";
import FormDialog from "../shared/FormDialog";
import { C } from "../../theme/colors";

const OUTLET_TYPES = ["Wholesale", "Distribution", "Franchise", "Warehouse"];

const validate = (form) => {
  const e = {};
  if (!form.outletName.trim()) e.outletName = "Outlet name is required";
  if (!form.locationId) e.locationId = "Location is required";
  if (!form.outletType) e.outletType = "Outlet type is required";
  if (!form.ownerName.trim()) e.ownerName = "Owner name is required";
  if (!form.address.trim()) e.address = "Address is required";
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
    <DialogContent sx={{ px: 2, py: 1.5 }}>{children}</DialogContent>
    <Box sx={{ px: 3, py: 2, borderTop: `1px solid ${C.border}`, display: "flex", justifyContent: "flex-end", gap: 1.5, backgroundColor: C.surface }}>
      <Button onClick={onClose} sx={{ textTransform: "none", fontWeight: 600, color: C.slate, border: `1px solid ${C.border}`, borderRadius: 2, px: 2 }}>Cancel</Button>
      <Button onClick={onConfirm} variant="contained" sx={{ textTransform: "none", fontWeight: 600, borderRadius: 2, px: 2, backgroundColor: C.blue, boxShadow: "none", "&:hover": { backgroundColor: C.blueDark, boxShadow: "none" } }}>Confirm</Button>
    </Box>
  </Dialog>
);

export default function OutletForm({ open, form, setForm, errors, setErrors, selectedId, onClose, onSubmit }) {
  const [locations, setLocations] = useState([]);
  const [allDivisions, setAllDivisions] = useState([]);
  const [locationDialog, setLocationDialog] = useState(false);
  const [tempLocation, setTempLocation] = useState(null);
  const [divisionDialog, setDivisionDialog] = useState(false);
  const [tempDivisions, setTempDivisions] = useState([]);

  useEffect(() => {
    if (!open) return;
    GetLocations({ page: 0, size: 100 }).then((r) => setLocations(r.locations));
    GetDivisions({ page: 0, size: 100 }).then((r) => setAllDivisions(r.divisions));
  }, [open]);

  const selectedDivisions = allDivisions.filter((d) => (form.divisionIds || []).includes(d.id));
  const availableProducts = selectedDivisions.flatMap((d) => d.products || [])
    .filter((p, i, arr) => arr.findIndex((x) => x.id === p.id) === i);

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
          onChange={(e) => setForm({ ...form, outletName: e.target.value })}
          error={!!errors.outletName} helperText={errors.outletName} fullWidth sx={fieldSx} />

        <FormControl fullWidth error={!!errors.locationId}>
          <TextField label="Location" value={locations.find((l) => l.id === form.locationId)?.name || ""}
            onClick={() => { setTempLocation(form.locationId); setLocationDialog(true); }}
            InputProps={{ readOnly: true }} sx={{ ...fieldSx, cursor: "pointer" }} />
          {errors.locationId && <FormHelperText>{errors.locationId}</FormHelperText>}
        </FormControl>

        <FormControl fullWidth error={!!errors.outletType} sx={fieldSx}>
          <InputLabel>Outlet Type</InputLabel>
          <Select value={form.outletType || ""} label="Outlet Type"
            onChange={(e) => setForm({ ...form, outletType: e.target.value })}
            sx={{ borderRadius: 2, fontSize: 14 }}>
            {OUTLET_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
          </Select>
          {errors.outletType && <FormHelperText>{errors.outletType}</FormHelperText>}
        </FormControl>

        <FormControl fullWidth error={!!errors.divisionIds}>
          <TextField label="Divisions" value={selectedDivisions.map((d) => d.name).join(", ")}
            onClick={() => { setTempDivisions(form.divisionIds || []); setDivisionDialog(true); }}
            InputProps={{ readOnly: true }} sx={{ ...fieldSx, cursor: "pointer" }} />
          {errors.divisionIds && <FormHelperText>{errors.divisionIds}</FormHelperText>}
        </FormControl>

        {availableProducts.length > 0 && (
          <>
            <Divider sx={{ borderColor: C.border }} />
            <Typography variant="caption" sx={{ color: C.slate, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.6, fontSize: 10 }}>
              Products from selected divisions
            </Typography>
            <FormControl fullWidth sx={fieldSx}>
              <InputLabel>Products</InputLabel>
              <Select multiple value={form.productIds || []}
                onChange={(e) => setForm({ ...form, productIds: e.target.value })}
                input={<OutlinedInput label="Products" />}
                renderValue={(selected) => availableProducts.filter((p) => selected.includes(p.id)).map((p) => p.name).join(", ")}
                sx={{ borderRadius: 2, fontSize: 14 }}>
                {availableProducts.map((p) => (
                  <MenuItem key={p.id} value={p.id}>
                    <Checkbox checked={(form.productIds || []).includes(p.id)} size="small" sx={{ color: C.blue, "&.Mui-checked": { color: C.blue } }} />
                    <ListItemText primary={p.name} secondary={p.productCode}
                      primaryTypographyProps={{ fontSize: 13, fontWeight: 600 }}
                      secondaryTypographyProps={{ fontSize: 11 }} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </>
        )}

        <TextField label="Owner Name" value={form.ownerName || ""}
          onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
          error={!!errors.ownerName} helperText={errors.ownerName} fullWidth sx={fieldSx} />

        <TextField label="Address" value={form.address || ""}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
          error={!!errors.address} helperText={errors.address} fullWidth multiline rows={2} sx={fieldSx} />
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
    </>
  );
}

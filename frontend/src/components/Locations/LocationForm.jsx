import { TextField } from "@mui/material";
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

export default function LocationForm({ open, form, setForm, errors = {}, selectedId, onClose, onSubmit }) {
  return (
    <FormDialog open={open} onClose={onClose} onSubmit={onSubmit} maxWidth="xs"
      title={selectedId ? "Edit Location" : "Add Location"}
      submitLabel={selectedId ? "Update" : "Add Location"}>
      <TextField
        label="Location Name"
        value={form.name || ""}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        error={!!errors.name}
        helperText={errors.name}
        fullWidth
        sx={fieldSx}
        autoFocus
      />
    </FormDialog>
  );
}

import { TextField } from "@mui/material";
import { toast } from "react-toastify";
import FormDialog from "../shared/FormDialog";
import { C } from "../../theme/colors";

const validate = (form) => {
  const e = {};
  if (!form.name.trim()) e.name = "Location name is required";
  else if (/\d/.test(form.name)) e.name = "Numbers are not allowed in location name";
  else if (form.name.trim().length < 2) e.name = "Must be at least 2 characters";
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

export default function LocationForm({ open, form, setForm, errors = {}, setErrors, selectedId, onClose, onSubmit }) {
  const handleNameChange = (e) => {
    const val = e.target.value;
    if (/\d/.test(val.slice(-1))) { toast.warn("Numbers are not allowed in location name"); return; }
    const newForm = { ...form, name: val };
    setForm(newForm);
    if (setErrors) setErrors(validate(newForm));
  };

  return (
    <FormDialog open={open} onClose={onClose} onSubmit={onSubmit} maxWidth="xs"
      title={selectedId ? "Edit Location" : "Add Location"}
      submitLabel={selectedId ? "Update" : "Add Location"}>
      <TextField
        label="Location Name"
        value={form.name || ""}
        onChange={handleNameChange}
        error={!!errors.name}
        helperText={errors.name || "Only letters and spaces allowed"}
        fullWidth
        sx={fieldSx}
        autoFocus
        inputProps={{ maxLength: 60 }}
      />
    </FormDialog>
  );
}

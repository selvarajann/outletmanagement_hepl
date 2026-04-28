import { Box, TextField, InputAdornment } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";
import { C } from "../../theme/colors";

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: 2, fontSize: 13, backgroundColor: C.white,
    "& fieldset": { borderColor: C.border },
    "&:hover fieldset": { borderColor: C.blue },
    "&.Mui-focused fieldset": { borderColor: C.blue },
  },
};

export default function LocationFilter({ filters, onChange }) {
  return (
    <Box sx={{ p: 2, mb: 2.5, backgroundColor: C.white, border: `1px solid ${C.border}`, borderRadius: 3 }}>
      <Box display="flex" alignItems="center" gap={1} mb={1.5}>
        <FilterListIcon sx={{ fontSize: 16, color: C.slate }} />
        <Box component="span" sx={{ fontSize: 12, fontWeight: 700, color: C.slate, textTransform: "uppercase", letterSpacing: 0.7 }}>Filters</Box>
      </Box>
      <TextField placeholder="Search by location name..." size="small" value={filters.keyword}
        onChange={(e) => onChange({ ...filters, keyword: e.target.value })}
        sx={{ ...fieldSx, minWidth: 260 }}
        InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 16, color: C.slate }} /></InputAdornment> }} />
    </Box>
  );
}

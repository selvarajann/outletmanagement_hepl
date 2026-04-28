import { useEffect, useState } from "react";
import { Box, TextField, MenuItem, Select, InputLabel, FormControl, InputAdornment, Button, Chip } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";
import CloseIcon from "@mui/icons-material/Close";
import { GetDivisions } from "../../services/DivisionService";
import { C } from "../../theme/colors";

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: 2, fontSize: 13, backgroundColor: C.white,
    "& fieldset": { borderColor: C.border },
    "&:hover fieldset": { borderColor: C.blue },
    "&.Mui-focused fieldset": { borderColor: C.blue },
  },
  "& .MuiInputLabel-root.Mui-focused": { color: C.blue },
};

export default function ProductFilter({ filters, onChange }) {
  const [divisions, setDivisions] = useState([]);

  useEffect(() => {
    GetDivisions({ page: 0, size: 100 }).then((r) => setDivisions(r.divisions));
  }, []);

  const activeCount = [filters.divisionId, filters.minSellingPrice, filters.maxSellingPrice, filters.minPurchasePrice, filters.maxPurchasePrice]
    .filter(Boolean).length;

  const handleReset = () => onChange({ keyword: "", divisionId: "", minSellingPrice: "", maxSellingPrice: "", minPurchasePrice: "", maxPurchasePrice: "" });

  return (
    <Box sx={{ p: 2, mb: 2.5, backgroundColor: C.white, border: `1px solid ${C.border}`, borderRadius: 3 }}>
      <Box display="flex" alignItems="center" gap={1} mb={1.5}>
        <FilterListIcon sx={{ fontSize: 16, color: C.slate }} />
        <Box component="span" sx={{ fontSize: 12, fontWeight: 700, color: C.slate, textTransform: "uppercase", letterSpacing: 0.7 }}>Filters</Box>
        {activeCount > 0 && (
          <Chip label={`${activeCount} active`} size="small"
            sx={{ fontSize: 10, fontWeight: 700, height: 18, backgroundColor: C.blueLight, color: C.blue }} />
        )}
        {activeCount > 0 && (
          <Button size="small" startIcon={<CloseIcon sx={{ fontSize: 12 }} />} onClick={handleReset}
            sx={{ ml: "auto", fontSize: 11, textTransform: "none", color: C.slate, p: 0, minWidth: 0, "&:hover": { color: C.red, backgroundColor: "transparent" } }}>
            Reset
          </Button>
        )}
      </Box>

      <Box display="flex" flexWrap="wrap" gap={1.5}>
        <TextField placeholder="Search by name or code..." size="small" value={filters.keyword}
          onChange={(e) => onChange({ ...filters, keyword: e.target.value })}
          sx={{ ...fieldSx, minWidth: 220 }}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 16, color: C.slate }} /></InputAdornment> }} />

        <FormControl size="small" sx={{ ...fieldSx, minWidth: 160 }}>
          <InputLabel>Division</InputLabel>
          <Select value={filters.divisionId} label="Division"
            onChange={(e) => onChange({ ...filters, divisionId: e.target.value })}
            sx={{ borderRadius: 2, fontSize: 13 }}>
            <MenuItem value=""><em>All Divisions</em></MenuItem>
            {divisions.map((d) => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
          </Select>
        </FormControl>

        <TextField placeholder="Min Sell ₹" size="small" type="number" value={filters.minSellingPrice}
          onChange={(e) => onChange({ ...filters, minSellingPrice: e.target.value })}
          sx={{ ...fieldSx, width: 110 }} />

        <TextField placeholder="Max Sell ₹" size="small" type="number" value={filters.maxSellingPrice}
          onChange={(e) => onChange({ ...filters, maxSellingPrice: e.target.value })}
          sx={{ ...fieldSx, width: 110 }} />

        <TextField placeholder="Min Cost ₹" size="small" type="number" value={filters.minPurchasePrice}
          onChange={(e) => onChange({ ...filters, minPurchasePrice: e.target.value })}
          sx={{ ...fieldSx, width: 110 }} />

        <TextField placeholder="Max Cost ₹" size="small" type="number" value={filters.maxPurchasePrice}
          onChange={(e) => onChange({ ...filters, maxPurchasePrice: e.target.value })}
          sx={{ ...fieldSx, width: 110 }} />
      </Box>
    </Box>
  );
}

import { Box, TextField, MenuItem, Select, InputLabel, FormControl, Button, Chip } from "@mui/material";
import FilterListIcon from "@mui/icons-material/FilterList";
import CloseIcon from "@mui/icons-material/Close";
import { useDivisions } from "../../hooks/useMasterData";
import { C } from "../../theme/colors";
import { useCallback } from "react";
import DebouncedSearchInput from "../common/DebouncedSearchInput";

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: 2, fontSize: 13, backgroundColor: C.white,
    "& fieldset": { borderColor: C.border },
    "&:hover fieldset": { borderColor: C.blue },
    "&.Mui-focused fieldset": { borderColor: C.blue },
  },
  "& .MuiInputLabel-root.Mui-focused": { color: C.blue },
};

export default function ProductFilter({ filters, onChange, onSearch }) {
  const { divisions } = useDivisions();

  const activeCount = [filters.keyword, filters.divisionId, filters.minSellingPrice, filters.maxSellingPrice, filters.minPurchasePrice, filters.maxPurchasePrice]
    .filter(Boolean).length;
    
  const handleReset = useCallback(() => {
    onChange({ keyword: "", divisionId: "", minSellingPrice: "", maxSellingPrice: "", minPurchasePrice: "", maxPurchasePrice: "" });
  }, [onChange]);

  const handleChange = useCallback((key, value) => {
    onChange({ ...filters, [key]: value });
  }, [filters, onChange]);

  return (
    <Box sx={{ width: "100%", p: 2, backgroundColor: C.white, borderRadius: "14px" }}>
      <Box display="flex" alignItems="center" gap={1} mb={1.5}>
        <FilterListIcon sx={{ fontSize: 16, color: C.slateMid }} />
        <Box component="span" sx={{ fontSize: "11px", fontWeight: 700, color: C.slateMid, textTransform: "uppercase", letterSpacing: 0.8 }}>Filters</Box>
        {activeCount > 0 && (
          <Chip label={`${activeCount} active`} size="small" sx={{ fontSize: 10, fontWeight: 700, height: 20, backgroundColor: `${C.blue}15`, color: C.blue, border: `1px solid ${C.blue}25`, ml: 1 }} />
        )}
        {activeCount > 0 && (
          <Button size="small" startIcon={<CloseIcon sx={{ fontSize: 12 }} />} onClick={handleReset}
            sx={{ ml: "auto", fontSize: 11, textTransform: "none", color: C.slateMid, p: 0, minWidth: 0, "&:hover": { color: C.red, backgroundColor: "transparent" } }}>
            Reset
          </Button>
        )}
      </Box>
      <Box display="flex" flexWrap="wrap" gap={1.5}>
        <DebouncedSearchInput 
          placeholder="Search by name or code..." 
          value={filters.keyword || ""}
          onSearch={(keyword, signal) => onSearch ? onSearch(keyword, signal) : handleChange("keyword", keyword)} 
          sx={{ ...fieldSx, minWidth: 220 }} 
        />
        <FormControl size="small" sx={{ ...fieldSx, minWidth: 160 }}>
          <InputLabel>Division</InputLabel>
          <Select value={filters.divisionId} label="Division"
            onChange={(e) => handleChange("divisionId", e.target.value)}
            sx={{ borderRadius: 2, fontSize: 13 }}>
            <MenuItem value=""><em>All Divisions</em></MenuItem>
            {divisions.map((d) => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
          </Select>
        </FormControl>
        <TextField placeholder="Min Sell ₹" size="small" type="number" value={filters.minSellingPrice}
          onChange={(e) => handleChange("minSellingPrice", e.target.value)}
          sx={{ ...fieldSx, width: 110 }} />
        <TextField placeholder="Max Sell ₹" size="small" type="number" value={filters.maxSellingPrice}
          onChange={(e) => handleChange("maxSellingPrice", e.target.value)}
          sx={{ ...fieldSx, width: 110 }} />
        <TextField placeholder="Min Cost ₹" size="small" type="number" value={filters.minPurchasePrice}
          onChange={(e) => handleChange("minPurchasePrice", e.target.value)}
          sx={{ ...fieldSx, width: 110 }} />
        <TextField placeholder="Max Cost ₹" size="small" type="number" value={filters.maxPurchasePrice}
          onChange={(e) => handleChange("maxPurchasePrice", e.target.value)}
          sx={{ ...fieldSx, width: 110 }} />
      </Box>
    </Box>
  );
}

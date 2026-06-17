import { Box, TextField, MenuItem, Select, InputLabel, FormControl, InputAdornment, Button, Chip } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";
import CloseIcon from "@mui/icons-material/Close";
import { useLocations, useDivisions } from "../../hooks/useMasterData";
import { C } from "../../theme/colors";

const OUTLET_TYPES = ["Wholesale", "Distribution", "Franchise", "Warehouse"];

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: 2, fontSize: 13, backgroundColor: C.white,
    "& fieldset": { borderColor: C.border },
    "&:hover fieldset": { borderColor: C.blue },
    "&.Mui-focused fieldset": { borderColor: C.blue },
  },
  "& .MuiInputLabel-root.Mui-focused": { color: C.blue },
};

export default function OutletFilter({ filters, onChange }) {
  const { locations } = useLocations();
  const { divisions } = useDivisions();

  const activeCount = [filters.keyword, filters.locationId, filters.divisionId, filters.outletType].filter(Boolean).length;
  const handleReset = () => onChange({ keyword: "", locationId: "", divisionId: "", outletType: "" });

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
        <TextField placeholder="Search by name, code or owner..." size="small" value={filters.keyword}
          onChange={(e) => onChange({ ...filters, keyword: e.target.value })}
          sx={{ ...fieldSx, minWidth: 240 }}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 16, color: C.slateMid }} /></InputAdornment> }} />
        <FormControl size="small" sx={{ ...fieldSx, minWidth: 150 }}>
          <InputLabel>Location</InputLabel>
          <Select value={filters.locationId} label="Location"
            onChange={(e) => onChange({ ...filters, locationId: e.target.value })}
            sx={{ borderRadius: 2, fontSize: 13 }}>
            <MenuItem value=""><em>All Locations</em></MenuItem>
            {locations.map((l) => <MenuItem key={l.id} value={l.id}>{l.name}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ ...fieldSx, minWidth: 150 }}>
          <InputLabel>Division</InputLabel>
          <Select value={filters.divisionId} label="Division"
            onChange={(e) => onChange({ ...filters, divisionId: e.target.value })}
            sx={{ borderRadius: 2, fontSize: 13 }}>
            <MenuItem value=""><em>All Divisions</em></MenuItem>
            {divisions.map((d) => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ ...fieldSx, minWidth: 150 }}>
          <InputLabel>Outlet Type</InputLabel>
          <Select value={filters.outletType} label="Outlet Type"
            onChange={(e) => onChange({ ...filters, outletType: e.target.value })}
            sx={{ borderRadius: 2, fontSize: 13 }}>
            <MenuItem value=""><em>All Types</em></MenuItem>
            {OUTLET_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
          </Select>
        </FormControl>
      </Box>
    </Box>
  );
}

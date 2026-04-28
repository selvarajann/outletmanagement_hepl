import { useEffect, useState } from "react";
import { Box, TextField, MenuItem, Select, InputLabel, FormControl, InputAdornment, Button, Chip } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";
import CloseIcon from "@mui/icons-material/Close";
import { GetLocations } from "../../services/LocationService";
import { GetDivisions } from "../../services/DivisionService";
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
  const [locations, setLocations] = useState([]);
  const [divisions, setDivisions] = useState([]);

  useEffect(() => {
    GetLocations({ page: 0, size: 100 }).then((r) => setLocations(r.locations));
    GetDivisions({ page: 0, size: 100 }).then((r) => setDivisions(r.divisions));
  }, []);

  const activeCount = [filters.locationId, filters.divisionId, filters.outletType].filter(Boolean).length;

  const handleReset = () => onChange({ keyword: "", locationId: "", divisionId: "", outletType: "" });

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
        <TextField placeholder="Search by name, code or owner..." size="small" value={filters.keyword}
          onChange={(e) => onChange({ ...filters, keyword: e.target.value })}
          sx={{ ...fieldSx, minWidth: 240 }}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 16, color: C.slate }} /></InputAdornment> }} />

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

import { Box, TextField, MenuItem, Select, InputLabel, FormControl, InputAdornment, Button, Chip } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";
import CloseIcon from "@mui/icons-material/Close";
import { useOutlets } from "../../hooks/useMasterData";
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

export default function StockOrderFilter({ filters, onChange }) {
  const { outlets } = useOutlets();

  const activeCount = [filters.keyword, filters.outletId, filters.status, filters.fromDate, filters.toDate]
    .filter(Boolean).length;

  const handleReset = () => onChange({ keyword: "", outletId: "", status: "", fromDate: "", toDate: "" });

  return (
    <Box sx={{ p: 2, mb: 2.5, backgroundColor: C.white, border: `1px solid ${C.border}`, borderRadius: "14px", width: "100%" }}>
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
        <TextField placeholder="Search by order code..." size="small" value={filters.keyword}
          onChange={(e) => onChange({ ...filters, keyword: e.target.value })}
          sx={{ ...fieldSx, minWidth: 220 }}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 16, color: C.slateMid }} /></InputAdornment> }} />
        
        <FormControl size="small" sx={{ ...fieldSx, minWidth: 160 }}>
          <InputLabel>Outlet</InputLabel>
          <Select value={filters.outletId} label="Outlet"
            onChange={(e) => onChange({ ...filters, outletId: e.target.value })}
            sx={{ borderRadius: 2, fontSize: 13 }}>
            <MenuItem value=""><em>All Outlets</em></MenuItem>
            {outlets.map((o) => <MenuItem key={o.id} value={o.id}>{o.outletName}</MenuItem>)}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ ...fieldSx, minWidth: 140 }}>
          <InputLabel>Status</InputLabel>
          <Select value={filters.status} label="Status"
            onChange={(e) => onChange({ ...filters, status: e.target.value })}
            sx={{ borderRadius: 2, fontSize: 13 }}>
            <MenuItem value=""><em>All Statuses</em></MenuItem>
            <MenuItem value="PENDING">Pending</MenuItem>
            <MenuItem value="APPROVED">Approved</MenuItem>
            <MenuItem value="CANCELLED">Cancelled</MenuItem>
            <MenuItem value="FULFILLED">Fulfilled</MenuItem>
          </Select>
        </FormControl>

        <TextField label="From Date" size="small" type="date" value={filters.fromDate}
          onChange={(e) => onChange({ ...filters, fromDate: e.target.value })}
          sx={{ ...fieldSx, width: 150 }} InputLabelProps={{ shrink: true }} />

        <TextField label="To Date" size="small" type="date" value={filters.toDate}
          onChange={(e) => onChange({ ...filters, toDate: e.target.value })}
          sx={{ ...fieldSx, width: 150 }} InputLabelProps={{ shrink: true }} />
      </Box>
    </Box>
  );
}

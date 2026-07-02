import { Box, TextField, MenuItem, Select, InputLabel, FormControl, InputAdornment, Button, Chip } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";
import CloseIcon from "@mui/icons-material/Close";
import { useOutlets } from "../../hooks/useMasterData";
import { C } from "../../theme/colors";
import { filterFieldSx, filterWrapperSx } from "../../theme/styles";

export default function StockFilter({ filters, onChange }) {
  const { outlets } = useOutlets();
  const activeCount = [filters.keyword, filters.outletId].filter(Boolean).length;
  const handleReset = () => onChange({ keyword: "", outletId: "" });

  return (
    <Box sx={filterWrapperSx}>
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
        <TextField placeholder="Search product name or code..." size="small" value={filters.keyword}
          onChange={(e) => onChange({ ...filters, keyword: e.target.value })}
          sx={{ ...filterFieldSx, flexGrow: 1 }}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 16, color: C.slateMid }} /></InputAdornment> }} />
        
        <FormControl size="small" sx={{ ...filterFieldSx, minWidth: 200 }}>
          <InputLabel>Outlet</InputLabel>
          <Select value={filters.outletId} label="Outlet"
            onChange={(e) => onChange({ ...filters, outletId: e.target.value })}>
            <MenuItem value=""><em>All Outlets</em></MenuItem>
            {outlets.map((o) => <MenuItem key={o.id} value={o.id}>{o.outletName}</MenuItem>)}
          </Select>
        </FormControl>
      </Box>
    </Box>
  );
}

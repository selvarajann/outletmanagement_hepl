import { TextField, InputAdornment, Box } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { C } from "../../theme/colors";

export default function SearchFilter({ value, onChange, placeholder }) {
  return (
    <Box mb={2.5}>
      <TextField
        placeholder={placeholder || "Search..."}
        size="small"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        sx={{
          width: 320,
          "& .MuiOutlinedInput-root": {
            borderRadius: 2,
            backgroundColor: C.white,
            fontSize: 14,
            "& fieldset": { borderColor: C.border },
            "&:hover fieldset": { borderColor: C.blue },
            "&.Mui-focused fieldset": { borderColor: C.blue },
          },
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon sx={{ fontSize: 18, color: C.slate }} />
            </InputAdornment>
          ),
        }}
      />
    </Box>
  );
}

import { Box, IconButton, Typography, Chip } from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { C } from "../../theme/colors";

export default function TablePagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;
  return (
    <Box display="flex" justifyContent="flex-end" alignItems="center" gap={1} mt={2}>
      <Typography variant="caption" sx={{ color: C.slate, mr: 1 }}>
        Page {page + 1} of {totalPages}
      </Typography>
      <IconButton
        size="small"
        disabled={page === 0}
        onClick={() => onPageChange((p) => p - 1)}
        sx={{
          border: `1px solid ${C.border}`,
          borderRadius: 1.5,
          "&:hover": { backgroundColor: C.blueLight, borderColor: C.blue },
          "&.Mui-disabled": { opacity: 0.35 },
        }}
      >
        <ChevronLeftIcon fontSize="small" />
      </IconButton>
      {Array.from({ length: totalPages }, (_, i) => (
        <Chip
          key={i}
          label={i + 1}
          size="small"
          onClick={() => onPageChange(i)}
          sx={{
            cursor: "pointer",
            fontWeight: 600,
            fontSize: 12,
            height: 28,
            minWidth: 28,
            backgroundColor: i === page ? C.blue : C.white,
            color: i === page ? C.white : C.slate,
            border: `1px solid ${i === page ? C.blue : C.border}`,
            borderRadius: 1.5,
            "&:hover": { backgroundColor: i === page ? C.blueDark : C.blueLight },
          }}
        />
      ))}
      <IconButton
        size="small"
        disabled={page >= totalPages - 1}
        onClick={() => onPageChange((p) => p + 1)}
        sx={{
          border: `1px solid ${C.border}`,
          borderRadius: 1.5,
          "&:hover": { backgroundColor: C.blueLight, borderColor: C.blue },
          "&.Mui-disabled": { opacity: 0.35 },
        }}
      >
        <ChevronRightIcon fontSize="small" />
      </IconButton>
    </Box>
  );
}

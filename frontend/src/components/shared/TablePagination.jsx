import { Box, IconButton, Typography, Tooltip } from "@mui/material";
import KeyboardArrowLeftIcon from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import { C } from "../../theme/colors";

export default function TablePagination({ page: currentPage, totalPages, onPageChange }) {
  const handlePrev = () => onPageChange(Math.max(0, currentPage - 1));
  const handleNext = () => onPageChange(Math.min(totalPages - 1, currentPage + 1));

  // Handle large page counts by showing limited pages with ellipsis
  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 0; i < totalPages; i++) pages.push(i);
    } else {
      if (currentPage < 4) {
        pages.push(0, 1, 2, 3, 4, "...", totalPages - 1);
      } else if (currentPage > totalPages - 5) {
        pages.push(0, "...", totalPages - 5, totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1);
      } else {
        pages.push(0, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages - 1);
      }
    }
    return pages;
  };

  if (totalPages <= 1) return null;

  return (
    <Box
      sx={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        py: 2, px: 1, mt: 1,
      }}
    >
      <Typography sx={{ fontSize: "12.5px", color: C.slateMid, fontWeight: 500 }}>
        Page <span style={{ fontWeight: 700, color: C.navy }}>{currentPage + 1}</span> of{" "}
        <span style={{ fontWeight: 700, color: C.navy }}>{totalPages}</span>
      </Typography>

      <Box display="flex" alignItems="center" gap={1}>
        <Tooltip title="Previous Page">
          <span>
            <IconButton
              onClick={handlePrev} disabled={currentPage === 0}
              size="small"
              sx={{
                width: 32, height: 32, borderRadius: "8px", border: `1px solid ${C.border}`,
                "&:hover": { bgcolor: C.bgMuted },
                "&.Mui-disabled": { opacity: 0.5 },
              }}
            >
              <KeyboardArrowLeftIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </span>
        </Tooltip>

        <Box display="flex" alignItems="center" gap={0.5}>
          {getPageNumbers().map((page, idx) => {
            if (page === "...") {
              return <Typography key={`ellipsis-${idx}`} sx={{ color: C.muted, px: 1 }}>...</Typography>;
            }
            const isActive = page === currentPage;
            return (
              <Box
                key={page}
                onClick={() => onPageChange(page)}
                sx={{
                  minWidth: 32, height: 32, px: 1,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  borderRadius: "8px", cursor: "pointer",
                  fontSize: "13px", fontWeight: isActive ? 700 : 500,
                  transition: "all 0.2s ease",
                  ...(isActive
                    ? { bgcolor: C.navy, color: C.white, boxShadow: "0 2px 6px rgba(15,23,42,0.2)" }
                    : { color: C.slateMid, "&:hover": { bgcolor: C.bgMuted, color: C.navy } }
                  ),
                }}
              >
                {page + 1}
              </Box>
            );
          })}
        </Box>

        <Tooltip title="Next Page">
          <span>
            <IconButton
              onClick={handleNext} disabled={currentPage >= totalPages - 1}
              size="small"
              sx={{
                width: 32, height: 32, borderRadius: "8px", border: `1px solid ${C.border}`,
                "&:hover": { bgcolor: C.bgMuted },
                "&.Mui-disabled": { opacity: 0.5 },
              }}
            >
              <KeyboardArrowRightIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </span>
        </Tooltip>
      </Box>
    </Box>
  );
}

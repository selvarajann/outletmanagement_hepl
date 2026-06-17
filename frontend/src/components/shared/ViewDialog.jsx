import { Dialog, DialogContent, Button, Box, Typography, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { C } from "../../theme/colors";

/**
 * Premium ViewDialog
 */
export default function ViewDialog({ open, onClose, title, children, maxWidth = "sm" }) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={maxWidth}
      fullWidth
      PaperProps={{
        elevation: 0,
        sx: {
          borderRadius: "20px",
          overflow: "hidden",
          border: `1px solid ${C.border}`,
          boxShadow: "0 20px 60px rgba(15,23,42,0.12), 0 4px 16px rgba(15,23,42,0.06)",
        },
      }}
    >
      {/* ── Header ── */}
      <Box
        sx={{
          px: 3.5, py: 2.5,
          borderBottom: `1px solid ${C.border}`,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          bgcolor: C.white,
        }}
      >
        <Typography
          sx={{
            fontWeight: 800, fontSize: "16px", color: C.navy,
            letterSpacing: "-0.2px",
          }}
        >
          {title}
        </Typography>

        <IconButton
          onClick={onClose}
          size="small"
          sx={{
            color: C.slateMid, borderRadius: "10px", width: 34, height: 34,
            transition: "all 0.2s",
            "&:hover": { bgcolor: C.bgMuted, color: C.navy },
          }}
        >
          <CloseIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>

      {/* ── Body ── */}
      <DialogContent sx={{ px: 0, py: 0, bgcolor: C.white }}>
        <Box sx={{ px: 3.5, py: 2.5 }}>
          {children}
        </Box>
      </DialogContent>

      {/* ── Footer ── */}
      <Box
        sx={{
          px: 3.5, py: 2,
          borderTop: `1px solid ${C.border}`,
          display: "flex", justifyContent: "flex-end",
          bgcolor: C.bgMuted,
        }}
      >
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{
            textTransform: "none", borderRadius: "10px", fontWeight: 600,
            fontSize: "13px", borderColor: C.border, color: C.slateMid, px: 3,
            "&:hover": { borderColor: "#94a3b8", bgcolor: C.white, color: C.navy },
          }}
        >
          Close
        </Button>
      </Box>
    </Dialog>
  );
}

/**
 * Premium ViewRow
 */
export function ViewRow({ label, value }) {
  return (
    <Box
      display="flex"
      alignItems="flex-start"
      gap={2}
      py={1.75}
      sx={{
        borderBottom: `1px solid ${C.borderMuted}`,
        "&:last-child": { borderBottom: "none" },
      }}
    >
      {/* Label */}
      <Box sx={{ minWidth: 160, pt: 0.25 }}>
        <Typography
          sx={{
            fontSize: "11px", fontWeight: 600, color: C.slateMid,
            textTransform: "uppercase", letterSpacing: "0.8px",
          }}
        >
          {label}
        </Typography>
      </Box>

      {/* Value */}
      <Box sx={{ flex: 1 }}>
        <Typography sx={{ fontSize: "14px", color: C.navy, fontWeight: 500, lineHeight: 1.5 }}>
          {value ?? <span style={{ color: C.muted }}>—</span>}
        </Typography>
      </Box>
    </Box>
  );
}

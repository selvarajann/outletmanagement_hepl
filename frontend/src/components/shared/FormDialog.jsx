import { Dialog, DialogContent, Button, Box, Typography, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { C } from "../../theme/colors";
import { memo } from "react";
import ActionButton from "../common/ActionButton";

const paperProps = {
  elevation: 0,
  sx: {
    borderRadius: "20px",
    overflow: "hidden",
    border: `1px solid ${C.border}`,
    boxShadow: "0 20px 60px rgba(15,23,42,0.12), 0 4px 16px rgba(15,23,42,0.06)",
  },
};

/**
 * Premium FormDialog
 */
const FormDialog = memo(({ open, onClose, onSubmit, title, submitLabel, children, maxWidth = "sm", loading = false }) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={maxWidth}
      fullWidth
      PaperProps={paperProps}
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
      <DialogContent
        sx={{
          px: 3.5, py: 3,
          bgcolor: C.bgMuted,
          "& .MuiOutlinedInput-root": {
            borderRadius: "10px", bgcolor: C.white,
            transition: "all 0.2s",
            "&:hover": { boxShadow: "0 2px 8px rgba(15,23,42,0.04)" },
            "&.Mui-focused": { boxShadow: "0 4px 12px rgba(37,99,235,0.1)" },
          },
          "& .MuiInputLabel-root": { fontSize: "13px", fontWeight: 500, color: C.slateMid },
        }}
      >
        <Box display="flex" flexDirection="column" gap={2.5}>
          {children}
        </Box>
      </DialogContent>

      {/* ── Footer ── */}
      <Box
        sx={{
          px: 3.5, py: 2.5,
          borderTop: `1px solid ${C.border}`,
          display: "flex", justifyContent: "flex-end", gap: 1.5,
          bgcolor: C.white,
        }}
      >
        <Button
          onClick={onClose}
          disabled={loading}
          sx={{
            textTransform: "none", fontWeight: 600, color: C.slateMid,
            borderRadius: "10px", px: 3, py: 1, fontSize: "13.5px",
            "&:hover": { bgcolor: C.bgMuted, color: C.navy },
            transition: "all 0.2s",
          }}
        >
          Cancel
        </Button>
        <ActionButton
          onClick={onSubmit}
          loading={loading}
          variant="contained"
          disableElevation
          sx={{
            textTransform: "none", fontWeight: 700, borderRadius: "10px",
            px: 3, py: 1, fontSize: "13.5px",
            background: C.navy, color: C.white,
            boxShadow: "0 4px 12px rgba(15,23,42,0.2)",
            "&:hover": {
              background: "#1e293b",
              boxShadow: "0 6px 16px rgba(15,23,42,0.3)",
              transform: "translateY(-1px)",
            },
            transition: "all 0.2s",
          }}
        >
          {submitLabel}
        </ActionButton>
      </Box>
    </Dialog>
  );
});

export default FormDialog;

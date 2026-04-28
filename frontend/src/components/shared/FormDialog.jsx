import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { C } from "../../theme/colors";

export default function FormDialog({ open, onClose, onSubmit, title, submitLabel, children, maxWidth = "sm" }) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth={maxWidth} fullWidth
      PaperProps={{ sx: { borderRadius: 3, overflow: "hidden" } }}
    >
      {/* Header */}
      <Box sx={{
        px: 3, py: 2,
        backgroundColor: C.navy,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <Typography fontWeight="700" fontSize={15} color={C.white} letterSpacing={0.2}>
          {title}
        </Typography>
        <Button
          onClick={onClose} size="small" sx={{ minWidth: 0, p: 0.5, color: "#94a3b8", "&:hover": { color: C.white, backgroundColor: "transparent" } }}
        >
          <CloseIcon fontSize="small" />
        </Button>
      </Box>

      {/* Body */}
      <DialogContent sx={{ px: 3, py: 2.5, backgroundColor: C.white }}>
        <Box display="flex" flexDirection="column" gap={2} mt={0.5}>
          {children}
        </Box>
      </DialogContent>

      {/* Footer */}
      <Box sx={{ px: 3, py: 2, borderTop: `1px solid ${C.border}`, display: "flex", justifyContent: "flex-end", gap: 1.5, backgroundColor: C.surface }}>
        <Button
          onClick={onClose}
          sx={{ textTransform: "none", fontWeight: 600, color: C.slate, borderRadius: 2, border: `1px solid ${C.border}`, px: 2.5, "&:hover": { backgroundColor: C.slateLight } }}
        >
          Cancel
        </Button>
        <Button
          onClick={onSubmit}
          variant="contained"
          sx={{ textTransform: "none", fontWeight: 600, borderRadius: 2, px: 2.5, backgroundColor: C.blue, boxShadow: "none", "&:hover": { backgroundColor: C.blueDark, boxShadow: "none" } }}
        >
          {submitLabel}
        </Button>
      </Box>
    </Dialog>
  );
}

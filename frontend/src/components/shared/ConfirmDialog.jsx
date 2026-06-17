import { Dialog, DialogTitle, DialogContent, DialogActions, Typography, Button, Divider, IconButton, Box } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { C } from "../../theme/colors";

export default function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmText = "Confirm", cancelText = "Cancel", confirmColor = "primary" }) {
  const getConfirmColor = () => {
    switch (confirmColor) {
      case "error": return { bg: C.red, hover: C.redDark };
      case "warning": return { bg: C.amber, hover: "#d97706" };
      case "success": return { bg: C.emerald, hover: "#059669" };
      default: return { bg: C.blue, hover: C.blueDark };
    }
  };

  const colorConfig = getConfirmColor();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3, border: `1px solid ${C.border}` } }}
    >
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pb: 1, pt: 2.5, px: 3 }}>
        <Box display="flex" alignItems="center" gap={1.5}>
          {confirmColor === "error" && <WarningAmberIcon sx={{ color: C.red }} />}
          <Typography fontWeight={800} fontSize={16} color={C.navy}>
            {title}
          </Typography>
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ color: C.slate }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      
      <Divider />
      
      <DialogContent sx={{ px: 3, py: 3 }}>
        <Typography fontSize={14} color={C.slate}>
          {message}
        </Typography>
      </DialogContent>

      <Divider />
      
      <DialogActions sx={{ px: 3, py: 1.5, gap: 1 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          size="small"
          sx={{ textTransform: "none", borderRadius: 2, borderColor: C.border, color: C.slate, "&:hover": { borderColor: C.slate } }}
        >
          {cancelText}
        </Button>
        <Button
          onClick={() => {
            onConfirm();
            onClose();
          }}
          variant="contained"
          size="small"
          sx={{
            textTransform: "none",
            borderRadius: 2,
            fontWeight: 700,
            backgroundColor: colorConfig.bg,
            boxShadow: "none",
            "&:hover": { backgroundColor: colorConfig.hover, boxShadow: "none" },
          }}
        >
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

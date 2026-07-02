import { Box, Typography, Button } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { C } from "../../theme/colors";

import { memo } from "react";

export default memo(function PageHeader({ title, subtitle, onAdd, addLabel }) {
  return (
    <Box mb={3}>
      <Box
        sx={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          bgcolor: C.white, border: `1px solid ${C.border}`,
          borderRadius: "14px", p: 2.5, pl: 0,
          boxShadow: "0 1px 4px rgba(15,23,42,0.04)",
          overflow: "hidden", position: "relative",
        }}
      >
        {/* Accent bar */}
        <Box sx={{ width: 3, alignSelf: "stretch", background: C.grad.primary, borderRadius: "0 3px 3px 0", mr: 2.5, flexShrink: 0 }} />

        <Box flex={1} minWidth={0}>
          <Typography sx={{ fontSize: "10px", fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: "0.8px", mb: 0.4 }}>
            Management
          </Typography>
          <Typography sx={{ fontWeight: 800, fontSize: "1.2rem", color: C.navy, letterSpacing: "-0.3px", lineHeight: 1.2 }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography sx={{ fontSize: "12.5px", color: C.slateMid, mt: 0.3 }}>{subtitle}</Typography>
          )}
        </Box>

        {onAdd && (
          <Button
            variant="contained"
            startIcon={<AddIcon sx={{ fontSize: "16px !important" }} />}
            onClick={onAdd}
            sx={{
              background: C.grad.primary,
              borderRadius: "9px",
              fontWeight: 700,
              textTransform: "none",
              px: 2.25, py: 0.875,
              fontSize: "13px",
              boxShadow: "0 4px 12px rgba(37,99,235,0.28)",
              ml: 2, flexShrink: 0,
              "&:hover": {
                background: "linear-gradient(135deg, #1d4ed8 0%, #4338ca 100%)",
                boxShadow: "0 6px 18px rgba(37,99,235,0.38)",
                transform: "translateY(-1px)",
              },
              transition: "all 0.2s ease",
            }}
          >
            {addLabel}
          </Button>
        )}
      </Box>
    </Box>
  );
});

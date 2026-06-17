import { Paper, Box, Typography } from "@mui/material";
import { C } from "../../theme/colors";

const InfoCard = ({ title, value, icon, color, bgColor }) => (
  <Paper
    elevation={0}
    className="card-enter"
    sx={{
      borderRadius: "14px",
      bgcolor: "#fff",
      border: `1px solid ${C.border}`,
      overflow: "hidden",
      position: "relative",
      transition: "transform 0.22s cubic-bezier(0.4,0,0.2,1), box-shadow 0.22s ease",
      "&:hover": {
        transform: "translateY(-4px)",
        boxShadow: `0 16px 40px ${color}14, 0 4px 12px rgba(15,23,42,0.07)`,
      },
    }}
  >
    {/* Top accent bar */}
    <Box
      sx={{
        height: 3,
        background: `linear-gradient(90deg, ${color} 0%, ${color}60 100%)`,
        position: "absolute", top: 0, left: 0, right: 0,
      }}
    />

    {/* Ambient background circle */}
    <Box
      sx={{
        position: "absolute", top: -16, right: -16,
        width: 80, height: 80, borderRadius: "50%",
        background: `${color}10`, pointerEvents: "none",
      }}
    />

    <Box sx={{ p: 2.25, pt: 2.75, display: "flex", alignItems: "center", gap: 2, position: "relative" }}>
      {/* Icon */}
      <Box
        sx={{
          width: 46, height: 46, borderRadius: "12px", flexShrink: 0,
          bgcolor: `${color}15`,
          display: "flex", alignItems: "center", justifyContent: "center",
          "& svg": { fontSize: "22px !important", color: `${color} !important` },
        }}
      >
        {icon}
      </Box>

      {/* Text */}
      <Box minWidth={0} flex={1}>
        <Typography
          sx={{
            fontSize: "10.5px", fontWeight: 600, color: C.muted,
            textTransform: "uppercase", letterSpacing: "0.8px", mb: 0.5,
          }}
        >
          {title}
        </Typography>
        <Typography
          sx={{
            fontWeight: 800, fontSize: "clamp(1.3rem,2.5vw,1.65rem)",
            color: C.navy, letterSpacing: "-0.4px", lineHeight: 1.1,
          }}
        >
          {value}
        </Typography>
      </Box>
    </Box>
  </Paper>
);

import { memo } from "react";

export default memo(InfoCard);

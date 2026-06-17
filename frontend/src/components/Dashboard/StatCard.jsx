import { Box, Paper, Typography } from "@mui/material";
import TrendingUpIcon   from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import { C } from "../../theme/colors";

/**
 * Premium KPI StatCard
 * – White card with soft shadow + top accent bar
 * – Coloured icon in a tinted square container
 * – Bold navy value, muted label
 * – Trend indicator with arrow
 * – Smooth lift-on-hover
 */
const StatCard = ({ title, value, icon, accentColor, bgColor, trend, trendUp }) => (
  <Paper
    elevation={0}
    className="card-enter"
    sx={{
      borderRadius: "14px",
      bgcolor: "#fff",
      border: `1px solid ${C.border}`,
      overflow: "hidden",
      position: "relative",
      cursor: "default",
      transition: "transform 0.22s cubic-bezier(0.4,0,0.2,1), box-shadow 0.22s ease",
      "&:hover": {
        transform: "translateY(-4px)",
        boxShadow: `0 16px 40px ${accentColor}14, 0 4px 12px rgba(15,23,42,0.07)`,
      },
    }}
  >
    {/* Top accent bar */}
    <Box
      sx={{
        height: 3,
        background: `linear-gradient(90deg, ${accentColor} 0%, ${accentColor}60 100%)`,
        position: "absolute", top: 0, left: 0, right: 0,
      }}
    />

    {/* Ambient background circle */}
    <Box
      sx={{
        position: "absolute", top: -16, right: -16,
        width: 80, height: 80, borderRadius: "50%",
        background: bgColor, opacity: 0.5, pointerEvents: "none",
      }}
    />

    <Box sx={{ p: 2.5, pt: 3 }}>
      <Box display="flex" alignItems="flex-start" justifyContent="space-between">
        {/* Text */}
        <Box flex={1} minWidth={0} pr={1.5}>
          <Typography
            sx={{
              fontSize: "10.5px", fontWeight: 600, color: C.muted,
              textTransform: "uppercase", letterSpacing: "0.8px", mb: 0.75,
            }}
          >
            {title}
          </Typography>
          <Typography
            noWrap
            sx={{
              fontSize: "clamp(1.3rem,2.5vw,1.65rem)",
              fontWeight: 800, color: C.navy,
              letterSpacing: "-0.4px", lineHeight: 1.1, mb: 1,
            }}
          >
            {value}
          </Typography>

          {trend !== undefined && (
            <Box display="flex" alignItems="center" gap={0.5}>
              {trendUp === true  && <TrendingUpIcon   sx={{ fontSize: 13, color: C.emerald }} />}
              {trendUp === false && <TrendingDownIcon sx={{ fontSize: 13, color: C.rose }} />}
              <Typography sx={{ fontSize: "11px", fontWeight: 600, color: trendUp === false ? C.rose : trendUp === true ? C.emerald : C.muted }}>
                {trend}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Icon */}
        <Box
          sx={{
            width: 46, height: 46, borderRadius: "12px", flexShrink: 0,
            bgcolor: bgColor,
            display: "flex", alignItems: "center", justifyContent: "center",
            "& svg": { fontSize: "22px !important", color: `${accentColor} !important` },
          }}
        >
          {icon}
        </Box>
      </Box>
    </Box>
  </Paper>
);

import { memo } from "react";

export default memo(StatCard);

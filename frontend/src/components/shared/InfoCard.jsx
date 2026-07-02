import { Card, CardContent, Box, Typography } from "@mui/material";
import TrendingUpIcon   from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import { C } from "../../theme/colors";

const InfoCard = ({ title, value, icon, color, accentColor, bgColor, trend, trendUp }) => {
  const actualColor = accentColor || color;
  const actualBg = bgColor || `color-mix(in srgb, ${actualColor} 15%, transparent)`;

  return (
    <Card
      className="card-enter"
      sx={{
        borderRadius: "14px",
        bgcolor: C.white,
        border: `1px solid ${C.border}`,
        overflow: "hidden",
        position: "relative",
        cursor: "default",
        transition: "transform 0.22s cubic-bezier(0.4,0,0.2,1), box-shadow 0.22s ease",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: `0 16px 40px color-mix(in srgb, ${actualColor} 14%, transparent), 0 4px 12px rgba(15,23,42,0.07)`,
        },
      }}
    >
      <Box sx={{ position: "absolute", top: -20, right: -20, width: 100, height: 100, borderRadius: "50%", background: actualBg, opacity: 0.4, pointerEvents: "none" }} />

      <CardContent sx={{ p: 2.5, pt: 3, "&:last-child": { pb: 2.5 } }}>
        <Box display="flex" alignItems="flex-start" justifyContent="space-between">
          <Box flex={1} minWidth={0} pr={1.5}>
            <Typography sx={{ fontSize: "10.5px", fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: "0.8px", mb: 0.75 }}>
              {title}
            </Typography>
            <Typography noWrap sx={{ fontSize: "clamp(1.3rem,2.5vw,1.65rem)", fontWeight: 800, color: C.navy, letterSpacing: "-0.4px", lineHeight: 1.1, mb: 1 }}>
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

          <Box
            sx={{
              display: "flex", alignItems: "center", justifyContent: "center",
              mt: 1, mr: 1, // slight margin to center it perfectly inside the ambient circle visually
              "& svg": { fontSize: "26px !important", color: `${actualColor} !important` },
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

import { memo } from "react";

export default memo(InfoCard);

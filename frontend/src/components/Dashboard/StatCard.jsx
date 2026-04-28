import { Box, Paper, Typography, Chip } from "@mui/material";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";

const StatCard = ({ title, value, icon, accentColor, bgColor, trend }) => {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 3,
        backgroundColor: "#ffffff",
        border: "1px solid #e2e8f0",
        borderLeft: `4px solid ${accentColor}`,
        position: "relative",
        overflow: "hidden",
        transition: "transform 0.2s, box-shadow 0.2s",
        "&:hover": {
          transform: "translateY(-3px)",
          boxShadow: `0 8px 24px ${accentColor}22`,
        },
      }}
    >
      {/* Tinted background blob */}
      <Box sx={{
        position: "absolute", top: -16, right: -16,
        width: 90, height: 90, borderRadius: "50%",
        backgroundColor: bgColor, opacity: 0.6,
      }} />

      <Box display="flex" justifyContent="space-between" alignItems="flex-start" position="relative">
        <Box>
          <Typography
            variant="caption"
            sx={{ color: "#64748b", fontWeight: 600, letterSpacing: 0.7, textTransform: "uppercase", fontSize: 10 }}
          >
            {title}
          </Typography>
          <Typography variant="h5" fontWeight="800" color="#0f172a" mt={0.5} lineHeight={1.2}>
            {value}
          </Typography>
          {trend !== undefined && (
            <Chip
              icon={<TrendingUpIcon sx={{ fontSize: "13px !important", color: `${accentColor} !important` }} />}
              label={trend}
              size="small"
              sx={{
                mt: 1.5,
                backgroundColor: bgColor,
                color: accentColor,
                fontWeight: 600,
                fontSize: 10,
                border: "none",
                height: 22,
              }}
            />
          )}
        </Box>

        <Box sx={{
          backgroundColor: bgColor,
          borderRadius: 2.5,
          p: 1.25,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}>
          <Box sx={{ color: accentColor, display: "flex" }}>{icon}</Box>
        </Box>
      </Box>
    </Paper>
  );
};

export default StatCard;

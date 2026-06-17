import { Paper, Typography, Box, Avatar, Divider, Button, Chip } from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { useNavigate } from "react-router-dom";
import { C } from "../../theme/colors";

const SummaryCard = ({ title, icon, iconColor, items = [], path, renderItem }) => {
  const navigate = useNavigate();

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: "14px",
        border: `1px solid ${C.border}`,
        overflow: "hidden",
        bgcolor: "#fff",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        transition: "box-shadow 0.22s ease, transform 0.22s ease",
        "&:hover": {
          transform: "translateY(-3px)",
          boxShadow: "0 12px 32px rgba(15,23,42,0.08)",
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px: 2.5, py: 1.75,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          bgcolor: C.bgMuted,
          borderBottom: `1px solid ${C.border}`,
        }}
      >
        <Box display="flex" alignItems="center" gap={1.25}>
          <Box
            sx={{
              width: 30, height: 30, borderRadius: "8px", flexShrink: 0,
              bgcolor: `${iconColor}18`,
              display: "flex", alignItems: "center", justifyContent: "center",
              "& svg": { fontSize: "15px !important", color: `${iconColor} !important` },
            }}
          >
            {icon}
          </Box>
          <Typography sx={{ fontWeight: 700, fontSize: "13.5px", color: C.navy }}>
            {title}
          </Typography>
        </Box>
        <Chip
          label={items.length}
          size="small"
          sx={{
            height: 20, minWidth: 28,
            bgcolor: `${iconColor}12`,
            color: iconColor,
            fontWeight: 700, fontSize: "11px",
            border: `1px solid ${iconColor}20`,
            borderRadius: "6px",
          }}
        />
      </Box>

      {/* Items */}
      <Box sx={{ flexGrow: 1, overflow: "hidden" }}>
        {items.length === 0 ? (
          <Box py={6} textAlign="center">
            <Typography sx={{ fontSize: "13px", color: C.muted }}>No records</Typography>
          </Box>
        ) : (
          items.slice(0, 5).map((item, i) => (
            <Box key={item.id || i}>
              <Box
                sx={{
                  pl: 2.5, pr: 2.5,
                  position: "relative",
                  transition: "bgcolor 0.15s",
                  "&:hover": { bgcolor: C.bgMuted },
                  "&::before": {
                    content: '""',
                    position: "absolute",
                    left: 10, top: 0, bottom: 0, width: 2,
                    bgcolor: i === 0 ? iconColor : `${iconColor}30`,
                    borderRadius: "1px",
                  },
                  "&::after": {
                    content: '""',
                    position: "absolute",
                    left: 7, top: "50%", transform: "translateY(-50%)",
                    width: 8, height: 8, borderRadius: "50%",
                    bgcolor: i === 0 ? iconColor : `${iconColor}50`,
                    border: "2px solid #fff",
                    boxShadow: i === 0 ? `0 0 6px ${iconColor}50` : "none",
                  },
                }}
              >
                {renderItem(item)}
              </Box>
              {i < Math.min(items.length, 5) - 1 && (
                <Divider sx={{ borderColor: C.borderMuted, ml: 2.5 }} />
              )}
            </Box>
          ))
        )}
      </Box>

      {/* Footer */}
      <Box sx={{ px: 2.5, py: 1.5, borderTop: `1px solid ${C.border}`, bgcolor: C.bgMuted, mt: "auto" }}>
        <Button
          size="small"
          endIcon={<ArrowForwardIcon sx={{ fontSize: "13px !important", transition: "transform 0.2s" }} />}
          onClick={() => navigate(path)}
          sx={{
            fontWeight: 600, textTransform: "none", fontSize: "12px",
            color: iconColor, p: 0, minWidth: 0,
            "&:hover": {
              bgcolor: "transparent", color: C.navy,
              "& .MuiButton-endIcon": { transform: "translateX(4px)" },
            },
          }}
        >
          View All
        </Button>
      </Box>
    </Paper>
  );
};

import { memo } from "react";

export default memo(SummaryCard);

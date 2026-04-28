import { Paper, Typography, Box, Avatar, Divider, Button, Chip } from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { useNavigate } from "react-router-dom";

const SummaryCard = ({ title, icon, iconColor, items = [], path, renderItem }) => {
  const navigate = useNavigate();
  return (
    <Paper
      elevation={0}
      sx={{ borderRadius: 3, border: "1px solid #e2e8f0", overflow: "hidden", height: "100%", backgroundColor: "#ffffff" }}
    >
      {/* Header */}
      <Box sx={{
        px: 3, py: 2,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        backgroundColor: "#f8fafc",
        borderBottom: "1px solid #e2e8f0",
      }}>
        <Box display="flex" alignItems="center" gap={1.5}>
          <Avatar sx={{ backgroundColor: iconColor, width: 32, height: 32, borderRadius: 1.5 }}>
            {icon}
          </Avatar>
          <Typography fontWeight="700" fontSize={14} color="#0f172a" letterSpacing={0.1}>
            {title}
          </Typography>
        </Box>
        <Chip
          label={`${items.length}`}
          size="small"
          sx={{ backgroundColor: "#e2e8f0", color: "#475569", fontWeight: 700, fontSize: 11, height: 20, minWidth: 28 }}
        />
      </Box>

      {/* Items */}
      <Box sx={{ px: 1, py: 0.5 }}>
        {items.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: "center", color: "#94a3b8" }}>
            No records found
          </Typography>
        ) : (
          items.slice(0, 5).map((item, i) => (
            <Box key={item.id || i}>
              {renderItem(item)}
              {i < Math.min(items.length, 5) - 1 && (
                <Divider sx={{ borderColor: "#f1f5f9" }} />
              )}
            </Box>
          ))
        )}
      </Box>

      {/* Footer */}
      <Box sx={{ px: 3, py: 1.5, borderTop: "1px solid #e2e8f0", backgroundColor: "#f8fafc" }}>
        <Button
          size="small"
          endIcon={<ArrowForwardIcon sx={{ fontSize: 14 }} />}
          onClick={() => navigate(path)}
          sx={{
            fontWeight: 600,
            textTransform: "none",
            fontSize: 12,
            color: "#0050e6",
            p: 0,
            "&:hover": { backgroundColor: "transparent", textDecoration: "underline" },
          }}
        >
          View All {title}
        </Button>
      </Box>
    </Paper>
  );
};

export default SummaryCard;

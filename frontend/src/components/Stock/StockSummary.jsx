import { Box, Typography, Grid, Paper } from "@mui/material";
import InventoryIcon from "@mui/icons-material/Inventory";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import PaymentsIcon from "@mui/icons-material/Payments";
import { C } from "../../theme/colors";

const SummaryCard = ({ title, value, subtitle, icon: Icon, color }) => (
  <Paper sx={{ p: 2, borderRadius: 3, border: `1px solid ${C.border}`, boxShadow: "none" }}>
    <Box display="flex" justifyContent="space-between" alignItems="flex-start">
      <Box>
        <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 700, textTransform: "uppercase" }}>{title}</Typography>
        <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5, color: C.slate }}>{value}</Typography>
        <Typography variant="caption" sx={{ color: color, fontWeight: 600 }}>{subtitle}</Typography>
      </Box>
      <Box sx={{ p: 1, borderRadius: 2, backgroundColor: `${color}15`, color: color }}>
        <Icon />
      </Box>
    </Box>
  </Paper>
);

export default function StockSummary({ summary }) {
  if (!summary) return null;

  // Calculate totals across all outlets if needed, or just show list
  const totalStockValue = summary.reduce((sum, s) => sum + (s.totalStockValue || 0), 0);
  const totalLowStock = summary.reduce((sum, s) => sum + (s.outOfStockItems || 0), 0);

  return (
    <Grid container spacing={2} mb={3}>
      <Grid item xs={12} md={4}>
        <SummaryCard title="Total Stock Value" value={`₹${totalStockValue.toLocaleString()}`} 
          subtitle="Across all outlets" icon={PaymentsIcon} color={C.blue} />
      </Grid>
      <Grid item xs={12} md={4}>
        <SummaryCard title="Low Stock Items" value={totalLowStock} 
          subtitle="Items with 0 quantity" icon={WarningAmberIcon} color={C.red} />
      </Grid>
      <Grid item xs={12} md={4}>
        <SummaryCard title="Active Outlets" value={summary.length} 
          subtitle="Outlets with inventory" icon={InventoryIcon} color={C.teal} />
      </Grid>
    </Grid>
  );
}

import React from "react";
import { C } from "../theme/colors";
import { Box, Grid, Typography, CircularProgress } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import GppBadOutlinedIcon from "@mui/icons-material/GppBadOutlined";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import SyncProblemOutlinedIcon from "@mui/icons-material/SyncProblemOutlined";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import PageHeader from "../components/shared/PageHeader";
import InfoCard from "../components/shared/InfoCard";
import EnterpriseTable from "../components/shared/EnterpriseTable";
import { getDashboardSummary, getLowStock, getExpiringSoon } from "../services/DashboardService";

const AnalyticsDashboard = () => {
  const { data: summary, isLoading: loadingSummary } = useQuery({
    queryKey: ["dashboardSummary"],
    queryFn: ({ signal }) => getDashboardSummary(signal),
  });

  const { data: lowStock } = useQuery({
    queryKey: ["lowStock"],
    queryFn: ({ signal }) => getLowStock(signal),
  });

  const { data: expiringSoon } = useQuery({
    queryKey: ["expiringSoon"],
    queryFn: ({ signal }) => getExpiringSoon(30, signal),
  });

  if (loadingSummary) {
    return <Box display="flex" justifyContent="center" mt={4}><CircularProgress /></Box>;
  }

  const lowStockColumns = [
    { key: "productCode", label: "Product Code", flex: 1 },
    { key: "productName", label: "Product Name", flex: 2 },
    { key: "outletName", label: "Outlet", flex: 1 },
    { key: "currentQuantity", label: "Quantity", flex: 1 },
  ];

  const expiringColumns = [
    { key: "productCode", label: "Product Code", flex: 1 },
    { key: "productName", label: "Product Name", flex: 2 },
    { key: "expiryDate", label: "Expiry Date", flex: 1 },
    { key: "remainingQuantity", label: "Remaining Qty", flex: 1 },
    { key: "daysUntilExpiry", label: "Days Left", flex: 1 },
  ];

  return (
    <Box sx={{ p: 3, backgroundColor: C.surface, minHeight: "100vh" }}>
      <PageHeader title="Analytics Dashboard" subtitle="System Health and Integration Metrics" />
      
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={4}>
          <InfoCard title="Total Active Stock" value={summary?.totalActiveStock || 0} icon={<Inventory2OutlinedIcon />} color={C.blue} />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <InfoCard title="Low Stock Alerts" value={summary?.lowStockAlerts || 0} icon={<WarningAmberOutlinedIcon />} color={C.amber} />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <InfoCard title="Quarantined Items" value={summary?.quarantinedBatchItems || 0} icon={<GppBadOutlinedIcon />} color={C.rose} />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <InfoCard title="Pending Shipments" value={summary?.pendingShipments || 0} icon={<LocalShippingOutlinedIcon />} color={C.indigo} />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <InfoCard title="Sync Failures" value={summary?.syncFailures || 0} icon={<SyncProblemOutlinedIcon />} color={C.red} />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <InfoCard title="Dead Letters" value={summary?.deadLetterCount || 0} icon={<MailOutlineIcon />} color={C.violet} />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Typography variant="h6" mb={2} sx={{ fontSize: 16, fontWeight: 800, color: C.navy }}>Low Stock Items</Typography>
          <Box height={400} sx={{ backgroundColor: C.white, borderRadius: 3, border: `1px solid ${C.border}`, overflow: 'auto' }}>
            <EnterpriseTable 
              data={lowStock || []} 
              columns={lowStockColumns} 
            />
          </Box>
        </Grid>
        <Grid item xs={12} md={6}>
          <Typography variant="h6" mb={2} sx={{ fontSize: 16, fontWeight: 800, color: C.navy }}>Expiring Soon (30 Days)</Typography>
          <Box height={400} sx={{ backgroundColor: C.white, borderRadius: 3, border: `1px solid ${C.border}`, overflow: 'auto' }}>
            <EnterpriseTable 
              data={expiringSoon || []} 
              columns={expiringColumns} 
            />
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AnalyticsDashboard;

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Grid, Typography, Box, Avatar, Chip,
  Paper, LinearProgress, Skeleton, Divider
} from "@mui/material";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import StoreIcon from "@mui/icons-material/Store";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import CategoryIcon from "@mui/icons-material/Category";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import CurrencyRupeeIcon from "@mui/icons-material/CurrencyRupee";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";

import { GetProducts } from "../services/ProductService";
import { GetOutlets } from "../services/OutletService";
import { GetLocations } from "../services/LocationService";
import { GetDivisions } from "../services/DivisionService";
import StatCard from "../components/Dashboard/StatCard";
import SummaryCard from "../components/Dashboard/SummaryCard";

// ── Enterprise color tokens (IBM Carbon / Salesforce Lightning inspired) ──
const C = {
  navy:        "#0f172a",   // page headings
  blue:        "#0050e6",   // IBM Blue — primary brand
  blueDark:    "#003ab3",
  blueLight:   "#e8f0fe",
  teal:        "#0e7490",   // SAP Teal — secondary
  tealLight:   "#e0f2f7",
  emerald:     "#047857",   // profit / positive
  emeraldLight:"#d1fae5",
  amber:       "#b45309",   // cost / caution
  amberLight:  "#fef3c7",
  slate:       "#475569",
  slateLight:  "#f1f5f9",
  border:      "#e2e8f0",
  white:       "#ffffff",
  surface:     "#f8fafc",
};

const QuickNavCard = ({ label, icon, bgColor, iconBg, count, onClick }) => (
  <Paper
    elevation={0}
    onClick={onClick}
    sx={{
      p: 2.5, borderRadius: 3, cursor: "pointer",
      border: `1px solid ${C.border}`,
      display: "flex", alignItems: "center", gap: 2,
      backgroundColor: C.white,
      transition: "all 0.2s",
      "&:hover": {
        borderColor: bgColor,
        backgroundColor: bgColor + "0d",
        transform: "translateY(-2px)",
        boxShadow: `0 6px 20px ${bgColor}22`,
      },
    }}
  >
    <Avatar sx={{ backgroundColor: iconBg, width: 46, height: 46, borderRadius: 2.5 }}>
      {icon}
    </Avatar>
    <Box>
      <Typography variant="h6" fontWeight="700" color={C.navy}>{count ?? "—"}</Typography>
      <Typography variant="caption" sx={{ color: C.slate, fontWeight: 600, letterSpacing: 0.3 }}>{label}</Typography>
    </Box>
  </Paper>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [outlets, setOutlets] = useState([]);
  const [locations, setLocations] = useState([]);
  const [divisions, setDivisions] = useState([]);

  useEffect(() => {
    Promise.all([
      GetProducts({ page: 0, size: 1000 }),
      GetOutlets({ page: 0, size: 1000 }),
      GetLocations({ page: 0, size: 1000 }),
      GetDivisions({ page: 0, size: 1000 }),
    ]).then(([p, o, l, d]) => {
      setProducts(p.products);
      setOutlets(o.outlets);
      setLocations(l.locations);
      setDivisions(d.divisions);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const totalSelling  = products.reduce((s, p) => s + (p.sellingPrice  || 0), 0);
  const totalPurchase = products.reduce((s, p) => s + (p.purchasePrice || 0), 0);
  const profit  = totalSelling - totalPurchase;
  const margin  = totalSelling > 0 ? ((profit / totalSelling) * 100).toFixed(1) : 0;
  const costPct = totalSelling > 0 ? ((totalPurchase / totalSelling) * 100).toFixed(1) : 0;

  const fmt = (n) => `₹${Number(n).toLocaleString("en-IN")}`;

  const statCards = [
    {
      title: "Total Products",
      value: loading ? "—" : products.length,
      icon: <Inventory2Icon sx={{ color: C.white, fontSize: 26 }} />,
      accentColor: C.blue,
      bgColor: C.blueLight,
      trend: "Products in catalog",
    },
    {
      title: "Total Selling Amount",
      value: loading ? "—" : fmt(totalSelling),
      icon: <TrendingUpIcon sx={{ color: C.white, fontSize: 26 }} />,
      accentColor: C.teal,
      bgColor: C.tealLight,
      trend: "Revenue potential",
    },
    {
      title: "Total Purchase Amount",
      value: loading ? "—" : fmt(totalPurchase),
      icon: <AccountBalanceWalletIcon sx={{ color: C.white, fontSize: 26 }} />,
      accentColor: C.amber,
      bgColor: C.amberLight,
      trend: "Cost of inventory",
    },
    {
      title: "Gross Profit",
      value: loading ? "—" : fmt(profit),
      icon: <ShowChartIcon sx={{ color: C.white, fontSize: 26 }} />,
      accentColor: C.emerald,
      bgColor: C.emeraldLight,
      trend: `${margin}% margin`,
    },
  ];

  return (
    <Box sx={{ backgroundColor: C.surface, minHeight: "100vh" }}>

      {/* ── Page Header ── */}
      <Box mb={4}>
        <Typography variant="h5" fontWeight="800" color={C.navy} letterSpacing={-0.3}>
          Dashboard
        </Typography>
        <Typography variant="body2" sx={{ color: C.slate, mt: 0.5 }}>
          Welcome back — here's your outlet management overview.
        </Typography>
      </Box>

      {/* ── Stat Cards ── */}
      <Grid container spacing={3} mb={4}>
        {statCards.map((card) => (
          <Grid item xs={12} sm={6} lg={3} key={card.title}>
            {loading
              ? <Skeleton variant="rounded" height={128} sx={{ borderRadius: 3 }} />
              : <StatCard {...card} />}
          </Grid>
        ))}
      </Grid>

      {/* ── Quick Navigation ── */}
      <Box mb={1.5} display="flex" alignItems="center" gap={1}>
        <Typography variant="subtitle2" fontWeight="700" color={C.navy} sx={{ textTransform: "uppercase", letterSpacing: 0.8, fontSize: 11 }}>
          Quick Navigation
        </Typography>
        <Divider sx={{ flex: 1, borderColor: C.border }} />
      </Box>
      <Grid container spacing={2} mb={4}>
        {[
          { label: "Products",  icon: <Inventory2Icon sx={{ color: C.white, fontSize: 20 }} />, bgColor: C.blue,    iconBg: C.blue,    count: products.length,  path: "/products"  },
          { label: "Outlets",   icon: <StoreIcon       sx={{ color: C.white, fontSize: 20 }} />, bgColor: C.teal,    iconBg: C.teal,    count: outlets.length,   path: "/outlets"   },
          { label: "Locations", icon: <LocationOnIcon  sx={{ color: C.white, fontSize: 20 }} />, bgColor: C.amber,   iconBg: C.amber,   count: locations.length, path: "/locations" },
          { label: "Divisions", icon: <CategoryIcon    sx={{ color: C.white, fontSize: 20 }} />, bgColor: C.emerald, iconBg: C.emerald, count: divisions.length, path: "/divisions" },
        ].map((item) => (
          <Grid item xs={6} sm={3} key={item.label}>
            {loading
              ? <Skeleton variant="rounded" height={78} sx={{ borderRadius: 3 }} />
              : <QuickNavCard {...item} onClick={() => navigate(item.path)} />}
          </Grid>
        ))}
      </Grid>

      {/* ── Profit Margin Bar ── */}
      {!loading && totalSelling > 0 && (
        <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: `1px solid ${C.border}`, mb: 4, backgroundColor: C.white }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Box display="flex" alignItems="center" gap={1}>
              <Box sx={{ width: 4, height: 18, borderRadius: 2, backgroundColor: C.blue }} />
              <Typography fontWeight="700" fontSize={14} color={C.navy}>Profit Margin Overview</Typography>
            </Box>
            <Box display="flex" gap={1}>
              <Chip
                icon={<ArrowUpwardIcon sx={{ fontSize: "12px !important", color: `${C.emerald} !important` }} />}
                label={`${margin}% margin`}
                size="small"
                sx={{ backgroundColor: C.emeraldLight, color: C.emerald, fontWeight: 700, fontSize: 11 }}
              />
            </Box>
          </Box>

          <Grid container spacing={3} mb={2}>
            {[
              { label: "Selling Revenue", value: fmt(totalSelling), color: C.teal,    bg: C.tealLight    },
              { label: "Purchase Cost",   value: fmt(totalPurchase), color: C.amber,   bg: C.amberLight   },
              { label: "Gross Profit",    value: fmt(profit),        color: C.emerald, bg: C.emeraldLight },
            ].map((m) => (
              <Grid item xs={12} sm={4} key={m.label}>
                <Box sx={{ p: 2, borderRadius: 2, backgroundColor: m.bg }}>
                  <Typography variant="caption" sx={{ color: C.slate, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, fontSize: 10 }}>
                    {m.label}
                  </Typography>
                  <Typography variant="h6" fontWeight="800" sx={{ color: m.color, mt: 0.3 }}>{m.value}</Typography>
                </Box>
              </Grid>
            ))}
          </Grid>

          <Box display="flex" justifyContent="space-between" mb={0.75}>
            <Typography variant="caption" sx={{ color: C.slate }}>Cost ratio: {costPct}%</Typography>
            <Typography variant="caption" sx={{ color: C.slate }}>Profit ratio: {margin}%</Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={Math.min(Number(costPct), 100)}
            sx={{
              height: 8, borderRadius: 4,
              backgroundColor: C.emeraldLight,
              "& .MuiLinearProgress-bar": { backgroundColor: C.amber, borderRadius: 4 },
            }}
          />
          <Box display="flex" justifyContent="space-between" mt={0.75}>
            <Typography variant="caption" sx={{ color: C.amber, fontWeight: 600 }}>Cost</Typography>
            <Typography variant="caption" sx={{ color: C.emerald, fontWeight: 600 }}>Profit</Typography>
          </Box>
        </Paper>
      )}

      {/* ── Summary Cards ── */}
      <Box mb={1.5} display="flex" alignItems="center" gap={1}>
        <Typography variant="subtitle2" fontWeight="700" color={C.navy} sx={{ textTransform: "uppercase", letterSpacing: 0.8, fontSize: 11 }}>
          Recent Records
        </Typography>
        <Divider sx={{ flex: 1, borderColor: C.border }} />
      </Box>

      <Grid container spacing={3}>
        {/* Outlets */}
        <Grid item xs={12} md={6}>
          {loading ? <Skeleton variant="rounded" height={320} sx={{ borderRadius: 3 }} /> : (
            <SummaryCard
              title="Recent Outlets" icon={<StoreIcon sx={{ fontSize: 17 }} />}
              iconColor={C.teal} items={outlets} path="/outlets"
              renderItem={(o) => (
                <Box display="flex" alignItems="center" justifyContent="space-between" py={1} px={1}>
                  <Box display="flex" alignItems="center" gap={1.5}>
                    <Avatar sx={{ width: 34, height: 34, fontSize: 13, fontWeight: 700, backgroundColor: C.teal }}>
                      {o.outletName?.[0]?.toUpperCase()}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" fontWeight="600" color={C.navy} lineHeight={1.3}>{o.outletName}</Typography>
                      <Typography variant="caption" sx={{ color: C.slate }}>{o.locationName || "—"}</Typography>
                    </Box>
                  </Box>
                  <Chip label={o.outletType || "—"} size="small"
                    sx={{ fontSize: 10, fontWeight: 600, backgroundColor: C.tealLight, color: C.teal, border: "none" }} />
                </Box>
              )}
            />
          )}
        </Grid>

        {/* Products */}
        <Grid item xs={12} md={6}>
          {loading ? <Skeleton variant="rounded" height={320} sx={{ borderRadius: 3 }} /> : (
            <SummaryCard
              title="Recent Products" icon={<Inventory2Icon sx={{ fontSize: 17 }} />}
              iconColor={C.blue} items={products} path="/products"
              renderItem={(p) => (
                <Box display="flex" alignItems="center" justifyContent="space-between" py={1} px={1}>
                  <Box display="flex" alignItems="center" gap={1.5}>
                    <Avatar sx={{ width: 34, height: 34, fontSize: 13, fontWeight: 700, backgroundColor: C.blue }}>
                      {p.name?.[0]?.toUpperCase()}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" fontWeight="600" color={C.navy} lineHeight={1.3}>{p.name}</Typography>
                      <Typography variant="caption" sx={{ color: C.slate }}>{p.productCode || "—"}</Typography>
                    </Box>
                  </Box>
                  <Box textAlign="right">
                    <Typography variant="caption" fontWeight="700" sx={{ color: C.emerald, display: "block" }}>
                      {fmt(p.sellingPrice || 0)}
                    </Typography>
                    <Typography variant="caption" sx={{ color: C.slate }}>
                      Cost: {fmt(p.purchasePrice || 0)}
                    </Typography>
                  </Box>
                </Box>
              )}
            />
          )}
        </Grid>

        {/* Locations */}
        <Grid item xs={12} md={6}>
          {loading ? <Skeleton variant="rounded" height={280} sx={{ borderRadius: 3 }} /> : (
            <SummaryCard
              title="Locations" icon={<LocationOnIcon sx={{ fontSize: 17 }} />}
              iconColor={C.amber} items={locations} path="/locations"
              renderItem={(l) => (
                <Box display="flex" alignItems="center" gap={1.5} py={1} px={1}>
                  <Avatar sx={{ width: 34, height: 34, fontSize: 13, fontWeight: 700, backgroundColor: C.amber }}>
                    {l.name?.[0]?.toUpperCase()}
                  </Avatar>
                  <Box>
                    <Typography variant="body2" fontWeight="600" color={C.navy}>{l.name}</Typography>
                    {l.description && <Typography variant="caption" sx={{ color: C.slate }}>{l.description}</Typography>}
                  </Box>
                </Box>
              )}
            />
          )}
        </Grid>

        {/* Divisions */}
        <Grid item xs={12} md={6}>
          {loading ? <Skeleton variant="rounded" height={280} sx={{ borderRadius: 3 }} /> : (
            <SummaryCard
              title="Divisions" icon={<CategoryIcon sx={{ fontSize: 17 }} />}
              iconColor={C.emerald} items={divisions} path="/divisions"
              renderItem={(d) => (
                <Box display="flex" alignItems="center" justifyContent="space-between" py={1} px={1}>
                  <Box display="flex" alignItems="center" gap={1.5}>
                    <Avatar sx={{ width: 34, height: 34, fontSize: 13, fontWeight: 700, backgroundColor: C.emerald }}>
                      {d.name?.[0]?.toUpperCase()}
                    </Avatar>
                    <Typography variant="body2" fontWeight="600" color={C.navy}>{d.name}</Typography>
                  </Box>
                  {d.products?.length > 0 && (
                    <Chip label={`${d.products.length} products`} size="small"
                      sx={{ fontSize: 10, fontWeight: 600, backgroundColor: C.emeraldLight, color: C.emerald }} />
                  )}
                </Box>
              )}
            />
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;

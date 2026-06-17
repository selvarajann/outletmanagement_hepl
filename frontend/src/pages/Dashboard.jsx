import { useMemo, memo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Grid, Typography, Box, Avatar, Chip,
  Paper, Skeleton, Divider, LinearProgress,
} from "@mui/material";
import Inventory2Icon           from "@mui/icons-material/Inventory2";
import StoreIcon                from "@mui/icons-material/Store";
import LocationOnIcon           from "@mui/icons-material/LocationOn";
import CategoryIcon             from "@mui/icons-material/Category";
import TrendingUpIcon           from "@mui/icons-material/TrendingUp";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import ShowChartIcon            from "@mui/icons-material/ShowChart";
import ArrowUpwardIcon          from "@mui/icons-material/ArrowUpward";
import ArrowForwardIcon         from "@mui/icons-material/ArrowForward";
import CalendarTodayIcon        from "@mui/icons-material/CalendarToday";
import StoreMallDirectoryIcon   from "@mui/icons-material/StoreMallDirectory";
import SpeedIcon                from "@mui/icons-material/Speed";

import { useQuery }                             from "@tanstack/react-query";
import { GetProducts }                          from "../services/ProductService";
import { useDivisions, useLocations, useOutlets } from "../hooks/useMasterData";
import { C }                                    from "../theme/colors";
import StatCard                                 from "../components/Dashboard/StatCard";
import SummaryCard                              from "../components/Dashboard/SummaryCard";

const fmt = (n) => `₹${Number(n).toLocaleString("en-IN")}`;

/* ── Section label ── */
const SectionLabel = memo(({ label }) => (
  <Box display="flex" alignItems="center" gap={1.25} mb={2}>
    <Box sx={{ width: 2.5, height: 16, borderRadius: 2, bgcolor: C.blue, flexShrink: 0 }} />
    <Typography sx={{ fontSize: "11px", fontWeight: 700, color: C.slateMid, textTransform: "uppercase", letterSpacing: "1px" }}>
      {label}
    </Typography>
    <Box sx={{ flex: 1, height: 1, bgcolor: C.border }} />
  </Box>
));

/* ── Quick stat pill (in hero) ── */
const HeroPill = memo(({ label, value, color, bg }) => (
  <Box sx={{
    px: 2, py: 1.25, borderRadius: "10px",
    bgcolor: bg, border: `1px solid ${color}20`,
    textAlign: "center", minWidth: 100,
  }}>
    <Typography sx={{ fontSize: "16px", fontWeight: 800, color, lineHeight: 1 }}>{value}</Typography>
    <Typography sx={{ fontSize: "9.5px", fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: "0.7px", mt: 0.3 }}>{label}</Typography>
  </Box>
));

/* ── Quick nav tile ── */
const NavTile = memo(({ label, count, icon, accentColor, bg, onClick }) => (
  <Paper
    elevation={0}
    onClick={onClick}
    sx={{
      p: 2.5, borderRadius: "12px", cursor: "pointer",
      border: `1px solid ${C.border}`, bgcolor: "#fff",
      display: "flex", alignItems: "center", gap: 2,
      transition: "all 0.2s ease",
      "&:hover": {
        borderColor: accentColor,
        boxShadow: `0 8px 24px ${accentColor}14`,
        transform: "translateY(-3px)",
        "& .tile-arrow": { opacity: 1, transform: "translateX(0)" },
      },
    }}
  >
    <Box sx={{
      width: 44, height: 44, borderRadius: "11px",
      bgcolor: bg, flexShrink: 0,
      display: "flex", alignItems: "center", justifyContent: "center",
      "& svg": { fontSize: "20px !important", color: `${accentColor} !important` },
    }}>
      {icon}
    </Box>
    <Box flex={1} minWidth={0}>
      <Typography sx={{ fontSize: "20px", fontWeight: 800, color: C.navy, lineHeight: 1, letterSpacing: "-0.5px" }}>{count ?? "—"}</Typography>
      <Typography sx={{ fontSize: "11.5px", fontWeight: 500, color: C.slateMid, mt: 0.25 }}>{label}</Typography>
    </Box>
    <ArrowForwardIcon className="tile-arrow" sx={{ color: accentColor, fontSize: 16, opacity: 0, transform: "translateX(-6px)", transition: "all 0.2s ease" }} />
  </Paper>
));

/* ── Metric box inside analytics panel ── */
const MetricBox = memo(({ label, value, color, bg }) => (
  <Box sx={{ p: 2, borderRadius: "10px", bgcolor: bg, border: `1px solid ${color}18` }}>
    <Typography sx={{ fontSize: "10px", fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.8px", mb: 0.5 }}>{label}</Typography>
    <Typography sx={{ fontSize: "1.1rem", fontWeight: 800, color, letterSpacing: "-0.3px" }}>{value}</Typography>
  </Box>
));

/* ═══════════════════════════════════════════════════════════
   Dashboard Page
═══════════════════════════════════════════════════════════ */
const todayStr = new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

const Dashboard = () => {
  const navigate = useNavigate();

  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ["master", "products"],
    queryFn: () => GetProducts({ page: 0, size: 1000 }).then((r) => r.products),
  });
  const { outlets,   loading: outletsLoading   } = useOutlets();
  const { locations, loading: locationsLoading } = useLocations();
  const { divisions, loading: divisionsLoading } = useDivisions();
  const loading = productsLoading || outletsLoading || locationsLoading || divisionsLoading;

  const totalSelling  = useMemo(() => products.reduce((s, p) => s + (p.sellingPrice  || 0), 0), [products]);
  const totalPurchase = useMemo(() => products.reduce((s, p) => s + (p.purchasePrice || 0), 0), [products]);
  const profit  = totalSelling - totalPurchase;
  const margin  = totalSelling > 0 ? ((profit / totalSelling) * 100).toFixed(1) : 0;
  const costPct = totalSelling > 0 ? ((totalPurchase / totalSelling) * 100).toFixed(1) : 0;

  const statCards = useMemo(() => [
    { title: "Total Products",    value: loading ? "—" : products.length,       icon: <Inventory2Icon />,           accentColor: C.blue,    bgColor: C.blueLight,    trend: "In catalog",      trendUp: true  },
    { title: "Gross Revenue",     value: loading ? "—" : fmt(totalSelling),     icon: <TrendingUpIcon />,           accentColor: C.teal,    bgColor: C.tealLight,    trend: "Selling value",   trendUp: true  },
    { title: "Purchase Cost",     value: loading ? "—" : fmt(totalPurchase),    icon: <AccountBalanceWalletIcon />, accentColor: C.amber,   bgColor: C.amberLight,   trend: "Cost of goods"               },
    { title: "Gross Profit",      value: loading ? "—" : fmt(profit),           icon: <ShowChartIcon />,            accentColor: C.emerald, bgColor: C.emeraldLight, trend: `${margin}% margin`, trendUp: true },
  ], [loading, products.length, totalSelling, totalPurchase, profit, margin]);

  const navTiles = useMemo(() => [
    { label: "Products",  count: products.length,  icon: <Inventory2Icon />, accentColor: C.blue,    bg: C.blueLight,    path: "/products"  },
    { label: "Outlets",   count: outlets.length,   icon: <StoreIcon />,      accentColor: C.teal,    bg: C.tealLight,    path: "/outlets"   },
    { label: "Locations", count: locations.length, icon: <LocationOnIcon />, accentColor: C.amber,   bg: C.amberLight,   path: "/locations" },
    { label: "Divisions", count: divisions.length, icon: <CategoryIcon />,   accentColor: C.emerald, bg: C.emeraldLight, path: "/divisions" },
  ], [products.length, outlets.length, locations.length, divisions.length]);

  return (
    <Box sx={{ minHeight: "100vh" }}>

      {/* ── Hero Header ─────────────────────────────────────────────────────── */}
      <Paper
        elevation={0}
        sx={{
          mb: 3,
          borderRadius: "16px",
          border: `1px solid ${C.border}`,
          background: "linear-gradient(135deg, #ffffff 0%, #f5f8ff 50%, #f0f4ff 100%)",
          p: { xs: 2.5, sm: 3 },
          position: "relative", overflow: "hidden",
          boxShadow: "0 2px 12px rgba(37,99,235,0.06)",
        }}
      >
        {/* Subtle background orbs */}
        <Box sx={{ position: "absolute", top: -30, right: -20, width: 150, height: 150, borderRadius: "50%", background: "radial-gradient(circle, rgba(37,99,235,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />
        <Box sx={{ position: "absolute", bottom: -20, left: "30%", width: 100, height: 100, borderRadius: "50%", background: "radial-gradient(circle, rgba(79,70,229,0.05) 0%, transparent 70%)", pointerEvents: "none" }} />

        <Box display="flex" alignItems={{ xs: "flex-start", sm: "center" }} justifyContent="space-between" flexDirection={{ xs: "column", sm: "row" }} gap={2} position="relative">
          <Box display="flex" alignItems="center" gap={2}>
            <Box sx={{
              width: 48, height: 48, borderRadius: "13px",
              background: C.grad.primary,
              boxShadow: "0 6px 18px rgba(37,99,235,0.22)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <StoreMallDirectoryIcon sx={{ fontSize: 24, color: "#fff" }} />
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 800, fontSize: { xs: "1.2rem", sm: "1.45rem" }, color: C.navy, letterSpacing: "-0.4px", lineHeight: 1.2 }}>
                Business Overview
              </Typography>
              <Box display="flex" alignItems="center" gap={0.75} mt={0.4}>
                <CalendarTodayIcon sx={{ fontSize: 11, color: C.muted }} />
                <Typography sx={{ fontSize: "12px", color: C.muted }}>{todayStr}</Typography>
              </Box>
            </Box>
          </Box>

          <Box display="flex" gap={1} flexWrap="wrap">
            {loading ? [80,80,80].map((w,i) => <Skeleton key={i} variant="rounded" width={w} height={56} sx={{ borderRadius: "10px" }} />) : (
              <>
                <HeroPill label="Outlets"      value={outlets.length}  color={C.teal}    bg={C.tealLight}    />
                <HeroPill label="Products"     value={products.length} color={C.blue}    bg={C.blueLight}    />
                <HeroPill label="Margin"       value={`${margin}%`}   color={C.emerald} bg={C.emeraldLight} />
              </>
            )}
          </Box>
        </Box>
      </Paper>

      {/* ── KPI Cards ───────────────────────────────────────────────────────── */}
      <SectionLabel label="Key Metrics" />
      <Grid container spacing={2} mb={3.5}>
        {statCards.map((card) => (
          <Grid item xs={12} sm={6} lg={3} key={card.title}>
            {loading
              ? <Skeleton variant="rounded" height={130} sx={{ borderRadius: "14px" }} />
              : <StatCard {...card} />}
          </Grid>
        ))}
      </Grid>

      {/* ── Quick Navigation ─────────────────────────────────────────────────── */}
      <SectionLabel label="Quick Access" />
      <Grid container spacing={2} mb={3.5}>
        {navTiles.map((tile) => (
          <Grid item xs={12} sm={6} md={3} key={tile.label}>
            {loading
              ? <Skeleton variant="rounded" height={84} sx={{ borderRadius: "12px" }} />
              : <NavTile {...tile} onClick={() => navigate(tile.path)} />}
          </Grid>
        ))}
      </Grid>

      {/* ── Financial Analytics ──────────────────────────────────────────────── */}
      {!loading && totalSelling > 0 && (
        <>
          <SectionLabel label="Financial Analytics" />
          <Paper elevation={0} sx={{ borderRadius: "14px", border: `1px solid ${C.border}`, overflow: "hidden", mb: 3.5, bgcolor: "#fff", boxShadow: "0 2px 8px rgba(15,23,42,0.04)" }}>
            {/* Panel header */}
            <Box sx={{ px: 2.5, py: 1.75, bgcolor: C.bgMuted, borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Box display="flex" alignItems="center" gap={1.25}>
                <Box sx={{ width: 28, height: 28, borderRadius: "7px", bgcolor: C.emeraldLight, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <SpeedIcon sx={{ fontSize: 15, color: C.emerald }} />
                </Box>
                <Typography sx={{ fontWeight: 700, fontSize: "13.5px", color: C.navy }}>Profit Margin Overview</Typography>
              </Box>
              <Chip
                icon={<ArrowUpwardIcon sx={{ fontSize: "11px !important", color: `${C.emerald} !important` }} />}
                label={`${margin}% Margin`}
                size="small"
                sx={{ bgcolor: C.emeraldLight, color: C.emerald, fontWeight: 700, fontSize: "11px", border: `1px solid ${C.emerald}20`, height: 24 }}
              />
            </Box>

            <Box sx={{ p: 2.5 }}>
              <Grid container spacing={2} mb={2.5}>
                <Grid item xs={12} sm={4}><MetricBox label="Selling Revenue" value={fmt(totalSelling)}  color={C.teal}    bg={C.tealLight}    /></Grid>
                <Grid item xs={12} sm={4}><MetricBox label="Purchase Cost"   value={fmt(totalPurchase)} color={C.amber}   bg={C.amberLight}   /></Grid>
                <Grid item xs={12} sm={4}><MetricBox label="Gross Profit"    value={fmt(profit)}        color={C.emerald} bg={C.emeraldLight} /></Grid>
              </Grid>

              {/* Progress bar */}
              <Box display="flex" justifyContent="space-between" mb={0.75}>
                <Typography sx={{ fontSize: "11px", fontWeight: 600, color: C.slateMid }}>
                  Cost: <Box component="span" sx={{ color: C.amber }}>{costPct}%</Box>
                </Typography>
                <Typography sx={{ fontSize: "11px", fontWeight: 600, color: C.slateMid }}>
                  Profit: <Box component="span" sx={{ color: C.emerald }}>{margin}%</Box>
                </Typography>
              </Box>
              <Box sx={{ height: 8, borderRadius: "6px", bgcolor: C.emeraldLight, overflow: "hidden" }}>
                <Box sx={{
                  height: "100%", borderRadius: "6px",
                  width: `${Math.min(Number(costPct), 100)}%`,
                  background: C.grad.amber,
                  transition: "width 1.2s cubic-bezier(0.4,0,0.2,1)",
                }} />
              </Box>
              <Box display="flex" justifyContent="space-between" mt={0.75}>
                <Typography sx={{ fontSize: "10.5px", fontWeight: 600, color: C.amber }}>● Cost</Typography>
                <Typography sx={{ fontSize: "10.5px", fontWeight: 600, color: C.emerald }}>● Profit</Typography>
              </Box>
            </Box>
          </Paper>
        </>
      )}

      {/* ── Recent Records ───────────────────────────────────────────────────── */}
      <SectionLabel label="Recent Records" />
      <Grid container spacing={2.5}>

        <Grid item xs={12} md={6}>
          {loading ? <Skeleton variant="rounded" height={320} sx={{ borderRadius: "14px" }} /> : (
            <SummaryCard title="Recent Outlets" icon={<StoreIcon />} iconColor={C.teal} items={outlets} path="/outlets"
              renderItem={(o) => (
                <Box display="flex" alignItems="center" justifyContent="space-between" py={1.25} pl={2.5} pr={2}>
                  <Box display="flex" alignItems="center" gap={1.5}>
                    <Avatar sx={{ width: 32, height: 32, fontSize: "12px", fontWeight: 700, bgcolor: C.tealLight, color: C.teal, borderRadius: "8px" }}>
                      {o.outletName?.[0]?.toUpperCase()}
                    </Avatar>
                    <Box>
                      <Typography sx={{ fontSize: "13px", fontWeight: 600, color: C.navy, lineHeight: 1.3 }}>{o.outletName}</Typography>
                      <Typography sx={{ fontSize: "11px", color: C.muted }}>{o.locationName || "—"}</Typography>
                    </Box>
                  </Box>
                  <Chip label={o.outletType || "—"} size="small" sx={{ fontSize: "10px", fontWeight: 600, bgcolor: C.tealLight, color: C.teal, borderRadius: "5px", height: 20 }} />
                </Box>
              )}
            />
          )}
        </Grid>

        <Grid item xs={12} md={6}>
          {loading ? <Skeleton variant="rounded" height={320} sx={{ borderRadius: "14px" }} /> : (
            <SummaryCard title="Recent Products" icon={<Inventory2Icon />} iconColor={C.blue} items={products} path="/products"
              renderItem={(p) => (
                <Box display="flex" alignItems="center" justifyContent="space-between" py={1.25} pl={2.5} pr={2}>
                  <Box display="flex" alignItems="center" gap={1.5}>
                    <Avatar sx={{ width: 32, height: 32, fontSize: "12px", fontWeight: 700, bgcolor: C.blueLight, color: C.blue, borderRadius: "8px" }}>
                      {p.name?.[0]?.toUpperCase()}
                    </Avatar>
                    <Box>
                      <Typography sx={{ fontSize: "13px", fontWeight: 600, color: C.navy, lineHeight: 1.3 }}>{p.name}</Typography>
                      <Typography sx={{ fontSize: "11px", color: C.muted }}>{p.productCode || "—"}</Typography>
                    </Box>
                  </Box>
                  <Box textAlign="right">
                    <Typography sx={{ fontSize: "12px", fontWeight: 700, color: C.emerald, display: "block" }}>{fmt(p.sellingPrice || 0)}</Typography>
                    <Typography sx={{ fontSize: "10.5px", color: C.muted }}>Cost: {fmt(p.purchasePrice || 0)}</Typography>
                  </Box>
                </Box>
              )}
            />
          )}
        </Grid>

        <Grid item xs={12} md={6}>
          {loading ? <Skeleton variant="rounded" height={280} sx={{ borderRadius: "14px" }} /> : (
            <SummaryCard title="Locations" icon={<LocationOnIcon />} iconColor={C.amber} items={locations} path="/locations"
              renderItem={(l) => (
                <Box display="flex" alignItems="center" gap={1.5} py={1.25} pl={2.5} pr={2}>
                  <Avatar sx={{ width: 32, height: 32, fontSize: "12px", fontWeight: 700, bgcolor: C.amberLight, color: C.amber, borderRadius: "8px" }}>
                    {l.name?.[0]?.toUpperCase()}
                  </Avatar>
                  <Typography sx={{ fontSize: "13px", fontWeight: 600, color: C.navy }}>{l.name}</Typography>
                </Box>
              )}
            />
          )}
        </Grid>

        <Grid item xs={12} md={6}>
          {loading ? <Skeleton variant="rounded" height={280} sx={{ borderRadius: "14px" }} /> : (
            <SummaryCard title="Divisions" icon={<CategoryIcon />} iconColor={C.emerald} items={divisions} path="/divisions"
              renderItem={(d) => (
                <Box display="flex" alignItems="center" justifyContent="space-between" py={1.25} pl={2.5} pr={2}>
                  <Box display="flex" alignItems="center" gap={1.5}>
                    <Avatar sx={{ width: 32, height: 32, fontSize: "12px", fontWeight: 700, bgcolor: C.emeraldLight, color: C.emerald, borderRadius: "8px" }}>
                      {d.name?.[0]?.toUpperCase()}
                    </Avatar>
                    <Typography sx={{ fontSize: "13px", fontWeight: 600, color: C.navy }}>{d.name}</Typography>
                  </Box>
                  {d.products?.length > 0 && (
                    <Chip label={`${d.products.length} products`} size="small" sx={{ fontSize: "10px", fontWeight: 600, bgcolor: C.emeraldLight, color: C.emerald, borderRadius: "5px", height: 20 }} />
                  )}
                </Box>
              )}
            />
          )}
        </Grid>

      </Grid>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <Box mt={4} sx={{ borderTop: `1px solid ${C.border}`, pt: 2, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 1 }}>
        <Typography sx={{ fontSize: "11.5px", color: C.muted, fontWeight: 500 }}>Outlet Management System</Typography>
        <Typography sx={{ fontSize: "11px", color: C.muted }}>© {new Date().getFullYear()} · All rights reserved</Typography>
      </Box>

    </Box>
  );
};

export default Dashboard;

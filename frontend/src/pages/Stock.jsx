import { useState, useRef, useEffect, useCallback } from "react";
import { Box, CircularProgress, Typography, Chip, Grid, Skeleton } from "@mui/material";
import WarehouseIcon from "@mui/icons-material/Warehouse";
import StoreIcon from "@mui/icons-material/Store";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import InfoCard from "../components/shared/InfoCard";
import { toast } from "react-toastify";
import PageHeader from "../components/shared/PageHeader";
import StockFilter from "../components/Stock/StockFilter";
import StockTable from "../components/Stock/StockTable";
import StockSummary from "../components/Stock/StockSummary";
import StockPagination from "../components/Stock/StockPagination";
import ViewDialog, { ViewRow } from "../components/shared/ViewDialog";
import { GetStock, GetStockSummary } from "../services/StockService";
import usePaginatedFetch from "../hooks/usePaginatedFetch";
import { C } from "../theme/colors";

const emptyFilters = { keyword: "", outletId: "" };

export default function Stock() {
  const debounceTimer = useRef(null);
  const [page, setPage] = useState(0);
  const [filters, setFilters] = useState(emptyFilters);
  const [debouncedFilters, setDebouncedFilters] = useState(emptyFilters);
  const [summary, setSummary] = useState([]);
  const [viewItem, setViewItem] = useState(null);

  const fetchStock = useCallback((params, signal) =>
    GetStock(params, signal)
  , []);
  const { rows, totalPages, loading } = usePaginatedFetch(fetchStock, { page, filters: debouncedFilters });

  useEffect(() => {
    const controller = new AbortController();
    GetStockSummary(controller.signal)
      .then(setSummary)
      .catch((err) => {
        if (err.name !== "CanceledError" && err.code !== "ERR_CANCELED") toast.error("Failed to load stock summary");
      });
    return () => controller.abort();
  }, []); // fetch once on mount, not on every rows change

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => { setDebouncedFilters(newFilters); setPage(0); }, 500);
  };

  const totalQty = rows.reduce((s, r) => s + (r.quantity || 0), 0);
  const lowStock = rows.filter((r) => r.quantity <= 10).length;
  const uniqueOutlets = [...new Set(rows.map((r) => r.outletName).filter(Boolean))].length;

  const cards = [
    { title: "Total Products", value: rows.length, icon: <Inventory2Icon sx={{ color: C.white, fontSize: 22 }} />, color: C.blue, bgColor: C.blue },
    { title: "Total Quantity", value: totalQty, icon: <WarehouseIcon sx={{ color: C.white, fontSize: 22 }} />, color: C.teal, bgColor: C.teal },
    { title: "Outlets Tracked", value: uniqueOutlets, icon: <StoreIcon sx={{ color: C.white, fontSize: 22 }} />, color: C.emerald, bgColor: C.emerald },
    { title: "Low Stock Items", value: lowStock, icon: <WarningAmberIcon sx={{ color: C.white, fontSize: 22 }} />, color: C.red, bgColor: C.red },
  ];

  return (
    <Box sx={{ p: 3, backgroundColor: C.surface, minHeight: "100vh" }}>
      <PageHeader title="Stock Inventory" subtitle="Real-time outlet-wise stock ledger" />
      {!loading && (
        <Grid container spacing={2.5} mb={3}>
          {cards.map((c) => (
            <Grid item xs={12} sm={6} lg={3} key={c.title}>
              <InfoCard {...c} />
            </Grid>
          ))}
        </Grid>
      )}
      {loading && <Grid container spacing={2.5} mb={3}>{[0,1,2,3].map((i) => <Grid item xs={12} sm={6} lg={3} key={i}><Skeleton variant="rounded" height={82} sx={{ borderRadius: 3 }} /></Grid>)}</Grid>}
      <StockSummary summary={summary} />
      <StockFilter filters={filters} onChange={handleFilterChange} />

      {loading ? (
        <Box display="flex" justifyContent="center" py={10}><CircularProgress /></Box>
      ) : rows.length > 0 ? (
        <>
          <StockTable stock={rows} onView={setViewItem} />
          <StockPagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      ) : (
        <Box sx={{ p: 10, textAlign: "center", backgroundColor: C.white, borderRadius: 3, border: `1px dashed ${C.border}` }}>
          <Typography color="textSecondary">No inventory found</Typography>
        </Box>
      )}

      <ViewDialog open={!!viewItem} onClose={() => setViewItem(null)} title="Stock Details">
        {viewItem && (
          <>
            <ViewRow label="Product"      value={viewItem.productName} />
            <ViewRow label="Product Code" value={viewItem.productCode} />
            <ViewRow label="Division"     value={viewItem.divisionName} />
            <ViewRow label="Outlet"       value={viewItem.outletName} />
            <ViewRow label="Quantity"     value={
              <Chip label={viewItem.quantity} size="small"
                sx={{ fontWeight: 700, backgroundColor: viewItem.quantity > 10 ? "#f1f5f9" : "#fef2f2", color: viewItem.quantity > 10 ? "#475569" : C.red }} />
            } />
            <ViewRow label="Last Batch"   value={<Chip label={viewItem.lastBatchCode} size="small" sx={{ fontSize: 11, backgroundColor: C.blueLight, color: C.blue }} />} />
            <ViewRow label="Last Updated" value={new Date(viewItem.lastUpdatedAt).toLocaleString()} />
          </>
        )}
      </ViewDialog>
    </Box>
  );
}

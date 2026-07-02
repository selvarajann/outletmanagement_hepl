import { useState, useRef, useCallback } from "react";
import { Box, CircularProgress, Typography, Chip, Grid, Skeleton } from "@mui/material";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import CurrencyRupeeIcon from "@mui/icons-material/CurrencyRupee";
import InfoCard from "../components/shared/InfoCard";
import { toast } from "react-toastify";
import PageHeader from "../components/shared/PageHeader";
import BatchFilter from "../components/Batches/BatchFilter";
import BatchTable from "../components/Batches/BatchTable";
import TablePagination from "../components/shared/TablePagination";
import BatchPriceEditDialog from "../components/Batches/BatchPriceEditDialog";
import BatchItemsDialog from "../components/Batches/BatchItemsDialog";
import BatchReceiveDialog from "../components/Batches/BatchReceiveDialog";
import ViewDialog, { ViewRow } from "../components/shared/ViewDialog";
import { GetBatches, GetBatchById, ReceiveBatch, CancelBatch, UpdateBatchPrices } from "../services/BatchService";
import usePaginatedFetch from "../hooks/usePaginatedFetch";
import ConfirmDialog from "../components/shared/ConfirmDialog";
import { C } from "../theme/colors";

const emptyFilters = { keyword: "", outletId: "", status: "", fromDate: "", toDate: "" };

const statusColors = {
  PENDING_RECEIPT: { bg: "#fffbeb", text: "#92400e" },
  PROCESSING:      { bg: "#fffbeb", text: "#92400e" }, // legacy
  RECEIVED:        { bg: "#ecfdf5", text: "#065f46" },
  DELIVERED:       { bg: "#ecfdf5", text: "#065f46" }, // legacy
  CANCELLED:       { bg: "#fef2f2", text: "#991b1b" },
};

export default function Batch() {
  const debounceTimer = useRef(null);
  const [page, setPage] = useState(0);
  const [filters, setFilters] = useState(emptyFilters);
  const [debouncedFilters, setDebouncedFilters] = useState(emptyFilters);

  // Price edit dialog
  const [priceOpen, setPriceOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [priceItems, setPriceItems] = useState([]);

  // Receive dialog
  const [receiveOpen, setReceiveOpen] = useState(false);
  const [deleteMode, setDeleteMode] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [batchToCancel, setBatchToCancel] = useState(null);
  const [receiveBatch, setReceiveBatch] = useState(null);
  const [dateMap, setDateMap] = useState({});
  const [receiving, setReceiving] = useState(false);

  const [viewItem, setViewItem] = useState(null);
  const [itemsDialogBatch, setItemsDialogBatch] = useState(null);
  const [itemsLoading, setItemsLoading] = useState(false);

  const fetchBatches = useCallback((params, signal) => {
    const finalParams = { ...params, ...debouncedFilters };
    if (!finalParams.outletId) delete finalParams.outletId;
    if (!finalParams.status) delete finalParams.status;
    if (!finalParams.fromDate) delete finalParams.fromDate;
    if (!finalParams.toDate) delete finalParams.toDate;
    return GetBatches(finalParams, signal);
  }, [debouncedFilters]);

  const { rows, totalPages, loading, refetch } = usePaginatedFetch(fetchBatches, { page, filters: debouncedFilters });

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => { setDebouncedFilters(newFilters); setPage(0); }, 500);
  };

  // Price editing
  const handleEditPrices = (batch) => {
    setSelectedBatch(batch);
    setPriceItems(batch.items.map((i) => ({ ...i })));
    setPriceOpen(true);
  };

  const handleSubmitPrices = async () => {
    try {
      await UpdateBatchPrices(selectedBatch.id, priceItems);
      toast.success("Batch prices updated!");
      setPriceOpen(false);
      refetch();
    } catch (err) { toast.error(err.response?.data?.message || "Failed to update prices"); }
  };

  // Mark received
  const handleOpenReceive = async (batch) => {
    setReceiveBatch(batch);
    // Pre-populate dateMap from existing item data if available
    const map = {};
    (batch.items || []).forEach((item) => {
      map[item.productId] = { mfgDate: item.mfgDate || "", expiryDate: item.expiryDate || "" };
    });
    setDateMap(map);
    setReceiveOpen(true);
  };

  const handleSubmitReceive = async () => {
    setReceiving(true);
    try {
      const items = (receiveBatch.items || []).map((item) => ({
        productId: item.productId,
        mfgDate: dateMap[item.productId]?.mfgDate || null,
        expiryDate: dateMap[item.productId]?.expiryDate || null,
      }));
      await ReceiveBatch(receiveBatch.id, { items });
      toast.success("Batch received! Stock inventory updated.");
      setReceiveOpen(false);
      refetch();
    } catch (err) { toast.error(err.response?.data?.message || "Failed to receive batch"); }
    finally { setReceiving(false); }
  };

  const requestCancelBatch = useCallback((batch) => {
    setBatchToCancel(batch);
    setConfirmOpen(true);
  }, []);

  const handleCancelBatch = useCallback(async () => {
    if (!batchToCancel) return;
    try {
      await CancelBatch(batchToCancel.id);
      toast.success("Batch cancelled successfully.");
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to cancel batch");
    } finally {
      setBatchToCancel(null);
      setConfirmOpen(false);
    }
  }, [batchToCancel, refetch]);

  const handleViewItems = async (row) => {
    setItemsDialogBatch(row);
    setItemsLoading(true);
    try {
      const full = await GetBatchById(row.id);
      setItemsDialogBatch(full);
    } catch { toast.error("Failed to load batch items"); }
    finally { setItemsLoading(false); }
  };

  const sc = viewItem ? (statusColors[viewItem.status] || statusColors.PENDING_RECEIPT) : null;
  const received  = rows.filter((b) => b.status === "RECEIVED"  || b.status === "DELIVERED").length;
  const cancelled = rows.filter((b) => b.status === "CANCELLED").length;
  const totalValue = rows.reduce((s, b) => s + (b.totalValue || 0), 0);

  const cards = [
    { title: "Total Batches", value: rows.length,                                              icon: <LocalShippingIcon  />, color: C.blue    },
    { title: "Received",      value: received,                                                 icon: <CheckCircleIcon    />, color: C.emerald },
    { title: "Cancelled",     value: cancelled,                                                icon: <CancelIcon         />, color: C.red     },
    { title: "Total Value",   value: `₹${totalValue.toLocaleString("en-IN")}`,                icon: <CurrencyRupeeIcon  />, color: C.amber   },
  ];

  return (
    <Box sx={{ p: 3, backgroundColor: C.surface, minHeight: "100vh" }}>
      <PageHeader title="Batches" subtitle="Record and track stock batches received from Inventory Management System" />
      
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
      
      <BatchFilter filters={filters} onChange={handleFilterChange} />

      {loading ? (
        <Box display="flex" justifyContent="center" py={10}><CircularProgress /></Box>
      ) : rows.length > 0 ? (
        <>
          <BatchTable batches={rows} onReceive={handleOpenReceive} onCancel={requestCancelBatch} onEditPrices={handleEditPrices} onView={setViewItem} onViewItems={handleViewItems} />
          <TablePagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      ) : (
        <Box sx={{ p: 10, textAlign: "center", backgroundColor: C.white, borderRadius: 3, border: `1px dashed ${C.border}` }}>
          <Typography color="textSecondary">No batches found</Typography>
        </Box>
      )}

      <BatchPriceEditDialog open={priceOpen} batch={selectedBatch} items={priceItems} setItems={setPriceItems} onClose={() => setPriceOpen(false)} onSubmit={handleSubmitPrices} />

      <BatchReceiveDialog
        open={receiveOpen}
        batch={receiveBatch}
        dateMap={dateMap}
        setDateMap={setDateMap}
        onClose={() => setReceiveOpen(false)}
        onSubmit={handleSubmitReceive}
        submitting={receiving}
      />

      <ConfirmDialog
        open={confirmOpen}
        title="Cancel Batch"
        message="Are you sure you want to cancel this batch? This action cannot be undone."
        onConfirm={handleCancelBatch}
        onClose={() => setConfirmOpen(false)}
      />

      <BatchItemsDialog
        open={!!itemsDialogBatch}
        onClose={() => setItemsDialogBatch(null)}
        batch={itemsDialogBatch}
        loading={itemsLoading}
      />

      <ViewDialog open={!!viewItem} onClose={() => setViewItem(null)} title="Batch Details">
        {viewItem && (
          <>
            <ViewRow label="Batch Code"    value={<Chip label={viewItem.batchCode} size="small" sx={{ fontWeight: 700, backgroundColor: C.blueLight, color: C.blue }} />} />
            <ViewRow label="Linked Order"  value={viewItem.orderCode || "N/A"} />
            <ViewRow label="Outlet"        value={viewItem.outletName} />
            <ViewRow label="Received By"   value={viewItem.receivedBy || "—"} />
            <ViewRow label="Received Date" value={viewItem.receivedDate} />
            <ViewRow label="Status"        value={<Chip label={viewItem.status} size="small" sx={{ fontWeight: 700, fontSize: 11, backgroundColor: sc.bg, color: sc.text }} />} />
            <ViewRow label="Items Count"   value={viewItem.itemCount} />
            <ViewRow label="Total Value"   value={<Typography sx={{ fontWeight: 700, color: C.blue }}>₹{viewItem.totalValue?.toLocaleString()}</Typography>} />
          </>
        )}
      </ViewDialog>
    </Box>
  );
}

import { useState, useRef, useMemo, useCallback } from "react";
import { Box, CircularProgress, Typography, Chip, Grid, Skeleton } from "@mui/material";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import CurrencyRupeeIcon from "@mui/icons-material/CurrencyRupee";
import InfoCard from "../components/shared/InfoCard";
import { toast } from "react-toastify";
import PageHeader from "../components/shared/PageHeader";
import StockOrderFilter from "../components/StockOrders/StockOrderFilter";
import StockOrderTable from "../components/StockOrders/StockOrderTable";
import StockOrderPagination from "../components/StockOrders/StockOrderPagination";
import StockOrderForm from "../components/StockOrders/StockOrderForm";
import StockOrderItemsDialog from "../components/StockOrders/StockOrderItemsDialog";
import ViewDialog, { ViewRow } from "../components/shared/ViewDialog";
import {
  GetStockOrders, CreateStockOrder, UpdateStockOrder,
  ApproveStockOrder, CancelStockOrder, DeleteStockOrder, GetStockOrderById, RetryImsPush
} from "../services/StockOrderService";
import usePaginatedFetch from "../hooks/usePaginatedFetch";
import ConfirmDialog from "../components/shared/ConfirmDialog";
import { C } from "../theme/colors";

const emptyFilters = { keyword: "", outletId: "", status: "", fromDate: "", toDate: "" };
const emptyForm = { outletId: "", requestedDate: new Date().toISOString().split("T")[0], notes: "", items: [] };

const statusColors = {
  PENDING:   { bg: "#fff7ed", text: "#9a3412" },
  APPROVED:  { bg: "#ecfdf5", text: "#047857" },
  CANCELLED: { bg: "#fef2f2", text: "#b91c1c" },
  FULFILLED: { bg: "#f0fdfa", text: "#0f766e" },
};

const imsColors = {
  PENDING:          { bg: "#f1f5f9", text: "#475569" },
  IMS_PUSHED:       { bg: "#ecfdf5", text: "#047857" },
  IMS_PUSH_FAILED:  { bg: "#fef2f2", text: "#b91c1c" },
};

export default function StockOrder() {
  const debounceTimer = useRef(null);
  const [page, setPage] = useState(0);
  const [filters, setFilters] = useState(emptyFilters);
  const [debouncedFilters, setDebouncedFilters] = useState(emptyFilters);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [selectedId, setSelectedId] = useState(null);
  const [viewItem, setViewItem] = useState(null);
  const [itemsDialogOrder, setItemsDialogOrder] = useState(null);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [confirmState, setConfirmState] = useState({ open: false, type: "", id: null });

  const fetchStockOrders = useCallback((params, signal) => GetStockOrders(params, signal), []);
  const fetchOptions = useMemo(() => ({ page, filters: debouncedFilters }), [page, debouncedFilters]);
  const { rows = [], totalPages = 0, loading, refetch } = usePaginatedFetch(fetchStockOrders, fetchOptions);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => { setDebouncedFilters(newFilters); setPage(0); }, 500);
  };

  const validate = () => {
    const e = {};
    if (!form.outletId) e.outletId = "Required";
    if (!form.requestedDate) e.requestedDate = "Required";
    if (!form.items || form.items.length === 0) e.items = "Add at least one item";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleOpen = (row = null) => {
    if (row) {
      setSelectedId(row.id);
      setForm({ outletId: row.outletId || "", requestedDate: row.requestedDate || new Date().toISOString().split("T")[0], notes: row.notes || "", items: row.items?.map((i) => ({ productId: i.productId || "", quantityRequested: i.quantityRequested || 1, unitPrice: i.unitPriceAtOrder || 0 })) || [] });
    } else { setSelectedId(null); setForm({ ...emptyForm, items: [] }); }
    setErrors({});
    setOpen(true);
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    try {
      if (selectedId) { await UpdateStockOrder(selectedId, form); toast.success("Stock order updated!"); }
      else { await CreateStockOrder(form); toast.success("Stock order created!"); }
      setOpen(false); refetch();
    } catch (err) {
      const res = err.response?.data;
      if (res?.data && typeof res.data === "object") setErrors(res.data);
      else toast.error(res?.message || "Operation failed");
    }
  };

  const requestApprove = useCallback((id) => setConfirmState({ open: true, type: "APPROVE", id }), []);
  const requestCancel = useCallback((id) => setConfirmState({ open: true, type: "CANCEL", id }), []);
  const requestDelete = useCallback((id) => setConfirmState({ open: true, type: "DELETE", id }), []);

  const executeConfirmAction = useCallback(async () => {
    const { type, id } = confirmState;
    if (!id) return;
    try {
      if (type === "APPROVE") {
        await ApproveStockOrder(id);
        toast.success("Order approved! Batch generated.");
      } else if (type === "CANCEL") {
        await CancelStockOrder(id);
        toast.success("Order cancelled!");
      } else if (type === "DELETE") {
        await DeleteStockOrder(id);
        toast.success("Order deleted!");
      }
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${type.toLowerCase()} order`);
    } finally {
      setConfirmState({ open: false, type: "", id: null });
    }
  }, [confirmState, refetch]);

  const handleViewItems = async (row) => {
    setItemsDialogOrder(row);
    setItemsLoading(true);
    try {
      const full = await GetStockOrderById(row.id);
      setItemsDialogOrder(full);
    } catch { toast.error("Failed to load order items"); }
    finally { setItemsLoading(false); }
  };

  const handleRetryIms = async (id) => {
    try {
      await RetryImsPush(id);
      toast.success("Retry IMS push triggered successfully");
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to retry IMS push");
    }
  };

  const sc = viewItem ? (statusColors[viewItem.status] || statusColors.PENDING) : null;

  const approved = rows.filter((o) => o.status === "APPROVED" || o.status === "FULFILLED").length;
  const pending = rows.filter((o) => o.status === "PENDING").length;
  const totalAmount = rows.reduce((s, o) => s + (o.totalAmount || 0), 0);

  const cards = [
    { title: "Total Orders", value: rows.length, icon: <ShoppingCartIcon sx={{ color: C.white, fontSize: 22 }} />, color: C.blue, bgColor: C.blue },
    { title: "Pending", value: pending, icon: <HourglassEmptyIcon sx={{ color: C.white, fontSize: 22 }} />, color: C.amber, bgColor: C.amber },
    { title: "Approved / Fulfilled", value: approved, icon: <CheckCircleIcon sx={{ color: C.white, fontSize: 22 }} />, color: C.emerald, bgColor: C.emerald },
    { title: "Total Amount", value: `₹${totalAmount.toLocaleString("en-IN")}`, icon: <CurrencyRupeeIcon sx={{ color: C.white, fontSize: 22 }} />, color: C.teal, bgColor: C.teal },
  ];

  return (
    <Box sx={{ p: 3, backgroundColor: C.surface, minHeight: "100vh" }}>
      <PageHeader title="Stock Orders" subtitle="Manage procurement requests for outlets" onAdd={() => handleOpen()} addLabel="New Order" />
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
      <StockOrderFilter filters={filters} onChange={handleFilterChange} />

      {loading ? (
        <Box display="flex" justifyContent="center" py={10}><CircularProgress /></Box>
      ) : rows?.length > 0 ? (
        <>
          <StockOrderTable orders={rows} onEdit={handleOpen} onDelete={requestDelete} onApprove={requestApprove} onCancel={requestCancel} onView={setViewItem} onViewItems={handleViewItems} onRetryIms={handleRetryIms} />
          <StockOrderPagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      ) : (
        <Box sx={{ p: 10, textAlign: "center", backgroundColor: C.white, borderRadius: 3, border: `1px dashed ${C.border}` }}>
          <Typography color="textSecondary">No stock orders found</Typography>
        </Box>
      )}

      <StockOrderForm open={open} form={form} setForm={setForm} errors={errors} selectedId={selectedId} onClose={() => setOpen(false)} onSubmit={handleSubmit} />

      <StockOrderItemsDialog
        open={!!itemsDialogOrder}
        onClose={() => setItemsDialogOrder(null)}
        order={itemsDialogOrder}
        loading={itemsLoading}
      />

      <ViewDialog open={!!viewItem} onClose={() => setViewItem(null)} title="Stock Order Details">
        {viewItem && (
          <>
            <ViewRow label="Order Code"    value={<Chip label={viewItem.orderCode} size="small" sx={{ fontWeight: 700, backgroundColor: "#f1f5f9", color: "#475569" }} />} />
            <ViewRow label="Outlet"        value={viewItem.outletName} />
            <ViewRow label="Requested Date" value={viewItem.requestedDate} />
            <ViewRow label="Status"        value={<Chip label={viewItem.status} size="small" sx={{ fontWeight: 700, fontSize: 11, backgroundColor: sc.bg, color: sc.text }} />} />
            <ViewRow label="IMS Status"    value={(() => { const ic = imsColors[viewItem.imsPushStatus] || imsColors.PENDING; return <Chip label={viewItem.imsPushStatus || "PENDING"} size="small" sx={{ fontWeight: 700, fontSize: 11, backgroundColor: ic.bg, color: ic.text }} />; })()} />
            <ViewRow label="Total Amount"  value={<Typography sx={{ fontWeight: 700, color: C.blue }}>₹{viewItem.totalAmount?.toLocaleString()}</Typography>} />
            <ViewRow label="Items Count"   value={viewItem.itemCount} />
            {viewItem.notes && <ViewRow label="Notes" value={viewItem.notes} />}
          </>
        )}
      </ViewDialog>

      <ConfirmDialog
        open={confirmState.open}
        title={confirmState.type === "APPROVE" ? "Approve Order" : confirmState.type === "CANCEL" ? "Cancel Order" : "Delete Order"}
        message={
          confirmState.type === "APPROVE" ? "Approve this order and generate a batch?" :
          confirmState.type === "CANCEL" ? "Are you sure you want to cancel this order?" :
          "Are you sure you want to delete this order? This action cannot be undone."
        }
        confirmText={confirmState.type === "APPROVE" ? "Approve" : confirmState.type === "CANCEL" ? "Cancel Order" : "Delete"}
        confirmColor={confirmState.type === "APPROVE" ? "success" : "error"}
        onConfirm={executeConfirmAction}
        onClose={() => setConfirmState({ open: false, type: "", id: null })}
      />
    </Box>
  );
}

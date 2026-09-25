import React, { useState, useCallback } from "react";
import {
  Box, Typography, CircularProgress, Tabs, Tab, Chip, Button,
  IconButton, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Grid, Skeleton, TextField,
  MenuItem, Select, FormControl, InputLabel, Tooltip
} from "@mui/material";
import InventoryIcon from "@mui/icons-material/Inventory";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import VisibilityIcon from "@mui/icons-material/Visibility";
import KeyboardReturnIcon from "@mui/icons-material/KeyboardReturn";

import PageHeader from "../components/shared/PageHeader";
import InfoCard from "../components/shared/InfoCard";
import TablePagination from "../components/shared/TablePagination";
import ViewDialog, { ViewRow } from "../components/shared/ViewDialog";
import EnterpriseTable from "../components/shared/EnterpriseTable";
import { ApproveDialog, RejectDialog, DispatchDialog } from "../components/IMS/IMSOrderActionDialogs";
import { ReturnActionDialog } from "../components/IMS/IMSReturnActionDialog";
import {
  GetImsOrders, GetImsOrderDetail,
  ApproveImsOrder, RejectImsOrder, DispatchImsOrder,
  GetImsReturns, AcknowledgeImsReturn, PickupImsReturn, CompleteImsReturn
} from "../services/ImsPortalService";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { C } from "../theme/colors";

// ── Status config ─────────────────────────────────────────────────────────────
const orderStatusCfg = {
  PENDING_IMS:      { bg: "#fff7ed", color: "#9a3412" },
  APPROVED:         { bg: "#ecfdf5", color: "#047857" },
  REJECTED:         { bg: "#fef2f2", color: "#b91c1c" },
  DISPATCHED:       { bg: "#eff6ff", color: "#1d4ed8" },
  RECEIVED:         { bg: "#f0fdfa", color: "#0f766e" },
  CANCEL_REQUESTED: { bg: "#fdf4ff", color: "#7c3aed" },
  CANCELLED:        { bg: "#f8fafc", color: "#64748b" },
};

const returnStatusCfg = {
  PENDING:      { bg: "#fff7ed", color: "#9a3412" },
  SUBMITTED:    { bg: "#eff6ff", color: "#1d4ed8" },
  ACKNOWLEDGED: { bg: "#ecfdf5", color: "#047857" },
  PICKED_UP:    { bg: "#f0fdfa", color: "#0f766e" },
  COMPLETED:    { bg: "#f8fafc", color: "#047857" },
  REJECTED:     { bg: "#fef2f2", color: "#b91c1c" },
};

const StatusBadge = ({ status, cfg }) => {
  const c = cfg[status] || { bg: "#f1f5f9", color: "#64748b" };
  return (
    <Chip label={status?.replace("_", " ")} size="small"
      sx={{ bgcolor: c.bg, color: c.color, fontWeight: 700, fontSize: 11 }} />
  );
};

// ── Order Actions ─────────────────────────────────────────────────────────────
function OrderActionButtons({ order, onApprove, onReject, onDispatch, onView }) {
  return (
    <Box display="flex" gap={0.75} justifyContent="flex-end" flexWrap="wrap">
      <IconButton size="small" onClick={() => onView(order)} sx={{ color: C.slate }}>
        <VisibilityIcon fontSize="small" />
      </IconButton>
      {order.status === "PENDING_IMS" && (
        <>
          <Tooltip title={order.paymentStatus !== "PAID" ? "Order must be PAID before approval" : ""}>
            <span>
              <Button size="small" variant="outlined" onClick={() => onApprove(order)}
                disabled={order.paymentStatus !== "PAID"}
                sx={{ color: C.emerald, borderColor: C.emerald, fontSize: 11 }}>
                Approve
              </Button>
            </span>
          </Tooltip>
          <Button size="small" variant="outlined" onClick={() => onReject(order)}
            sx={{ color: "#ef4444", borderColor: "#ef4444", fontSize: 11 }}>
            Reject
          </Button>
        </>
      )}
      {(order.status === "APPROVED" || order.status === "PENDING_IMS") && (
        <Tooltip title={order.paymentStatus !== "PAID" ? "Order must be PAID before dispatch" : ""}>
          <span>
            <Button size="small" variant="contained" onClick={() => onDispatch(order)}
              disabled={order.paymentStatus !== "PAID"}
              startIcon={<LocalShippingIcon sx={{ fontSize: 13 }} />}
              sx={{ bgcolor: C.blue, fontSize: 11, "&:hover": { opacity: 0.85 } }}>
              Dispatch
            </Button>
          </span>
        </Tooltip>
      )}
    </Box>
  );
}

// ── Return Actions ─────────────────────────────────────────────────────────────
function ReturnActionButtons({ ret, onAck, onPickup, onComplete }) {
  if (ret.status === "SUBMITTED" || ret.status === "PENDING") {
    return <Button size="small" variant="outlined" onClick={() => onAck(ret)}
      sx={{ fontSize: 11, color: "#d97706", borderColor: "#d97706" }}>Acknowledge</Button>;
  }
  if (ret.status === "ACKNOWLEDGED") {
    return <Button size="small" variant="outlined" onClick={() => onPickup(ret)}
      sx={{ fontSize: 11, color: C.blue, borderColor: C.blue }}>Pickup</Button>;
  }
  if (ret.status === "PICKED_UP") {
    return <Button size="small" variant="contained" onClick={() => onComplete(ret)}
      sx={{ fontSize: 11, bgcolor: C.emerald, "&:hover": { opacity: 0.85 } }}>Complete</Button>;
  }
  return <Chip label="Done" size="small" sx={{ bgcolor: C.emeraldLight, color: C.emerald, fontWeight: 700 }} />;
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function IMSOrders() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState(0);

  // Orders state
  const [orderPage, setOrderPage] = useState(0);
  const [orderStatus, setOrderStatus] = useState("");
  const [approveTarget, setApproveTarget] = useState(null);
  const [rejectTarget, setRejectTarget]   = useState(null);
  const [dispatchTarget, setDispatchTarget] = useState(null);
  const [viewOrder, setViewOrder] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Returns state
  const [returnPage, setReturnPage] = useState(0);
  const [returnStatus, setReturnStatus] = useState("");
  const [returnAction, setReturnAction] = useState(null); // { type, ret }

  // ── Queries ──────────────────────────────────────────────────────────────
  const ordersQuery = useQuery({
    queryKey: ["ims-orders", orderPage, orderStatus],
    queryFn: ({ signal }) => GetImsOrders({ page: orderPage, size: 10, status: orderStatus || undefined }, signal),
  });

  const returnsQuery = useQuery({
    queryKey: ["ims-returns", returnPage, returnStatus],
    queryFn: ({ signal }) => GetImsReturns({ page: returnPage, size: 10, status: returnStatus || undefined }, signal),
  });

  const orders = ordersQuery.data?.content || [];
  const orderPages = ordersQuery.data?.totalPages || 0;
  const returns = returnsQuery.data?.content || [];
  const returnPages = returnsQuery.data?.totalPages || 0;

  // ── Order actions ─────────────────────────────────────────────────────────
  const handleApprove = useCallback(async (data) => {
    setActionLoading(true);
    try {
      await ApproveImsOrder(approveTarget.id, data);
      toast.success(`Order ${approveTarget.orderCode} approved!`);
      setApproveTarget(null);
      queryClient.invalidateQueries({ queryKey: ["ims-orders"] });
    } catch (e) { toast.error(e.response?.data?.message || "Approve failed"); }
    finally { setActionLoading(false); }
  }, [approveTarget, queryClient]);

  const handleReject = useCallback(async (data) => {
    setActionLoading(true);
    try {
      await RejectImsOrder(rejectTarget.id, data);
      toast.success(`Order ${rejectTarget.orderCode} rejected.`);
      setRejectTarget(null);
      queryClient.invalidateQueries({ queryKey: ["ims-orders"] });
    } catch (e) { toast.error(e.response?.data?.message || "Reject failed"); }
    finally { setActionLoading(false); }
  }, [rejectTarget, queryClient]);

  const handleDispatch = useCallback(async (data) => {
    setActionLoading(true);
    try {
      await DispatchImsOrder(dispatchTarget.id, data);
      toast.success("Order dispatched! Shipment created for the outlet.");
      setDispatchTarget(null);
      queryClient.invalidateQueries({ queryKey: ["ims-orders"] });
    } catch (e) { toast.error(e.response?.data?.message || "Dispatch failed"); }
    finally { setActionLoading(false); }
  }, [dispatchTarget, queryClient]);

  const handleViewOrder = async (order) => {
    setViewOrder(order);
    setDetailData(null);
    try {
      const full = await GetImsOrderDetail(order.id);
      setDetailData(full);
    } catch { /* use base data */ }
  };

  // ── Return actions ────────────────────────────────────────────────────────
  const handleReturnAction = useCallback(async (data) => {
    const { type, ret } = returnAction;
    setActionLoading(true);
    try {
      if (type === "acknowledge") await AcknowledgeImsReturn(ret.returnCode, data);
      else if (type === "pickup")  await PickupImsReturn(ret.returnCode, data);
      else if (type === "complete") await CompleteImsReturn(ret.returnCode, data);
      toast.success(`Return ${ret.returnCode} ${type} done!`);
      setReturnAction(null);
      queryClient.invalidateQueries({ queryKey: ["ims-returns"] });
    } catch (e) { toast.error(e.response?.data?.message || "Action failed"); }
    finally { setActionLoading(false); }
  }, [returnAction, queryClient]);

  // ── Info cards ─────────────────────────────────────────────────────────────
  const pendingCount  = orders.filter(o => o.status === "PENDING_IMS").length;
  const approvedCount = orders.filter(o => o.status === "APPROVED").length;
  const dispatchedCount = orders.filter(o => o.status === "DISPATCHED").length;

  const orderCards = [
    { title: "Incoming Orders", value: orders.length, icon: <InventoryIcon />, color: C.blue },
    { title: "Awaiting Review", value: pendingCount, icon: <InventoryIcon />, color: "#d97706" },
    { title: "Approved", value: approvedCount, icon: <CheckCircleIcon />, color: C.emerald },
    { title: "Dispatched", value: dispatchedCount, icon: <LocalShippingIcon />, color: C.teal },
  ];

  const pendingReturns = returns.filter(r => r.status === "SUBMITTED" || r.status === "PENDING").length;
  const returnCards = [
    { title: "Total Returns", value: returns.length, icon: <KeyboardReturnIcon />, color: C.blue },
    { title: "Pending Action", value: pendingReturns, icon: <KeyboardReturnIcon />, color: "#d97706" },
    { title: "Completed", value: returns.filter(r => r.status === "COMPLETED").length, icon: <CheckCircleIcon />, color: C.emerald },
  ];

  const orderColumns = [
    { label: "Order Code", render: (row) => <Typography sx={{ fontWeight: 700, fontSize: 13 }}>{row.orderCode}</Typography> },
    { label: "Outlet", render: (row) => <Typography sx={{ fontSize: 13 }}>{row.outletName}</Typography> },
    { label: "Date", render: (row) => <Typography sx={{ fontSize: 12, color: C.slate }}>{row.requestedDate}</Typography> },
    { label: "Items", render: (row) => <Typography sx={{ fontSize: 12 }}>{row.itemCount ?? "—"}</Typography> },
    { label: "Total", render: (row) => <Typography sx={{ fontSize: 12, fontWeight: 600 }}>{row.totalAmount ? `₹${Number(row.totalAmount).toLocaleString("en-IN")}` : "—"}</Typography> },
    { label: "Payment", render: (row) => (
        <Chip label={row.paymentStatus || 'UNPAID'} size="small" sx={{ fontWeight: 700, fontSize: 10, height: 20,
          backgroundColor: row.paymentStatus === 'PAID' ? '#ecfdf5' : row.paymentStatus === 'PARTIAL' ? '#fff7ed' : '#fef2f2',
          color: row.paymentStatus === 'PAID' ? '#047857' : row.paymentStatus === 'PARTIAL' ? '#9a3412' : '#b91c1c'
        }} />
      )
    },
    { label: "Status", render: (row) => <StatusBadge status={row.status} cfg={orderStatusCfg} /> },
    { label: "Actions", render: (row) => (
        <OrderActionButtons
          order={row}
          onApprove={setApproveTarget}
          onReject={setRejectTarget}
          onDispatch={setDispatchTarget}
          onView={handleViewOrder}
        />
      )
    }
  ];

  const returnColumns = [
    { label: "Return Code", render: (row) => <Typography sx={{ fontWeight: 700, fontSize: 13 }}>{row.returnCode}</Typography> },
    { label: "Outlet", render: (row) => <Typography sx={{ fontSize: 13 }}>{row.outletName}</Typography> },
    { label: "Batch", render: (row) => <Typography sx={{ fontSize: 12, color: C.slate }}>{row.batchCode}</Typography> },
    { label: "Reason", render: (row) => <Chip label={row.reason} size="small" sx={{ fontSize: 10 }} /> },
    { label: "Created", render: (row) => <Typography sx={{ fontSize: 12, color: C.slate }}>{row.createdAt ? new Date(row.createdAt).toLocaleDateString("en-IN") : "—"}</Typography> },
    { label: "Status", render: (row) => <StatusBadge status={row.status} cfg={returnStatusCfg} /> },
    { label: "Actions", render: (row) => (
        <ReturnActionButtons
          ret={row}
          onAck={(r) => setReturnAction({ type: "acknowledge", ret: r })}
          onPickup={(r) => setReturnAction({ type: "pickup", ret: r })}
          onComplete={(r) => setReturnAction({ type: "complete", ret: r })}
        />
      )
    }
  ];

  return (
    <Box sx={{ p: 3, backgroundColor: C.surface, minHeight: "100vh" }}>
      <PageHeader title="IMS Portal" subtitle="Inventory Manager — Manage incoming orders and stock returns from outlets" />

      {/* Banner */}
      <Box sx={{ mb: 3, p: 2, bgcolor: C.blueLight, borderRadius: 2, border: `1px solid ${C.blue}20`,
        display: "flex", alignItems: "center", gap: 2 }}>
        <InventoryIcon sx={{ color: C.blue, fontSize: 28 }} />
        <Box>
          <Typography fontWeight={700} sx={{ color: C.blueDark || C.blue }}>Inventory Manager Portal</Typography>
          <Typography variant="body2" sx={{ color: C.blueDark || C.blue }}>
            You are acting as the external IMS. Approve, reject, and dispatch stock orders. Manage return requests from outlets.
          </Typography>
        </Box>
      </Box>

      {/* Tabs */}
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3, borderBottom: `1px solid ${C.border}` }}>
        <Tab label="Stock Orders" icon={<InventoryIcon sx={{ fontSize: 16 }} />} iconPosition="start"
          sx={{ fontSize: 13, fontWeight: 600, textTransform: "none" }} />
        <Tab label="Stock Returns" icon={<KeyboardReturnIcon sx={{ fontSize: 16 }} />} iconPosition="start"
          sx={{ fontSize: 13, fontWeight: 600, textTransform: "none" }} />
      </Tabs>

      {/* ── ORDERS TAB ─────────────────────────────────────────────────── */}
      {tab === 0 && (
        <>
          {/* Info Cards */}
          <Grid container spacing={2.5} mb={3}>
            {ordersQuery.isLoading
              ? [0,1,2,3].map(i => <Grid item xs={12} sm={6} lg={3} key={i}><Skeleton variant="rounded" height={82} sx={{ borderRadius: 3 }} /></Grid>)
              : orderCards.map(c => (
                  <Grid item xs={12} sm={6} lg={3} key={c.title}>
                    <InfoCard {...c} />
                  </Grid>
                ))}
          </Grid>

          {/* Filter */}
          <Box mb={2} display="flex" gap={1.5} alignItems="center">
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>Filter by Status</InputLabel>
              <Select value={orderStatus} label="Filter by Status" onChange={(e) => { setOrderStatus(e.target.value); setOrderPage(0); }}>
                <MenuItem value="">All</MenuItem>
                {["PENDING_IMS", "APPROVED", "REJECTED", "DISPATCHED", "RECEIVED", "CANCELLED"].map(s => (
                  <MenuItem key={s} value={s}>{s.replace("_", " ")}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {ordersQuery.isLoading ? (
            <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>
          ) : orders.length === 0 ? (
            <Box sx={{ p: 10, textAlign: "center", bgcolor: "white", borderRadius: 3, border: `1px dashed ${C.border}` }}>
              <Typography color="textSecondary">No orders found.</Typography>
            </Box>
          ) : (
            <EnterpriseTable columns={orderColumns} data={orders} emptyMessage="No orders found." />
          )}
          <TablePagination page={orderPage} totalPages={orderPages} onPageChange={setOrderPage} />
        </>
      )}

      {/* ── RETURNS TAB ─────────────────────────────────────────────────── */}
      {tab === 1 && (
        <>
          <Grid container spacing={2.5} mb={3}>
            {returnsQuery.isLoading
              ? [0,1,2].map(i => <Grid item xs={12} sm={6} lg={3} key={i}><Skeleton variant="rounded" height={82} sx={{ borderRadius: 3 }} /></Grid>)
              : returnCards.map(c => (
                  <Grid item xs={12} sm={6} lg={3} key={c.title}>
                    <InfoCard {...c} />
                  </Grid>
                ))}
          </Grid>

          {/* Filter */}
          <Box mb={2} display="flex" gap={1.5}>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Filter by Status</InputLabel>
              <Select value={returnStatus} label="Filter by Status" onChange={(e) => { setReturnStatus(e.target.value); setReturnPage(0); }}>
                <MenuItem value="">All</MenuItem>
                {["PENDING", "SUBMITTED", "ACKNOWLEDGED", "PICKED_UP", "COMPLETED", "REJECTED"].map(s => (
                  <MenuItem key={s} value={s}>{s}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {returnsQuery.isLoading ? (
            <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>
          ) : returns.length === 0 ? (
            <Box sx={{ p: 10, textAlign: "center", bgcolor: "white", borderRadius: 3, border: `1px dashed ${C.border}` }}>
              <Typography color="textSecondary">No return requests found.</Typography>
            </Box>
          ) : (
            <EnterpriseTable columns={returnColumns} data={returns} emptyMessage="No return requests found." />
          )}
          <TablePagination page={returnPage} totalPages={returnPages} onPageChange={setReturnPage} />
        </>
      )}

      {/* ── Order Dialogs ──────────────────────────────────────────────── */}
      <ApproveDialog open={!!approveTarget} order={approveTarget}
        onClose={() => setApproveTarget(null)} onConfirm={handleApprove} loading={actionLoading} />
      <RejectDialog open={!!rejectTarget} order={rejectTarget}
        onClose={() => setRejectTarget(null)} onConfirm={handleReject} loading={actionLoading} />
      <DispatchDialog open={!!dispatchTarget} order={detailData?.id === dispatchTarget?.id ? detailData : dispatchTarget}
        onClose={() => setDispatchTarget(null)} onConfirm={handleDispatch} loading={actionLoading} />

      {/* ── View Order Detail ────────────────────────────────────────────── */}
      <ViewDialog open={!!viewOrder} onClose={() => { setViewOrder(null); setDetailData(null); }} title="Order Details">
        {(detailData || viewOrder) && (() => {
          const o = detailData || viewOrder;
          return (
            <>
              <ViewRow label="Order Code" value={o.orderCode} />
              <ViewRow label="Outlet" value={o.outletName} />
              <ViewRow label="Requested Date" value={o.requestedDate} />
              <ViewRow label="Status" value={<StatusBadge status={o.status} cfg={orderStatusCfg} />} />
              <ViewRow label="Payment Method" value={o.paymentMethod || "—"} />
              <ViewRow label="Payment Status" value={o.paymentStatus || "UNPAID"} />
              <ViewRow label="Created By" value={o.createdBy || "—"} />
              <ViewRow label="Notes" value={o.notes || "—"} />
              {o.items?.length > 0 && (
                <Box mt={2}>
                  <Typography variant="caption" fontWeight={700} color="text.secondary">ITEMS</Typography>
                  {o.items.map((item, i) => (
                    <Box key={i} sx={{ display: "flex", justifyContent: "space-between", py: 0.75,
                      borderBottom: `1px solid ${C.border}` }}>
                      <Typography variant="body2">{item.productName} <span style={{ color: C.slate }}>({item.productCode})</span></Typography>
                      <Typography variant="body2" fontWeight={700}>×{item.quantityRequested} = ₹{Number(item.lineTotal || 0).toLocaleString("en-IN")}</Typography>
                    </Box>
                  ))}
                  <Box display="flex" justifyContent="flex-end" mt={1}>
                    <Typography fontWeight={800} color={C.blue}>Total: ₹{Number(o.totalAmount || 0).toLocaleString("en-IN")}</Typography>
                  </Box>
                </Box>
              )}
            </>
          );
        })()}
      </ViewDialog>

      {/* ── Return Action Dialog ─────────────────────────────────────────── */}
      <ReturnActionDialog
        open={!!returnAction}
        type={returnAction?.type}
        returnCode={returnAction?.ret?.returnCode}
        onClose={() => setReturnAction(null)}
        onConfirm={handleReturnAction}
        loading={actionLoading}
      />
    </Box>
  );
}

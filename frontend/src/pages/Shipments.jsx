import React, { useState } from "react";
import { C } from "../theme/colors";
import {
  Box, Chip, Grid, Skeleton, Typography,
} from "@mui/material";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import AllInboxIcon from "@mui/icons-material/AllInbox";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import PageHeader from "../components/shared/PageHeader";
import InfoCard from "../components/shared/InfoCard";
import EnterpriseTable from "../components/shared/EnterpriseTable";
import TablePagination from "../components/shared/TablePagination";
import { GetShipments } from "../services/ShipmentService";
import ReceiveShipmentModal from "../components/Shipments/ReceiveShipmentModal";

// ── Status chip helper ────────────────────────────────────────────────────────
const statusConfig = {
  RECEIVED:   { bg: C.emeraldLight, color: C.emerald },
  IN_TRANSIT: { bg: C.amberLight,   color: C.amber   },
  DISPATCHED: { bg: C.blueLight,    color: C.blue    },
  PENDING:    { bg: C.slateLight,   color: C.slateMid },
};

const StatusChip = ({ status }) => {
  const cfg = statusConfig[status] || statusConfig.PENDING;
  return (
    <Box
      sx={{
        display: "inline-flex", alignItems: "center", px: 1.5, py: 0.5,
        borderRadius: "20px", fontSize: 11, fontWeight: 700,
        bgcolor: cfg.bg, color: cfg.color,
      }}
    >
      {status?.replace("_", " ")}
    </Box>
  );
};

const Shipments = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [receiveModalOpen, setReceiveModalOpen] = useState(false);
  const [selectedShipmentId, setSelectedShipmentId] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ["shipments", page, size, keyword, statusFilter],
    queryFn: ({ signal }) =>
      GetShipments({ page, size, keyword: keyword || undefined, status: statusFilter || undefined }, signal),
  });

  const rows = data?.rows || [];
  const totalPages = data?.totalPages || 0;

  // Summary stats
  const received   = rows.filter((r) => r.status === "RECEIVED").length;
  const inTransit  = rows.filter((r) => r.status === "IN_TRANSIT").length;

  const cards = [
    { title: "Total Shipments", value: rows.length,    icon: <AllInboxIcon />,         color: C.blue    },
    { title: "In Transit",      value: inTransit,      icon: <LocalShippingIcon />,     color: C.amber   },
    { title: "Received",        value: received,       icon: <CheckCircleIcon />,       color: C.emerald },
    { title: "Pending",         value: rows.length - received - inTransit,
                                                       icon: <HourglassEmptyIcon />,    color: C.indigo  },
  ];

  const handleReceiveClick = (id) => {
    setSelectedShipmentId(id);
    setReceiveModalOpen(true);
  };

  const columns = [
    { key: "shipmentCode", label: "Shipment Code" },
    { key: "orderCode",    label: "Order Ref" },
    { key: "outletName",   label: "Outlet" },
    {
      key: "dispatchDate",
      label: "Dispatch Date",
      render: (row) => row.dispatchDate
        ? new Date(row.dispatchDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
        : "—",
    },
    {
      key: "status",
      label: "Status",
      render: (row) => <StatusChip status={row.status} />,
    },
    {
      key: "actions",
      label: "Actions",
      render: (row) =>
        row.status === "IN_TRANSIT" ? (
          <Box
            component="button"
            onClick={() => handleReceiveClick(row.id)}
            sx={{
              display: "inline-flex", alignItems: "center", gap: 0.5,
              px: 2, py: 0.75, borderRadius: "8px", fontSize: 12, fontWeight: 700,
              bgcolor: C.teal, color: C.bg, border: "none", cursor: "pointer",
              transition: "all 0.2s",
              "&:hover": { bgcolor: C.tealMid || C.teal, opacity: 0.9 },
            }}
          >
            <LocalShippingIcon sx={{ fontSize: 14 }} />
            Receive
          </Box>
        ) : (
          <Box
            sx={{
              display: "inline-flex", alignItems: "center", gap: 0.5,
              px: 1.5, py: 0.5, borderRadius: "20px", fontSize: 11, fontWeight: 600,
              bgcolor: C.emeraldLight, color: C.emerald,
            }}
          >
            <CheckCircleIcon sx={{ fontSize: 13 }} /> Completed
          </Box>
        ),
    },
  ];

  return (
    <Box sx={{ p: 3, backgroundColor: C.surface, minHeight: "100vh" }}>
      <PageHeader
        title="Shipments"
        subtitle="Manage incoming stock shipments dispatched from IMS"
      />

      {/* Info Cards */}
      {isLoading ? (
        <Grid container spacing={2.5} mb={3}>
          {[0, 1, 2, 3].map((i) => (
            <Grid item xs={12} sm={6} lg={3} key={i}>
              <Skeleton variant="rounded" height={82} sx={{ borderRadius: 3 }} />
            </Grid>
          ))}
        </Grid>
      ) : (
        <Grid container spacing={2.5} mb={3}>
          {cards.map((c) => (
            <Grid item xs={12} sm={6} lg={3} key={c.title}>
              <InfoCard {...c} />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Search + Filter bar */}
      <Box
        sx={{
          display: "flex", alignItems: "center", gap: 1.5, mb: 2.5,
          p: 1.5, borderRadius: "12px",
          bgcolor: C.white, border: `1px solid ${C.border}`,
          flexWrap: "wrap",
        }}
      >
        {/* Search */}
        <Box
          component="input"
          placeholder="Search shipments…"
          value={keyword}
          onChange={(e) => { setKeyword(e.target.value); setPage(0); }}
          sx={{
            flex: 1, minWidth: 200, border: `1px solid ${C.border}`,
            borderRadius: "8px", px: 1.5, py: 0.75, fontSize: 13,
            color: C.navy, bgcolor: C.bgMuted, outline: "none",
            "&:focus": { borderColor: C.blue },
          }}
        />
        {/* Status filter pills */}
        {["", "IN_TRANSIT", "RECEIVED", "DISPATCHED"].map((s) => (
          <Box
            key={s}
            onClick={() => { setStatusFilter(s); setPage(0); }}
            sx={{
              px: 2, py: 0.6, borderRadius: "20px", fontSize: 12, fontWeight: 600,
              cursor: "pointer", transition: "all 0.15s",
              bgcolor: statusFilter === s ? C.navy : C.bgMuted,
              color:   statusFilter === s ? C.bg   : C.slateMid,
              border: `1px solid ${statusFilter === s ? C.navy : C.border}`,
              "&:hover": { borderColor: C.navy, color: C.navy },
            }}
          >
            {s === "" ? "All" : s.replace("_", " ")}
          </Box>
        ))}
      </Box>

      <EnterpriseTable
        data={rows}
        columns={columns}
      />
      <TablePagination
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />

      <ReceiveShipmentModal
        open={receiveModalOpen}
        onClose={() => setReceiveModalOpen(false)}
        shipmentId={selectedShipmentId}
      />
    </Box>
  );
};

export default Shipments;

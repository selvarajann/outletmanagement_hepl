import { IconButton, Chip, Box, Typography, Button, Tooltip } from "@mui/material";
import MoveToInboxIcon from "@mui/icons-material/MoveToInbox";
import EditIcon from "@mui/icons-material/Edit";
import CancelIcon from "@mui/icons-material/Cancel";
import VisibilityIcon from "@mui/icons-material/Visibility";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import EnterpriseTable from "../shared/EnterpriseTable";
import { C } from "../../theme/colors";

const statusColors = {
  PENDING_RECEIPT: { bg: "#fffbeb", text: "#92400e", border: "#fef3c7" },
  PROCESSING:      { bg: "#fffbeb", text: "#92400e", border: "#fef3c7" }, // legacy compat
  RECEIVED:        { bg: "#ecfdf5", text: "#065f46", border: "#d1fae5" },
  DELIVERED:       { bg: "#ecfdf5", text: "#065f46", border: "#d1fae5" }, // legacy compat
  CANCELLED:       { bg: "#fef2f2", text: "#991b1b", border: "#fee2e2" },
};

const isPendingReceipt = (status) => status === "PENDING_RECEIPT" || status === "PROCESSING";

export default function BatchTable({ batches, onReceive, onCancel, onEditPrices, onView, onViewItems }) {
  const columns = [
    { label: "Batch Code", render: (row) => (
      <Chip label={row.batchCode} size="small" sx={{ fontWeight: 700, borderRadius: 1.5, backgroundColor: C.blueLight, color: C.blue }} />
    )},
    { label: "Linked Order", render: (row) => row.orderCode || "N/A" },
    { label: "Outlet",       render: (row) => row.outletName },
    { label: "Received By",  render: (row) => row.receivedBy || "—" },
    { label: "Date",         render: (row) => row.receivedDate },
    { label: "Status", render: (row) => {
      const colors = statusColors[row.status] || statusColors.PENDING_RECEIPT;
      return <Chip label={row.status} size="small" sx={{ fontWeight: 700, fontSize: 10, height: 20, backgroundColor: colors.bg, color: colors.text, border: `1px solid ${colors.border}` }} />;
    }},
    { label: "Items",       render: (row) => row.itemCount },
    { label: "Total Value", render: (row) => (
      <Typography sx={{ fontSize: 13, fontWeight: 700, color: C.blue }}>₹{row.totalValue?.toLocaleString()}</Typography>
    )},
    { label: "Actions", align: "right", render: (row) => (
      <Box display="flex" justifyContent="flex-end" gap={0.5}>
        <Tooltip title="View Details">
          <IconButton size="small" onClick={() => onView(row)} sx={{ color: C.teal, "&:hover": { backgroundColor: C.tealLight } }}>
            <VisibilityIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="View Items">
          <IconButton size="small" onClick={() => onViewItems(row)} sx={{ color: C.slate, "&:hover": { backgroundColor: C.slateLight } }}>
            <Inventory2Icon fontSize="small" />
          </IconButton>
        </Tooltip>
        {isPendingReceipt(row.status) && (
          <>
            <Button size="small" variant="contained" color="success"
              startIcon={<MoveToInboxIcon sx={{ fontSize: 14 }} />}
              onClick={() => onReceive(row)}
              sx={{ textTransform: "none", fontSize: 11, borderRadius: 2, py: 0, px: 1, backgroundColor: C.emerald, "&:hover": { backgroundColor: "#047857" } }}>
              Mark Received
            </Button>
            <Tooltip title="Edit Prices">
              <IconButton size="small" onClick={() => onEditPrices(row)} sx={{ color: C.blue, "&:hover": { backgroundColor: C.blueLight } }}>
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Cancel">
              <IconButton size="small" onClick={() => onCancel(row.id)} sx={{ color: C.red, "&:hover": { backgroundColor: "#fef2f2" } }}>
                <CancelIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </>
        )}
      </Box>
    )},
  ];

  return <EnterpriseTable columns={columns} data={batches} />;
}

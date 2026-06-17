import { IconButton, Chip, Box, Typography, Button, Tooltip } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CancelIcon from "@mui/icons-material/Cancel";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import VisibilityIcon from "@mui/icons-material/Visibility";
import ListAltIcon from "@mui/icons-material/ListAlt";
import SyncIcon from "@mui/icons-material/Sync";
import EnterpriseTable from "../shared/EnterpriseTable";
import { C } from "../../theme/colors";

const statusColors = {
  PENDING:   { bg: "#fff7ed", text: "#9a3412", border: "#ffedd5" },
  APPROVED:  { bg: "#ecfdf5", text: "#047857", border: "#d1fae5" },
  CANCELLED: { bg: "#fef2f2", text: "#b91c1c", border: "#fee2e2" },
  FULFILLED: { bg: "#f0fdfa", text: "#0f766e", border: "#ccfbf1" },
};

const imsColors = {
  PENDING:          { bg: "#f1f5f9", text: "#475569" },
  IMS_PUSHED:       { bg: "#ecfdf5", text: "#047857" },
  IMS_PUSH_FAILED:  { bg: "#fef2f2", text: "#b91c1c" },
};

export default function StockOrderTable({ orders, onEdit, onDelete, onApprove, onCancel, onView, onViewItems, onRetryIms }) {
  const columns = [
    { label: "Order Code", render: (row) => (
      <Chip label={row.orderCode} size="small" sx={{ fontWeight: 700, borderRadius: 1.5, backgroundColor: "#f1f5f9", color: "#475569" }} />
    )},
    { label: "Outlet",       render: (row) => row.outletName },
    { label: "Date",         render: (row) => row.requestedDate },
    { label: "Status", render: (row) => {
      const colors = statusColors[row.status] || statusColors.PENDING;
      return <Chip label={row.status} size="small" sx={{ fontWeight: 700, fontSize: 10, height: 20, backgroundColor: colors.bg, color: colors.text, border: `1px solid ${colors.border}` }} />;
    }},
    { label: "IMS", render: (row) => {
      const ic = imsColors[row.imsPushStatus] || imsColors.PENDING;
      return <Chip label={row.imsPushStatus || "PENDING"} size="small" sx={{ fontWeight: 700, fontSize: 9, height: 18, backgroundColor: ic.bg, color: ic.text }} />;
    }},
    { label: "Items",        render: (row) => row.itemCount },
    { label: "Total Amount", render: (row) => (
      <Typography sx={{ fontSize: 13, fontWeight: 700, color: C.blue }}>₹{row.totalAmount?.toLocaleString()}</Typography>
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
            <ListAltIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        {row.imsPushStatus === "IMS_PUSH_FAILED" && (
          <Tooltip title="Retry IMS Push">
            <IconButton size="small" onClick={() => onRetryIms(row.id)} sx={{ color: C.amber, "&:hover": { backgroundColor: "#fffbeb" } }}>
              <SyncIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
        {row.status === "PENDING" && (
          <>
            <Button size="small" variant="outlined" color="success" startIcon={<CheckCircleIcon sx={{ fontSize: 14 }} />}
              onClick={() => onApprove(row.id)} sx={{ textTransform: "none", fontSize: 11, borderRadius: 2, py: 0 }}>
              Approve
            </Button>
            <Tooltip title="Edit">
              <IconButton size="small" onClick={() => onEdit(row)} sx={{ color: C.blue, "&:hover": { backgroundColor: C.blueLight } }}>
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Cancel">
              <IconButton size="small" onClick={() => onCancel(row.id)} sx={{ color: C.amber, "&:hover": { backgroundColor: "#fffbeb" } }}>
                <CancelIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete">
              <IconButton size="small" onClick={() => onDelete(row.id)} sx={{ color: C.red, "&:hover": { backgroundColor: "#fef2f2" } }}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </>
        )}
      </Box>
    )},
  ];

  return <EnterpriseTable columns={columns} data={orders} />;
}

import { IconButton, Chip, Box, Typography, Tooltip } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CancelIcon from "@mui/icons-material/Cancel";
import VisibilityIcon from "@mui/icons-material/Visibility";
import ListAltIcon from "@mui/icons-material/ListAlt";
import PaymentIcon from "@mui/icons-material/Payment";
import ReceiptIcon from "@mui/icons-material/Receipt";
import EnterpriseTable from "../shared/EnterpriseTable";
import { C } from "../../theme/colors";

const statusColors = {
  PENDING:          { bg: C.amberLight, text: C.amber, border: C.amberMid },
  ACCEPTED:         { bg: C.tealLight, text: C.teal, border: C.tealLight },
  APPROVED:         { bg: C.emeraldLight, text: C.emerald, border: C.emeraldMid },
  REJECTED:         { bg: C.redLight, text: C.red, border: C.redMid },
  CANCEL_REQUESTED: { bg: C.amberLight, text: C.amber, border: C.amberMid },
  CANCELLED:        { bg: C.redLight, text: C.red, border: C.redMid },
  DISPATCHED:       { bg: C.blueLight, text: C.blue, border: C.blueMid },
  RECEIVED:         { bg: C.tealLight, text: C.teal, border: C.tealLight },
  FULFILLED:        { bg: C.tealLight, text: C.teal, border: C.tealLight },
};

export default function StockOrderTable({ orders, onEdit, onDelete, onCancel, onView, onViewItems, onPay, onDownloadBill, onBulkDelete }) {
  const columns = [
    { label: "Order Code", render: (row) => (
      <Chip label={row.orderCode || row.order_code || row.id || "N/A"} size="small" sx={{ fontWeight: 700, borderRadius: 1.5, backgroundColor: C.bgMuted, color: C.slate }} />
    )},
    { label: "Outlet",       render: (row) => row.outletName || row.outlet_name || "Unknown" },
    { label: "Date",         render: (row) => {
        const d = row.requestedDate || row.requested_date || row.createdAt || row.created_at;
        return d ? String(d).split("T")[0] : "-";
    }},
    { label: "Status", render: (row) => {
      const status = row.status || "UNKNOWN";
      const colors = statusColors[status] || statusColors.PENDING;
      return <Chip label={status.replace("_", " ")} size="small" sx={{ fontWeight: 700, fontSize: 10, height: 20, backgroundColor: colors.bg, color: colors.text, border: `1px solid ${colors.border}` }} />;
    }},
    { label: "Payment", render: (row) => {
      const pc = row.paymentStatus === 'PAID' ? { bg: C.emeraldLight, text: C.emerald, border: C.emeraldMid } : 
                 row.paymentStatus === 'PARTIAL' ? { bg: C.amberLight, text: C.amber, border: C.amberMid } : 
                 { bg: C.redLight, text: C.red, border: C.redMid };
      return <Chip label={row.paymentStatus || 'UNPAID'} size="small" sx={{ fontWeight: 700, fontSize: 9, height: 18, backgroundColor: pc.bg, color: pc.text, border: `1px solid ${pc.border}` }} />;
    }},
    { label: "Items",        render: (row) => row.itemCount || row.item_count || (row.items ? row.items.length : 0) },
    { label: "Total Amount", render: (row) => {
      const amt = row.totalAmount || row.total_amount || 0;
      return <Typography sx={{ fontSize: 13, fontWeight: 700, color: C.blue }}>₹{amt.toLocaleString()}</Typography>;
    }},
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


        {row.paymentStatus !== "PAID" && row.status !== "CANCELLED" && (
          <Tooltip title="Pay Order">
            <IconButton size="small" onClick={() => onPay(row)} sx={{ color: C.emerald, "&:hover": { backgroundColor: C.emeraldLight } }}>
              <PaymentIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
        {row.paymentStatus === "PAID" && (
          <Tooltip title="Download Bill">
            <IconButton size="small" onClick={() => onDownloadBill(row.id)} sx={{ color: C.blue, "&:hover": { backgroundColor: C.blueLight } }}>
              <ReceiptIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
        {row.status === "PENDING" && (
          <>
            <Tooltip title="Edit">
              <IconButton size="small" onClick={() => onEdit(row)} sx={{ color: C.blue, "&:hover": { backgroundColor: C.blueLight } }}>
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Request Cancel">
              <IconButton size="small" onClick={() => onCancel(row.id)} sx={{ color: C.amber, "&:hover": { backgroundColor: C.amberLight } }}>
                <CancelIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete">
              <IconButton size="small" onClick={() => onDelete(row.id)} sx={{ color: C.red, "&:hover": { backgroundColor: C.redLight } }}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </>
        )}
      </Box>
    )},
  ];

  return <EnterpriseTable columns={columns} data={orders} onBulkDelete={onBulkDelete} />;
}

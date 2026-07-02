import { Chip, Box, Typography, IconButton, Tooltip } from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EnterpriseTable from "../shared/EnterpriseTable";
import { C } from "../../theme/colors";

export default function StockTable({ stock, onView }) {
  const columns = [
    { label: "Product", render: (row) => (
      <Box>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>{row.productName}</Typography>
        <Typography variant="caption" color="textSecondary">{row.productCode} • {row.divisionName}</Typography>
      </Box>
    )},
    { label: "Outlet",       render: (row) => row.outletName },
    { label: "Quantity",     render: (row) => (
      <Chip label={row.quantity} size="small"
        sx={{ fontWeight: 700, backgroundColor: row.quantity > 10 ? C.bgMuted : C.redLight, color: row.quantity > 10 ? C.slate : C.red }} />
    )},
    { label: "Last Batch",   render: (row) => (
      <Chip label={row.lastBatchCode} size="small" sx={{ fontSize: 10, backgroundColor: C.blueLight, color: C.blue }} />
    )},
    { label: "Last Updated", render: (row) => new Date(row.lastUpdatedAt).toLocaleString() },
    { label: "Actions", align: "right", render: (row) => (
      <Box display="flex" justifyContent="flex-end">
        <Tooltip title="View">
          <IconButton size="small" onClick={() => onView(row)} sx={{ color: C.teal, "&:hover": { backgroundColor: C.tealLight } }}>
            <VisibilityIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    )},
  ];

  return <EnterpriseTable columns={columns} data={stock} />;
}

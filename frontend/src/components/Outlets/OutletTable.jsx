import { TableRow, TableCell, Typography, Chip, IconButton, Tooltip, Avatar, Box } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EnterpriseTable from "../shared/EnterpriseTable";
import { C } from "../../theme/colors";

const TYPE_COLORS = {
  Wholesale: { bg: C.blueLight, color: C.blue },
  Distribution: { bg: C.tealLight, color: C.teal },
  Franchise: { bg: C.emeraldLight, color: C.emerald },
  Warehouse: { bg: C.amberLight, color: C.amber },
};

export default function OutletTable({ outlets, onEdit, onDelete, onView }) {
  const columns = ["Outlet", "Code", "Location", "Type", "Owner", "Address", "Divisions", "Actions"];

  const rows = outlets.map((o, i) => {
    const tc = TYPE_COLORS[o.outletType] || { bg: C.slateLight, color: C.slate };
    return (
      <TableRow key={o.id} sx={{ backgroundColor: i % 2 === 0 ? C.surface : C.white, "&:hover": { backgroundColor: C.blueLight }, transition: "background 0.15s" }}>
        <TableCell>
          <Box display="flex" alignItems="center" gap={1.5}>
            <Avatar sx={{ width: 32, height: 32, fontSize: 13, fontWeight: 700, backgroundColor: C.teal, borderRadius: 1.5 }}>
              {o.outletName?.[0]?.toUpperCase()}
            </Avatar>
            <Typography fontWeight="600" fontSize={14} color={C.navy}>{o.outletName}</Typography>
          </Box>
        </TableCell>
        <TableCell><Chip label={o.outletCode || "N/A"} size="small" sx={{ backgroundColor: C.slateLight, color: C.slate, fontWeight: 600, fontSize: 11, borderRadius: 1 }} /></TableCell>
        <TableCell><Typography fontSize={13} color={C.slate}>{o.locationName || "—"}</Typography></TableCell>
        <TableCell><Chip label={o.outletType || "—"} size="small" sx={{ backgroundColor: tc.bg, color: tc.color, fontWeight: 700, fontSize: 11, borderRadius: 1 }} /></TableCell>
        <TableCell><Typography fontSize={13} color={C.slate}>{o.ownerName}</Typography></TableCell>
        <TableCell><Typography fontSize={13} color={C.slate} sx={{ maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.address}</Typography></TableCell>
        <TableCell>
          <Box display="flex" flexWrap="wrap" gap={0.5}>
            {o.divisions?.map((d) => (
              <Chip key={d.id} label={d.name} size="small" sx={{ backgroundColor: C.emeraldLight, color: C.emerald, fontWeight: 600, fontSize: 10, borderRadius: 1 }} />
            ))}
          </Box>
        </TableCell>
        <TableCell>
          <Tooltip title="View">
            <IconButton size="small" onClick={() => onView(o)} sx={{ color: C.teal, "&:hover": { backgroundColor: C.tealLight }, borderRadius: 1.5, mr: 0.5 }}>
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit">
            <IconButton size="small" onClick={() => onEdit(o)} sx={{ color: C.blue, "&:hover": { backgroundColor: C.blueLight }, borderRadius: 1.5, mr: 0.5 }}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton size="small" onClick={() => onDelete(o.id)} sx={{ color: C.red, "&:hover": { backgroundColor: C.redLight }, borderRadius: 1.5 }}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </TableCell>
      </TableRow>
    );
  });

  return <EnterpriseTable columns={columns} rows={rows} emptyMessage="No outlets found" />;
}

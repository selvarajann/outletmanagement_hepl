import { TableRow, TableCell, Typography, IconButton, Tooltip, Avatar, Box, Chip } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EnterpriseTable from "../shared/EnterpriseTable";
import { C } from "../../theme/colors";

export default function LocationTable({ locations, onEdit, onDelete, onView }) {
  const columns = ["#", "Location", "Actions"];

  const rows = locations.map((l, i) => (
    <TableRow key={l.id} sx={{ backgroundColor: i % 2 === 0 ? C.surface : C.white, "&:hover": { backgroundColor: C.blueLight }, transition: "background 0.15s" }}>
      <TableCell>
        <Chip label={i + 1} size="small" sx={{ backgroundColor: C.slateLight, color: C.slate, fontWeight: 700, fontSize: 11, borderRadius: 1, minWidth: 28 }} />
      </TableCell>
      <TableCell>
        <Box display="flex" alignItems="center" gap={1.5}>
          <Avatar sx={{ width: 32, height: 32, fontSize: 13, fontWeight: 700, backgroundColor: C.amber, borderRadius: 1.5 }}>
            {l.name?.[0]?.toUpperCase()}
          </Avatar>
          <Typography fontWeight="600" fontSize={14} color={C.navy}>{l.name}</Typography>
        </Box>
      </TableCell>
      <TableCell>
        <Tooltip title="View">
          <IconButton size="small" onClick={() => onView(l)} sx={{ color: C.teal, "&:hover": { backgroundColor: C.tealLight }, borderRadius: 1.5, mr: 0.5 }}>
            <VisibilityIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Edit">
          <IconButton size="small" onClick={() => onEdit(l)} sx={{ color: C.blue, "&:hover": { backgroundColor: C.blueLight }, borderRadius: 1.5, mr: 0.5 }}>
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Delete">
          <IconButton size="small" onClick={() => onDelete(l.id)} sx={{ color: C.red, "&:hover": { backgroundColor: C.redLight }, borderRadius: 1.5 }}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </TableCell>
    </TableRow>
  ));

  return <EnterpriseTable columns={columns} rows={rows} emptyMessage="No locations found" />;
}

import { TableRow, TableCell, Typography, Chip, IconButton, Tooltip, Avatar, Box } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import EnterpriseTable from "../shared/EnterpriseTable";
import { C } from "../../theme/colors";

const fmt = (n) => `₹${Number(n).toLocaleString("en-IN")}`;

export default function ProductTable({ products, onEdit, onDelete }) {
  const columns = ["Product", "Code", "UIM Price", "MRP", "Selling Price", "Purchase Price", "Actions"];

  const rows = products.map((p, i) => (
    <TableRow
      key={p.id}
      sx={{
        backgroundColor: i % 2 === 0 ? C.surface : C.white,
        "&:hover": { backgroundColor: C.blueLight },
        transition: "background 0.15s",
      }}
    >
      <TableCell>
        <Box display="flex" alignItems="center" gap={1.5}>
          <Avatar sx={{ width: 32, height: 32, fontSize: 13, fontWeight: 700, backgroundColor: C.blue, borderRadius: 1.5 }}>
            {p.name?.[0]?.toUpperCase()}
          </Avatar>
          <Typography fontWeight="600" fontSize={14} color={C.navy}>{p.name}</Typography>
        </Box>
      </TableCell>
      <TableCell>
        <Chip label={p.productCode || "N/A"} size="small"
          sx={{ backgroundColor: C.slateLight, color: C.slate, fontWeight: 600, fontSize: 11, borderRadius: 1 }} />
      </TableCell>
      <TableCell>
        <Typography fontSize={13} color={C.slate}>{fmt(p.uimPrice ?? 0)}</Typography>
      </TableCell>
      <TableCell>
        <Typography fontSize={13} color={C.slate}>{fmt(p.mrp ?? 0)}</Typography>
      </TableCell>
      <TableCell>
        <Chip label={fmt(p.sellingPrice)} size="small"
          sx={{ backgroundColor: C.emeraldLight, color: C.emerald, fontWeight: 700, fontSize: 11, borderRadius: 1 }} />
      </TableCell>
      <TableCell>
        <Chip label={fmt(p.purchasePrice)} size="small"
          sx={{ backgroundColor: C.amberLight, color: C.amber, fontWeight: 700, fontSize: 11, borderRadius: 1 }} />
      </TableCell>
      <TableCell>
        <Tooltip title="Edit">
          <IconButton size="small" onClick={() => onEdit(p)}
            sx={{ color: C.blue, "&:hover": { backgroundColor: C.blueLight }, borderRadius: 1.5, mr: 0.5 }}>
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Delete">
          <IconButton size="small" onClick={() => onDelete(p.id)}
            sx={{ color: C.red, "&:hover": { backgroundColor: C.redLight }, borderRadius: 1.5 }}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </TableCell>
    </TableRow>
  ));

  return <EnterpriseTable columns={columns} rows={rows} emptyMessage="No products found" />;
}

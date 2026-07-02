import { Typography, Chip, IconButton, Tooltip, Avatar, Box } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EnterpriseTable from "../shared/EnterpriseTable";
import { C } from "../../theme/colors";

export default function DivisionTable({ divisions, onEdit, onDelete, onView }) {
  const columns = [
    { label: "#", render: (_, i) => <Chip label={i + 1} size="small" sx={{ backgroundColor: C.slateLight, color: C.slate, fontWeight: 700, fontSize: 11, borderRadius: 1, minWidth: 28 }} /> },
    { label: "Division", render: (d) => (
      <Box display="flex" alignItems="center" gap={1.5}>
        <Avatar sx={{ width: 32, height: 32, fontSize: 13, fontWeight: 700, backgroundColor: C.emerald, borderRadius: 1.5 }}>
          {d.name?.[0]?.toUpperCase()}
        </Avatar>
        <Box>
          <Typography fontWeight="600" fontSize={14} color={C.navy}>{d.name}</Typography>
          <Typography variant="caption" sx={{ color: C.slate }}>{d.products?.length || 0} products</Typography>
        </Box>
      </Box>
    )},
    { label: "Products", render: (d) => (
      <Box display="flex" flexWrap="wrap" gap={0.5}>
        {d.products?.length > 0
          ? d.products.map((p) => (
            <Chip key={p.id} label={p.name} size="small" sx={{ backgroundColor: C.blueLight, color: C.blue, fontWeight: 600, fontSize: 10, borderRadius: 1 }} />
          ))
          : <Typography variant="caption" sx={{ color: C.slate }}>No products</Typography>
        }
      </Box>
    )},
    { label: "Actions", align: "right", render: (d) => (
      <Box display="flex" justifyContent="flex-end" gap={0.5}>
        <Tooltip title="View"><IconButton size="small" onClick={() => onView(d)} sx={{ color: C.teal, "&:hover": { backgroundColor: C.tealLight }, borderRadius: 1.5 }}><VisibilityIcon fontSize="small" /></IconButton></Tooltip>
        <Tooltip title="Edit"><IconButton size="small" onClick={() => onEdit(d)} sx={{ color: C.blue, "&:hover": { backgroundColor: C.blueLight }, borderRadius: 1.5 }}><EditIcon fontSize="small" /></IconButton></Tooltip>
        <Tooltip title="Delete"><IconButton size="small" onClick={() => onDelete(d.id)} sx={{ color: C.red, "&:hover": { backgroundColor: C.redLight }, borderRadius: 1.5 }}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
      </Box>
    )},
  ];

  return <EnterpriseTable columns={columns} data={divisions} emptyMessage="No divisions found" />;
}

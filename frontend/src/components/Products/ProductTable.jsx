import { useRef, useState, memo } from "react";
import { TableRow, TableCell, Typography, Chip, IconButton, Tooltip, Avatar, Box, CircularProgress } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import { toast } from "react-toastify";
import EnterpriseTable from "../shared/EnterpriseTable";
import { C } from "../../theme/colors";

// Use an empty base so image src is a relative URL (e.g. /uploads/products/...)
// This ensures image requests go through the Vite dev proxy (→ localhost:8080)
// instead of bypassing it with a hardcoded http://localhost:8080 absolute URL.
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const fmt = (n) => `₹${Number(n).toLocaleString("en-IN")}`;

const ProductRow = memo(({ product: p, index: i, isUploading, onEdit, onDelete, onView, onImageUpload, setUploadingId }) => {
  const inputRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      toast.error("Only JPEG, PNG, WebP, and GIF images are allowed.");
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      toast.error("Image size must be under 5MB.");
      return;
    }

    setUploadingId(p.id);
    try {
      await onImageUpload(p, file);
    } finally {
      setUploadingId(null);
    }
  };

  return (
    <TableRow sx={{ backgroundColor: i % 2 === 0 ? C.surface : C.white, "&:hover": { backgroundColor: C.blueLight }, transition: "background 0.15s" }}>
      <TableCell>
        <Box display="flex" alignItems="center" gap={1.5}>
          {p.imageUrl ? (
            <Avatar
              src={`${BASE_URL}${p.imageUrl}`}
              variant="rounded"
              sx={{ width: 36, height: 36, borderRadius: 1.5, border: `1px solid ${C.border}` }}
            />
          ) : (
            <Avatar sx={{ width: 36, height: 36, fontSize: 13, fontWeight: 700, backgroundColor: C.blue, borderRadius: 1.5 }}>
              {p.name?.[0]?.toUpperCase()}
            </Avatar>
          )}
          <Typography fontWeight="600" fontSize={14} color={C.navy}>{p.name}</Typography>
        </Box>
      </TableCell>
      <TableCell><Chip label={p.productCode || "N/A"} size="small" sx={{ backgroundColor: C.slateLight, color: C.slate, fontWeight: 600, fontSize: 11, borderRadius: 1 }} /></TableCell>
      <TableCell><Typography fontSize={13} color={C.slate}>{fmt(p.uimPrice ?? 0)}</Typography></TableCell>
      <TableCell><Typography fontSize={13} color={C.slate}>{fmt(p.mrp ?? 0)}</Typography></TableCell>
      <TableCell><Chip label={fmt(p.sellingPrice)} size="small" sx={{ backgroundColor: C.emeraldLight, color: C.emerald, fontWeight: 700, fontSize: 11, borderRadius: 1 }} /></TableCell>
      <TableCell><Chip label={fmt(p.purchasePrice)} size="small" sx={{ backgroundColor: C.amberLight, color: C.amber, fontWeight: 700, fontSize: 11, borderRadius: 1 }} /></TableCell>
      <TableCell>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
        <Tooltip title="View"><IconButton size="small" onClick={() => onView(p)} sx={{ color: C.teal, "&:hover": { backgroundColor: C.tealLight }, borderRadius: 1.5, mr: 0.5 }}><VisibilityIcon fontSize="small" /></IconButton></Tooltip>
        <Tooltip title="Edit"><IconButton size="small" onClick={() => onEdit(p)} sx={{ color: C.blue, "&:hover": { backgroundColor: C.blueLight }, borderRadius: 1.5, mr: 0.5 }}><EditIcon fontSize="small" /></IconButton></Tooltip>
        <Tooltip title="Upload Image">
          <span>
            <IconButton
              size="small"
              disabled={isUploading}
              onClick={() => inputRef.current?.click()}
              sx={{ color: C.slate, "&:hover": { backgroundColor: C.slateLight }, borderRadius: 1.5, mr: 0.5 }}
            >
              {isUploading
                ? <CircularProgress size={16} sx={{ color: C.slate }} />
                : <AddPhotoAlternateIcon fontSize="small" />}
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Delete"><IconButton size="small" onClick={() => onDelete(p.id)} sx={{ color: C.red, "&:hover": { backgroundColor: C.redLight }, borderRadius: 1.5 }}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
      </TableCell>
    </TableRow>
  );
});

export default function ProductTable({ products, onEdit, onDelete, onView, onImageUpload }) {
  const columns = ["Product", "Code", "UIM Price", "MRP", "Selling Price", "Purchase Price", "Actions"];
  const [uploadingId, setUploadingId] = useState(null);

  const rows = products.map((p, i) => (
    <ProductRow
      key={p.id}
      product={p}
      index={i}
      isUploading={uploadingId === p.id}
      onEdit={onEdit}
      onDelete={onDelete}
      onView={onView}
      onImageUpload={onImageUpload}
      setUploadingId={setUploadingId}
    />
  ));

  return <EnterpriseTable columns={columns} rows={rows} emptyMessage="No products found" />;
}

import { Chip } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import BlockIcon from "@mui/icons-material/Block";
import { C } from "../../theme/colors";

export default function StatusChip({ active }) {
  return (
    <Chip
      label={active ? "Active" : "Inactive"}
      size="small"
      icon={active 
        ? <CheckCircleIcon style={{ fontSize: 13, color: C.emerald }} /> 
        : <BlockIcon style={{ fontSize: 13, color: C.red }} />}
      sx={{
        backgroundColor: active ? C.emeraldLight : C.redLight,
        color: active ? C.emerald : C.red,
        fontWeight: 700,
        fontSize: 11,
        borderRadius: 1.5,
      }}
    />
  );
}

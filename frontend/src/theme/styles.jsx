import { C } from "./colors";

/**
 * Reusable row styling for raw <TableRow> components used inside EnterpriseTable.
 * Matches the native object-mapping style of EnterpriseTable.
 */
export const enterpriseRowSx = {
  backgroundColor: C.white,
  transition: "background-color 0.15s ease",
  "&:hover": { backgroundColor: C.blueLight }, // Distinct solid blue tint on hover
  "&:last-child td": { borderBottom: "none" },
};

/**
 * Reusable column header styling for EnterpriseTable.
 */
export const enterpriseHeaderSx = {
  backgroundColor: C.bgMuted, // Stronger slate contrast for the header
  color: C.navy,
  fontWeight: 700,
  fontSize: "11px",
  letterSpacing: "0.5px",
  textTransform: "uppercase",
  py: 1.5,
  px: 2.5,
  borderBottom: `1px solid ${C.border}`,
  whiteSpace: "nowrap",
  "&:last-child": { pr: 2.5 },
};

/**
 * Reusable styling for form fields and selects within Filter components.
 */
export const filterFieldSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: 2,
    fontSize: 13,
    backgroundColor: C.white,
    "& fieldset": { borderColor: C.border },
    "&:hover fieldset": { borderColor: C.blue },
    "&.Mui-focused fieldset": { borderColor: C.blue },
  },
  "& .MuiInputLabel-root.Mui-focused": { color: C.blue },
};

/**
 * Reusable styling for the outer wrapper <Box> of Filter components.
 */
export const filterWrapperSx = {
  p: 2,
  mb: 2.5,
  backgroundColor: C.white,
  border: `1px solid ${C.border}`,
  borderRadius: "14px",
  width: "100%",
};

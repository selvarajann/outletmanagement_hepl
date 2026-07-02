import {
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Box, Typography
} from "@mui/material";
import TableChartOutlinedIcon from "@mui/icons-material/TableChartOutlined";
import { C } from "../../theme/colors";
import { enterpriseHeaderSx, enterpriseRowSx } from "../../theme/styles";

import { memo } from "react";

/**
 * Premium Data Table
 */
export default memo(function EnterpriseTable({ columns = [], rows, data, emptyMessage = "No records found" }) {
  const isObjectColumns = columns.length > 0 && typeof columns[0] === "object";
  const tableData = data ?? rows ?? [];

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: "14px",
        border: `1px solid ${C.border}`,
        overflow: "hidden",
        backgroundColor: C.white,
        boxShadow: "0 2px 8px rgba(15,23,42,0.03)",
      }}
    >
      <TableContainer sx={{ maxHeight: "70vh" }}>
        <Table stickyHeader>
          {/* ── Header ── */}
          <TableHead>
            <TableRow>
              {columns.map((col, i) => (
                <TableCell
                  key={isObjectColumns ? `${col.label}-${i}` : `${col}-${i}`}
                  align={isObjectColumns ? (col.align || "left") : "left"}
                  sx={enterpriseHeaderSx}
                >
                  {isObjectColumns ? col.label : col}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          {/* ── Body ── */}
          <TableBody>
            {isObjectColumns ? (
              tableData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} sx={{ border: "none" }}>
                    <EmptyState message={emptyMessage} />
                  </TableCell>
                </TableRow>
              ) : (
                tableData.map((row, rowIdx) => (
                  <TableRow
                    key={row.id ?? rowIdx}
                    sx={enterpriseRowSx}
                  >
                    {columns.map((col, colIdx) => (
                      <TableCell
                        key={colIdx}
                        align={col.align || "left"}
                        sx={{
                          py: 1.5,
                          px: 2.5,
                          fontSize: "13px",
                          fontWeight: 500,
                          color: C.navy,
                          borderBottom: `1px solid ${C.border}`,
                        }}
                      >
                        {col.render ? col.render(row, rowIdx) : row[col.key]}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )
            ) : (
              // Raw row passing
              tableData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} sx={{ border: "none" }}>
                    <EmptyState message={emptyMessage} />
                  </TableCell>
                </TableRow>
              ) : (
                tableData
              )
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
});

function EmptyState({ message }) {
  return (
    <Box
      sx={{
        py: 8,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 2,
      }}
    >
      <Box
        sx={{
          width: 56,
          height: 56,
          borderRadius: "14px",
          background: C.bgMuted,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: `1px solid ${C.border}`,
        }}
      >
        <TableChartOutlinedIcon sx={{ fontSize: 28, color: C.muted }} />
      </Box>
      <Typography sx={{ color: C.slateMid, fontSize: "14px", fontWeight: 600 }}>
        {message}
      </Typography>
    </Box>
  );
}

import {
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Box, Typography
} from "@mui/material";
import { C } from "../../theme/colors";

export default function EnterpriseTable({ columns, rows, emptyMessage = "No records found" }) {
  return (
    <Paper elevation={0} sx={{ borderRadius: 3, border: `1px solid ${C.border}`, overflow: "hidden" }}>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: C.navy }}>
              {columns.map((col) => (
                <TableCell
                  key={col}
                  sx={{
                    color: "#94a3b8",
                    fontWeight: 700,
                    fontSize: 11,
                    letterSpacing: 0.8,
                    textTransform: "uppercase",
                    py: 1.5,
                    borderBottom: "none",
                    whiteSpace: "nowrap",
                  }}
                >
                  {col}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length}>
                  <Box py={5} textAlign="center">
                    <Typography variant="body2" sx={{ color: C.slate }}>{emptyMessage}</Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : rows}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}

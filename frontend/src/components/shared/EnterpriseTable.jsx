import { Paper, Box, Typography, Button } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import TableChartOutlinedIcon from "@mui/icons-material/TableChartOutlined";
import DeleteSweepIcon from "@mui/icons-material/DeleteSweep";
import { C } from "../../theme/colors";
import { memo, useState } from "react";
import ConfirmDialog from "./ConfirmDialog";

/**
 * Premium Data Table powered by MUI DataGrid
 */
export default memo(function EnterpriseTable({ 
  columns = [], 
  rows, 
  data, 
  emptyMessage = "No records found", 
  minWidth = 900, 
  enableBulkSelect = false, 
  onBulkDelete 
}) {
  const isObjectColumns = columns.length > 0 && typeof columns[0] === "object";
  const tableData = data ?? rows ?? [];
  const [selectedIds, setSelectedIds] = useState([]);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  // Enable checkbox selection if either prop is provided
  const shouldShowCheckboxes = enableBulkSelect || !!onBulkDelete;

  // Adapt custom columns to DataGrid GridColDef
  const gridColumns = isObjectColumns
    ? columns.map((col, i) => {
        return {
          field: col.key || `col-${i}`,
          headerName: col.label,
          flex: 1, // To auto-expand
          minWidth: 150,
          align: col.align || "left",
          headerAlign: col.align || "left",
          sortable: col.sortable !== false,
          renderCell: col.render
            ? (params) => {
                // We pass params.row to match the expected signature
                return col.render(params.row, tableData.findIndex(r => r.id === params.id || r === params.row));
              }
            : undefined,
        };
      })
    : columns.map((col, i) => ({
        field: `col-${i}`,
        headerName: col,
        flex: 1,
        minWidth: 150,
      }));

  // Some components previously passed RAW React components to rows/data (e.g., in IMSOrders when they passed <TableRow> tags). 
  // We need to gracefully handle that, although all our refactored usages should pass array of objects.
  if (!isObjectColumns || (tableData.length > 0 && !tableData[0] && typeof tableData[0] !== "object")) {
    return (
      <Paper elevation={0} sx={{ borderRadius: "14px", border: `1px solid ${C.border}`, overflow: "hidden", p: 2, textAlign: 'center' }}>
        <Typography color="error">EnterpriseTable: Legacy raw table rows are not supported by DataGrid. Please pass an array of data objects.</Typography>
      </Paper>
    );
  }

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: "14px",
        border: `1px solid ${C.border}`,
        overflow: "hidden",
        backgroundColor: C.white,
        boxShadow: "0 2px 8px rgba(15,23,42,0.03)",
        width: "100%",
        minWidth: { xs: '100%', md: minWidth },
      }}
    >
      {selectedIds.length > 0 && onBulkDelete && (
        <Box sx={{ p: 1.5, display: "flex", justifyContent: "flex-end", bgcolor: "#f8fafc", borderBottom: `1px solid ${C.border}` }}>
          <Button
            variant="contained"
            color="error"
            startIcon={<DeleteSweepIcon />}
            onClick={() => setConfirmDeleteOpen(true)}
            sx={{ borderRadius: 2, textTransform: "none", fontWeight: 700 }}
          >
            Delete Selected ({selectedIds.length})
          </Button>
        </Box>
      )}
      <ConfirmDialog
        open={confirmDeleteOpen}
        title="Delete Selected Items"
        message={`Are you sure you want to delete ${selectedIds.length} items? This action cannot be undone.`}
        confirmText="Delete"
        confirmColor="error"
        onConfirm={() => {
          onBulkDelete(selectedIds);
          setSelectedIds([]);
          setConfirmDeleteOpen(false);
        }}
        onClose={() => setConfirmDeleteOpen(false)}
      />
      <DataGrid
        rows={tableData}
        columns={gridColumns}
        getRowId={(row) => row.id ?? tableData.indexOf(row)}
        disableRowSelectionOnClick
        hideFooter // We hide the footer because the app uses custom external TablePagination
        autoHeight
        checkboxSelection={shouldShowCheckboxes}
        onRowSelectionModelChange={(newSelection) => setSelectedIds(newSelection)}
        rowSelectionModel={selectedIds}
        getRowHeight={() => 'auto'}
        slots={{
          noRowsOverlay: () => <EmptyState message={emptyMessage} />,
        }}
        sx={{
          border: "none",
          "& .MuiDataGrid-columnHeaders": {
            backgroundColor: C.surface,
            borderBottom: `2px solid ${C.border}`,
            minHeight: "52px !important",
            maxHeight: "52px !important",
          },
          "& .MuiDataGrid-columnHeaderTitle": {
            fontWeight: 700,
            fontSize: "12px",
            color: C.slateMid,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          },
          "& .MuiDataGrid-iconButtonContainer": {
            color: C.slateMid,
          },
          "& .MuiDataGrid-sortIcon": {
            color: C.slateMid,
          },
          "& .MuiDataGrid-menuIcon": {
            color: C.slateMid,
            width: "auto",
          },
          "& .MuiDataGrid-columnSeparator": {
            display: "none",
          },
          "& .MuiDataGrid-row": {
            borderBottom: `1px solid ${C.border}`,
            "&:hover": {
              backgroundColor: C.bgLight,
            },
          },
          "& .MuiDataGrid-cell": {
            borderBottom: "none",
            display: "flex",
            alignItems: "center",
            py: 1.5,
            px: 2.5,
            fontSize: "13px",
            fontWeight: 500,
            color: C.navy,
            whiteSpace: "normal",
            wordBreak: "break-word",
          },
          "& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within": {
            outline: "none !important", // Remove blue outline when clicking cells
          },
          "& .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-columnHeader:focus-within": {
            outline: "none !important",
          },
          "& .MuiDataGrid-virtualScroller": {
            minHeight: tableData.length === 0 ? 300 : "auto",
          },
        }}
      />
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
        height: "100%",
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

import React, { useState } from "react";
import { C } from "../theme/colors";
import { Box, Typography, Button, Drawer } from "@mui/material";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import PageHeader from "../components/shared/PageHeader";
import EnterpriseTable from "../components/shared/EnterpriseTable";
import TablePagination from "../components/shared/TablePagination";
import ActionButton from "../components/common/ActionButton";
import { getReconciliationReports, getReportMismatches, triggerReconciliation } from "../services/ReconciliationService";

const ReconciliationDashboard = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ["reconciliationReports", page, size],
    queryFn: ({ signal }) => getReconciliationReports({ page, size }, signal),
  });

  const { data: mismatches, isLoading: loadingMismatches } = useQuery({
    queryKey: ["reportMismatches", selectedReportId],
    queryFn: ({ signal }) => getReportMismatches(selectedReportId, signal),
    enabled: !!selectedReportId && drawerOpen,
  });

  const triggerMutation = useMutation({
    mutationFn: triggerReconciliation,
    onSuccess: () => {
      toast.success("Manual reconciliation triggered successfully.");
      queryClient.invalidateQueries(["reconciliationReports"]);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to trigger reconciliation.");
    }
  });

  const handleViewDetails = (id) => {
    setSelectedReportId(id);
    setDrawerOpen(true);
  };

  const columns = [
    { key: "reportCode", label: "Report Code", flex: 1 },
    { key: "startedAt", label: "Started", flex: 1 },
    { key: "completedAt", label: "Completed", flex: 1 },
    { key: "status", label: "Status", flex: 1 },
    { key: "totalItemsScanned", label: "Scanned", width: 100 },
    { key: "totalMismatchesFound", label: "Mismatches", width: 120 },
    {
      key: "actions",
      label: "Actions",
      width: 150,
      render: (row) => (
        <ActionButton onClick={() => handleViewDetails(row.id)} color="primary">Details</ActionButton>
      ),
    },
  ];

  const mismatchColumns = [
    { key: "productCode", label: "Product", flex: 1 },
    { key: "omsQuantity", label: "OMS Qty", width: 100 },
    { key: "imsQuantity", label: "IMS Qty", width: 100 },
    { key: "mismatchType", label: "Type", flex: 1 },
  ];

  return (
    <Box sx={{ p: 3, backgroundColor: C.surface, minHeight: "100vh" }}>
      <PageHeader 
        title="Reconciliation Dashboard" 
        subtitle="Nightly inventory consistency reports between OMS and IMS"
      />
      
      <Box mb={2} display="flex" justifyContent="flex-end">
        <Button 
          variant="contained" 
          onClick={() => triggerMutation.mutate()}
          disabled={triggerMutation.isPending}
        >
          {triggerMutation.isPending ? "Running..." : "Run Now"}
        </Button>
      </Box>

      <EnterpriseTable
        data={data?.rows || []}
        columns={columns}
      />
      <TablePagination 
        page={page} 
        totalPages={data?.totalPages || 1} 
        onPageChange={setPage} 
      />

      <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <Box p={3} width={600}>
          <Typography variant="h6" mb={2}>Mismatch Details</Typography>
          <EnterpriseTable
            data={mismatches || []}
            columns={mismatchColumns}
          />
        </Box>
      </Drawer>
    </Box>
  );
};

export default ReconciliationDashboard;

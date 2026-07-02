import React, { useState } from "react";
import { C } from "../theme/colors";
import { Box, Typography, TextField, Button, Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import PageHeader from "../components/shared/PageHeader";
import EnterpriseTable from "../components/shared/EnterpriseTable";
import TablePagination from "../components/shared/TablePagination";
import FormDialog from "../components/shared/FormDialog";
import ConfirmDialog from "../components/shared/ConfirmDialog";
import ActionButton from "../components/common/ActionButton";
import { getQuarantinedBatchItems, approveQuarantine, rejectQuarantine } from "../services/BatchQuarantineService";

const QuarantineReview = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["quarantinedItems", page, size],
    queryFn: ({ signal }) => getQuarantinedBatchItems({ page, size }, signal),
  });

  const approveMutation = useMutation({
    mutationFn: approveQuarantine,
    onSuccess: () => {
      toast.success("Quarantine approved.");
      queryClient.invalidateQueries(["quarantinedItems"]);
      setApproveDialogOpen(false);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to approve quarantine.");
    }
  });

  const rejectMutation = useMutation({
    mutationFn: rejectQuarantine,
    onSuccess: () => {
      toast.success("Quarantine rejected.");
      queryClient.invalidateQueries(["quarantinedItems"]);
      setRejectDialogOpen(false);
      setRejectReason("");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to reject quarantine.");
    }
  });

  const handleApproveClick = (id) => {
    setSelectedItemId(id);
    setApproveDialogOpen(true);
  };

  const handleRejectClick = (id) => {
    setSelectedItemId(id);
    setRejectDialogOpen(true);
  };

  const columns = [
    { key: "batchCode", label: "IMS Batch Code", flex: 1 },
    { key: "productName", label: "Product", flex: 2 },
    { key: "outletName", label: "Outlet", flex: 1 },
    { key: "quantity", label: "Quantity", flex: 1 },
    { key: "quarantineReason", label: "Reason", flex: 2 },
    {
      key: "actions",
      label: "Actions",
      flex: 1,
      render: (row) => (
        <Box display="flex" gap={1}>
          <ActionButton onClick={() => handleApproveClick(row.id)} color="success">Approve</ActionButton>
          <ActionButton onClick={() => handleRejectClick(row.id)} color="error">Reject</ActionButton>
        </Box>
      ),
    },
  ];

  return (
    <Box sx={{ p: 3, backgroundColor: C.surface, minHeight: "100vh" }}>
      <PageHeader title="Quarantine Review" subtitle="Manage isolated shipments awaiting verification" />
      
      <EnterpriseTable
        data={data?.rows || []}
        columns={columns}
      />
      <TablePagination 
        page={page} 
        totalPages={data?.totalPages || 1} 
        onPageChange={setPage} 
      />

      <ConfirmDialog
        open={approveDialogOpen}
        title="Approve Quarantine"
        content="Are you sure you want to approve this batch? The stock will become available for sales immediately."
        onConfirm={() => approveMutation.mutate(selectedItemId)}
        onCancel={() => setApproveDialogOpen(false)}
        loading={approveMutation.isPending}
      />

      <FormDialog 
        open={rejectDialogOpen} 
        onClose={() => setRejectDialogOpen(false)}
        title="Reject Quarantine"
        submitLabel="Reject"
        onSubmit={() => rejectMutation.mutate({ batchItemId: selectedItemId, reason: rejectReason })}
        loading={rejectMutation.isPending}
      >
        <Typography mb={2} variant="body2" color="textSecondary">Please provide a reason for rejecting this batch. It will remain isolated.</Typography>
        <TextField
          fullWidth
          multiline
          rows={3}
          label="Reason"
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
        />
      </FormDialog>
    </Box>
  );
};

export default QuarantineReview;

import React, { useState } from "react";
import { C } from "../theme/colors";
import { Box, Typography, Tabs, Tab } from "@mui/material";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import PageHeader from "../components/shared/PageHeader";
import EnterpriseTable from "../components/shared/EnterpriseTable";
import ConfirmDialog from "../components/shared/ConfirmDialog";
import ActionButton from "../components/common/ActionButton";
import { getDeadLetters, retrySync } from "../services/SyncService";

const DeadLetterManager = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState(0);
  const [retryDialogOpen, setRetryDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ["deadLetters"],
    queryFn: ({ signal }) => getDeadLetters(signal),
  });

  const retryMutation = useMutation({
    mutationFn: retrySync,
    onSuccess: () => {
      toast.success("Retry initiated. Item has been pushed back to the sync queue.");
      queryClient.invalidateQueries(["deadLetters"]);
      setRetryDialogOpen(false);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to initiate retry.");
    }
  });

  const handleRetryClick = (type, id) => {
    setSelectedItem({ type, id });
    setRetryDialogOpen(true);
  };

  const commonColumns = [
    { key: "id", label: "ID", width: 90 },
    { key: "retryCount", label: "Retries", width: 100 },
  ];

  const getColumns = (type) => [
    ...commonColumns,
    { key: type === 'stock-order' ? "orderCode" : type === 'stock-return' ? "returnCode" : "shipmentCode", label: "Reference Code", flex: 1 },
    {
      key: "actions",
      label: "Actions",
      width: 150,
      render: (row) => (
        <ActionButton onClick={() => handleRetryClick(type, row.id)} color="primary">Retry</ActionButton>
      ),
    },
  ];

  const getRows = () => {
    if (!data) return [];
    if (activeTab === 0) return data.stockOrders || [];
    if (activeTab === 1) return data.stockReturns || [];
    if (activeTab === 2) return data.shipments || [];
    return [];
  };

  const getActiveType = () => {
    if (activeTab === 0) return 'stock-order';
    if (activeTab === 1) return 'stock-return';
    if (activeTab === 2) return 'shipment-receipt';
    return '';
  };

  return (
    <Box sx={{ p: 3, backgroundColor: C.surface, minHeight: "100vh" }}>
      <PageHeader title="Dead Letter Manager" subtitle="Manage and retry permanently failed sync operations" />
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={activeTab} onChange={(e, val) => setActiveTab(val)}>
          <Tab label={`Stock Orders (${data?.stockOrders?.length || 0})`} />
          <Tab label={`Stock Returns (${data?.stockReturns?.length || 0})`} />
          <Tab label={`Shipment Receipts (${data?.shipments?.length || 0})`} />
        </Tabs>
      </Box>

      {isLoading ? (
        <Box display="flex" justifyContent="center" py={4}>
          <Typography color={C.slate}>Loading...</Typography>
        </Box>
      ) : (
        <EnterpriseTable
          data={getRows()}
          columns={getColumns(getActiveType())}
        />
      )}

      <ConfirmDialog
        open={retryDialogOpen}
        title="Retry Sync Operation"
        content="This will reset the retry count and place the item back into the active processing queue. Are you sure?"
        onConfirm={() => retryMutation.mutate(selectedItem)}
        onCancel={() => setRetryDialogOpen(false)}
        loading={retryMutation.isPending}
      />
    </Box>
  );
};

export default DeadLetterManager;

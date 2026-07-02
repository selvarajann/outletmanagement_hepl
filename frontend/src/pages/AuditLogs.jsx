import React, { useState } from "react";
import { C } from "../theme/colors";
import { Box, TextField, Grid } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import PageHeader from "../components/shared/PageHeader";
import EnterpriseTable from "../components/shared/EnterpriseTable";
import TablePagination from "../components/shared/TablePagination";
import { GetAuditLogs } from "../services/AuditLogService";

const AuditLogs = () => {
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  
  // Filters
  const [username, setUsername] = useState("");
  const [entity, setEntity] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["auditLogs", page, size, username, entity],
    queryFn: ({ signal }) => GetAuditLogs({ page, size, username, entity }, signal),
  });

  const columns = [
    { key: "createdAt", label: "Date", width: 180, render: (row) => new Date(row.createdAt).toLocaleString() },
    { key: "username", label: "User", width: 120 },
    { key: "action", label: "Action", flex: 1 },
    { key: "entity", label: "Entity", width: 150 },
    { key: "businessKey", label: "Key", width: 150 },
    { key: "requestMethod", label: "Method", width: 100 },
    { key: "statusCode", label: "Status", width: 100 },
  ];

  return (
    <Box sx={{ p: 3, backgroundColor: C.surface, minHeight: "100vh" }}>
      <PageHeader 
        title="Audit Logs" 
        subtitle="Real-time system events and security audit trail"
      />
      
      <Box mb={3}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4} md={3}>
            <TextField
              fullWidth
              size="small"
              label="Username"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setPage(0);
              }}
            />
          </Grid>
          <Grid item xs={12} sm={4} md={3}>
            <TextField
              fullWidth
              size="small"
              label="Entity Type"
              value={entity}
              onChange={(e) => {
                setEntity(e.target.value);
                setPage(0);
              }}
            />
          </Grid>
        </Grid>
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
    </Box>
  );
};

export default AuditLogs;

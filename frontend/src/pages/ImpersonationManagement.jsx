import React, { useEffect, useState, useContext } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  CircularProgress,
  Chip,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import SupervisorAccountIcon from "@mui/icons-material/SupervisorAccount";
import StopIcon from "@mui/icons-material/Stop";
import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";
import { TextField, InputAdornment, MenuItem } from "@mui/material";
import impersonationService from "../services/impersonationService";
import axiosInstance from "../config/axiosInstance";
import { AuthContext } from "../context/AuthContext";
import { toast } from "react-toastify";

const ImpersonationManagement = () => {
  const { startImpersonation } = useContext(AuthContext);

  const [users, setUsers] = useState([]);
  const [activeSessions, setActiveSessions] = useState([]);
  const [history, setHistory] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingActive, setLoadingActive] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await axiosInstance.get("/api/v1/users");
      // Filter out SUPER_ADMIN, they cannot be impersonated
      const impersonableUsers = (res.data.data || []).filter(
        (u) => u.role !== "SUPER_ADMIN"
      );
      setUsers(impersonableUsers);
    } catch (e) {
      console.error("Failed to fetch users", e);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchActiveSessions = async () => {
    setLoadingActive(true);
    try {
      const data = await impersonationService.getActiveSessions();
      setActiveSessions(data || []);
    } catch (e) {
      console.error("Failed to fetch active sessions", e);
    } finally {
      setLoadingActive(false);
    }
  };

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const data = await impersonationService.getSessionHistory();
      setHistory(data || []);
    } catch (e) {
      console.error("Failed to fetch history", e);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchActiveSessions();
    fetchHistory();
  }, []);

  const handleStartImpersonation = async (userId) => {
    try {
      await startImpersonation(userId);
      toast.success("Impersonation session started successfully.");
    } catch (e) {
      toast.error("Failed to start impersonation: " + (e.response?.data?.message || e.message));
    }
  };

  const handleRevokeSession = async (adminUsername) => {
    toast.info("Revoking another admin's session requires a dedicated endpoint. Currently not supported.");
  };

  const userColumns = [
    { field: "username", headerName: "Username", flex: 1 },
    { field: "role", headerName: "Role", flex: 1 },
    {
      field: "active",
      headerName: "Status",
      flex: 1,
      renderCell: (params) => (
        <Chip
          label={params.value ? "Active" : "Inactive"}
          color={params.value ? "success" : "error"}
          size="small"
        />
      ),
    },
    {
      field: "actions",
      headerName: "Action",
      width: 150,
      renderCell: (params) => (
        <Button
          variant="contained"
          size="small"
          startIcon={<SupervisorAccountIcon />}
          onClick={() => handleStartImpersonation(params.row.id)}
          disabled={!params.row.active}
        >
          Impersonate
        </Button>
      ),
    },
  ];

  const sessionColumns = [
    { field: "adminUsername", headerName: "Admin", flex: 1 },
    { field: "targetUsername", headerName: "Target", flex: 1 },
    { field: "targetRole", headerName: "Role", flex: 1 },
    {
      field: "startedAt",
      headerName: "Started At",
      flex: 1,
      valueGetter: (params) => new Date(params.row.startedAt).toLocaleString(),
    },
    {
      field: "endedAt",
      headerName: "Ended At",
      flex: 1,
      valueGetter: (params) =>
        params.row.endedAt ? new Date(params.row.endedAt).toLocaleString() : "-",
    },
    { field: "endReason", headerName: "Reason", flex: 1 },
  ];

  const filteredUsers = users.filter((u) => {
    const matchesSearch = u.username.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "ALL" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" mb={3} color="primary">
        Impersonation Management
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 2, display: "flex", flexDirection: "column" }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Impersonable Users</Typography>
            </Box>
            
            <Box display="flex" gap={2} mb={2}>
              <TextField
                size="small"
                placeholder="Search by username..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
                sx={{ flexGrow: 1 }}
              />
              <TextField
                select
                size="small"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                sx={{ minWidth: 150 }}
              >
                <MenuItem value="ALL">All Roles</MenuItem>
                <MenuItem value="OUTLET_MANAGER">Outlet Manager</MenuItem>
                <MenuItem value="INVENTORY_MANAGER">Inventory Manager</MenuItem>
                <MenuItem value="SALES_OPERATOR">Sales Operator</MenuItem>
              </TextField>
            </Box>

            <Box sx={{ flexGrow: 1, width: "100%" }}>
              <DataGrid
                rows={filteredUsers}
                columns={userColumns}
                loading={loadingUsers}
                pageSizeOptions={[5, 10, 25]}
                initialState={{
                  pagination: { paginationModel: { pageSize: 5 } },
                }}
                disableRowSelectionOnClick
                autoHeight
              />
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 2, display: "flex", flexDirection: "column" }}>
            <Typography variant="h6" mb={2}>
              Live Sessions
            </Typography>
            <Box sx={{ flexGrow: 1, overflowY: "auto" }}>
              {loadingActive ? (
                <CircularProgress />
              ) : activeSessions.length === 0 ? (
                <Typography color="textSecondary">No active sessions right now.</Typography>
              ) : (
                activeSessions.map((session) => (
                  <Paper
                    key={session.id}
                    variant="outlined"
                    sx={{ p: 2, mb: 1, display: "flex", justifyContent: "space-between", alignItems: "center" }}
                  >
                    <Box>
                      <Typography variant="body2" fontWeight="bold">
                        {session.adminUsername} ➔ {session.targetUsername}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        Started: {new Date(session.startedAt).toLocaleTimeString()}
                      </Typography>
                    </Box>
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      startIcon={<StopIcon />}
                      onClick={() => handleRevokeSession(session.adminUsername)}
                    >
                      Revoke
                    </Button>
                  </Paper>
                ))
              )}
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 2, display: "flex", flexDirection: "column" }}>
            <Typography variant="h6" mb={2}>
              Session History
            </Typography>
            <Box sx={{ flexGrow: 1, width: "100%" }}>
              <DataGrid
                rows={history}
                columns={sessionColumns}
                loading={loadingHistory}
                pageSizeOptions={[5, 10, 25]}
                initialState={{
                  pagination: { paginationModel: { pageSize: 5 } },
                  sorting: {
                    sortModel: [{ field: "startedAt", sort: "desc" }],
                  },
                }}
                disableRowSelectionOnClick
                autoHeight
              />
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ImpersonationManagement;

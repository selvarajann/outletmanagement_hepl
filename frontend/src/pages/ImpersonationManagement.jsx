import React, { useEffect, useState, useContext } from "react";
import { C } from "../theme/colors";
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  CircularProgress,
  Chip,
} from "@mui/material";
import SupervisorAccountIcon from "@mui/icons-material/SupervisorAccount";
import StopIcon from "@mui/icons-material/Stop";
import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";
import { TextField, InputAdornment, MenuItem } from "@mui/material";
import impersonationService from "../services/impersonationService";
import axiosInstance from "../config/axiosInstance";
import { AuthContext } from "../context/AuthContext";
import { toast } from "react-toastify";
import EnterpriseTable from "../components/shared/EnterpriseTable";
import TablePagination from "../components/shared/TablePagination";
import PageHeader from "../components/shared/PageHeader";

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
  const [userPage, setUserPage] = useState(0);
  const [historyPage, setHistoryPage] = useState(0);

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
    { key: "username", label: "Username" },
    { key: "role", label: "Role" },
    {
      label: "Status",
      render: (row) => (
        <Chip
          label={row.active ? "Active" : "Inactive"}
          color={row.active ? "success" : "error"}
          size="small"
        />
      ),
    },
    {
      label: "Action",
      align: "right",
      render: (row) => (
        <Button
          variant="contained"
          size="small"
          startIcon={<SupervisorAccountIcon />}
          onClick={() => handleStartImpersonation(row.id)}
          disabled={!row.active}
        >
          Impersonate
        </Button>
      ),
    },
  ];

  const sessionColumns = [
    { key: "adminUsername", label: "Admin" },
    { key: "targetUsername", label: "Target" },
    { key: "targetRole", label: "Role" },
    {
      label: "Started At",
      render: (row) => new Date(row.startedAt).toLocaleString(),
    },
    {
      label: "Ended At",
      render: (row) =>
        row.endedAt ? new Date(row.endedAt).toLocaleString() : "-",
    },
    { key: "endReason", label: "Reason" },
  ];

  const filteredUsers = users.filter((u) => {
    const matchesSearch = u.username.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "ALL" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const paginatedUsers = filteredUsers.slice(userPage * 5, (userPage + 1) * 5);
  const totalUserPages = Math.ceil(filteredUsers.length / 5);

  const paginatedHistory = history.slice(historyPage * 5, (historyPage + 1) * 5);
  const totalHistoryPages = Math.ceil(history.length / 5);

  return (
    <Box sx={{ p: 3, backgroundColor: C.surface, minHeight: "100vh" }}>
      <PageHeader title="Impersonation Management" subtitle="Manage and monitor impersonation sessions" />

      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <Paper elevation={0} sx={{ p: 2.5, display: "flex", flexDirection: "column", bgcolor: C.white, border: `1px solid ${C.border}`, borderRadius: "14px" }}>
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
              {loadingUsers ? (
                <Box display="flex" justifyContent="center" py={4}><CircularProgress /></Box>
              ) : (
                <>
                  <EnterpriseTable
                    data={paginatedUsers}
                    columns={userColumns}
                  />
                  <TablePagination
                    page={userPage}
                    totalPages={totalUserPages}
                    onPageChange={setUserPage}
                  />
                </>
              )}
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={5}>
          <Paper elevation={0} sx={{ p: 2.5, display: "flex", flexDirection: "column", bgcolor: C.white, border: `1px solid ${C.border}`, borderRadius: "14px" }}>
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
                    sx={{ p: 2, mb: 1, display: "flex", justifyContent: "space-between", alignItems: "center", borderColor: C.border, borderRadius: "10px" }}
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
          <Paper elevation={0} sx={{ p: 2.5, display: "flex", flexDirection: "column", bgcolor: C.white, border: `1px solid ${C.border}`, borderRadius: "14px" }}>
            <Typography variant="h6" mb={2}>
              Session History
            </Typography>
            <Box sx={{ flexGrow: 1, width: "100%" }}>
              {loadingHistory ? (
                <Box display="flex" justifyContent="center" py={4}><CircularProgress /></Box>
              ) : (
                <>
                  <EnterpriseTable
                    data={paginatedHistory}
                    columns={sessionColumns}
                  />
                  <TablePagination
                    page={historyPage}
                    totalPages={totalHistoryPages}
                    onPageChange={setHistoryPage}
                  />
                </>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ImpersonationManagement;

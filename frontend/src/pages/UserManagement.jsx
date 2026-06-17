import { useState, useRef, useCallback, useMemo } from "react";
import {
  Box, Grid, Skeleton, CircularProgress, Chip, Typography,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, MenuItem, Switch, FormControlLabel,
  Divider, IconButton,
} from "@mui/material";
import PeopleAltIcon      from "@mui/icons-material/PeopleAlt";
import AdminPanelSettings from "@mui/icons-material/AdminPanelSettings";
import CheckCircleIcon    from "@mui/icons-material/CheckCircle";
import BlockIcon          from "@mui/icons-material/Block";
import EditIcon           from "@mui/icons-material/Edit";
import DeleteIcon         from "@mui/icons-material/Delete";
import VisibilityIcon     from "@mui/icons-material/Visibility";
import CloseIcon          from "@mui/icons-material/Close";
import { toast }          from "react-toastify";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import PageHeader      from "../components/shared/PageHeader";
import InfoCard        from "../components/shared/InfoCard";
import EnterpriseTable from "../components/shared/EnterpriseTable";
import ViewDialog, { ViewRow } from "../components/shared/ViewDialog";
import ConfirmDialog   from "../components/shared/ConfirmDialog";
import { C }           from "../theme/colors";
import {
  getUsers, createUser, updateUser, deleteUser,
} from "../services/UserService";

// ─── Role config ──────────────────────────────────────────────────────────────
const ROLES = ["SUPER_ADMIN", "OUTLET_MANAGER", "INVENTORY_MANAGER", "SALES_OPERATOR"];

const ROLE_COLOR = {
  SUPER_ADMIN:       { bg: "#ede9fe", color: "#6d28d9" },
  OUTLET_MANAGER:    { bg: C.blueLight,    color: C.blue },
  INVENTORY_MANAGER: { bg: C.tealLight,    color: C.teal },
  SALES_OPERATOR:    { bg: C.amberLight,   color: C.amber },
};

const emptyForm = { username: "", email: "", password: "", role: "OUTLET_MANAGER", active: true };

const validate = (form, isEdit) => {
  const e = {};
  if (!isEdit && !form.username.trim()) e.username = "Username is required";
  if (!form.email.trim()) e.email = "Email is required";
  else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Enter a valid email";
  if (!isEdit && !form.password.trim()) e.password = "Password is required";
  if (!form.role) e.role = "Role is required";
  return e;
};

// ─── Role Chip ────────────────────────────────────────────────────────────────
const RoleChip = ({ role }) => {
  const cfg = ROLE_COLOR[role] || { bg: C.slateLight, color: C.slate };
  return (
    <Chip
      label={role.replace(/_/g, " ")}
      size="small"
      sx={{
        backgroundColor: cfg.bg,
        color: cfg.color,
        fontWeight: 700,
        fontSize: 11,
        letterSpacing: 0.3,
        borderRadius: 1.5,
      }}
    />
  );
};

// ─── Status Chip ──────────────────────────────────────────────────────────────
const StatusChip = ({ active }) => (
  <Chip
    label={active ? "Active" : "Inactive"}
    size="small"
    icon={active
      ? <CheckCircleIcon style={{ fontSize: 13, color: C.emerald }} />
      : <BlockIcon       style={{ fontSize: 13, color: C.red }} />}
    sx={{
      backgroundColor: active ? C.emeraldLight : C.redLight,
      color: active ? C.emerald : C.red,
      fontWeight: 700,
      fontSize: 11,
      borderRadius: 1.5,
      "& .MuiChip-icon": { ml: 0.5 },
    }}
  />
);

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function UserManagement() {
  const abortRef = useRef(null);
  const queryClient = useQueryClient();

  const [open,       setOpen]       = useState(false);
  const [viewItem,   setViewItem]   = useState(null);
  const [editingId,  setEditingId]  = useState(null);
  const [form,       setForm]       = useState(emptyForm);
  const [errors,     setErrors]     = useState({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [userToDeactivate, setUserToDeactivate] = useState(null);

  // ── Fetch ────────────────────────────────────────────────────────────────
  const { data: users = [], isLoading: loading, refetch: refetchUsers } = useQuery({
    queryKey: ["users"],
    queryFn: () => getUsers(),
    staleTime: 30 * 1000, // 30s — users change infrequently
  });

  const fetchUsers = useCallback(() => queryClient.invalidateQueries({ queryKey: ["users"] }), [queryClient]);

  // ── Open / Close dialog ───────────────────────────────────────────────────
  const handleOpen = useCallback((user = null) => {
    if (user) {
      setEditingId(user.id);
      setForm({ username: user.username, email: user.email, password: "", role: user.role, active: user.active });
    } else {
      setEditingId(null);
      setForm(emptyForm);
    }
    setErrors({});
    setOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
    setForm(emptyForm);
    setErrors({});
    setEditingId(null);
  }, []);

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    const e = validate(form, !!editingId);
    if (Object.keys(e).length) { setErrors(e); return; }

    const payload = { ...form };
    if (editingId && !payload.password) delete payload.password;

    try {
      if (editingId) {
        await updateUser(editingId, payload);
        toast.success("User updated!");
      } else {
        await createUser(payload);
        toast.success("User created!");
      }
      handleClose();
      fetchUsers();
    } catch (err) {
      toast.error(err.message || "Operation failed");
    }
  }, [form, editingId, handleClose, fetchUsers]);

  // ── Deactivate (soft delete) ──────────────────────────────────────────────
  const requestDeactivate = useCallback((id) => {
    setUserToDeactivate(id);
    setConfirmOpen(true);
  }, []);

  const handleDeactivate = useCallback(async () => {
    if (!userToDeactivate) return;
    try {
      await deleteUser(userToDeactivate);
      toast.success("User deactivated");
      fetchUsers();
    } catch (err) {
      toast.error(err.message || "Failed to deactivate");
    } finally {
      setUserToDeactivate(null);
    }
  }, [userToDeactivate, fetchUsers]);

  // ── Stats ─────────────────────────────────────────────────────────────────
  const active        = useMemo(() => users.filter(u => u.active).length, [users]);
  const inactive      = useMemo(() => users.length - active, [users, active]);
  const adminCount    = useMemo(() => users.filter(u => u.role === "SUPER_ADMIN").length, [users]);

  const cards = useMemo(() => [
    { title: "Total Users",    value: loading ? "—" : users.length, icon: <PeopleAltIcon sx={{ color: C.white, fontSize: 22 }} />,      color: C.blue,    bgColor: C.blue },
    { title: "Active Users",   value: loading ? "—" : active,       icon: <CheckCircleIcon sx={{ color: C.white, fontSize: 22 }} />,    color: C.emerald, bgColor: C.emerald },
    { title: "Inactive Users", value: loading ? "—" : inactive,     icon: <BlockIcon sx={{ color: C.white, fontSize: 22 }} />,          color: C.red,     bgColor: C.red },
    { title: "Super Admins",   value: loading ? "—" : adminCount,   icon: <AdminPanelSettings sx={{ color: C.white, fontSize: 22 }} />, color: "#6d28d9", bgColor: "#6d28d9" },
  ], [loading, users.length, active, inactive, adminCount]);

  // ── Table columns ─────────────────────────────────────────────────────────
  // ── Table columns ─────────────────────────────────────────────────────────
  const columns = useMemo(() => [
    {
      label: "Username",
      key: "username",
      render: (row) => (
        <Typography sx={{ fontWeight: 600, fontSize: 13, color: C.navy }}>{row.username}</Typography>
      ),
    },
    {
      label: "Email",
      key: "email",
      render: (row) => (
        <Typography sx={{ fontSize: 13, color: C.slate }}>{row.email}</Typography>
      ),
    },
    {
      label: "Role",
      render: (row) => <RoleChip role={row.role} />,
    },
    {
      label: "Status",
      render: (row) => <StatusChip active={row.active} />,
    },
    {
      label: "Last Login",
      render: (row) => (
        <Typography sx={{ fontSize: 12, color: C.slate }}>
          {row.lastLogin ? new Date(row.lastLogin).toLocaleDateString("en-IN") : "Never"}
        </Typography>
      ),
    },
    {
      label: "Actions",
      align: "right",
      render: (row) => (
        <Box display="flex" justifyContent="flex-end" gap={0.5}>
          <IconButton
            size="small"
            onClick={() => setViewItem(row)}
            sx={{ color: C.slate, "&:hover": { color: C.blue, backgroundColor: C.blueLight } }}
          >
            <VisibilityIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => handleOpen(row)}
            sx={{ color: C.slate, "&:hover": { color: C.teal, backgroundColor: C.tealLight } }}
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => requestDeactivate(row.id)}
            disabled={!row.active}
            sx={{ color: C.slate, "&:hover": { color: C.red, backgroundColor: C.redLight }, "&.Mui-disabled": { opacity: 0.3 } }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      ),
    },
  ], [handleOpen, requestDeactivate]);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <Box sx={{ backgroundColor: C.surface, minHeight: "100vh" }}>

      {/* Header */}
      <PageHeader
        title="User Management"
        subtitle="Manage system users and their roles"
        onAdd={() => handleOpen()}
        addLabel="Add User"
      />

      {/* Info Cards */}
      <Grid container spacing={2.5} mb={3}>
        {cards.map((c) => (
          <Grid item xs={12} sm={6} lg={3} key={c.title}>
            {loading
              ? <Skeleton variant="rounded" height={82} sx={{ borderRadius: 3 }} />
              : <InfoCard {...c} />}
          </Grid>
        ))}
      </Grid>

      {/* Table */}
      {loading && (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress size={28} sx={{ color: C.blue }} />
        </Box>
      )}
      {!loading && (
        <EnterpriseTable
          columns={columns}
          data={users}
          emptyMessage="No users found. Click 'Add User' to create one."
        />
      )}

      {/* ── Create / Edit Dialog ─────────────────────────────────────────── */}
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, border: `1px solid ${C.border}` } }}
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pb: 1, pt: 2.5, px: 3 }}>
          <Typography fontWeight={800} fontSize={16} color={C.navy}>
            {editingId ? "Edit User" : "Add New User"}
          </Typography>
          <IconButton size="small" onClick={handleClose} sx={{ color: C.slate }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <Divider />

        <DialogContent sx={{ px: 3, py: 2.5 }}>
          <Box display="flex" flexDirection="column" gap={2.5}>
            <TextField
              label="Username"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              error={!!errors.username}
              helperText={errors.username}
              disabled={!!editingId}
              fullWidth
              size="small"
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
            />
            <TextField
              label="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              error={!!errors.email}
              helperText={errors.email}
              fullWidth
              size="small"
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
            />
            <TextField
              label={editingId ? "New Password (leave blank to keep)" : "Password"}
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              error={!!errors.password}
              helperText={errors.password}
              fullWidth
              size="small"
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
            />
            <TextField
              select
              label="Role"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              error={!!errors.role}
              helperText={errors.role}
              fullWidth
              size="small"
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
            >
              {ROLES.map((r) => (
                <MenuItem key={r} value={r}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <RoleChip role={r} />
                  </Box>
                </MenuItem>
              ))}
            </TextField>
            <FormControlLabel
              control={
                <Switch
                  checked={form.active}
                  onChange={(e) => setForm({ ...form, active: e.target.checked })}
                  sx={{
                    "& .MuiSwitch-switchBase.Mui-checked": { color: C.emerald },
                    "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { backgroundColor: C.emerald },
                  }}
                />
              }
              label={
                <Typography fontSize={13} fontWeight={600} color={C.slate}>
                  {form.active ? "Active" : "Inactive"}
                </Typography>
              }
            />
          </Box>
        </DialogContent>

        <Divider />
        <DialogActions sx={{ px: 3, py: 1.5, gap: 1 }}>
          <Button
            onClick={handleClose}
            variant="outlined"
            size="small"
            sx={{ textTransform: "none", borderRadius: 2, borderColor: C.border, color: C.slate, "&:hover": { borderColor: C.slate } }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            size="small"
            sx={{
              textTransform: "none",
              borderRadius: 2,
              fontWeight: 700,
              backgroundColor: C.blue,
              boxShadow: "none",
              "&:hover": { backgroundColor: C.blueDark, boxShadow: "none" },
            }}
          >
            {editingId ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── View Dialog ───────────────────────────────────────────────────── */}
      <ViewDialog
        open={!!viewItem}
        onClose={() => setViewItem(null)}
        title="User Details"
      >
        {viewItem && (
          <>
            <ViewRow label="Username"   value={<Typography sx={{ fontWeight: 600, fontSize: 13, color: C.navy }}>{viewItem.username}</Typography>} />
            <ViewRow label="Email"      value={viewItem.email} />
            <ViewRow label="Role"       value={<RoleChip role={viewItem.role} />} />
            <ViewRow label="Status"     value={<StatusChip active={viewItem.active} />} />
            <ViewRow label="Created At" value={viewItem.createdAt ? new Date(viewItem.createdAt).toLocaleString("en-IN") : "—"} />
            <ViewRow label="Last Login" value={viewItem.lastLogin ? new Date(viewItem.lastLogin).toLocaleString("en-IN") : "Never"} />
          </>
        )}
      </ViewDialog>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDeactivate}
        title="Deactivate User"
        message="Deactivate this user? They can be re-activated later."
        confirmText="Deactivate"
        confirmColor="error"
      />

    </Box>
  );
}

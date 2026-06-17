import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  Box, Drawer, AppBar, Toolbar, Typography, List,
  ListItemButton, ListItemText, ListItemIcon, IconButton,
  Menu, MenuItem, useMediaQuery, Tooltip, Divider, Chip,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useState, useMemo, useCallback, memo } from "react";
import { useAuth } from "../hooks/useAuth";
import { C } from "../theme/colors";
import NotificationBell from "../components/Notifications/NotificationBell";
import ImpersonationBanner from "../components/shared/ImpersonationBanner";

import DashboardIcon          from "@mui/icons-material/Dashboard";
import InventoryIcon          from "@mui/icons-material/Inventory";
import StoreIcon              from "@mui/icons-material/Store";
import LocationOnIcon         from "@mui/icons-material/LocationOn";
import CategoryIcon           from "@mui/icons-material/Category";
import ShoppingCartIcon       from "@mui/icons-material/ShoppingCart";
import LogoutIcon             from "@mui/icons-material/Logout";
import MenuIcon               from "@mui/icons-material/Menu";
import AccountCircleIcon      from "@mui/icons-material/AccountCircle";
import ChevronLeftIcon        from "@mui/icons-material/ChevronLeft";
import ListAltIcon            from "@mui/icons-material/ListAlt";
import Inventory2Icon         from "@mui/icons-material/Inventory2";
import WarehouseIcon          from "@mui/icons-material/Warehouse";
import PersonIcon             from "@mui/icons-material/Person";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import StoreMallDirectoryIcon from "@mui/icons-material/StoreMallDirectory";
import SupervisorAccountIcon  from "@mui/icons-material/SupervisorAccount";

const DRAWER_WIDTH  = 248;
const MINI_WIDTH    = 64;
const APPBAR_HEIGHT = 60;

const DRAWER_PAPER_SX = {
  borderRight: "none",
  background: "linear-gradient(180deg, #0c1220 0%, #0f172a 60%, #0b1120 100%)",
  boxShadow: "1px 0 0 rgba(255,255,255,0.04), 4px 0 24px rgba(0,0,0,0.25)",
  overflowX: "hidden",
  boxSizing: "border-box",
};

const navSections = [
  {
    label: "Core",
    items: [
      { name: "Dashboard",    path: "/dashboard",    icon: <DashboardIcon />,  roles: ["SUPER_ADMIN","OUTLET_MANAGER","INVENTORY_MANAGER","SALES_OPERATOR"] },
      { name: "Point of Sale",path: "/pos",          icon: <ShoppingCartIcon />,roles: ["SALES_OPERATOR"] },
      { name: "Products",     path: "/products",     icon: <InventoryIcon />,  roles: ["SUPER_ADMIN","OUTLET_MANAGER","INVENTORY_MANAGER","SALES_OPERATOR"] },
    ],
  },
  {
    label: "Operations",
    items: [
      { name: "Stock Orders", path: "/stock-orders", icon: <ListAltIcon />,    roles: ["SUPER_ADMIN","OUTLET_MANAGER","INVENTORY_MANAGER"] },
      { name: "Batches",      path: "/batches",      icon: <Inventory2Icon />, roles: ["SUPER_ADMIN","OUTLET_MANAGER","INVENTORY_MANAGER"] },
      { name: "Stock",        path: "/stock",        icon: <WarehouseIcon />,  roles: ["SUPER_ADMIN","OUTLET_MANAGER","INVENTORY_MANAGER","SALES_OPERATOR"] },
      { name: "Outlets",      path: "/outlets",      icon: <StoreIcon />,      roles: ["SUPER_ADMIN","OUTLET_MANAGER"] },
    ],
  },
  {
    label: "Admin",
    items: [
      { name: "Locations",    path: "/locations",    icon: <LocationOnIcon />, roles: ["SUPER_ADMIN"] },
      { name: "Divisions",    path: "/divisions",    icon: <CategoryIcon />,   roles: ["SUPER_ADMIN"] },
      { name: "Users",        path: "/users",        icon: <PersonIcon />,     roles: ["SUPER_ADMIN"] },
      { name: "Impersonation",path: "/admin/impersonation", icon: <SupervisorAccountIcon />, roles: ["SUPER_ADMIN"] },
    ],
  },
];

const menuConfig = navSections.flatMap((s) => s.items);

const roleLabel = {
  SUPER_ADMIN: "Super Admin", OUTLET_MANAGER: "Outlet Manager",
  INVENTORY_MANAGER: "Inventory Manager", SALES_OPERATOR: "Sales Operator",
};
const roleChipColor = {
  SUPER_ADMIN:       { bg: "#ede9fe", color: "#5b21b6" },
  OUTLET_MANAGER:    { bg: "#dbeafe", color: "#1d4ed8" },
  INVENTORY_MANAGER: { bg: "#ccfbf1", color: "#0d9488" },
  SALES_OPERATOR:    { bg: "#fef3c7", color: "#b45309" },
};

// ─── Sidebar content — shared between permanent and temporary drawers ─────────
const SidebarContent = memo(({ open, role, location, onNavClick }) => {
  const theme = useTheme();
  return (
    <>
      {/* Logo */}
      <Box
        sx={{
          height: APPBAR_HEIGHT,
          display: "flex",
          alignItems: "center",
          justifyContent: open ? "flex-start" : "center",
          px: open ? 2.5 : 0,
          gap: 1.5,
          overflow: "hidden",
          flexShrink: 0,
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <Box
          sx={{
            width: 34, height: 34, borderRadius: "10px", flexShrink: 0,
            background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
            boxShadow: "0 4px 14px rgba(99,102,241,0.40)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <StoreMallDirectoryIcon sx={{ fontSize: 18, color: "#fff" }} />
        </Box>

        <Box
          sx={{
            overflow: "hidden",
            maxWidth: open ? 180 : 0,
            opacity: open ? 1 : 0,
            transition: theme.transitions.create(["max-width", "opacity"], {
              easing: theme.transitions.easing.sharp,
              duration: open
                ? theme.transitions.duration.enteringScreen
                : theme.transitions.duration.leavingScreen,
            }),
            whiteSpace: "nowrap",
          }}
        >
          <Typography sx={{ fontWeight: 800, fontSize: "13.5px", color: "#f1f5f9", letterSpacing: "-0.2px", lineHeight: 1.2 }}>
            Outlet Management
          </Typography>
          <Typography sx={{ fontSize: "10px", color: "#4b5563", lineHeight: 1.3, display: "block" }}>
            Admin Portal
          </Typography>
        </Box>
      </Box>

      {/* Nav */}
      <Box sx={{ overflowY: "auto", overflowX: "hidden", flexGrow: 1, py: 1.5 }}>
        {navSections.map((section, sIdx) => {
          const visible = section.items.filter((item) =>
            item.roles.includes(role || "SUPER_ADMIN")
          );
          if (!visible.length) return null;
          return (
            <Box key={section.label}>
              {open && (
                <Typography sx={{
                  fontSize: "9.5px", fontWeight: 700, color: "#2d3f55",
                  textTransform: "uppercase", letterSpacing: "1px",
                  px: 2.5, pt: sIdx === 0 ? 0.5 : 2, pb: 0.75,
                }}>
                  {section.label}
                </Typography>
              )}
              {!open && sIdx > 0 && (
                <Divider sx={{ borderColor: "rgba(255,255,255,0.05)", mx: 1, my: 1 }} />
              )}
              <List disablePadding sx={{ px: open ? 1 : 0.75 }}>
                {visible.map((item) => {
                  const isActive =
                    location.pathname === item.path ||
                    location.pathname.startsWith(item.path + "/");
                  return (
                    <Tooltip
                      key={item.path}
                      title={!open ? item.name : ""}
                      placement="right"
                      arrow
                    >
                      <ListItemButton
                        onClick={() => onNavClick(item.path)}
                        selected={isActive}
                        sx={{
                          justifyContent: open ? "initial" : "center",
                          px: open ? 1.5 : 1.25, py: 0.8, mb: 0.25,
                          borderRadius: "9px",
                          position: "relative",
                          transition: "all 0.2s ease",
                          "&.Mui-selected": {
                            bgcolor: "rgba(99,102,241,0.15)",
                            "&::before": {
                              content: '""',
                              position: "absolute", left: 0, top: "22%", bottom: "22%",
                              width: 3, borderRadius: "0 2px 2px 0",
                              background: "linear-gradient(180deg,#6366f1,#8b5cf6)",
                              boxShadow: "0 0 8px rgba(99,102,241,0.6)",
                            },
                            "& .nav-icon": { color: "#818cf8" },
                          },
                          "&:hover:not(.Mui-selected)": { bgcolor: "rgba(255,255,255,0.05)" },
                          "&.Mui-selected:hover": { bgcolor: "rgba(99,102,241,0.20)" },
                        }}
                      >
                        <ListItemIcon
                          className="nav-icon"
                          sx={{
                            minWidth: 0, mr: open ? 1.5 : "auto",
                            justifyContent: "center",
                            color: isActive ? "#818cf8" : "#4b5563",
                            transition: "color 0.2s",
                            "& svg": { fontSize: "18px !important" },
                          }}
                        >
                          {item.icon}
                        </ListItemIcon>
                        <ListItemText
                          primary={item.name}
                          primaryTypographyProps={{
                            fontSize: "13px", fontWeight: isActive ? 600 : 400,
                            color: isActive ? "#e2e8f0" : "#64748b",
                            noWrap: true, lineHeight: 1.4,
                          }}
                          sx={{
                            opacity: open ? 1 : 0,
                            maxWidth: open ? 180 : 0,
                            transition: "opacity 0.2s",
                            m: 0,
                          }}
                        />
                      </ListItemButton>
                    </Tooltip>
                  );
                })}
              </List>
            </Box>
          );
        })}
      </Box>

      {/* Footer */}
      <Box sx={{
        px: open ? 2 : 0, py: 1.5,
        borderTop: "1px solid rgba(255,255,255,0.05)",
        display: "flex", justifyContent: open ? "flex-start" : "center",
      }}>
        <Typography sx={{ fontSize: "10px", color: "#1e3a5f", fontWeight: 500 }}>
          {open ? `© ${new Date().getFullYear()} Outlet Management` : "©"}
        </Typography>
      </Box>
    </>
  );
});

// ─── Main Layout ──────────────────────────────────────────────────────────────
const DashBoardLayout = memo(() => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const theme     = useTheme();

  // isMobile is ONLY used to decide which drawer to render.
  // It does NOT control the open/close state of the desktop drawer.
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  // Desktop: open = expanded (248px) vs collapsed (64px mini)
  // This state is NEVER touched by isMobile changes — DevTools resize cannot affect it.
  const [desktopOpen, setDesktopOpen] = useState(true);

  // Mobile: open = drawer visible vs hidden
  const [mobileOpen, setMobileOpen] = useState(false);

  const [anchorEl, setAnchorEl] = useState(null);
  const menuOpen = Boolean(anchorEl);
  const { role, logout, isImpersonating } = useAuth();
  const BANNER_HEIGHT = isImpersonating ? 48 : 0;

  const toggleDesktop   = useCallback(() => setDesktopOpen((p) => !p), []);
  const toggleMobile    = useCallback(() => setMobileOpen((p) => !p), []);
  const handleMenuOpen  = useCallback((e) => setAnchorEl(e.currentTarget), []);
  const handleMenuClose = useCallback(() => setAnchorEl(null), []);
  const handleLogout    = useCallback(() => { handleMenuClose(); logout(); }, [handleMenuClose, logout]);

  const handleNavClick = useCallback((path) => {
    navigate(path);
    if (isMobile) setMobileOpen(false); // close mobile drawer after navigation
  }, [navigate, isMobile]);

  // AppBar and main content offset — only applies on desktop
  const sidebarW = isMobile ? 0 : desktopOpen ? DRAWER_WIDTH : MINI_WIDTH;

  const activeItem = useMemo(
    () => menuConfig.find((m) => location.pathname === m.path || location.pathname.startsWith(m.path + "/")),
    [location.pathname]
  );
  const rc = useMemo(() => roleChipColor[role] || roleChipColor.SUPER_ADMIN, [role]);

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: C.bg }}>
      <ImpersonationBanner />

      {/* ── AppBar ──────────────────────────────────────────────────────────── */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          zIndex: theme.zIndex.drawer + 1,
          bgcolor: "rgba(255,255,255,0.92)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderBottom: `1px solid ${C.border}`,
          width:  `calc(100% - ${sidebarW}px)`,
          ml:     `${sidebarW}px`,
          top:    `${BANNER_HEIGHT}px`,
          transition: theme.transitions.create(["width", "margin", "top"], {
            easing: theme.transitions.easing.sharp,
            duration: desktopOpen
              ? theme.transitions.duration.enteringScreen
              : theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        <Toolbar sx={{ justifyContent: "space-between", minHeight: `${APPBAR_HEIGHT}px !important`, px: { xs: 2, sm: 3 } }}>
          {/* Toggle button */}
          <Box display="flex" alignItems="center" gap={1.5}>
            <Tooltip title={isMobile ? "Open menu" : desktopOpen ? "Collapse" : "Expand"}>
              <IconButton
                onClick={isMobile ? toggleMobile : toggleDesktop}
                size="small"
                sx={{
                  width: 34, height: 34, borderRadius: "9px",
                  border: `1px solid ${C.border}`, color: C.slateMid,
                  "&:hover": { bgcolor: C.bgMuted, borderColor: "#cbd5e1" },
                  transition: "all 0.2s",
                }}
              >
                {!isMobile && desktopOpen
                  ? <ChevronLeftIcon sx={{ fontSize: 18 }} />
                  : <MenuIcon sx={{ fontSize: 18 }} />}
              </IconButton>
            </Tooltip>

            {/* Breadcrumb */}
            <Box display="flex" alignItems="center" gap={0.75}>
              <Typography
                sx={{ fontSize: "12.5px", color: C.muted, fontWeight: 500, cursor: "pointer",
                  "&:hover": { color: C.blue }, transition: "color 0.15s" }}
                onClick={() => navigate("/dashboard")}
              >
                Home
              </Typography>
              {activeItem && (
                <>
                  <KeyboardArrowRightIcon sx={{ fontSize: 14, color: C.border }} />
                  <Typography sx={{ fontSize: "12.5px", fontWeight: 700, color: C.navy, letterSpacing: "0.1px" }}>
                    {activeItem.name}
                  </Typography>
                </>
              )}
            </Box>
          </Box>

          {/* Right side */}
          <Box display="flex" alignItems="center" gap={1.25}>
            <Chip
              label={roleLabel[role] || role || "User"}
              size="small"
              sx={{
                display: { xs: "none", sm: "flex" },
                bgcolor: rc.bg, color: rc.color,
                fontWeight: 700, fontSize: "11px", letterSpacing: "0.2px",
                height: 24, border: `1px solid ${rc.color}20`, borderRadius: "6px",
              }}
            />
            <NotificationBell />
            <Tooltip title="Account">
              <IconButton
                onClick={handleMenuOpen}
                size="small"
                sx={{
                  width: 34, height: 34, borderRadius: "9px",
                  border: `1px solid ${C.border}`, color: C.slateMid,
                  "&:hover": { bgcolor: C.bgMuted, borderColor: "#cbd5e1" },
                }}
              >
                <AccountCircleIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          </Box>

          <Menu
            anchorEl={anchorEl}
            open={menuOpen}
            onClose={handleMenuClose}
            transformOrigin={{ horizontal: "right", vertical: "top" }}
            anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
            PaperProps={{
              elevation: 0,
              sx: {
                minWidth: 192, borderRadius: "12px", mt: 0.75,
                border: `1px solid ${C.border}`,
                boxShadow: "0 8px 32px rgba(15,23,42,0.12), 0 2px 8px rgba(15,23,42,0.06)",
                overflow: "hidden",
              },
            }}
          >
            <Box sx={{ px: 2, py: 1.5, bgcolor: C.bgMuted, borderBottom: `1px solid ${C.border}` }}>
              <Typography sx={{ fontSize: "11px", color: C.muted, fontWeight: 500 }}>Signed in as</Typography>
              <Typography sx={{ fontSize: "13px", color: C.navy, fontWeight: 700, mt: 0.2 }}>
                {roleLabel[role] || role || "User"}
              </Typography>
            </Box>
            <MenuItem
              onClick={handleLogout}
              sx={{ gap: 1.5, py: 1.25, fontSize: "13px", fontWeight: 600, color: C.rose,
                "&:hover": { bgcolor: C.roseLight }, transition: "background 0.15s" }}
            >
              <LogoutIcon sx={{ fontSize: 17 }} />
              Sign Out
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* ── Desktop Drawer — PERMANENT, never switches variant ──────────────── */}
      {/* Hidden on mobile via display:none so it never interferes */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: "none", md: "block" },   // hidden on mobile
          width: desktopOpen ? DRAWER_WIDTH : MINI_WIDTH,
          flexShrink: 0,
          whiteSpace: "nowrap",
          boxSizing: "border-box",
          "& .MuiDrawer-paper": {
            ...DRAWER_PAPER_SX,
            width: desktopOpen ? DRAWER_WIDTH : MINI_WIDTH,
            top: `${BANNER_HEIGHT}px`,
            height: `calc(100% - ${BANNER_HEIGHT}px)`,
            transition: theme.transitions.create(["width", "top", "height"], {
              easing: theme.transitions.easing.sharp,
              duration: desktopOpen
                ? theme.transitions.duration.enteringScreen
                : theme.transitions.duration.leavingScreen,
            }),
          },
        }}
      >
        <SidebarContent
          open={desktopOpen}
          role={role}
          location={location}
          onNavClick={handleNavClick}
        />
      </Drawer>

      {/* ── Mobile Drawer — TEMPORARY, only rendered on mobile ──────────────── */}
      {/* Hidden on desktop via display:none so it never interferes */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={toggleMobile}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", md: "none" },   // hidden on desktop
          "& .MuiDrawer-paper": {
            ...DRAWER_PAPER_SX,
            width: DRAWER_WIDTH,
            top: `${BANNER_HEIGHT}px`,
            height: `calc(100% - ${BANNER_HEIGHT}px)`,
          },
        }}
      >
        <SidebarContent
          open={true}
          role={role}
          location={location}
          onNavClick={handleNavClick}
        />
      </Drawer>

      {/* ── Main content ────────────────────────────────────────────────────── */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          px: { xs: 2, sm: 3 },
          pt: `${APPBAR_HEIGHT + 24 + BANNER_HEIGHT}px`,
          pb: 4,
          minHeight: "100vh",
          boxSizing: "border-box",
          transition: theme.transitions.create("margin", {
            easing: theme.transitions.easing.sharp,
            duration: desktopOpen
              ? theme.transitions.duration.enteringScreen
              : theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
});

export default DashBoardLayout;

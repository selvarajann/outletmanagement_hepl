import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  Box, Drawer, AppBar, Toolbar, Typography, List,
  ListItemButton, ListItemText, ListItemIcon, IconButton,
  Menu, MenuItem, useMediaQuery, Tooltip, Divider, Chip, Collapse,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useState, useMemo, useCallback } from "react";
import { useAuth } from "../hooks/useAuth";
import { useAppTheme } from "../context/ThemeContext";
import { C } from "../theme/colors";
import NotificationBell from "../components/Notifications/NotificationBell";
import ImpersonationBanner from "../components/shared/ImpersonationBanner";
import ChatbotWidget from "../components/Chatbot/ChatbotWidget";

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
import KeyboardReturnIcon     from "@mui/icons-material/KeyboardReturn";
import LightModeIcon          from "@mui/icons-material/LightMode";
import DarkModeIcon           from "@mui/icons-material/DarkMode";
import ExpandLess             from "@mui/icons-material/ExpandLess";
import ExpandMore             from "@mui/icons-material/ExpandMore";
import SettingsIcon           from "@mui/icons-material/Settings";
import BusinessIcon           from "@mui/icons-material/Business";

const DRAWER_WIDTH  = 248;
const MINI_WIDTH    = 64;
const APPBAR_HEIGHT = 60;

const getDrawerPaperSx = (isDark) => ({
  borderRight: isDark ? "1px solid rgba(255,255,255,0.05)" : `1px solid ${C.border}`,
  background: isDark ? "linear-gradient(180deg, #0a0a0a 0%, #000000 100%)" : "#ffffff",
  boxShadow: isDark ? "4px 0 24px rgba(0,0,0,0.50)" : "none",
  overflowX: "hidden",
  boxSizing: "border-box",
});

const navSections = [
  {
    label: "Core",
    items: [
      { name: "Dashboard",    path: "/dashboard",    icon: <DashboardIcon />,  roles: ["SUPER_ADMIN","OUTLET_MANAGER","INVENTORY_MANAGER","SALES_OPERATOR"] },
      { name: "Analytics",    path: "/analytics",    icon: <DashboardIcon />,  roles: ["SUPER_ADMIN","OUTLET_MANAGER","INVENTORY_MANAGER","SALES_OPERATOR"] },
      { name: "Point of Sale",path: "/pos",          icon: <ShoppingCartIcon />,roles: ["SALES_OPERATOR"] },
      { name: "Products",     path: "/products",     icon: <InventoryIcon />,  roles: ["SUPER_ADMIN","OUTLET_MANAGER","INVENTORY_MANAGER","SALES_OPERATOR"] },
      { name: "WH Products",  path: "/warehouse-products", icon: <WarehouseIcon />, roles: ["INVENTORY_MANAGER"] },
    ],
  },
  {
    label: "Operations",
    items: [
      {
        name: "Stock Operations",
        icon: <WarehouseIcon />,
        roles: ["SUPER_ADMIN","OUTLET_MANAGER","INVENTORY_MANAGER","SALES_OPERATOR"],
        children: [
          { name: "Stock Ledger",   path: "/stock",        icon: <ListAltIcon />,  roles: ["SUPER_ADMIN","OUTLET_MANAGER","INVENTORY_MANAGER","SALES_OPERATOR"] },
          { name: "Stock Orders",   path: "/stock-orders", icon: <ShoppingCartIcon />, roles: ["SUPER_ADMIN","OUTLET_MANAGER","INVENTORY_MANAGER"] },
          { name: "Shipments",      path: "/shipments",    icon: <StoreMallDirectoryIcon />, roles: ["SUPER_ADMIN","OUTLET_MANAGER","INVENTORY_MANAGER"] },
          { name: "Batches",        path: "/batches",      icon: <Inventory2Icon />, roles: ["SUPER_ADMIN","OUTLET_MANAGER","INVENTORY_MANAGER"] },
          { name: "Stock Returns",  path: "/stock-returns",icon: <KeyboardReturnIcon />, roles: ["SUPER_ADMIN","OUTLET_MANAGER","INVENTORY_MANAGER"] },
          { name: "Reconciliation", path: "/inventory/reconciliation", icon: <ListAltIcon />, roles: ["SUPER_ADMIN", "OUTLET_MANAGER", "INVENTORY_MANAGER"] },
        ]
      },
      { name: "Outlets",      path: "/outlets",      icon: <StoreIcon />,      roles: ["SUPER_ADMIN","OUTLET_MANAGER"] },
    ],
  },
  {
    label: "Admin",
    items: [
      {
        name: "Organization",
        icon: <BusinessIcon />,
        roles: ["SUPER_ADMIN"],
        children: [
          { name: "Locations",    path: "/locations",    icon: <LocationOnIcon />, roles: ["SUPER_ADMIN"] },
          { name: "Divisions",    path: "/divisions",    icon: <CategoryIcon />,   roles: ["SUPER_ADMIN"] },
          { name: "Users",        path: "/users",        icon: <PersonIcon />,     roles: ["SUPER_ADMIN"] },
          { name: "Impersonation",path: "/admin/impersonation", icon: <SupervisorAccountIcon />, roles: ["SUPER_ADMIN"] },
        ]
      },
      {
        name: "System",
        icon: <SettingsIcon />,
        roles: ["SUPER_ADMIN"],
        children: [
          { name: "Audit Logs",   path: "/admin/audit-logs", icon: <ListAltIcon />, roles: ["SUPER_ADMIN"] },
          { name: "Cron Scheduler", path: "/system/jobs", icon: <ListAltIcon />, roles: ["SUPER_ADMIN"] },
          { name: "Dead Letters", path: "/system/dead-letters", icon: <ListAltIcon />, roles: ["SUPER_ADMIN"] },
        ]
      }
    ],
  },
];

const getFlatMenuItems = (sections) => {
  const flat = [];
  sections.forEach(sec => {
    sec.items.forEach(item => {
      if (item.path) flat.push(item);
      if (item.children) {
        item.children.forEach(child => flat.push(child));
      }
    });
  });
  return flat;
};

const menuConfig = getFlatMenuItems(navSections);

const roleLabel = {
  SUPER_ADMIN: "Super Admin", OUTLET_MANAGER: "Outlet Manager",
  INVENTORY_MANAGER: "Inventory Manager", SALES_OPERATOR: "Sales Operator",
};
const roleChipColor = {
  SUPER_ADMIN:       { bg: C.violetLight, color: C.violet },
  OUTLET_MANAGER:    { bg: C.blueLight, color: C.blueDark },
  INVENTORY_MANAGER: { bg: C.tealLight, color: C.teal },
  SALES_OPERATOR:    { bg: C.amberLight, color: C.amber },
};

// ─── Sidebar content — shared between permanent and temporary drawers ─────────
const SidebarContent = ({ open, role, location, onNavClick, isDark, toggleTheme }) => {
  const theme = useTheme();
  
  // State for expanded menus (undefined means use default active state)
  const [expanded, setExpanded] = useState({});

  const handleToggleExpand = (name, hasActiveChild) => {
    setExpanded(prev => {
      const isCurrentlyExpanded = prev[name] !== undefined ? prev[name] : hasActiveChild;
      return { ...prev, [name]: !isCurrentlyExpanded };
    });
  };

  const textColor = isDark ? "#ffffff" : "#1e293b";
  const subtextColor = isDark ? "#a3a3a3" : "#64748b";
  const iconColor = isDark ? "#a3a3a3" : "#64748b";
  const sectionColor = isDark ? "#737373" : "#94a3b8";
  const hoverBg = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)";
  const dividerColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";

  const scrollThumb = isDark ? 'linear-gradient(180deg, #6366f1, #8b5cf6)' : '#000000';
  const scrollThumbHover = isDark ? 'linear-gradient(180deg, #818cf8, #a78bfa)' : '#333333';

  // Reusable nav item renderer
  const renderNavItem = (item, isChild = false) => {
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
            justifyContent: "flex-start",
            px: open ? (isChild ? 3 : 1.5) : "20px", 
            py: 0.8, 
            mb: 0.25,
            borderRadius: "9px",
            position: "relative",
            transition: theme.transitions.create(["padding", "background-color"], {
              duration: "0.2s",
            }),
            "&.Mui-selected": {
              bgcolor: isDark ? "rgba(255,255,255,0.08)" : "rgba(99,102,241,0.08)",
              "&::before": {
                content: '""',
                position: "absolute", left: 0, top: "22%", bottom: "22%",
                width: 3, borderRadius: "0 2px 2px 0",
                background: isDark ? "#ffffff" : "linear-gradient(180deg,#6366f1,#8b5cf6)",
                boxShadow: isDark ? "0 0 8px rgba(255,255,255,0.2)" : "0 0 8px rgba(99,102,241,0.6)",
              },
              "& .nav-icon": { color: isDark ? "#ffffff" : "#6366f1" },
            },
            "&:hover:not(.Mui-selected)": { bgcolor: hoverBg },
            "&.Mui-selected:hover": { bgcolor: isDark ? "rgba(255,255,255,0.12)" : "rgba(99,102,241,0.12)" },
          }}
        >
          <ListItemIcon
            className="nav-icon"
            sx={{
              minWidth: 0, mr: open ? 1.5 : 0,
              justifyContent: "center",
              color: isActive ? "#6366f1" : iconColor,
              transition: theme.transitions.create(["margin", "color"], {
                duration: "0.2s",
              }),
              "& svg": { fontSize: (isChild ? "16px !important" : "18px !important") },
            }}
          >
            {item.icon}
          </ListItemIcon>
          <ListItemText
            primary={item.name}
            primaryTypographyProps={{
              fontSize: (isChild ? "12px" : "13px"), 
              fontWeight: isActive ? 600 : 500,
              color: isActive ? (isDark ? "#ffffff" : "#4f46e5") : subtextColor,
              noWrap: true, lineHeight: 1.4,
            }}
            sx={{
              opacity: open ? 1 : 0,
              maxWidth: open ? 180 : 0,
              transition: theme.transitions.create(["max-width", "opacity"], {
                duration: "0.2s",
              }),
              m: 0,
            }}
          />
        </ListItemButton>
      </Tooltip>
    );
  };

  return (
    <>
      {/* Logo */}
      <Box
        sx={{
          height: APPBAR_HEIGHT,
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-start",
          px: open ? 2.5 : "15px",
          gap: open ? 1.5 : 0,
          overflow: "hidden",
          flexShrink: 0,
          borderBottom: `1px solid ${dividerColor}`,
          transition: theme.transitions.create(["padding", "gap"], {
            duration: "0.2s",
          }),
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
            flex: 1,
            overflow: "hidden",
            maxWidth: open ? 180 : 0,
            opacity: open ? 1 : 0,
            transition: theme.transitions.create(["max-width", "opacity"], {
              duration: "0.2s",
            }),
            whiteSpace: "nowrap",
          }}
        >
          <Typography sx={{ fontWeight: 800, fontSize: "13.5px", color: textColor, letterSpacing: "-0.2px", lineHeight: 1.2 }}>
            Outlet Management
          </Typography>
          <Typography sx={{ fontSize: "10px", color: subtextColor, lineHeight: 1.3, display: "block" }}>
            Admin Portal
          </Typography>
        </Box>
      </Box>

      {/* Nav */}
      <Box sx={{ 
        overflowY: "auto", overflowX: "hidden", flexGrow: 1, py: 1.5,
        '&::-webkit-scrollbar': { width: '5px' },
        '&::-webkit-scrollbar-track': { background: 'transparent' },
        '&::-webkit-scrollbar-thumb': { 
          background: scrollThumb, 
          borderRadius: '10px' 
        },
        '&::-webkit-scrollbar-thumb:hover': { 
          background: scrollThumbHover 
        },
      }}>
        {navSections.map((section, sIdx) => {
          const visible = section.items.filter((item) =>
            item.roles.includes(role || "SUPER_ADMIN")
          );
          if (!visible.length) return null;
          return (
            <Box key={section.label}>
              {open && (
                <Typography sx={{
                  fontSize: "9.5px", fontWeight: 700, color: sectionColor,
                  textTransform: "uppercase", letterSpacing: "1px",
                  px: 2.5, pt: sIdx === 0 ? 0.5 : 2, pb: 0.75,
                }}>
                  {section.label}
                </Typography>
              )}
              {!open && sIdx > 0 && (
                <Divider sx={{ borderColor: dividerColor, mx: 1, my: 1 }} />
              )}
              <List disablePadding sx={{ px: open ? 1 : 0.75 }}>
                {visible.map((item) => {
                  if (item.children) {
                    const hasActiveChild = item.children.some(child => 
                      location.pathname === child.path || location.pathname.startsWith(child.path + "/")
                    );
                    const isExpanded = open && (expanded[item.name] !== undefined ? expanded[item.name] : hasActiveChild);
                    const childVisible = item.children.filter(child => child.roles.includes(role || "SUPER_ADMIN"));

                    if (!childVisible.length) return null;

                    return (
                      <Box key={item.name}>
                        <Tooltip title={!open ? item.name : ""} placement="right" arrow>
                          <ListItemButton
                            onClick={() => {
                              if (open) {
                                handleToggleExpand(item.name, hasActiveChild);
                              } else {
                                // If collapsed, maybe navigate to the first child or just expand the sidebar
                                // It's common to just expand the sidebar first or navigate to the parent's default child
                                onNavClick(childVisible[0].path);
                              }
                            }}
                            sx={{
                              justifyContent: "flex-start",
                              px: open ? 1.5 : "20px", py: 0.8, mb: 0.25,
                              borderRadius: "9px",
                              transition: theme.transitions.create(["padding", "background-color"], {
                                duration: "0.2s",
                              }),
                              color: hasActiveChild ? "#6366f1" : subtextColor,
                              bgcolor: hasActiveChild && !open ? (isDark ? "rgba(255,255,255,0.08)" : "rgba(99,102,241,0.08)") : "transparent",
                              "&:hover": { bgcolor: hoverBg },
                            }}
                          >
                            <ListItemIcon
                              sx={{
                                minWidth: 0, mr: open ? 1.5 : 0,
                                justifyContent: "center",
                                color: hasActiveChild ? "#6366f1" : iconColor,
                                transition: theme.transitions.create(["margin", "color"], {
                                  duration: "0.2s",
                                }),
                                "& svg": { fontSize: "18px !important" },
                              }}
                            >
                              {item.icon}
                            </ListItemIcon>
                            <ListItemText
                              primary={item.name}
                              primaryTypographyProps={{
                                fontSize: "13px", fontWeight: hasActiveChild ? 600 : 500,
                                noWrap: true, lineHeight: 1.4,
                              }}
                              sx={{
                                opacity: open ? 1 : 0,
                                maxWidth: open ? 180 : 0,
                                transition: theme.transitions.create(["max-width", "opacity"], {
                                  easing: theme.transitions.easing.sharp,
                                  duration: theme.transitions.duration.standard,
                                }),
                                m: 0,
                              }}
                            />
                            {open && (
                              isExpanded ? <ExpandLess sx={{ fontSize: 18 }} /> : <ExpandMore sx={{ fontSize: 18 }} />
                            )}
                          </ListItemButton>
                        </Tooltip>
                        
                        {/* Expandable Children */}
                        <Collapse in={isExpanded && open} timeout={300} unmountOnExit>
                          <List component="div" disablePadding>
                            {childVisible.map((child) => renderNavItem(child, true))}
                          </List>
                        </Collapse>
                      </Box>
                    );
                  }

                  // Standard render for non-nested items
                  return renderNavItem(item, false);
                })}
              </List>
            </Box>
          );
        })}
      </Box>

      {/* Footer / Toggle */}
      <Box sx={{
        px: open ? 2 : 1, py: 1.5,
        borderTop: `1px solid ${dividerColor}`,
        display: "flex", flexDirection: open ? "row" : "column", 
        alignItems: "center", justifyContent: open ? "space-between" : "center",
        gap: open ? 0 : 1
      }}>
        <Typography sx={{ fontSize: "10px", color: subtextColor, fontWeight: 500, display: open ? "block" : "none" }}>
          © {new Date().getFullYear()} Outlet Mgmt
        </Typography>
        <Tooltip title={isDark ? "Light Mode" : "Dark Mode"} placement="right">
          <IconButton onClick={toggleTheme} size="small" sx={{ color: subtextColor, "&:hover": { color: textColor, bgcolor: hoverBg } }}>
            {isDark ? <LightModeIcon sx={{ fontSize: 18 }} /> : <DarkModeIcon sx={{ fontSize: 18 }} />}
          </IconButton>
        </Tooltip>
      </Box>
    </>
  );
};

// ─── Main Layout ──────────────────────────────────────────────────────────────
const DashBoardLayout = () => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const theme     = useTheme();

  // isMobile is ONLY used to decide which drawer to render.
  // It does NOT control the open/close state of the desktop drawer.
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  // Desktop: open = expanded (248px) vs collapsed (64px mini)
  // Controlled entirely by hover state now
  const [isHovered, setIsHovered] = useState(false);

  // Mobile: open = drawer visible vs hidden
  const [mobileOpen, setMobileOpen] = useState(false);

  // Use global theme context instead of local state
  const { isDark, toggleTheme } = useAppTheme();

  const [anchorEl, setAnchorEl] = useState(null);
  const menuOpen = Boolean(anchorEl);
  const { role, logout, isImpersonating } = useAuth();
  const BANNER_HEIGHT = isImpersonating ? 48 : 0;

  const toggleMobile    = useCallback(() => setMobileOpen((p) => !p), []);
  const handleMenuOpen  = useCallback((e) => setAnchorEl(e.currentTarget), []);
  const handleMenuClose = useCallback(() => setAnchorEl(null), []);
  const handleLogout    = useCallback(() => { handleMenuClose(); logout(); }, [handleMenuClose, logout]);

  const handleNavClick = useCallback((path) => {
    navigate(path);
    if (isMobile) setMobileOpen(false); // close mobile drawer after navigation
  }, [navigate, isMobile]);

  // AppBar and main content offset — only applies on desktop. 
  // It dynamically shifts the layout when hovered.
  const sidebarW = isMobile ? 0 : isHovered ? DRAWER_WIDTH : MINI_WIDTH;

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
          bgcolor: C.glass,
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderBottom: `1px solid ${C.border}`,
          width:  `calc(100% - ${sidebarW}px)`,
          ml:     `${sidebarW}px`,
          top:    `${BANNER_HEIGHT}px`,
          transition: theme.transitions.create(["width", "margin", "top"], {
            duration: "0.2s",
          }),
        }}
      >
        <Toolbar sx={{ justifyContent: "space-between", minHeight: `${APPBAR_HEIGHT}px !important`, px: { xs: 2, sm: 3 } }}>
          <Box display="flex" alignItems="center" gap={1.5}>
            {/* Toggle button - Mobile Only */}
            <Box display={{ xs: "flex", md: "none" }} alignItems="center" gap={1.5}>
              <Tooltip title="Open menu">
                <IconButton
                  onClick={toggleMobile}
                  size="small"
                  sx={{
                    width: 34, height: 34, borderRadius: "9px",
                    border: `1px solid ${C.border}`, color: C.slateMid,
                    "&:hover": { bgcolor: C.bgMuted, borderColor: "#cbd5e1" },
                    transition: "all 0.2s",
                  }}
                >
                  <MenuIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>
            </Box>

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
          width: isHovered ? DRAWER_WIDTH : MINI_WIDTH,
          flexShrink: 0,
          whiteSpace: "nowrap",
          boxSizing: "border-box",
          zIndex: theme.zIndex.drawer,
          "& .MuiDrawer-paper": {
            ...getDrawerPaperSx(isDark),
            width: isHovered ? DRAWER_WIDTH : MINI_WIDTH,
            top: `${BANNER_HEIGHT}px`,
            height: `calc(100% - ${BANNER_HEIGHT}px)`,
            transition: theme.transitions.create(["width", "top", "height"], {
              duration: "0.2s",
            }),
          },
        }}
        onMouseEnter={() => !isMobile && setIsHovered(true)}
        onMouseLeave={() => !isMobile && setIsHovered(false)}
      >
        <SidebarContent
          open={!isMobile && isHovered}
          role={role}
          location={location}
          onNavClick={handleNavClick}
          isDark={isDark}
          toggleTheme={toggleTheme}
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
            ...getDrawerPaperSx(isDark),
            width: DRAWER_WIDTH,
            top: `${BANNER_HEIGHT}px`,
            height: `calc(100% - ${BANNER_HEIGHT}px)`,
          },
        }}
      >
        <SidebarContent
          open={mobileOpen}
          role={role}
          location={location}
          onNavClick={handleNavClick}
          isDark={isDark}
          toggleTheme={toggleTheme}
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
            duration: "0.2s",
          }),
        }}
      >
        {useMemo(() => <Outlet />, [])}
      </Box>

      {/* Global AI Chatbot */}
      <ChatbotWidget />
    </Box>
  );
};

export default DashBoardLayout;

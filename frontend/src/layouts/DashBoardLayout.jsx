import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  List,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  IconButton,
  Menu,
  MenuItem,
  useMediaQuery,
  Tooltip,
  Divider,
} from "@mui/material";
import { useTheme, styled } from "@mui/material/styles";
import { useState, useEffect } from "react";

// Icons
import DashboardIcon from "@mui/icons-material/Dashboard";
import InventoryIcon from "@mui/icons-material/Inventory";
import StoreIcon from "@mui/icons-material/Store";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import CategoryIcon from "@mui/icons-material/Category";
import LogoutIcon from "@mui/icons-material/Logout";
import MenuIcon from "@mui/icons-material/Menu";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";

// ─── Constants ───────────────────────────────────────────────
const DRAWER_WIDTH = 240;  
const MINI_WIDTH   = 64;   

const menuConfig = [
  { name: "Dashboard", path: "/dashboard", icon: <DashboardIcon /> },
  { name: "Products",  path: "/products",  icon: <InventoryIcon /> },
  { name: "Outlets",   path: "/outlets",   icon: <StoreIcon /> },
  { name: "Locations", path: "/locations", icon: <LocationOnIcon /> },
  { name: "Divisions", path: "/divisions", icon: <CategoryIcon /> },
];

// ─── Styled Drawer ───────────────────────────────────────────
// Animates paper width between DRAWER_WIDTH and MINI_WIDTH
const MiniDrawer = styled(Drawer, {
  shouldForwardProp: (prop) => prop !== "open" && prop !== "isMobile",
})(({ theme, open, isMobile }) => ({
  width: isMobile ? DRAWER_WIDTH : open ? DRAWER_WIDTH : MINI_WIDTH,
  flexShrink: 0,
  whiteSpace: "nowrap",
  boxSizing: "border-box",
  "& .MuiDrawer-paper": {
    backgroundColor: "#0f172a",
    color: "#fff",
    borderRight: "none",
    overflowX: "hidden",
    width: isMobile ? DRAWER_WIDTH : open ? DRAWER_WIDTH : MINI_WIDTH,
    transition: theme.transitions.create("width", {
      easing: theme.transitions.easing.sharp,
      duration: open
        ? theme.transitions.duration.enteringScreen
        : theme.transitions.duration.leavingScreen,
    }),
  },
}));

// ─── Component ───────────────────────────────────────────────
const DashBoardLayout = () => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const theme     = useTheme();

  const isMobile = useMediaQuery(theme.breakpoints.down("md")); // < 900px

  const [open, setOpen] = useState(true);

  useEffect(() => {
    setOpen(!isMobile);
  }, [isMobile]);

  const toggleDrawer = () => setOpen((prev) => !prev);

  const [anchorEl, setAnchorEl] = useState(null);
  const menuOpen = Boolean(anchorEl);

  // Route protection
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) navigate("/login");
  }, [navigate]);

  const handleMenuOpen  = (e) => setAnchorEl(e.currentTarget);
  const handleMenuClose = ()  => setAnchorEl(null);

  const handleLogout = () => {
    handleMenuClose();
    localStorage.removeItem("token");
    navigate("/login");
  };

  const handleNavClick = (path) => {
    navigate(path);
    if (isMobile) setOpen(false);
  };

  
  const sidebarWidth = isMobile ? 0 : open ? DRAWER_WIDTH : MINI_WIDTH;

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>

      {/* ── APP BAR ───────────────────────────────────────────── */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          zIndex: theme.zIndex.drawer + 1,
          backgroundColor: "#0f172a",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          width:  `calc(100% - ${sidebarWidth}px)`,
          ml:     `${sidebarWidth}px`,
          transition: theme.transitions.create(["width", "margin"], {
            easing: theme.transitions.easing.sharp,
            duration: open
              ? theme.transitions.duration.enteringScreen
              : theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        <Toolbar sx={{ justifyContent: "space-between", minHeight: { xs: 56, sm: 64 } }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Tooltip title={open && !isMobile ? "Collapse sidebar" : "Expand sidebar"}>
              <IconButton color="inherit" onClick={toggleDrawer} edge="start" aria-label="toggle drawer">
                {open && !isMobile ? <ChevronLeftIcon /> : <MenuIcon />}
              </IconButton>
            </Tooltip>

            <Typography
              variant="h6"
              fontWeight={700}
              letterSpacing={0.5}
              sx={{ userSelect: "none" }}
            >
              Admin Panel
            </Typography>
          </Box>

          <Tooltip title="Account">
            <IconButton color="inherit" onClick={handleMenuOpen} aria-label="account menu">
              <AccountCircleIcon />
            </IconButton>
          </Tooltip>

          <Menu
            anchorEl={anchorEl}
            open={menuOpen}
            onClose={handleMenuClose}
            transformOrigin={{ horizontal: "right", vertical: "top" }}
            anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
            PaperProps={{ elevation: 3, sx: { minWidth: 160, borderRadius: 2, mt: 0.5 } }}
          >
            <MenuItem onClick={handleLogout} sx={{ gap: 1.5 }}>
              <LogoutIcon fontSize="small" />
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* ── MINI SIDEBAR DRAWER ───────────────────────────────── */}
      <MiniDrawer
        variant={isMobile ? "temporary" : "permanent"}
        open={open}
        isMobile={isMobile}
        onClose={toggleDrawer}
        ModalProps={{ keepMounted: true }}
      >
        <Toolbar sx={{ minHeight: { xs: 56, sm: 64 } }} />

        <Box sx={{ overflow: "hidden", flexGrow: 1 }}>
          <List disablePadding sx={{ pt: 1 }}>
            {menuConfig.map((item) => {
              const isActive = location.pathname.startsWith(item.path);

              return (
                // Wrap in Tooltip: show label as tooltip only when collapsed on desktop
                <Tooltip
                  key={item.path}
                  title={!open && !isMobile ? item.name : ""}
                  placement="right"
                  arrow
                >
                  <ListItemButton
                    selected={isActive}
                    onClick={() => handleNavClick(item.path)}
                    sx={{
                      // When collapsed: center the icon; when expanded: normal padding
                      justifyContent: open ? "initial" : "center",
                      px: open ? 2 : 1.5,
                      mx: open ? 1 : 0.5,
                      mb: 0.5,
                      borderRadius: 2,
                      transition: "all 0.2s ease",
                      "&.Mui-selected": {
                        backgroundColor: "#1e3a5f",
                        borderLeft: open ? "3px solid #0050e6" : "none",
                        borderRight: !open ? "3px solid #0050e6" : "none",
                        "& .MuiListItemIcon-root": { color: "#93c5fd" },
                      },
                      "&:hover": { backgroundColor: "#1a2e47" },
                      "&.Mui-selected:hover": { backgroundColor: "#1e3a5f" },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        color: isActive ? "#93c5fd" : "#94a3b8",
                        // Keep icon centered when collapsed
                        minWidth: 0,
                        mr: open ? 2 : "auto",
                        justifyContent: "center",
                        transition: "margin 0.2s ease",
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>

                    {/* Label: fade out when collapsed */}
                    <ListItemText
                      primary={item.name}
                      primaryTypographyProps={{
                        fontSize: "0.9rem",
                        fontWeight: isActive ? 700 : 400,
                        color: isActive ? "#f0f9ff" : "#94a3b8",
                        // Prevent text reflow causing layout jump
                        noWrap: true,
                      }}
                      sx={{
                        opacity: open ? 1 : 0,
                        // Collapse text width to 0 smoothly
                        maxWidth: open ? 200 : 0,
                        overflow: "hidden",
                        transition: "opacity 0.2s ease, max-width 0.2s ease",
                        m: 0,
                      }}
                    />
                  </ListItemButton>
                </Tooltip>
              );
            })}
          </List>
        </Box>

        <Divider sx={{ borderColor: "rgba(255,255,255,0.08)" }} />

        {/* Footer: hide text when collapsed */}
        <Box
          sx={{
            p: open ? 2 : 1,
            display: "flex",
            justifyContent: open ? "flex-start" : "center",
            transition: "padding 0.2s ease",
          }}
        >
          {open ? (
            <Typography variant="caption" sx={{ color: "#475569" }}>
               Admin Panel
            </Typography>
          ) : (
            <Tooltip title="© 2025 Admin Panel" placement="right">
              <Typography variant="caption" sx={{ color: "#475569", fontSize: 10 }}>
                ©
              </Typography>
            </Tooltip>
          )}
        </Box>
      </MiniDrawer>

      {/* ── MAIN CONTENT ──────────────────────────────────────── */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3 },
          pt: { xs: 9, sm: 10 },
          minHeight: "100vh",
          backgroundColor: "#f1f5f9",
          overflowX: "hidden",
          boxSizing: "border-box",
          transition: theme.transitions.create("margin", {
            easing: theme.transitions.easing.sharp,
            duration: open
              ? theme.transitions.duration.enteringScreen
              : theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        <Outlet />
      </Box>

    </Box>
  );
};

export default DashBoardLayout;
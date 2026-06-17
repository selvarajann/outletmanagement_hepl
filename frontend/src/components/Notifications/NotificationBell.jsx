import React, { useState, useEffect } from "react";
import { Badge, IconButton, Box } from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import { keyframes } from "@emotion/react";
import { useNotifications } from "../../hooks/useNotifications";
import NotificationPanel from "./NotificationPanel";
import { C } from "../../theme/colors";

const pulse = keyframes`
  0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.7); }
  70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(37, 99, 235, 0); }
  100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(37, 99, 235, 0); }
`;

const NotificationBell = () => {
  const { unreadCount } = useNotifications();
  const [panelOpen, setPanelOpen] = useState(false);
  const [isPulsing, setIsPulsing] = useState(false);
  const [prevCount, setPrevCount] = useState(unreadCount);

  // Trigger pulse animation when unread count increases
  useEffect(() => {
    if (unreadCount > prevCount) {
      setIsPulsing(true);
      const timer = setTimeout(() => setIsPulsing(false), 3000); // Pulse for 3s
      return () => clearTimeout(timer);
    }
    setPrevCount(unreadCount);
  }, [unreadCount, prevCount]);

  return (
    <>
      <Box sx={{ position: "relative" }}>
        <IconButton
          color="inherit"
          onClick={() => setPanelOpen(true)}
          sx={{
            ml: 1,
            color: C.slate,
            "&:hover": { color: C.blue, bgcolor: C.blueLight },
            transition: "all 0.2s",
            animation: isPulsing ? `${pulse} 1.5s infinite` : "none",
          }}
        >
          <Badge
            badgeContent={unreadCount}
            color="error"
            max={99}
            sx={{
              "& .MuiBadge-badge": {
                bgcolor: C.rose,
                color: C.white,
                fontWeight: "bold",
                boxShadow: "0 0 0 2px white",
              },
            }}
          >
            <NotificationsIcon />
          </Badge>
        </IconButton>
      </Box>

      <NotificationPanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
      />
    </>
  );
};

export default NotificationBell;

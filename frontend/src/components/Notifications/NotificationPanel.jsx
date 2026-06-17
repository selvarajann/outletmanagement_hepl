import React from "react";
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  List,
  Button,
  Divider,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import NotificationsOffIcon from "@mui/icons-material/NotificationsOff";
import DoneAllIcon from "@mui/icons-material/DoneAll";

import NotificationItem from "./NotificationItem";
import { useNotifications } from "../../hooks/useNotifications";
import { C } from "../../theme/colors";

const NotificationPanel = ({ open, onClose }) => {
  const { notifications, markAllRead, deleteNotification } = useNotifications();

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: "100%", sm: 400 },
          bgcolor: C.bg,
          boxShadow: "-4px 0 24px rgba(0,0,0,0.1)",
          mt: "60px",
          height: "calc(100% - 60px)",
          display: "flex",
          flexDirection: "column",
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2.5,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          bgcolor: C.surface,
          borderBottom: `1px solid ${C.border}`,
          position: "sticky",
          top: 0,
          zIndex: 1,
        }}
      >
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600, color: C.navy }}>
            Notifications
          </Typography>
          <Typography variant="caption" sx={{ color: C.slateMid }}>
            You have {notifications.filter(n => !n.read).length} unread alerts
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          {notifications.length > 0 && (
            <Button
              size="small"
              startIcon={<DoneAllIcon />}
              onClick={markAllRead}
              sx={{ color: C.blue, textTransform: "none" }}
            >
              Mark all read
            </Button>
          )}
          <IconButton onClick={onClose} size="small" sx={{ color: C.slate }}>
            <CloseIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Content */}
      <Box sx={{ p: 2, flexGrow: 1, overflowY: "auto" }}>
        {notifications.length === 0 ? (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "60vh",
              color: C.muted,
              textAlign: "center",
            }}
          >
            <NotificationsOffIcon sx={{ fontSize: 64, color: C.border, mb: 2 }} />
            <Typography variant="h6" sx={{ color: C.slateMid, fontWeight: 500 }}>
              No notifications yet
            </Typography>
            <Typography variant="body2" sx={{ mt: 1, maxWidth: 250 }}>
              When you get stock alerts or system updates, they'll show up here.
            </Typography>
          </Box>
        ) : (
          <List disablePadding>
            {notifications.map((notif) => (
              <NotificationItem
                key={notif.id}
                notification={notif}
                onDelete={deleteNotification}
              />
            ))}
          </List>
        )}
      </Box>
    </Drawer>
  );
};

export default NotificationPanel;

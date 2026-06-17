import React from "react";
import {
  Box,
  Typography,
  IconButton,
  ListItem,
  ListItemText,
  ListItemIcon,
} from "@mui/material";
import { keyframes } from "@emotion/react";
import CloseIcon from "@mui/icons-material/Close";
import InventoryIcon from "@mui/icons-material/Inventory";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import InfoIcon from "@mui/icons-material/Info";
import SyncIcon from "@mui/icons-material/Sync";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";

import { timeAgo } from "../../utils/timeAgo";
import { C } from "../../theme/colors";

const fadeIn = keyframes`
  from { opacity: 0; transform: translateX(10px); }
  to { opacity: 1; transform: translateX(0); }
`;

const NotificationItem = ({ notification, onDelete }) => {
  const getIcon = (type) => {
    switch (type) {
      case "STOCK_ORDER_CREATED":
        return <InventoryIcon sx={{ color: C.blue }} />;
      case "STOCK_ORDER_APPROVED":
      case "SUCCESS":
        return <CheckCircleIcon sx={{ color: C.emerald }} />;
      case "STOCK_ORDER_CANCELLED":
      case "ERROR":
        return <CancelIcon sx={{ color: C.rose }} />;
      case "LOW_STOCK_ALERT":
      case "WARNING":
        return <WarningAmberIcon sx={{ color: C.amber }} />;
      case "NEW_USER_REGISTERED":
        return <PersonAddIcon sx={{ color: C.teal }} />;
      case "IMPORT_COMPLETED":
        return <SyncIcon sx={{ color: C.indigo }} />;
      case "AUDIT_ACTION":
        return <AdminPanelSettingsIcon sx={{ color: C.violet }} />;
      case "INFO":
      default:
        return <InfoIcon sx={{ color: C.slateMid }} />;
    }
  };

  const getBorderColor = (type) => {
    switch (type) {
      case "STOCK_ORDER_CREATED": return C.blue;
      case "STOCK_ORDER_APPROVED":
      case "SUCCESS": return C.emerald;
      case "STOCK_ORDER_CANCELLED":
      case "ERROR": return C.rose;
      case "LOW_STOCK_ALERT":
      case "WARNING": return C.amber;
      case "NEW_USER_REGISTERED": return C.teal;
      case "IMPORT_COMPLETED": return C.indigo;
      case "AUDIT_ACTION": return C.violet;
      case "INFO":
      default: return C.border;
    }
  };

  return (
    <ListItem
      sx={{
        mb: 1.5,
        p: 2,
        alignItems: "flex-start",
        bgcolor: notification.read ? C.surface : C.blueLight,
        borderRadius: "12px",
        borderLeft: `4px solid ${getBorderColor(notification.type)}`,
        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
        transition: "all 0.2s ease-in-out",
        animation: `${fadeIn} 0.3s ease-out forwards`,
        "&:hover": {
          bgcolor: notification.read ? C.bgMuted : "#e0e7ff",
          transform: "translateY(-1px)",
        },
      }}
    >
      <ListItemIcon sx={{ minWidth: 40, mt: 0.5 }}>
        {getIcon(notification.type)}
      </ListItemIcon>
      
      <Box sx={{ flexGrow: 1, minWidth: 0, mr: 2 }}>
        <Box display="flex" alignItems="center" gap={1} mb={0.5}>
          <Typography variant="subtitle2" sx={{ fontWeight: notification.read ? 500 : 700, color: C.navy, lineHeight: 1.2 }} noWrap>
            {notification.title}
          </Typography>
          {!notification.read && (
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                bgcolor: C.blue,
                boxShadow: `0 0 4px ${C.blue}`,
                flexShrink: 0
              }}
            />
          )}
        </Box>
        <Typography variant="body2" sx={{ color: C.slate, lineHeight: 1.4 }}>
          {notification.message}
        </Typography>
      </Box>

      <Box display="flex" flexDirection="column" alignItems="flex-end" gap={1} flexShrink={0}>
        <Typography variant="caption" sx={{ color: C.muted, whiteSpace: "nowrap", lineHeight: 1.2, mt: 0.5 }}>
          {timeAgo(notification.createdAt)}
        </Typography>
        <IconButton 
          aria-label="delete" 
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(notification.id);
          }}
          sx={{ color: C.slateMid, "&:hover": { color: C.rose, bgcolor: "rgba(225, 29, 72, 0.08)" }, p: 0.5 }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>
    </ListItem>
  );
};

export default NotificationItem;

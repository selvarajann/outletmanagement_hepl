import React, { createContext, useState, useEffect, useContext, useCallback, useRef } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client/dist/sockjs";
import notificationService from "../services/notificationService";
import { useAuth } from "../hooks/useAuth";

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { user, token } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const stompClientRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  const fetchInitialData = useCallback(async () => {
    if (!user) return;
    try {
      const [countRes, listRes] = await Promise.all([
        notificationService.getUnreadCount(),
        notificationService.getNotifications(0, 50),
      ]);
      if (countRes.success) setUnreadCount(countRes.data);
      if (listRes.success) setNotifications(listRes.data.content || []);
    } catch (error) {
      console.error("Failed to fetch initial notifications:", error);
    }
  }, [user]);

  const connectWebSocket = useCallback(() => {
    if (!token || !user) return;
    if (stompClientRef.current && stompClientRef.current.active) return;

    // Use absolute URL if in dev, else relative
    const wsUrl = window.location.hostname === "localhost" ? "http://localhost:8080/ws" : "/ws";
    
    const client = new Client({
      webSocketFactory: () => new SockJS(wsUrl),
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      debug: (str) => {
        // console.debug(str); // Uncomment for debugging WebSocket
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        console.log("WebSocket connected for user:", user.username);
        
        // 1. Subscribe to role-based notifications
        if (user.role) {
          client.subscribe(`/topic/role/${user.role}`, (message) => {
            handleIncomingNotification(JSON.parse(message.body));
          });
        }
        
        // 2. Subscribe to user-specific notifications
        client.subscribe(`/user/${user.username}/queue/notifications`, (message) => {
          handleIncomingNotification(JSON.parse(message.body));
        });
      },
      onStompError: (frame) => {
        console.error("Broker reported error: " + frame.headers["message"]);
        console.error("Additional details: " + frame.body);
      },
      onWebSocketClose: (event) => {
        console.log("WebSocket disconnected", event);
      }
    });

    client.activate();
    stompClientRef.current = client;

  }, [token, user]);

  const disconnectWebSocket = useCallback(() => {
    if (stompClientRef.current) {
      stompClientRef.current.deactivate();
      stompClientRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
  }, []);

  useEffect(() => {
    if (user && token) {
      fetchInitialData();
      connectWebSocket();
    } else {
      setNotifications([]);
      setUnreadCount(0);
      disconnectWebSocket();
    }

    return () => {
      disconnectWebSocket();
    };
  }, [user, token, fetchInitialData, connectWebSocket, disconnectWebSocket]);

  const handleIncomingNotification = (notification) => {
    setNotifications((prev) => [notification, ...prev]);
    setUnreadCount((prev) => prev + 1);
    
    // Optional: could trigger browser native notification here
    // if (Notification.permission === 'granted') {
    //   new Notification(notification.title, { body: notification.message });
    // }
  };

  const markAllRead = async () => {
    try {
      await notificationService.markAllRead();
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error("Failed to mark notifications as read:", error);
    }
  };

  const deleteNotification = async (id) => {
    try {
      await notificationService.deleteNotification(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      // Re-fetch unread count to be accurate
      const countRes = await notificationService.getUnreadCount();
      if (countRes.success) setUnreadCount(countRes.data);
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAllRead,
        deleteNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
};

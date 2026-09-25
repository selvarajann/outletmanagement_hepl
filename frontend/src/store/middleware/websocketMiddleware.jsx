import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client/dist/sockjs';
import { addNotification } from '../slices/notificationSlice';

export const websocketMiddleware = (store) => {
  let client = null;

  return (next) => (action) => {
    // When a user logs in (or app initializes with a token), connect WebSocket
    if (action.type === 'auth/setLoginState' || (action.type?.startsWith('auth/') && store.getState().auth.token)) {
      const state = store.getState();
      const token = action.payload?.token || state.auth.token;
      const user = action.payload?.user || state.auth.user;
      const role = action.payload?.role || state.auth.role;

      if (!client && token && user) {
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || (window.location.hostname === "localhost" ? "http://localhost:8080" : "");
        const wsUrl = import.meta.env.VITE_WS_URL || `${apiBaseUrl}/ws`;

        client = new Client({
          webSocketFactory: () => new SockJS(wsUrl),
          connectHeaders: { Authorization: `Bearer ${token}` },
          reconnectDelay: 5000,
          heartbeatIncoming: 4000,
          heartbeatOutgoing: 4000,
          onConnect: () => {
            if (role) {
              client.subscribe(`/topic/role/${role}`, (message) => {
                store.dispatch(addNotification(JSON.parse(message.body)));
              });
            }
            client.subscribe(`/user/${user}/queue/notifications`, (message) => {
              store.dispatch(addNotification(JSON.parse(message.body)));
            });
          }
        });
        client.activate();
      }
    }

    // When user logs out, disconnect WebSocket
    if (action.type === 'auth/logout/fulfilled') {
      if (client) {
        client.deactivate();
        client = null;
      }
    }

    return next(action);
  };
};

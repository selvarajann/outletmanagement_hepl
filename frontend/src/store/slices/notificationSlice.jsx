import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import notificationService from '../../services/notificationService';

export const fetchInitialNotifications = createAsyncThunk(
  'notifications/fetchInitial',
  async (_, { getState }) => {
    const { user } = getState().auth;
    if (!user) return { unreadCount: 0, notifications: [] };
    
    const [countRes, listRes] = await Promise.all([
      notificationService.getUnreadCount(),
      notificationService.getNotifications(0, 50),
    ]);
    
    return {
      unreadCount: countRes.success ? countRes.data : 0,
      notifications: listRes.success ? (listRes.data.content || []) : [],
    };
  }
);

export const markAllRead = createAsyncThunk(
  'notifications/markAllRead',
  async () => {
    await notificationService.markAllRead();
    return true;
  }
);

export const deleteNotification = createAsyncThunk(
  'notifications/delete',
  async (id) => {
    await notificationService.deleteNotification(id);
    const countRes = await notificationService.getUnreadCount();
    return {
      id,
      unreadCount: countRes.success ? countRes.data : 0
    };
  }
);

const initialState = {
  notifications: [],
  unreadCount: 0,
};

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addNotification: (state, action) => {
      state.notifications.unshift(action.payload);
      state.unreadCount += 1;
    },
    clearNotifications: (state) => {
      state.notifications = [];
      state.unreadCount = 0;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchInitialNotifications.fulfilled, (state, action) => {
        state.notifications = action.payload.notifications;
        state.unreadCount = action.payload.unreadCount;
      })
      .addCase(markAllRead.fulfilled, (state) => {
        state.unreadCount = 0;
        state.notifications = state.notifications.map(n => ({ ...n, read: true }));
      })
      .addCase(deleteNotification.fulfilled, (state, action) => {
        state.notifications = state.notifications.filter(n => n.id !== action.payload.id);
        state.unreadCount = action.payload.unreadCount;
      });
  }
});

export const { addNotification, clearNotifications } = notificationSlice.actions;
export default notificationSlice.reducer;

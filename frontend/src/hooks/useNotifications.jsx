import { useSelector, useDispatch } from 'react-redux';
import { markAllRead, deleteNotification, fetchInitialNotifications } from '../store/slices/notificationSlice';
import { useEffect } from 'react';

export const useNotifications = () => {
  const dispatch = useDispatch();
  const { notifications, unreadCount } = useSelector((state) => state.notifications);
  const user = useSelector((state) => state.auth.user);

  useEffect(() => {
    if (user) {
      dispatch(fetchInitialNotifications());
    }
  }, [user, dispatch]);

  return {
    notifications,
    unreadCount,
    markAllRead: () => dispatch(markAllRead()),
    deleteNotification: (id) => dispatch(deleteNotification(id)),
  };
};

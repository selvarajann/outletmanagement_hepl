import api from "../config/axiosInstance";

const API_URL = "/api/v1/notifications";

const getNotifications = async (page = 0, size = 20) => {
  const response = await api.get(`${API_URL}?page=${page}&size=${size}`);
  return response.data;
};

const getUnreadCount = async () => {
  const response = await api.get(`${API_URL}/unread-count`);
  return response.data;
};

const markAllRead = async () => {
  const response = await api.put(`${API_URL}/mark-all-read`);
  return response.data;
};

const deleteNotification = async (id) => {
  const response = await api.delete(`${API_URL}/${id}`);
  return response.data;
};

const notificationService = {
  getNotifications,
  getUnreadCount,
  markAllRead,
  deleteNotification,
};

export default notificationService;

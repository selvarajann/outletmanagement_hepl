import api from "../config/axiosInstance";

const API_URL = "/api/chatbot";

const getConversations = async () => {
  const response = await api.get(`${API_URL}/conversations`);
  return response.data;
};

const getConversation = async (id) => {
  const response = await api.get(`${API_URL}/conversations/${id}`);
  return response.data;
};

const sendMessage = async (conversationId, message) => {
  const response = await api.post(`${API_URL}/chat`, { conversationId, message });
  return response.data;
};

const deleteConversation = async (id) => {
  const response = await api.delete(`${API_URL}/conversations/${id}`);
  return response.data;
};

const chatbotService = {
  getConversations,
  getConversation,
  sendMessage,
  deleteConversation,
};

export default chatbotService;

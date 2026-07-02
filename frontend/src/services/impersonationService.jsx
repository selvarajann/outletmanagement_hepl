import axiosInstance from "../config/axiosInstance";

const startImpersonation = async (targetUserId) => {
  const response = await axiosInstance.post(`/api/v1/admin/impersonate/start/${targetUserId}`);
  return response.data.data;
};

const endImpersonation = async () => {
  const response = await axiosInstance.post("/api/v1/admin/impersonate/end");
  return response.data;
};

const getActiveSessions = async () => {
  const response = await axiosInstance.get("/api/v1/admin/impersonate/sessions/active");
  return response.data.data;
};

const getSessionHistory = async (targetUsername = "") => {
  const response = await axiosInstance.get("/api/v1/admin/impersonate/sessions/history", {
    params: { targetUsername },
  });
  return response.data.data;
};

const getMyActiveSession = async () => {
  const response = await axiosInstance.get("/api/v1/admin/impersonate/sessions/me");
  return response.data.data;
};

export default {
  startImpersonation,
  endImpersonation,
  getActiveSessions,
  getSessionHistory,
  getMyActiveSession,
};

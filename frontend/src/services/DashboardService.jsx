import api from "../config/axiosInstance";

export const getDashboardSummary = async (signal) => {
  const res = await api.get("/api/dashboard/summary", { signal });
  return res.data.data;
};

export const getLowStock = async (signal) => {
  const res = await api.get("/api/dashboard/low-stock", { signal });
  return res.data.data;
};

export const getExpiringSoon = async (daysAhead, signal) => {
  const res = await api.get("/api/dashboard/expiring-soon", {
    params: { daysAhead },
    signal,
  });
  return res.data.data;
};

import api from "../config/axiosInstance";

export const getDeadLetters = async (signal) => {
  const res = await api.get("/api/sync/dead-letters", { signal });
  return res.data.data;
};

export const retrySync = async ({ type, id }) => {
  const res = await api.post(`/api/sync/retry/${type}/${id}`);
  return res.data;
};

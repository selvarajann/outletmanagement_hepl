import api from "../config/axiosInstance";

export const getQuarantinedBatchItems = async (params, signal) => {
  const res = await api.get("/api/batch-quarantine", { params, signal });
  const d = res.data.data;
  return { rows: d.content, totalPages: d.totalPages };
};

export const approveQuarantine = async (batchItemId) => {
  const res = await api.post(`/api/batch-quarantine/${batchItemId}/approve`);
  return res.data;
};

export const rejectQuarantine = async ({ batchItemId, reason }) => {
  const res = await api.post(`/api/batch-quarantine/${batchItemId}/reject`, {
    reason,
  });
  return res.data;
};

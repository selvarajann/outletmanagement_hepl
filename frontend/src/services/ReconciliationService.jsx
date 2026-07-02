import api from "../config/axiosInstance";

export const getReconciliationReports = async (params, signal) => {
  const res = await api.get("/api/reconciliation/reports", { params, signal });
  const d = res.data.data;
  return { rows: d.content, totalPages: d.totalPages };
};

export const getReportMismatches = async (reportId, signal) => {
  const res = await api.get(`/api/reconciliation/reports/${reportId}/mismatches`, { signal });
  return res.data.data;
};

export const triggerReconciliation = async () => {
  const res = await api.post("/api/reconciliation/trigger");
  return res.data;
};

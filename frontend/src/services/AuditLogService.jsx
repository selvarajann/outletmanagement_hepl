import api from '../config/axiosInstance';

const URL = '/api/v1/audit-logs';

export const GetAuditLogs = async (params, signal) => {
  const res = await api.get(URL, { params, signal });
  const d = res.data.data;
  return { rows: d.content, totalPages: d.totalPages, totalElements: d.totalElements };
};

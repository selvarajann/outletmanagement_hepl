import api from '../config/axiosInstance';

export const GetJobs = async (signal) => {
  const res = await api.get('/api/jobs', { signal });
  return res.data.data;
};

export const CreateJob = async (data) => {
  const res = await api.post('/api/jobs', data);
  return res.data.data;
};

export const UpdateJob = async ({ id, ...data }) => {
  const res = await api.put(`/api/jobs/${id}`, data);
  return res.data.data;
};

export const DeleteJob = async (id) => {
  const res = await api.delete(`/api/jobs/${id}`);
  return res.data;
};

export const RunJob = async (id) => {
  const res = await api.post(`/api/jobs/${id}/run`);
  return res.data;
};

// Legacy manual export kept for PDF download specific logic
export const RunDailySalesReport = async () => {
  const res = await api.post('/api/jobs/daily-sales-report/run');
  return res.data;
};

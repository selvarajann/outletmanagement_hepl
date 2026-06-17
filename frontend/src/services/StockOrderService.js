import api from "../config/axiosInstance";

const URL = "/api/stock-orders";

export const GetStockOrders = async (params, signal) => {
  const res = await api.get(URL, { params, signal });
  const d = res.data.data;
  return { rows: d.content, totalPages: d.totalPages };
};

export const GetStockOrderById = async (id, signal) => {
  const res = await api.get(`${URL}/${id}`, { signal });
  return res.data.data;
};

export const CreateStockOrder = async (data, signal) => {
  const res = await api.post(URL, data, { signal });
  return res.data;
};

export const UpdateStockOrder = async (id, data, signal) => {
  const res = await api.put(`${URL}/${id}`, data, { signal });
  return res.data;
};

export const ApproveStockOrder = async (id, signal) => {
  const res = await api.patch(`${URL}/${id}/approve`, {}, { signal });
  return res.data;
};

export const CancelStockOrder = async (id, signal) => {
  const res = await api.patch(`${URL}/${id}/cancel`, {}, { signal });
  return res.data;
};

export const DeleteStockOrder = async (id, signal) => {
  const res = await api.delete(`${URL}/${id}`, { signal });
  return res.data;
};

export const RetryImsPush = async (id, signal) => {
  const res = await api.post(`${URL}/${id}/retry-ims`, {}, { signal });
  return res.data;
};

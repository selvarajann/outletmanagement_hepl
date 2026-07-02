import api from "../config/axiosInstance";

const URL = "/api/batches";

export const GetBatches = async (params, signal) => {
  const res = await api.get(URL, { params, signal });
  const d = res.data.data;
  return { rows: d.content, totalPages: d.totalPages };
};

export const GetBatchById = async (id, signal) => {
  const res = await api.get(`${URL}/${id}`, { signal });
  return res.data.data;
};

export const CreateBatch = async (data, signal) => {
  const res = await api.post(URL, data, { signal });
  return res.data;
};

export const ReceiveBatch = async (id, data, signal) => {
  const res = await api.patch(`${URL}/${id}/receive`, data, { signal });
  return res.data;
};

export const DeliverBatch = async (id, signal) => {
  const res = await api.patch(`${URL}/${id}/deliver`, {}, { signal });
  return res.data;
};

export const CancelBatch = async (id, signal) => {
  const res = await api.patch(`${URL}/${id}/cancel`, {}, { signal });
  return res.data;
};

export const UpdateBatchPrices = async (id, items, signal) => {
  const res = await api.put(`${URL}/${id}/items`, items, { signal });
  return res.data;
};

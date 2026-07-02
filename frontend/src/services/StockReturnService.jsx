import api from "../config/axiosInstance";

const URL = "/api/stock-returns";

export const GetStockReturns = async (params, signal) => {
  const res = await api.get(URL, { params, signal });
  const d = res.data.data;
  return { rows: d.content, totalPages: d.totalPages, totalElements: d.totalElements };
};

export const GetStockReturnById = async (id, signal) => {
  const res = await api.get(`${URL}/${id}`, { signal });
  return res.data.data;
};

export const CreateStockReturn = async (data, signal) => {
  const res = await api.post(URL, data, { signal });
  return res.data;
};

export const RetryImsPush = async (id, signal) => {
  const res = await api.post(`${URL}/${id}/retry-ims`, {}, { signal });
  return res.data;
};

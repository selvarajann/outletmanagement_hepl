import api from "../config/axiosInstance";

const URL = "/api/stock";

export const GetStock = async (params, signal) => {
  const res = await api.get(URL, { params, signal });
  const d = res.data.data;
  return { rows: d.content, totalPages: d.totalPages };
};

export const GetStockByOutlet = async (outletId, signal) => {
  const res = await api.get(`${URL}/outlet/${outletId}`, { signal });
  return res.data.data;
};

export const GetStockSummary = async (signal) => {
  const res = await api.get(`${URL}/summary`, { signal });
  return res.data.data;
};

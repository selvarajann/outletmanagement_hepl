import api from "../config/axiosInstance";

const URL = "/api/sales";

export const ProcessSale = async (data, signal) => {
  const res = await api.post(URL, data, { signal });
  return res.data;
};

export const GetSales = async (params, signal) => {
  const res = await api.get(URL, { params, signal });
  const d = res.data.data;
  return { rows: d.content, totalPages: d.totalPages };
};

export const GetSaleById = async (id, signal) => {
  const res = await api.get(`${URL}/${id}`, { signal });
  return res.data.data;
};

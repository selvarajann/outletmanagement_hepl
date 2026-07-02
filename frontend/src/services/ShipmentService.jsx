import api from "../config/axiosInstance";

const URL = "/api/shipments";

export const GetShipments = async (params, signal) => {
  const res = await api.get(URL, { params, signal });
  const d = res.data.data;
  return { rows: d.content, totalPages: d.totalPages };
};

export const GetShipmentById = async (id, signal) => {
  const res = await api.get(`${URL}/${id}`, { signal });
  return res.data.data;
};

export const ReceiveShipment = async (id, data, receivedBy, signal) => {
  const res = await api.post(`${URL}/${id}/receive`, data, { 
      params: { receivedBy },
      signal 
  });
  return res.data;
};

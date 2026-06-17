import api from "../config/axiosInstance";

const URL = "/api/stock-returns";

export const GetStockReturns = async (params, signal) => {
  const res = await api.get(URL, { params, signal });
  const d = res.data.data;
  return { rows: d.content, totalPages: d.totalPages };
};

export const GetStockReturnById = async (id, signal) => {
  const res = await api.get(`${URL}/${id}`, { signal });
  return res.data.data;
};

export const CreateStockReturn = async (data, createdBy, signal) => {
  const res = await api.post(URL, data, { 
      params: { createdBy },
      signal 
  });
  return res.data;
};

export const ApproveReturn = async (id, signal) => {
  const res = await api.patch(`${URL}/${id}/approve`, {}, { signal });
  return res.data;
};

export const RejectReturn = async (id, reason, signal) => {
  const res = await api.patch(`${URL}/${id}/reject`, {}, { 
      params: { reason },
      signal 
  });
  return res.data;
};

export const CompleteReturn = async (id, imsAckCode, signal) => {
  const res = await api.patch(`${URL}/${id}/complete`, {}, { 
      params: { imsAckCode },
      signal 
  });
  return res.data;
};

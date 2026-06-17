import api from "../config/axiosInstance";

const URL = "/api/outlets";

export const GetOutlets = async (params, signal) => {
  const res = await api.get(URL, { params, signal });
  const data = res.data.data;

  return {
    outlets: data.content,
    totalPages: data.totalPages,
    currentPage: data.number
  };
};

export const GetOutletById = async (id, signal) => {
  const res = await api.get(`${URL}/${id}`, { signal });
  return res.data.data;
};

export const CreateOutlet = async (data, signal) =>
  api.post(URL, data, { signal });

export const UpdateOutlet = async (id, data, signal) =>
  api.put(`${URL}/${id}`, data, { signal });

export const DeleteOutlet = async (id, signal) =>
  api.delete(`${URL}/${id}`, { signal });
import api from "../config/axiosInstance";

const URL = "/api/outlets";

export const GetOutlets = async (params) => {
  const res = await api.get(URL, { params });
  const data = res.data.data;
  return { outlets: data.content, totalPages: data.totalPages, currentPage: data.number };
};

export const CreateOutlet = async (data) => api.post(URL, data);

export const UpdateOutlet = async (id, data) => api.put(`${URL}/${id}`, data);

export const DeleteOutlet = async (id) => api.delete(`${URL}/${id}`);

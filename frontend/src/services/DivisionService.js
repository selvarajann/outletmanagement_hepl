import api from "../config/axiosInstance";

const URL = "/api/divisions";

export const GetDivisions = async (params) => {
  const res = await api.get(URL, { params });
  const data = res.data.data;
  return { divisions: data.content, totalPages: data.totalPages, currentPage: data.number };
};

export const CreateDivision = async (data) => api.post(URL, data);

export const UpdateDivision = async (id, data) => api.put(`${URL}/${id}`, data);

export const DeleteDivision = async (id) => api.delete(`${URL}/${id}`);

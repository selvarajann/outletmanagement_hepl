import api from "../config/axiosInstance";

const URL = "/api/divisions";

export const GetDivisions = async (params, signal) => {
  const res = await api.get(URL, { params, signal });
  const data = res.data.data;
  return { divisions: data.content, totalPages: data.totalPages, currentPage: data.number };
};

export const CreateDivision = async (data, signal) => api.post(URL, data, { signal });

export const UpdateDivision = async (id, data, signal) => api.put(`${URL}/${id}`, data, { signal });

export const DeleteDivision = async (id, signal) => api.delete(`${URL}/${id}`, { signal });

export const ImportDivisions = async (file, signal) => {
  const form = new FormData();
  form.append("file", file);
  const res = await api.post(`${URL}/import`, form, { signal });
  return res.data.data;
};

export const ExportDivisions = async (params, format) => {
  const res = await api.get(`${URL}/export`, { params: { ...params, format }, responseType: 'blob' });
  return res.data;
};

export const GetDivisionTemplate = async (format) => {
  const res = await api.get(`${URL}/template`, { params: { format }, responseType: 'blob' });
  return res.data;
};

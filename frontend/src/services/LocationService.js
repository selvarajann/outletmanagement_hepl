import api from "../config/axiosInstance";

const URL = "/api/locations";

export const GetLocations = async (params, signal) => {
  const res = await api.get(URL, { params, signal });
  const data = res.data.data;
  return { locations: data.content, totalPages: data.totalPages, currentPage: data.number };
};

export const CreateLocation = async (data, signal) => api.post(URL, data, { signal });

export const UpdateLocation = async (id, data, signal) => api.put(`${URL}/${id}`, data, { signal });

export const DeleteLocation = async (id, signal) => api.delete(`${URL}/${id}`, { signal });

export const ImportLocations = async (file, signal) => {
  const form = new FormData();
  form.append("file", file);
  const res = await api.post(`${URL}/import`, form, { signal });
  return res.data.data;
};

export const ExportLocations = async (params, format) => {
  const res = await api.get(`${URL}/export`, { params: { ...params, format }, responseType: 'blob' });
  return res.data;
};

export const GetLocationTemplate = async (format) => {
  const res = await api.get(`${URL}/template`, { params: { format }, responseType: 'blob' });
  return res.data;
};

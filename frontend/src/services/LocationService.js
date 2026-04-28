import api from "../config/axiosInstance";

const URL = "/api/locations";

export const GetLocations = async (params) => {
  const res = await api.get(URL, { params });
  const data = res.data.data;
  return { locations: data.content, totalPages: data.totalPages, currentPage: data.number };
};

export const CreateLocation = async (data) => api.post(URL, data);

export const UpdateLocation = async (id, data) => api.put(`${URL}/${id}`, data);

export const DeleteLocation = async (id) => api.delete(`${URL}/${id}`);

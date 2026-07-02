import api from "../config/axiosInstance";

const URL = "/api/products";

export const GetProducts = async (params, signal) => {
  const res = await api.get(URL, { params, signal });
  const data = res.data.data;
  return { products: data.content, totalPages: data.totalPages, currentPage: data.number };
};

export const CreateProduct = async (data, signal) => api.post(URL, data, { signal });

export const UpdateProduct = async (id, data, signal) => api.put(`${URL}/${id}`, data, { signal });

export const DeleteProduct = async (id, signal) => api.delete(`${URL}/${id}`, { signal });

export const ImportProducts = async (file, signal) => {
  const form = new FormData();
  form.append("file", file);
  const res = await api.post(`${URL}/import`, form, { signal });
  return res.data.data;
};

export const UploadProductImage = async (id, file, signal) => {
  const form = new FormData();
  form.append("file", file);
  const res = await api.patch(`${URL}/${id}/image`, form, {
    signal,
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data.data;
};

export const ExportProducts = async (params, format) => {
  const res = await api.get(`${URL}/export`, { params: { ...params, format }, responseType: 'blob' });
  return res.data;
};

export const GetProductTemplate = async (format) => {
  const res = await api.get(`${URL}/template`, { params: { format }, responseType: 'blob' });
  return res.data;
};


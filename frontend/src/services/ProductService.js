import api from "../config/axiosInstance";

const URL = "/api/products";

export const GetProducts = async (params) => {
  const res = await api.get(URL, { params });
  const data = res.data.data;
  return { products: data.content, totalPages: data.totalPages, currentPage: data.number };
};

export const CreateProduct = async (data) => api.post(URL, data);

export const UpdateProduct = async (id, data) => api.put(`${URL}/${id}`, data);

export const DeleteProduct = async (id) => api.delete(`${URL}/${id}`);

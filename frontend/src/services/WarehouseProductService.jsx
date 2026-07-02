import api from "../config/axiosInstance";

const URL = "/api/v1/warehouse-products";

export const GetWarehouseProducts = async (params, signal) => {
  const res = await api.get(URL, { params, signal });
  const data = res.data; 
  return { products: data.content, totalPages: data.totalPages, currentPage: data.number };
};

export const CreateWarehouseProduct = async (data, signal) => api.post(URL, data, { signal });

export const UpdateWarehouseProduct = async (id, data, signal) => api.put(`${URL}/${id}`, data, { signal });

export const DeleteWarehouseProduct = async (id, signal) => api.delete(`${URL}/${id}`, { signal });

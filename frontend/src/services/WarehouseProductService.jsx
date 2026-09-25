import api from "../config/axiosInstance";

const URL = "/api/v1/warehouse-products";

export const GetWarehouseProducts = async (params, signal) => {
  const res = await api.get(URL, { params, signal });
  // Controller now wraps in ApiResponse: { success, message, data: Page }
  const page = res.data.data;
  return {
    products: page?.content || [],
    totalPages: page?.totalPages || 0,
    currentPage: page?.number || 0,
    totalElements: page?.totalElements || 0,
  };
};

export const CreateWarehouseProduct = async (data, signal) => {
  const res = await api.post(URL, data, { signal });
  return res.data;
};

export const UpdateWarehouseProduct = async (id, data, signal) => {
  const res = await api.put(`${URL}/${id}`, data, { signal });
  return res.data;
};

export const DeleteWarehouseProduct = async (id, signal) => {
  const res = await api.delete(`${URL}/${id}`, { signal });
  return res.data;
};

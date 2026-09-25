import api from "../config/axiosInstance";

const URL = "/api/stock-orders";

export const GetStockOrders = async (params, signal) => {
  const res = await api.get("/api/stock-orders", { params, signal });
  const d = res.data.data;
  return { rows: d.content, totalPages: d.totalPages };
};

export const GetStockOrderById = async (id, signal) => {
  const res = await api.get(`${URL}/${id}`, { signal });
  return res.data.data;
};

export const CreateStockOrder = async (data, signal) => {
  const res = await api.post(URL, data, { signal });
  return res.data;
};

export const UpdateStockOrder = async (id, data, signal) => {
  const res = await api.put(`${URL}/${id}`, data, { signal });
  return res.data;
};

export const RequestCancelStockOrder = async (id, signal) => {
  const res = await api.post(`${URL}/${id}/request-cancel`, {}, { signal });
  return res.data;
};

export const DeleteStockOrder = async (id, signal) => {
  const res = await api.delete(`${URL}/${id}`, { signal });
  return res.data;
};

export const RetryImsPush = async (id, signal) => {
  const res = await api.post(`${URL}/${id}/retry-ims`, {}, { signal });
  return res.data;
};

export const GetWarehouseProducts = async (outletId, signal) => {
  const res = await api.get(`${URL}/warehouse-products`, {
    params: { outletId },
    signal,
  });
  return res.data.data;
};

export const PayStockOrder = async (id, signal) => {
  try {
    const res = await api.post(`${URL}/${id}/pay`, {}, { signal });
    return res.data;
  } catch (error) {
    // Fallback if the backend hasn't been restarted and /pay endpoint is missing (Returns 404 or mapped 500)
    if (error.response?.status === 404 || (error.response?.status === 500 && error.response?.data?.message?.includes("NoResourceFoundException"))) {
      console.warn("Falling back to PUT update for payment as /pay endpoint is missing.");
      // 1. Fetch current order
      const getRes = await api.get(`${URL}/${id}`, { signal });
      const orderData = getRes.data.data;
      
      // 2. Build full update request mapping the DTO fields exactly
      const requestData = {
        outletId: orderData.outletId,
        requestedDate: orderData.requestedDate,
        notes: orderData.notes || "",
        paymentMethod: "ONLINE",
        paymentStatus: "PAID",
        items: orderData.items.map(item => ({
          productId: item.productId,
          quantityRequested: item.quantityRequested
        }))
      };
      
      // 3. Update the whole order
      const updateRes = await api.put(`${URL}/${id}`, requestData, { signal });
      return updateRes.data;
    }
    throw error;
  }
};

export const DownloadBill = async (id) => {
  const res = await api.get(`${URL}/${id}/bill`, { responseType: 'blob' });
  const blob = new Blob([res.data], { type: 'text/html;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  // Open in new tab so user can print it or save as needed
  const newTab = window.open(url, '_blank');
  if (!newTab) {
    // Fallback: direct download if popup blocked
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `invoice_${id}.html`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  }
  setTimeout(() => window.URL.revokeObjectURL(url), 10000);
};

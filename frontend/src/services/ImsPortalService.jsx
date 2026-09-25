import api from "../config/axiosInstance";

const BASE = "/api/ims-portal";

// ── Orders ──────────────────────────────────────────────────────────────────
export const GetImsOrders = async (params, signal) => {
  const res = await api.get(`${BASE}/orders`, { params, signal });
  return res.data.data; // Page<ImsPortalOrderResponseDto>
};

export const GetImsOrderDetail = async (id, signal) => {
  const res = await api.get(`${BASE}/orders/${id}`, { signal });
  return res.data.data;
};

export const ApproveImsOrder = async (id, payload = {}) => {
  const res = await api.post(`${BASE}/orders/${id}/approve`, payload);
  return res.data;
};

export const RejectImsOrder = async (id, payload) => {
  const res = await api.post(`${BASE}/orders/${id}/reject`, payload);
  return res.data;
};

export const DispatchImsOrder = async (id, payload) => {
  const res = await api.post(`${BASE}/orders/${id}/dispatch`, payload);
  return res.data;
};

// ── Returns ──────────────────────────────────────────────────────────────────
export const GetImsReturns = async (params, signal) => {
  const res = await api.get(`${BASE}/returns`, { params, signal });
  return res.data.data;
};

export const GetImsReturnDetail = async (returnCode, signal) => {
  const res = await api.get(`${BASE}/returns/${returnCode}`, { signal });
  return res.data.data;
};

export const AcknowledgeImsReturn = async (returnCode, payload = {}) => {
  const res = await api.post(`${BASE}/returns/${returnCode}/acknowledge`, payload);
  return res.data;
};

export const PickupImsReturn = async (returnCode, payload = {}) => {
  const res = await api.post(`${BASE}/returns/${returnCode}/pickup`, payload);
  return res.data;
};

export const CompleteImsReturn = async (returnCode, payload = {}) => {
  const res = await api.post(`${BASE}/returns/${returnCode}/complete`, payload);
  return res.data;
};

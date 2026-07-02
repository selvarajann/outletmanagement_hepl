import api from "../config/axiosInstance";

const BASE = '/api/v1/users';

export async function getUsers() {
  try {
    const res = await api.get(BASE);
    return res.data.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || err.message || 'Failed to fetch users');
  }
}

export async function createUser(userData) {
  try {
    const res = await api.post(BASE, userData);
    return res.data.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || err.message || 'Failed to create user');
  }
}

export async function updateUser(id, userData) {
  try {
    const res = await api.put(`${BASE}/${id}`, userData);
    return res.data.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || err.message || 'Failed to update user');
  }
}

export async function deleteUser(id) {
  try {
    const res = await api.delete(`${BASE}/${id}`);
    return res.data.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || err.message || 'Failed to deactivate user');
  }
}

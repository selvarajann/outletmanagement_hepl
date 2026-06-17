import axios from "axios";
import { refreshToken } from "../services/authService";

const api = axios.create({
  baseURL: "",
  withCredentials: true, // send cookies (refreshToken HttpOnly) on every request
});

// ── Request interceptor: attach access token ────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const reqId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2);
    config.__requestId = reqId;
    window.dispatchEvent(new CustomEvent('show-global-loader', { detail: { id: reqId } }));

    try {
      const token = localStorage.getItem("token");
      if (token) config.headers.Authorization = `Bearer ${token}`;

      // Add Idempotency-Key for modifying requests
      if (['post', 'put', 'patch'].includes(config.method?.toLowerCase()) && !config.headers['Idempotency-Key']) {
        config.headers['Idempotency-Key'] = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2);
      }
    } catch (err) {
      window.dispatchEvent(new CustomEvent('hide-global-loader', { detail: { id: reqId } }));
      throw err;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ── Token-refresh state ──────────────────────────────────────────────────────
// Prevents a "refresh storm": if 5 requests all get 401 at the same time,
// only ONE refresh call is made; the other 4 are queued and retried afterward.
let isRefreshing = false;
let pendingQueue = []; // [{ resolve, reject }]

const processQueue = (error, token = null) => {
  pendingQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  pendingQueue = [];
};

// ── Response interceptor: handle 401 → silent refresh → retry ───────────────
api.interceptors.response.use(
  (res) => {
    const reqId = res.config?.__requestId;
    if (reqId) {
      window.dispatchEvent(new CustomEvent('hide-global-loader', { detail: { id: reqId } }));
    }
    return res;
  },
  async (error) => {
    const reqId = error.config?.__requestId;
    if (reqId) {
      window.dispatchEvent(new CustomEvent('hide-global-loader', { detail: { id: reqId } }));
    }

    const originalRequest = error.config;

    // Only handle 401 once per request (avoid infinite retry loop)
    if (error.response?.status !== 401 || originalRequest?._retry) {
      return Promise.reject(error);
    }

    // Skip retry for the refresh endpoint itself (would cause infinite loop)
    if (originalRequest?.url?.includes("/api/v1/auth/refresh")) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      // Another refresh is in progress — queue this request until it completes
      return new Promise((resolve, reject) => {
        pendingQueue.push({ resolve, reject });
      })
        .then((token) => {
          if (originalRequest) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          }
          return Promise.reject(error);
        })
        .catch((err) => {
          return Promise.reject(err);
        });
    }

    if (originalRequest) {
      originalRequest._retry = true;
    }
    isRefreshing = true;

    try {
      const data = await refreshToken(); // POST /api/v1/auth/refresh (sends cookie)

      const newToken = data.token;
      localStorage.setItem("token", newToken);
      if (data.role) localStorage.setItem("role", data.role);

      // Decode payload to keep user in sync
      try {
        const payload = JSON.parse(atob(newToken.split(".")[1]));
        if (payload.sub) localStorage.setItem("user", payload.sub);
      } catch {
        // non-critical; ignore
      }

      // Unblock queued requests
      processQueue(null, newToken);
      if (originalRequest) {
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      }
      return Promise.reject(error);
    } catch (refreshError) {
      processQueue(refreshError, null);

      // Refresh token is expired/invalid → force logout
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      localStorage.removeItem("user");
      window.location.href = "/login";
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;

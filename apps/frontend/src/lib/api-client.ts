import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Send cookies (refresh_token)
  headers: {
    "Content-Type": "application/json",
  },
});

// Access token stored in memory (not localStorage for security)
let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

// Request interceptor — attach JWT
apiClient.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Response interceptor — refresh on 401
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string | null) => void;
  reject: (err: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach((p) => {
    if (error) {
      p.reject(error);
    } else {
      p.resolve(token);
    }
  });
  failedQueue = [];
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Don't refresh if the failed request was itself a refresh attempt
      if (originalRequest.url?.includes("/auth/refresh")) {
        return Promise.reject(error);
      }

      // Don't refresh for public auth endpoints (they return 401 legitimately)
      const PUBLIC_ENDPOINTS = ["/auth/magic-link/request", "/auth/magic-link/verify"];
      if (PUBLIC_ENDPOINTS.some((ep) => originalRequest.url?.includes(ep))) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Queue this request until refresh completes
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token: string | null) => {
              if (token) {
                originalRequest.headers.Authorization = `Bearer ${token}`;
              }
              resolve(apiClient(originalRequest));
            },
            reject,
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post(
          `${API_URL}/auth/refresh`,
          {},
          { withCredentials: true },
        );

        accessToken = data.accessToken;
        processQueue(null, accessToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Only treat the session as lost if the refresh endpoint explicitly
        // returned 401 (token revoked/expired). Transient network failures
        // and server errors should not force a logout.
        const isAuthFailure =
          axios.isAxiosError(refreshError) &&
          refreshError.response?.status === 401;

        if (isAuthFailure) {
          accessToken = null;
          if (typeof window !== "undefined") {
            window.location.href = "/login";
          }
        }

        // Reject queued requests — callers can retry after a network error
        processQueue(refreshError, null);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default apiClient;

// Public client — no auth header, no 401 refresh (used for public browse pages)
export const apiPublic = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

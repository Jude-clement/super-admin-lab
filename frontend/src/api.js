import axios from 'axios';

let isRefreshing = false;
let refreshSubscribers = [];

function subscribeTokenRefresh(callback) {
  refreshSubscribers.push(callback);
}

function onRefreshed(token) {
  refreshSubscribers.forEach(callback => callback(token));
  refreshSubscribers = [];
}

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve) => {
          subscribeTokenRefresh((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(api(originalRequest));
          });
        });
      }

      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        const response = await axios.post(`${api.defaults.baseURL}/refresh`, { refresh_token: refreshToken });

        localStorage.setItem('access_token', response.data.access_token);
        localStorage.setItem('refresh_token', response.data.refresh_token);

        api.defaults.headers.common['Authorization'] = `Bearer ${response.data.access_token}`;
        originalRequest.headers.Authorization = `Bearer ${response.data.access_token}`;

        onRefreshed(response.data.access_token);
        isRefreshing = false;

        return api(originalRequest);
      } catch (err) {
        console.error('Failed to refresh token', err);
        isRefreshing = false;

        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);

export const setupAuthListeners = () => {
  window.addEventListener('storage', (event) => {
    if (event.key === 'access_token' && !event.newValue) {
      window.location.href = '/login';
    }
  });
};

export default api;
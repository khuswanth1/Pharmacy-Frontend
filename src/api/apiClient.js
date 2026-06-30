import axios from 'axios';

// Points at the API Gateway, which aggregates all microservices (see Swagger at
// http://localhost:8089/swagger-ui.html). Override with REACT_APP_API_URL.
const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8089',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token automatically
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('pharmacy_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token expiration/401 Unauthorized errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn("Unauthorized request detected (expired or invalid token). Logging out...");
      localStorage.removeItem('pharmacy_token');
      localStorage.removeItem('pharmacy_user');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;

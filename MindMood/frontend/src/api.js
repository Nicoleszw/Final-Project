import axios from 'axios';

const API_URL =
  import.meta.env.VITE_API_URL || 'https://mindmood-backend.onrender.com';

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

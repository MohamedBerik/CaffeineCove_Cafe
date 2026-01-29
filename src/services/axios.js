import axios from "axios";
import { notifyError } from "../utils/notify";

const api = axios.create({
  baseURL: "https://caffeinecoveapi-production-a107.up.railway.app/api", // Laravel API
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

// إضافة التوكن تلقائيًا
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

export default api;

import axios from "axios";

const api = axios.create({
  baseURL: "/api", // ✅ مفيش Cross-Origin
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});
export default api;

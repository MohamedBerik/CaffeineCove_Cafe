import api from "./axios";

// =======================
// Dashboard
// =======================
export const getAdminDashboard = () => api.get("/admin/dashboard");

// =======================
// CRUD
// =======================
export const getEntityById = (table, id) => api.get(`/admin/${table}/${id}`);

export const createEntity = (table, data) => api.post(`/admin/${table}`, data);

export const updateEntity = (table, id, data) =>
  api.put(`/admin/${table}/${id}`, data);

export const deleteEntity = (table, id) => api.delete(`/admin/${table}/${id}`);

export const getEntities = (table, params = {}) =>
  api.get(`/admin/${table}`, { params });

export const getTableData = (table, params) =>
  api.get(`/admin/${table}`, { params });

export const logout = () => api.post("/logout");

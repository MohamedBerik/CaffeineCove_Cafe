// src/pages/admin/Dashboard.jsx
import { useEffect, useState, useCallback } from "react";
import _ from "lodash";
import {
  getAdminDashboard,
  deleteEntity,
  getTableData,
} from "../../services/adminApi";
import { data, useNavigate } from "react-router-dom";
import "./Dashboard.css";
import AdminLayout from "../layouts/AdminLayout";
import { notifyError, notifyInfo, notifySuccess } from "../../utils/notify";
import useDebounce from "../../hooks/useDebounce";
import debounce from "lodash/debounce";
import api from "../../services/axios";

const TABLES = [
  "users",
  "categories",
  "products",
  "customers",
  "orders",
  "employees",
  "sales",
  "reservations",
];

const EMPTY_LATEST = {
  users: [],
  categories: [],
  products: [],
  customers: [],
  orders: [],
  employees: [],
  sales: [],
  reservations: [],
};

const Dashboard = () => {
  const [stats, setStats] = useState({
    users: 0,
    categories: 0,
    products: 0,
    customers: 0,
    orders: 0,
    employees: 0,
    sales: 0,
    reservations: 0,
    revenue: 0,
  });
  const [latest, setLatest] = useState(EMPTY_LATEST);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  const iconMap = {
    users: "👥",
    categories: "📁",
    products: "📦",
    customers: "👤",
    orders: "🛒",
    employees: "💼",
    sales: "📈",
    reservations: "📅",
    revenue: "💰",
  };

  // =====================
  // Fetch Dashboard Data
  // =====================
  const fetchDashboard = useCallback(() => {
    setLoading(true);
    getAdminDashboard()
      .then((res) => {
        const data = res?.data || {};
        const totalRevenue =
          (data.statistics?.orders || 0) * 100 +
          (data.statistics?.sales || 0) * 150;

        setStats({
          users: data.statistics?.users ?? 0,
          categories: data.statistics?.categories ?? 0,
          products: data.statistics?.products ?? 0,
          customers: data.statistics?.customers ?? 0,
          orders: data.statistics?.orders ?? 0,
          employees: data.statistics?.employees ?? 0,
          sales: data.statistics?.sales ?? 0,
          reservations: data.statistics?.reservations ?? 0,
          revenue: totalRevenue,
        });

        setLatest({
          users: Array.isArray(data.latest?.users) ? data.latest.users : [],
          categories: Array.isArray(data.latest?.categories)
            ? data.latest.categories
            : [],
          products: Array.isArray(data.latest?.products)
            ? data.latest.products
            : [],
          customers: Array.isArray(data.latest?.customers)
            ? data.latest.customers
            : [],
          orders: Array.isArray(data.latest?.orders) ? data.latest.orders : [],
          employees: Array.isArray(data.latest?.employees)
            ? data.latest.employees
            : [],
          sales: Array.isArray(data.latest?.sales) ? data.latest.sales : [],
          reservations: Array.isArray(data.latest?.reservations)
            ? data.latest.reservations
            : [],
        });
      })
      .catch((err) => {
        notifyError("Dashboard fetch error");
        console.error("Dashboard fetch error:", err);
        setLatest(EMPTY_LATEST);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchDashboard();
    document.body.classList.add("dashboard-page");
    return () => document.body.classList.remove("dashboard-page");
  }, [fetchDashboard]);

  const [search, setSearch] = useState(
    Object.fromEntries(TABLES.map((t) => [t, ""])),
  );
  const [page, setPage] = useState({});
  const debouncedSearch = useDebounce(search, 500);

  const fetchTableData = async (table) => {
    try {
      const res = await getTableData(table, {
        search: debouncedSearch[table] || "",
        per_page: 6,
      });

      setLatest((prev) => ({
        ...prev,
        [table]: res.data.data ?? res.data,
      }));
    } catch (err) {
      console.error(`Fetch ${table} error`, err);
    }
  };

  useEffect(() => {
    Object.entries(debouncedSearch).forEach(([table, value]) => {
      if (value !== undefined) {
        fetchTableData(table);
      }
    });
  }, [debouncedSearch]);

  const handleSearchChange = (table, value) => {
    setSearch((prev) => {
      if (prev[table] === value) return prev; // لا تغير لو نفس القيمة
      return { ...prev, [table]: value };
    });
  };

  // =====================
  // CRUD Handlers
  // =====================
  const handleAdd = (table) => navigate(`/admin/${table}/create`);

  const handleEdit = (table, id) => navigate(`/admin/${table}/${id}/edit`);

  const handleShow = (table, id) => navigate(`/admin/${table}/${id}/show`);

  const handleDelete = async (table, id) => {
    const ok = window.confirm(
      `Are you sure you want to delete this ${table.slice(0, -1)}?`,
    );
    if (!ok) return;
    try {
      await deleteEntity(table, id);
      notifySuccess("Deleted successfully");
      fetchDashboard();
    } catch (err) {
      notifyError("Delete failed");
      console.error(err);
    }
  };

  const handleConfirm = async (id) => {
    try {
      await api.post(`/reservations/${id}/confirm`);
      notifySuccess("Reservation confirmed & email sent");
      fetchTableData("reservations"); // تحديث الجدول
    } catch (err) {
      notifyError("Failed to confirm reservation");
      console.error(err);
    }
  };

  const handleCancel = async (id) => {
    try {
      await api.post(`/reservations/${id}/cancel`);
      notifySuccess("Reservation cancelled");
      fetchTableData("reservations"); // تحديث الجدول
    } catch (err) {
      notifyError("Failed to cancel reservation");
      console.error(err);
    }
  };

  // =====================
  // Render
  // =====================
  if (loading)
    return (
      <div className="dashboard-loading">
        <div className="dashboard-loading-text">Loading Dashboard...</div>
      </div>
    );

  return (
    <div className="dashboard-container">
      <AdminLayout />

      {/* Header */}
      <div className="dashboard-header"></div>

      {/* Statistics */}
      <div className="stats-grid">
        {Object.entries(stats).map(([key, value]) => (
          <div key={key} className={`stat-card ${key}`}>
            <div className="stat-card-icon">{iconMap[key]}</div>
            <div className="stat-title">
              {key.charAt(0).toUpperCase() + key.slice(1)}
            </div>
            <div className="stat-value">
              {key === "revenue" ? `$${value.toLocaleString()}` : value}
            </div>
          </div>
        ))}
      </div>

      {/* Latest Tables */}
      <div className="tables-grid">
        {Object.entries(latest).map(([table, data]) => {
          if (!Array.isArray(data)) return null;

          const hiddenColumns = [
            "_id",
            "__v",
            "password",
            "remember_token",
            "created_at",
            "updated_at",
          ];

          const columns =
            data.length > 0
              ? Object.keys(data[0])
                  .filter((k) => !hiddenColumns.includes(k))
                  .slice(0, window.innerWidth < 1200 ? 3 : 8)
              : [];

          const filteredData = data.filter((item) => {
            const term = search[table]?.toLowerCase() || "";
            if (!term) return true;

            return Object.values(item).some((val) =>
              String(val).toLowerCase().includes(term),
            );
          });

          return (
            <div key={table} className={`table-container ${table}`}>
              <div className="table-header">
                <h3>
                  {iconMap[table]} Latest{" "}
                  {table.charAt(0).toUpperCase() + table.slice(1)} (
                  {data.length} items)
                </h3>
                <div>
                  <button className="mr-2" onClick={() => handleAdd(table)}>
                    New
                  </button>
                  <button onClick={() => navigate(`/admin/${table}`)}>
                    View All
                  </button>
                </div>
              </div>
              <input
                type="text"
                placeholder={`Search ${table}...`}
                value={search[table] || ""}
                onChange={(e) => handleSearchChange(table, e.target.value)}
                className="w-100 mb-1 rounded-5"
              />

              <table className="custom-table">
                <thead>
                  <tr>
                    {columns.map((col) => (
                      <th key={col}>{col}</th>
                    ))}
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.slice(0, 6).map((item, idx) => (
                    <tr key={idx}>
                      {columns.map((col) => (
                        <td key={col}>
                          {typeof item[col] === "object"
                            ? JSON.stringify(item[col]).substring(0, 20) + "..."
                            : String(item[col] || "-")}
                        </td>
                      ))}
                      <td>
                        {/* <button onClick={() => handleShow(table, item.id)}>
                          <i class="fa-solid fa-eye"></i>
                        </button> */}
                        <button onClick={() => handleEdit(table, item.id)}>
                          <i class="fa-solid fa-pen-to-square"></i>
                        </button>
                        <button onClick={() => handleDelete(table, item.id)}>
                          <i class="fa-solid fa-trash"></i>
                        </button>
                        {table === "reservations" && (
                          <>
                            <div className="d-flex">
                              <button
                                onClick={() => handleConfirm(item.id)}
                                className=""
                                title="Confirm"
                              >
                                <i class="fa-solid fa-check"></i>
                              </button>
                              <button
                                onClick={() => handleCancel(item.id)}
                                className=""
                                title="Cancel"
                              >
                                <i class="fas fa-times"></i>
                              </button>
                            </div>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {data.length === 0 && <p>No data available.</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Dashboard;

import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../layouts/AdminLayout";
import { notifyError, notifySuccess } from "../../utils/notify";
import api from "../../services/axios";
import useDebounce from "../../hooks/useDebounce";
import "./Dashboard.css";

const TABLES = [
  "users",
  "categories",
  "products",
  "customers",
  "orders",
  "employees",
  "sales",
  "reservations",
  "invoices",
];

const EMPTY_LATEST = TABLES.reduce((acc, t) => ({ ...acc, [t]: [] }), {});
const EMPTY_ACTIVITY = [];

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
    total_collected: 0,
    total_paid_to_suppliers: 0,
    receivables: 0,
    payables: 0,
  });
  const [latest, setLatest] = useState(EMPTY_LATEST);
  const [activityLogs, setActivityLogs] = useState(EMPTY_ACTIVITY);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(
    Object.fromEntries(TABLES.map((t) => [t, ""])),
  );
  const debouncedSearch = useDebounce(search, 500);
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
    total_collected: "💵",
    total_paid_to_suppliers: "🏦",
    receivables: "📬",
    payables: "📭",
  };

  // =====================
  // Fetch Dashboard Data
  // =====================
  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      // 1️⃣ fetch general stats & latest tables
      const res = await api.get("/admin/dashboard");
      const data = res.data.data || {};

      setStats((prev) => ({
        ...prev,
        users: data.statistics?.users ?? 0,
        categories: data.statistics?.categories ?? 0,
        products: data.statistics?.products ?? 0,
        customers: data.statistics?.customers ?? 0,
        orders: data.statistics?.orders ?? 0,
        employees: data.statistics?.employees ?? 0,
        sales: data.statistics?.sales ?? 0,
        reservations: data.statistics?.reservations ?? 0,
      }));

      setLatest(
        TABLES.reduce((acc, table) => {
          acc[table] = Array.isArray(data.latest?.[table])
            ? data.latest[table]
            : [];
          return acc;
        }, {}),
      );

      // 2️⃣ fetch finance stats
      const finance = await api.get("/erp/dashboard/finance");
      setStats((prev) => ({
        ...prev,
        revenue: finance.data.total_sales,
        total_collected: finance.data.total_collected,
        total_paid_to_suppliers: finance.data.total_paid_to_suppliers,
        receivables: finance.data.receivables,
        payables: finance.data.payables,
      }));

      // 3️⃣ fetch activity logs
      const actRes = await api.get("/erp/activity-logs?limit=6");
      setActivityLogs(actRes.data.data || []);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      notifyError("Failed to fetch dashboard");
      setLatest(EMPTY_LATEST);
      setActivityLogs(EMPTY_ACTIVITY);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
    document.body.classList.add("dashboard-page");
    return () => document.body.classList.remove("dashboard-page");
  }, [fetchDashboard]);

  const handleSearchChange = (table, value) => {
    setSearch((prev) => ({ ...prev, [table]: value }));
  };

  const fetchTableData = async (table) => {
    try {
      const res = await api.get(`/admin/${table}`, {
        params: { search: debouncedSearch[table] || "", per_page: 6 },
      });
      setLatest((prev) => ({ ...prev, [table]: res.data.data ?? res.data }));
    } catch (err) {
      console.error(`Fetch ${table} error`, err);
    }
  };

  useEffect(() => {
    Object.keys(debouncedSearch).forEach((table) => fetchTableData(table));
  }, [debouncedSearch]);

  // =====================
  // CRUD Handlers
  // =====================
  const handleAdd = (table) => navigate(`/admin/${table}/create`);
  const handleEdit = (table, id) => navigate(`/admin/${table}/${id}/edit`);
  const handleDelete = async (table, id) => {
    if (
      !window.confirm(
        `Are you sure you want to delete this ${table.slice(0, -1)}?`,
      )
    )
      return;
    try {
      await api.delete(`/admin/${table}/${id}`);
      notifySuccess("Deleted successfully");
      fetchDashboard();
    } catch (err) {
      console.error(err);
      notifyError("Delete failed");
    }
  };

  // =====================
  // Reservations & Payments Handlers
  // =====================
  const handleConfirm = async (id) => {
    try {
      await api.post(`/erp/orders/${id}/confirm`);
      notifySuccess("Order confirmed & email sent");
      fetchDashboard();
    } catch (err) {
      console.error(err);
      notifyError("Failed to confirm order");
    }
  };

  const handleCancel = async (id) => {
    try {
      await api.post(`/erp/orders/${id}/cancel`);
      notifySuccess("Order cancelled");
      fetchDashboard();
    } catch (err) {
      console.error(err);
      notifyError("Failed to cancel order");
    }
  };

  const handlePayInvoice = async (id, amount) => {
    try {
      await api.post(`/erp/invoices/${id}/pay`, { amount });
      notifySuccess("Payment recorded");
      fetchDashboard();
    } catch (err) {
      console.error(err);
      notifyError("Failed to pay invoice");
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

      {/* Statistics */}
      <div className="stats-grid">
        {Object.entries(stats).map(([key, value]) => (
          <div key={key} className={`stat-card ${key}`}>
            <div className="stat-card-icon">{iconMap[key]}</div>
            <div className="stat-title">
              {key.charAt(0).toUpperCase() + key.slice(1).replace("_", " ")}
            </div>
            <div className="stat-value">
              {typeof value === "number" ? `$${value.toLocaleString()}` : value}
            </div>
          </div>
        ))}
      </div>

      {/* Latest Tables */}
      <div className="tables-grid">
        {Object.entries(latest).map(([table, data]) => {
          const hiddenColumns = [
            "password",
            "remember_token",
            "created_at",
            "updated_at",
            "email_verified_at",
          ];
          const columns = data.length
            ? Object.keys(data[0])
                .filter((k) => !hiddenColumns.includes(k))
                .slice(0, 4)
            : [];

          const filteredData = data.filter((item) =>
            Object.values(item).some((val) =>
              String(val)
                .toLowerCase()
                .includes((search[table] || "").toLowerCase()),
            ),
          );

          return (
            <div key={table} className={`table-container ${table}`}>
              <div className="table-header">
                <h3>
                  {table.charAt(0).toUpperCase() + table.slice(1)} (
                  {data.length})
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
                        <td key={col}>{String(item[col] ?? "-")}</td>
                      ))}
                      <td>
                        <button onClick={() => handleEdit(table, item.id)}>
                          <i className="fa-solid fa-pen-to-square"></i>
                        </button>
                        <button onClick={() => handleDelete(table, item.id)}>
                          <i className="fa-solid fa-trash"></i>
                        </button>
                        {table === "reservations" && (
                          <>
                            <button onClick={() => handleConfirm(item.id)}>
                              ✔
                            </button>
                            <button onClick={() => handleCancel(item.id)}>
                              ✖
                            </button>
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

      {/* Activity Logs */}
      <div className="activity-logs">
        <h3>Recent Activity</h3>
        {activityLogs.length === 0 ? (
          <p>No activity yet.</p>
        ) : (
          <ul>
            {activityLogs.map((log) => (
              <li key={log.id}>
                <strong>{log.user?.name || "System"}:</strong> {log.action} on{" "}
                {log.subject_type}#{log.subject_id} at{" "}
                {new Date(log.created_at).toLocaleString()}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Dashboard;

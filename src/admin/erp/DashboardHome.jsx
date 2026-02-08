import { useEffect, useState } from "react";
import api from "../../services/axios";

import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

export default function DashboardHome() {
  const [stats, setStats] = useState(null);
  const [salesChart, setSalesChart] = useState([]);
  const [paymentsChart, setPaymentsChart] = useState([]);
  const [latestInvoices, setLatestInvoices] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);

      // ✅ المسار الصحيح حسب routes عندك
      const res = await api.get("/erp/dashboard/finance");

      setStats(res.data.stats || null);
      setSalesChart(res.data.sales_chart || []);
      setPaymentsChart(res.data.payments_chart || []);
      setLatestInvoices(res.data.latest_invoices || []);
      setActivities(res.data.activities || []);
    } catch (e) {
      console.error("Failed to load ERP dashboard", e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mt-4 pt-4">
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="container mt-4 pt-4">
        <div className="alert alert-warning">Dashboard data not available.</div>
      </div>
    );
  }

  return (
    <div className="container-fluid mt-4 pt-4">
      {/* ================= KPIs ================= */}

      <div className="row g-3 mb-4">
        <div className="col-12 col-md-6 col-xl-3">
          <KpiCard title="Sales today" value={stats.sales_today} />
        </div>

        <div className="col-12 col-md-6 col-xl-3">
          <KpiCard title="Payments today" value={stats.payments_today} />
        </div>

        <div className="col-12 col-md-6 col-xl-3">
          <KpiCard title="Refunds today" value={stats.refunds_today} />
        </div>

        <div className="col-12 col-md-6 col-xl-3">
          <KpiCard title="Outstanding receivables" value={stats.outstanding} />
        </div>
      </div>

      {/* ================= Charts ================= */}

      <div className="row g-4 mb-4">
        <div className="col-12 col-xl-6">
          <div className="card h-100">
            <div className="card-header">Sales – last 7 days</div>

            <div className="card-body" style={{ height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={salesChart}>
                  <Line type="monotone" dataKey="total" strokeWidth={2} />
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="col-12 col-xl-6">
          <div className="card h-100">
            <div className="card-header">Payments vs refunds</div>

            <div className="card-body" style={{ height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={paymentsChart}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="payments" />
                  <Bar dataKey="refunds" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* ================= Lists ================= */}

      <div className="row g-4">
        {/* Latest invoices */}
        <div className="col-12 col-xl-6">
          <div className="card h-100">
            <div className="card-header d-flex justify-content-between align-items-center">
              <span>Latest invoices</span>
              <a
                href="/admin/erp/invoices"
                className="btn btn-sm btn-outline-primary"
              >
                View all
              </a>
            </div>

            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-sm mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Number</th>
                      <th>Customer</th>
                      <th className="text-end">Total</th>
                      <th className="text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {latestInvoices.length === 0 && (
                      <tr>
                        <td colSpan="4" className="text-center text-muted py-3">
                          No invoices
                        </td>
                      </tr>
                    )}

                    {latestInvoices.map((i) => (
                      <tr key={i.id}>
                        <td>{i.number}</td>
                        <td>{i.customer}</td>
                        <td className="text-end">{i.total}</td>
                        <td className="text-center">
                          <span className="badge bg-secondary">{i.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Activity */}
        <div className="col-12 col-xl-6">
          <div className="card h-100">
            <div className="card-header">Recent activity</div>

            <div className="card-body">
              {activities.length === 0 && (
                <div className="text-muted">No activity</div>
              )}

              <ul className="list-group list-group-flush">
                {activities.map((a) => (
                  <li key={a.id} className="list-group-item px-0">
                    <div className="fw-semibold">{a.description}</div>
                    <div className="text-muted small">{a.created_at}</div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================= */

function KpiCard({ title, value }) {
  return (
    <div className="card h-100">
      <div className="card-body">
        <div className="text-muted small">{title}</div>
        <div className="fs-4 fw-bold mt-2">{value}</div>
      </div>
    </div>
  );
}

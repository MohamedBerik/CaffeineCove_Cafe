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

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    const res = await api.get("/erp/dashboard/finance");

    setStats(res.data.stats);
    setSalesChart(res.data.sales_chart);
    setPaymentsChart(res.data.payments_chart);
    setLatestInvoices(res.data.latest_invoices);
    setActivities(res.data.activities);
  };

  if (!stats) return <div>Loading dashboard...</div>;

  return (
    <div className="p-4 space-y-6">
      {/* ================= KPI CARDS ================= */}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mt-4">
        <KpiCard title="Sales today" value={stats.sales_today} />

        <KpiCard title="Payments today" value={stats.payments_today} />

        <KpiCard title="Refunds today" value={stats.refunds_today} />

        <KpiCard title="Outstanding receivables" value={stats.outstanding} />
      </div>

      {/* ================= CHARTS ================= */}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow p-4">
          <h3 className="font-semibold mb-3">Sales – last 7 days</h3>

          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={salesChart}>
              <Line type="monotone" dataKey="total" strokeWidth={2} />
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow p-4">
          <h3 className="font-semibold mb-3">Payments vs refunds</h3>

          <ResponsiveContainer width="100%" height={280}>
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

      {/* ================= LISTS ================= */}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Latest invoices */}
        <div className="bg-white rounded-xl shadow p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold">Latest invoices</h3>
            <a href="/admin/erp/invoices" className="text-sm text-blue-600">
              View all
            </a>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="border-b">
                <tr>
                  <th className="text-left py-2">Number</th>
                  <th className="text-left">Customer</th>
                  <th className="text-right">Total</th>
                  <th className="text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {latestInvoices.map((i) => (
                  <tr key={i.id} className="border-b last:border-0">
                    <td className="py-2">{i.number}</td>
                    <td>{i.customer}</td>
                    <td className="text-right">{i.total}</td>
                    <td className="text-center">
                      <span className="px-2 py-1 rounded text-xs bg-gray-100">
                        {i.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Activity */}
        <div className="bg-white rounded-xl shadow p-4">
          <h3 className="font-semibold mb-3">Recent activity</h3>

          <ul className="space-y-3">
            {activities.map((a) => (
              <li key={a.id} className="text-sm border-b last:border-0 pb-2">
                <div className="font-medium">{a.description}</div>
                <div className="text-xs text-gray-500">{a.created_at}</div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

/* ======================= */

function KpiCard({ title, value }) {
  return (
    <div className="bg-white rounded-xl shadow p-4">
      <div className="text-sm text-gray-500">{title}</div>
      <div className="text-2xl font-bold mt-2">{value}</div>
    </div>
  );
}

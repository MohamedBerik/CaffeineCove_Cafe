import { useEffect, useState } from "react";
import axios from "../../services/axios";

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
  const [data, setData] = useState(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    const res = await axios.get("/erp/dashboard/finance");
    setData(res.data);
  };

  if (!data) return <div>Loading dashboard...</div>;

  const { stats } = data;

  return (
    <div className="container-fluid py-4">
      {/* ===================================================== */}
      {/* Operational KPIs */}
      {/* ===================================================== */}

      <section className="mb-4">
        <h2 className="text-lg font-semibold mb-3">Today overview</h2>

        <div className="row g-3">
          <div className="col-12 col-md-6 col-xl-3">
            <KpiCard title="Sales today" value={stats.sales_today} />
            <KpiCard title="Payments today" value={stats.payments_today} />
            <KpiCard title="Refunds today" value={stats.refunds_today} />
            <KpiCard
              title="Outstanding receivables"
              value={stats.outstanding}
            />
          </div>
        </div>
      </section>

      {/* ===================================================== */}
      {/* Financial snapshot (old data) */}
      {/* ===================================================== */}

      <section className="mb-4">
        <h2 className="text-lg font-semibold mb-3">Financial snapshot</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-4">
          <SmallCard title="Total sales" value={data.total_sales} />
          <SmallCard title="Gross collected" value={data.gross_collected} />
          <SmallCard title="Refunds total" value={data.refunds_total} />
          <SmallCard title="Net collected" value={data.net_collected} />
          <SmallCard title="Receivables" value={data.receivables} />
          <SmallCard title="Collected" value={data.total_collected} />

          <SmallCard title="Total purchases" value={data.total_purchases} />
          <SmallCard
            title="Paid to suppliers"
            value={data.total_paid_to_suppliers}
          />
          <SmallCard title="Payables" value={data.payables} />
        </div>
      </section>

      {/* ===================================================== */}
      {/* Charts */}
      {/* ===================================================== */}

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow p-4">
          <h3 className="font-semibold mb-3">Sales – last 7 days</h3>

          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={data.sales_chart}>
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
            <BarChart data={data.payments_chart}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="payments" />
              <Bar dataKey="refunds" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* ===================================================== */}
      {/* Lists */}
      {/* ===================================================== */}

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
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
                {data.latest_invoices.map((i) => (
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

        <div className="bg-white rounded-xl shadow p-4">
          <h3 className="font-semibold mb-3">Recent activity</h3>

          <ul className="space-y-3">
            {data.activities.map((a) => (
              <li key={a.id} className="text-sm border-bottom pb-2">
                <div className="fw-semibold">{a.description}</div>

                {a.subject_type && (
                  <div className="small text-muted">{a.subject_type}</div>
                )}

                <div className="small text-muted">{a.created_at}</div>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}

/* ================================================= */

function KpiCard({ title, value }) {
  return (
    <div className="bg-white rounded-xl shadow p-4">
      <div className="text-sm text-gray-500">{title}</div>
      <div className="text-2xl font-bold mt-2">{value}</div>
    </div>
  );
}

function SmallCard({ title, value }) {
  return (
    <div className="bg-white rounded-lg shadow p-3">
      <div className="text-xs text-gray-500">{title}</div>
      <div className="text-lg font-semibold mt-1">{value}</div>
    </div>
  );
}

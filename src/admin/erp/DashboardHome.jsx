import "../../index.css";
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

  if (!data) return <div className="p-4">Loading dashboard...</div>;

  const { stats } = data;

  return (
    <div className="container-fluid py-4">
      {/* ================= Today overview ================= */}

      <section className="mb-4">
        <h5 className="fw-semibold mb-3">Today overview</h5>

        <div className="row g-3">
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
            <KpiCard
              title="Outstanding receivables"
              value={stats.outstanding}
            />
          </div>
        </div>
      </section>

      {/* ================= Financial snapshot ================= */}

      <section className="mb-4">
        <h5 className="fw-semibold mb-3">Financial snapshot</h5>

        <div className="row g-3">
          <div className="col-12 col-md-4 col-xl-2">
            <SmallCard title="Total sales" value={data.total_sales} />
          </div>

          <div className="col-12 col-md-4 col-xl-2">
            <SmallCard title="Gross collected" value={data.gross_collected} />
          </div>

          <div className="col-12 col-md-4 col-xl-2">
            <SmallCard title="Refunds total" value={data.refunds_total} />
          </div>

          <div className="col-12 col-md-4 col-xl-2">
            <SmallCard title="Net collected" value={data.net_collected} />
          </div>

          <div className="col-12 col-md-4 col-xl-2">
            <SmallCard title="Receivables" value={data.receivables} />
          </div>

          <div className="col-12 col-md-4 col-xl-2">
            <SmallCard title="Collected" value={data.total_collected} />
          </div>

          <div className="col-12 col-md-4 col-xl-2">
            <SmallCard title="Total purchases" value={data.total_purchases} />
          </div>

          <div className="col-12 col-md-4 col-xl-2">
            <SmallCard
              title="Paid to suppliers"
              value={data.total_paid_to_suppliers}
            />
          </div>

          <div className="col-12 col-md-4 col-xl-2">
            <SmallCard title="Payables" value={data.payables} />
          </div>
        </div>
      </section>

      {/* ================= Charts ================= */}

      <section className="mb-4">
        <div className="row g-4">
          <div className="col-12 col-xl-6">
            <div className="bg-white rounded shadow-sm p-3 h-100">
              <h6 className="fw-semibold mb-3">Sales – last 7 days</h6>

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
          </div>

          <div className="col-12 col-xl-6">
            <div className="bg-white rounded shadow-sm p-3 h-100">
              <h6 className="fw-semibold mb-3">Payments vs refunds</h6>

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
          </div>
        </div>
      </section>

      {/* ================= Lists ================= */}

      <section>
        <div className="row g-4">
          {/* Latest invoices */}
          <div className="col-12 col-xl-6">
            <div className="bg-white rounded shadow-sm p-3 h-100">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="fw-semibold mb-0">Latest invoices</h6>

                <a
                  href="/admin/erp/invoices"
                  className="small text-decoration-none"
                >
                  View all
                </a>
              </div>

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
                    {data.latest_invoices.map((i) => (
                      <tr key={i.id}>
                        <td>{i.number}</td>
                        <td>{i.customer}</td>
                        <td className="text-end">{i.total}</td>
                        <td className="text-center">
                          <span className="badge bg-light text-dark">
                            {i.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Recent activity */}
          <div className="col-12 col-xl-6">
            <div className="bg-white rounded shadow-sm p-3 h-100">
              <h6 className="fw-semibold mb-3">Recent activity</h6>

              <ul className="list-unstyled mb-0">
                {data.activities.map((a, index) => (
                  <li
                    key={a.id}
                    className={`pb-2 ${index !== data.activities.length - 1 ? "border-bottom mb-2" : ""}`}
                  >
                    <div className="fw-semibold small">{a.description}</div>

                    <div className="text-muted small">{a.created_at}</div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ================================================= */

function KpiCard({ title, value }) {
  return (
    <div className="bg-white rounded shadow-sm p-3 h-100">
      <div className="text-muted small">{title}</div>
      <div className="fs-4 fw-bold mt-2">{value}</div>
    </div>
  );
}

function SmallCard({ title, value }) {
  return (
    <div className="bg-white rounded shadow-sm p-3 h-100">
      <div className="text-muted small">{title}</div>
      <div className="fw-semibold mt-1">{value}</div>
    </div>
  );
}

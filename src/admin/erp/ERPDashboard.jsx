import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";

const ERPDashboard = () => {
  // States للـ KPIs
  const [kpis, setKpis] = useState({
    totalInvoices: 0,
    totalPayments: 0,
    totalRefunded: 0,
    outstanding: 0,
  });

  // States للـ Charts
  const [salesData, setSalesData] = useState([]);
  const [paymentsData, setPaymentsData] = useState([]);

  // States للـ Latest invoices
  const [latestInvoices, setLatestInvoices] = useState([]);

  // States للـ Activity log
  const [activityLog, setActivityLog] = useState([]);

  // جلب البيانات من API عند تحميل الصفحة
  useEffect(() => {
    axios.get("/api/kpis").then((res) => setKpis(res.data));
    axios.get("/erp/sales-last-7-days").then((res) => setSalesData(res.data));
    axios
      .get("/erp/payments-vs-refunds")
      .then((res) => setPaymentsData(res.data));
    axios
      .get("/erp/latest-invoices?limit=5")
      .then((res) => setLatestInvoices(res.data));
    axios
      .get("/erp/activity-log?limit=5")
      .then((res) => setActivityLog(res.data));
  }, []);

  return (
    <div>
      {/* KPI Cards */}
      <div className="row g-3 mb-4 mt-4">
        <div className="col-md-3 col-sm-6">
          <div className="card text-center shadow">
            <div className="card-body">
              <h6 className="card-subtitle mb-2 text-muted">
                Total Invoices Today
              </h6>
              <h4 className="card-title">{kpis.totalInvoices}</h4>
            </div>
          </div>
        </div>

        <div className="col-md-3 col-sm-6">
          <div className="card text-center shadow">
            <div className="card-body">
              <h6 className="card-subtitle mb-2 text-muted">
                Total Payments Today
              </h6>
              <h4 className="card-title">{kpis.totalPayments}</h4>
            </div>
          </div>
        </div>

        <div className="col-md-3 col-sm-6">
          <div className="card text-center shadow">
            <div className="card-body">
              <h6 className="card-subtitle mb-2 text-muted">
                Total Refunded Today
              </h6>
              <h4 className="card-title">{kpis.totalRefunded}</h4>
            </div>
          </div>
        </div>

        <div className="col-md-3 col-sm-6">
          <div className="card text-center shadow">
            <div className="card-body">
              <h6 className="card-subtitle mb-2 text-muted">
                Outstanding Receivables
              </h6>
              <h4 className="card-title">{kpis.outstanding}</h4>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="row g-3 mb-4">
        <div className="col-lg-6">
          <div className="card shadow p-3">
            <h6 className="mb-3">Sales Last 7 Days</h6>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="sales"
                  stroke="#0d6efd"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="col-lg-6">
          <div className="card shadow p-3">
            <h6 className="mb-3">Payments vs Refunds</h6>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={paymentsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="payments" fill="#198754" />
                <Bar dataKey="refunds" fill="#dc3545" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Latest Invoices */}
      <div className="card shadow mb-4">
        <div className="card-body">
          <h6 className="card-title mb-3">Latest Invoices</h6>
          <div className="table-responsive">
            <table className="table table-striped table-hover">
              <thead>
                <tr>
                  <th>Number</th>
                  <th>Customer</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {latestInvoices.map((inv) => (
                  <tr key={inv.number}>
                    <td>{inv.number}</td>
                    <td>{inv.customer}</td>
                    <td>{inv.total}</td>
                    <td>{inv.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="text-end mt-2">
            <a href="/admin/erp/invoices" className="text-decoration-none">
              View all invoices
            </a>
          </div>
        </div>
      </div>

      {/* Activity Log */}
      <div className="card shadow">
        <div className="card-body">
          <h6 className="card-title mb-3">Recent Activity</h6>
          <ul className="list-group list-group-flush">
            {activityLog.map((act, idx) => (
              <li key={idx} className="list-group-item">
                {act.message} <small className="text-muted">({act.date})</small>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ERPDashboard;

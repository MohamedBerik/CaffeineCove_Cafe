// Dashboard.jsx
import React, { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import AdminNavbar from "../components/AdminNavbar";
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

const Dashboard = () => {
  // State للـ KPIs
  const [kpis, setKpis] = useState({
    totalInvoices: 0,
    totalPayments: 0,
    totalRefunded: 0,
    outstanding: 0,
  });

  // State للـ Charts
  const [salesData, setSalesData] = useState([]);
  const [paymentsData, setPaymentsData] = useState([]);

  // State للـ Latest invoices
  const [latestInvoices, setLatestInvoices] = useState([]);

  // State للـ Activity log
  const [activityLog, setActivityLog] = useState([]);

  // جلب البيانات من الـ API عند تحميل الصفحة
  useEffect(() => {
    // KPIs
    axios.get("/api/kpis").then((res) => setKpis(res.data));

    // Sales chart
    axios.get("/api/sales-last-7-days").then((res) => setSalesData(res.data));

    // Payments vs Refunds chart
    axios
      .get("/api/payments-vs-refunds")
      .then((res) => setPaymentsData(res.data));

    // Latest invoices
    axios
      .get("/api/latest-invoices?limit=5")
      .then((res) => setLatestInvoices(res.data));

    // Activity log
    axios
      .get("/api/activity-log?limit=5")
      .then((res) => setActivityLog(res.data));
  }, []);

  return (
    <div className="p-6 space-y-8">
      <AdminNavbar />
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white shadow rounded p-4">
          <h3 className="text-gray-500 text-sm">Total Invoices Today</h3>
          <p className="text-2xl font-bold">{kpis.totalInvoices}</p>
        </div>
        <div className="bg-white shadow rounded p-4">
          <h3 className="text-gray-500 text-sm">Total Payments Today</h3>
          <p className="text-2xl font-bold">{kpis.totalPayments}</p>
        </div>
        <div className="bg-white shadow rounded p-4">
          <h3 className="text-gray-500 text-sm">Total Refunded Today</h3>
          <p className="text-2xl font-bold">{kpis.totalRefunded}</p>
        </div>
        <div className="bg-white shadow rounded p-4">
          <h3 className="text-gray-500 text-sm">Outstanding Receivables</h3>
          <p className="text-2xl font-bold">{kpis.outstanding}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white shadow rounded p-4">
          <h3 className="text-gray-700 font-semibold mb-2">
            Sales Last 7 Days
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="sales"
                stroke="#4f46e5"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white shadow rounded p-4">
          <h3 className="text-gray-700 font-semibold mb-2">
            Payments vs Refunds
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={paymentsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="payments" fill="#10b981" />
              <Bar dataKey="refunds" fill="#f87171" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Latest Invoices */}
      <div className="bg-white shadow rounded p-4">
        <h3 className="text-gray-700 font-semibold mb-2">Latest Invoices</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left text-sm text-gray-500">
                  Number
                </th>
                <th className="px-4 py-2 text-left text-sm text-gray-500">
                  Customer
                </th>
                <th className="px-4 py-2 text-left text-sm text-gray-500">
                  Total
                </th>
                <th className="px-4 py-2 text-left text-sm text-gray-500">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {latestInvoices.map((inv) => (
                <tr key={inv.number} className="border-b">
                  <td className="px-4 py-2">{inv.number}</td>
                  <td className="px-4 py-2">{inv.customer}</td>
                  <td className="px-4 py-2">{inv.total}</td>
                  <td className="px-4 py-2">{inv.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-2 text-right">
          <a href="/invoices" className="text-blue-600 hover:underline">
            View all invoices
          </a>
        </div>
      </div>

      {/* Activity Log */}
      <div className="bg-white shadow rounded p-4">
        <h3 className="text-gray-700 font-semibold mb-2">Recent Activity</h3>
        <ul className="space-y-1">
          {activityLog.map((act, idx) => (
            <li key={idx} className="text-gray-600 text-sm">
              {act.message}{" "}
              <span className="text-gray-400 text-xs">({act.date})</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Dashboard;

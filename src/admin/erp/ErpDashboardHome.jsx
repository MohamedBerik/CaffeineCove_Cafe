import { useEffect, useMemo, useState } from "react";
import axios from "../../services/axios";
import { Link } from "react-router";

export default function ErpDashboardHome() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await axios.get("/erp/dashboard");
      setData(res.data?.data ?? null);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.msg ||
          "Failed to load ERP dashboard.",
      );
    } finally {
      setLoading(false);
    }
  };

  const currency = useMemo(() => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }, []);

  const formatCurrency = (value) => currency.format(Number(value || 0));

  const formatDateTime = (value) => {
    if (!value) return "-";
    try {
      return new Date(value).toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return value;
    }
  };

  const formatDate = (value) => {
    if (!value) return "-";
    try {
      return new Date(value).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "2-digit",
      });
    } catch {
      return value;
    }
  };

  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "400px" }}
      >
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger d-flex justify-content-between align-items-center">
        <span>{error}</span>
        <button
          className="btn btn-sm btn-outline-danger"
          onClick={loadDashboard}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="alert alert-warning">No dashboard data available.</div>
    );
  }

  const kpis = data.kpis || {};
  const recentAppointments = data.recent_appointments || [];
  const recentInvoices = data.recent_invoices || [];
  const recentPayments = data.recent_payments || [];

  return (
    <div className="container-fluid px-0">
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold mb-1">ERP Dashboard</h3>
          <p className="text-muted mb-0">
            Clinic operations, billing, and payment overview
          </p>
        </div>

        <Link
          to="/admin/erp/patients"
          className="btn btn-outline-primary me-2"
          style={{ borderWidth: "2px" }}
        >
          View Patients
        </Link>
        <button className="btn btn-primary" onClick={loadDashboard}>
          Refresh
        </button>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-lg-3">
          <KpiCard
            title="Appointments Today"
            value={kpis.today_appointments_count ?? 0}
            icon="fas fa-calendar-day"
            color="primary"
          />
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <KpiCard
            title="Scheduled Today"
            value={kpis.scheduled_today_count ?? 0}
            icon="fas fa-clock"
            color="info"
          />
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <KpiCard
            title="Completed Today"
            value={kpis.completed_today_count ?? 0}
            icon="fas fa-check-circle"
            color="success"
          />
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <KpiCard
            title="Cancelled / No Show"
            value={`${kpis.cancelled_today_count ?? 0} / ${kpis.no_show_today_count ?? 0}`}
            icon="fas fa-times-circle"
            color="danger"
          />
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <KpiCard
            title="Unpaid Invoices"
            value={kpis.unpaid_invoices_count ?? 0}
            icon="fas fa-file-invoice"
            color="warning"
          />
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <KpiCard
            title="Partially Paid"
            value={kpis.partially_paid_invoices_count ?? 0}
            icon="fas fa-receipt"
            color="secondary"
          />
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <KpiCard
            title="Today Revenue"
            value={formatCurrency(kpis.today_revenue)}
            icon="fas fa-money-bill-wave"
            color="success"
          />
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <KpiCard
            title="Month Revenue"
            value={formatCurrency(kpis.month_revenue)}
            icon="fas fa-chart-line"
            color="dark"
          />
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <KpiCard
            title="Customer Credit Balance"
            value={formatCurrency(kpis.credit_balance_total)}
            icon="fas fa-wallet"
            color="primary"
          />
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <KpiCard
            title="Paid Invoices"
            value={kpis.paid_invoices_count ?? 0}
            icon="fas fa-check-double"
            color="success"
          />
        </div>
      </div>

      <div className="row g-4">
        <div className="col-12 col-xl-4">
          <div className="card shadow-sm h-100">
            <div className="card-header bg-white">
              <h5 className="mb-0">Recent Appointments</h5>
            </div>
            <div className="card-body p-0">
              {recentAppointments.length === 0 ? (
                <EmptyState text="No recent appointments." />
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Patient</th>
                        <th>Doctor</th>
                        <th>Date</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentAppointments.map((item) => (
                        <tr key={item.id}>
                          <td>{item.patient?.name || "-"}</td>
                          <td>
                            {item.doctor?.name || item.doctor_name || "-"}
                          </td>
                          <td>
                            {item.appointment_date}{" "}
                            {String(item.appointment_time || "").slice(0, 5)}
                          </td>
                          <td>
                            <StatusBadge status={item.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-12 col-xl-4">
          <div className="card shadow-sm h-100">
            <div className="card-header bg-white">
              <h5 className="mb-0">Recent Invoices</h5>
            </div>
            <div className="card-body p-0">
              {recentInvoices.length === 0 ? (
                <EmptyState text="No recent invoices." />
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Number</th>
                        <th>Total</th>
                        <th>Status</th>
                        <th>Issued</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentInvoices.map((item) => (
                        <tr key={item.id}>
                          <td>{item.number}</td>
                          <td>{formatCurrency(item.total)}</td>
                          <td>
                            <StatusBadge status={item.status} />
                          </td>
                          <td>
                            {formatDate(item.issued_at || item.created_at)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-12 col-xl-4">
          <div className="card shadow-sm h-100">
            <div className="card-header bg-white">
              <h5 className="mb-0">Recent Payments</h5>
            </div>
            <div className="card-body p-0">
              {recentPayments.length === 0 ? (
                <EmptyState text="No recent payments." />
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Invoice</th>
                        <th>Applied</th>
                        <th>Method</th>
                        <th>Paid At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentPayments.map((item) => (
                        <tr key={item.id}>
                          <td>#{item.invoice_id}</td>
                          <td>{formatCurrency(item.applied_amount)}</td>
                          <td className="text-capitalize">
                            {item.method || "-"}
                          </td>
                          <td>
                            {formatDateTime(item.paid_at || item.created_at)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ title, value, icon, color = "primary" }) {
  return (
    <div className="card border-0 shadow-sm h-100">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-start">
          <div>
            <div className="text-muted small mb-1">{title}</div>
            <div className="fs-4 fw-bold">{value}</div>
          </div>

          <div
            className={`text-${color} bg-${color} bg-opacity-10 rounded p-2`}
          >
            <i className={icon}></i>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ text }) {
  return <div className="p-3 text-muted">{text}</div>;
}

function StatusBadge({ status }) {
  const value = String(status || "").toLowerCase();

  let cls = "secondary";

  if (["paid", "completed"].includes(value)) cls = "success";
  else if (["unpaid", "cancelled", "no_show"].includes(value)) cls = "danger";
  else if (["partially_paid", "scheduled"].includes(value)) cls = "warning";
  else if (["in_progress"].includes(value)) cls = "info";

  return <span className={`badge bg-${cls}`}>{status}</span>;
}

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import axios from "../../../services/axios";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";

export default function AnalyticsDashboardPage() {
  const today = new Date().toISOString().slice(0, 10);

  const [filters, setFilters] = useState({
    from: today,
    to: today,
  });

  const [appointments, setAppointments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [doctors, setDoctors] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError("");

      const [appointmentsRes, invoicesRes, doctorsRes] = await Promise.all([
        axios.get("/erp/appointments"),
        axios.get("/erp/invoices"),
        axios.get("/erp/doctors"),
      ]);

      const appointmentsPayload = appointmentsRes.data || {};
      const invoicesPayload = invoicesRes.data || {};
      const doctorsPayload = doctorsRes.data || {};

      const appointmentRows = Array.isArray(appointmentsPayload.data)
        ? appointmentsPayload.data
        : appointmentsPayload.data?.data || [];

      const invoiceRows = Array.isArray(invoicesPayload.data)
        ? invoicesPayload.data
        : invoicesPayload.data?.data || invoicesPayload.invoices || [];

      const doctorRows = Array.isArray(doctorsPayload.data)
        ? doctorsPayload.data
        : doctorsPayload.data?.data || [];

      setAppointments(appointmentRows);
      setInvoices(invoiceRows);
      setDoctors(doctorRows);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.msg ||
          "Failed to load analytics.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const inRange = (dateValue) => {
    const dateOnly = String(dateValue || "").slice(0, 10);
    if (!dateOnly) return false;
    if (filters.from && dateOnly < filters.from) return false;
    if (filters.to && dateOnly > filters.to) return false;
    return true;
  };

  const filteredAppointments = useMemo(() => {
    return appointments.filter((item) => inRange(item.appointment_date));
  }, [appointments, filters]);

  const filteredInvoices = useMemo(() => {
    return invoices.filter((item) =>
      inRange(item.issued_at || item.created_at),
    );
  }, [invoices, filters]);

  const money = (value) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    }).format(Number(value || 0));

  const revenueTrendData = useMemo(() => {
    const map = {};

    filteredInvoices.forEach((item) => {
      const date = String(item.issued_at || item.created_at || "").slice(0, 10);
      if (!date) return;

      const total = Number(item.total || 0);
      const paid = Number(item.net_paid ?? item.total_paid ?? 0);

      if (!map[date]) {
        map[date] = {
          date,
          invoiced: 0,
          paid: 0,
        };
      }

      map[date].invoiced += total;
      map[date].paid += paid;
    });

    return Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredInvoices]);

  const appointmentStatusData = useMemo(() => {
    const counts = {
      scheduled: 0,
      completed: 0,
      cancelled: 0,
      no_show: 0,
      in_progress: 0,
    };

    filteredAppointments.forEach((item) => {
      const key = String(item.status || "").toLowerCase();
      if (counts[key] != null) counts[key] += 1;
    });

    return Object.entries(counts).map(([name, value]) => ({
      name,
      value,
    }));
  }, [filteredAppointments]);

  const doctorLoadData = useMemo(() => {
    return doctors.map((doctor) => {
      const doctorAppointments = filteredAppointments.filter(
        (a) => String(a.doctor_id) === String(doctor.id),
      );

      return {
        name: doctor.name || `Doctor #${doctor.id}`,
        total: doctorAppointments.length,
        completed: doctorAppointments.filter((a) => a.status === "completed")
          .length,
      };
    });
  }, [doctors, filteredAppointments]);

  const paymentSnapshot = useMemo(() => {
    let invoiced = 0;
    let paid = 0;
    let refunded = 0;
    let remaining = 0;

    filteredInvoices.forEach((item) => {
      const total = Number(item.total || 0);
      const grossPaid = Number(
        item.total_paid ?? item.gross_paid ?? item.net_paid ?? 0,
      );
      const itemRefunded = Number(item.total_refunded ?? item.refunded ?? 0);
      const netPaid =
        item.net_paid != null
          ? Number(item.net_paid)
          : Math.max(grossPaid - itemRefunded, 0);
      const itemRemaining =
        item.remaining != null
          ? Number(item.remaining)
          : Math.max(total - netPaid, 0);

      invoiced += total;
      paid += netPaid;
      refunded += itemRefunded;
      remaining += itemRemaining;
    });

    return [
      { name: "Invoiced", value: invoiced },
      { name: "Paid", value: paid },
      { name: "Refunded", value: refunded },
      { name: "Remaining", value: remaining },
    ];
  }, [filteredInvoices]);

  const kpis = useMemo(() => {
    const totalAppointments = filteredAppointments.length;
    const completedAppointments = filteredAppointments.filter(
      (a) => a.status === "completed",
    ).length;

    const totalInvoiced = filteredInvoices.reduce(
      (sum, item) => sum + Number(item.total || 0),
      0,
    );

    const totalPaid = filteredInvoices.reduce(
      (sum, item) => sum + Number(item.net_paid ?? item.total_paid ?? 0),
      0,
    );

    return {
      totalAppointments,
      completedAppointments,
      totalInvoiced,
      totalPaid,
    };
  }, [filteredAppointments, filteredInvoices]);

  const applyFilters = async (e) => {
    e.preventDefault();
  };

  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "320px" }}
      >
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid px-0">
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
        <div>
          <h3 className="fw-bold mb-1">Analytics Dashboard</h3>
          <p className="text-muted mb-0">
            Visual overview of revenue, appointments, doctors, and collections
          </p>
        </div>

        <div className="d-flex gap-2">
          <Link to="/admin/erp/reports" className="btn btn-outline-secondary">
            Back to Reports
          </Link>

          <button className="btn btn-primary" onClick={loadAnalytics}>
            Refresh
          </button>
        </div>
      </div>

      {error ? <div className="alert alert-danger">{error}</div> : null}

      <div className="card shadow-sm border-0 mb-4">
        <div className="card-header bg-white">
          <h5 className="mb-0">Filters</h5>
        </div>

        <div className="card-body">
          <form className="row g-3 align-items-end" onSubmit={applyFilters}>
            <div className="col-12 col-md-4">
              <label className="form-label fw-semibold">From</label>
              <input
                type="date"
                className="form-control"
                name="from"
                value={filters.from}
                onChange={handleChange}
              />
            </div>

            <div className="col-12 col-md-4">
              <label className="form-label fw-semibold">To</label>
              <input
                type="date"
                className="form-control"
                name="to"
                value={filters.to}
                onChange={handleChange}
              />
            </div>

            <div className="col-12 col-md-4 d-grid">
              <button type="submit" className="btn btn-outline-primary">
                Apply Filters
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="row g-3 mb-4">
        <MetricCard
          title="Appointments"
          value={kpis.totalAppointments}
          subtitle="Filtered range"
        />
        <MetricCard
          title="Completed"
          value={kpis.completedAppointments}
          subtitle="Appointments done"
        />
        <MetricCard
          title="Invoiced"
          value={money(kpis.totalInvoiced)}
          subtitle="Total billed"
        />
        <MetricCard
          title="Collected"
          value={money(kpis.totalPaid)}
          subtitle="Net paid"
        />
      </div>

      <div className="row g-4">
        <div className="col-12 col-xl-8">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-header bg-white">
              <h5 className="mb-0">Revenue Trend</h5>
            </div>
            <div className="card-body">
              {revenueTrendData.length === 0 ? (
                <div className="text-muted">No revenue data in this range.</div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={revenueTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="invoiced" strokeWidth={2} />
                    <Line type="monotone" dataKey="paid" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        <div className="col-12 col-xl-4">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-header bg-white">
              <h5 className="mb-0">Appointment Status Mix</h5>
            </div>
            <div className="card-body">
              {appointmentStatusData.every((x) => x.value === 0) ? (
                <div className="text-muted">
                  No appointment data in this range.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={appointmentStatusData}
                      dataKey="value"
                      nameKey="name"
                      outerRadius={100}
                      label
                    >
                      {appointmentStatusData.map((entry, index) => (
                        <Cell key={index} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        <div className="col-12 col-xl-7">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-header bg-white">
              <h5 className="mb-0">Doctor Load</h5>
            </div>
            <div className="card-body">
              {doctorLoadData.length === 0 ? (
                <div className="text-muted">No doctor data available.</div>
              ) : (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={doctorLoadData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="total" />
                    <Bar dataKey="completed" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        <div className="col-12 col-xl-5">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-header bg-white">
              <h5 className="mb-0">Payment Snapshot</h5>
            </div>
            <div className="card-body">
              <div className="d-flex flex-column gap-3">
                {paymentSnapshot.map((item) => (
                  <div
                    key={item.name}
                    className="d-flex justify-content-between align-items-center border rounded p-3 bg-light"
                  >
                    <div className="fw-semibold">{item.name}</div>
                    <div className="fw-bold">{money(item.value)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, subtitle }) {
  return (
    <div className="col-12 col-sm-6 col-xl-3">
      <div className="card shadow-sm border-0 h-100">
        <div className="card-body">
          <div className="text-muted small mb-1">{title}</div>
          <div className="fs-4 fw-bold">{value}</div>
          <div className="small text-muted mt-1">{subtitle}</div>
        </div>
      </div>
    </div>
  );
}

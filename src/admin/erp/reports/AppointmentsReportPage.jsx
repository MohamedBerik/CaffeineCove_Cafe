import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import axios from "../../../services/axios";

export default function AppointmentsReportPage() {
  const today = new Date().toISOString().slice(0, 10);

  const [filters, setFilters] = useState({
    from: today,
    to: today,
    doctor_id: "",
    status: "",
  });

  const [rows, setRows] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [summary, setSummary] = useState({
    total: 0,
    scheduled: 0,
    completed: 0,
    cancelled: 0,
    no_show: 0,
    in_progress: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadReport();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
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

  const loadReport = async () => {
    try {
      setLoading(true);
      setError("");

      const [appointmentsRes, doctorsRes] = await Promise.all([
        axios.get("/erp/appointments"),
        axios.get("/erp/doctors"),
      ]);

      const appointmentsPayload = appointmentsRes.data || {};
      const doctorsPayload = doctorsRes.data || {};

      const appointmentRows = Array.isArray(appointmentsPayload.data)
        ? appointmentsPayload.data
        : appointmentsPayload.data?.data || [];

      const doctorRows = Array.isArray(doctorsPayload.data)
        ? doctorsPayload.data
        : doctorsPayload.data?.data || [];

      const filtered = appointmentRows.filter((item) => {
        const dateOnly = String(item.appointment_date || "").slice(0, 10);

        if (filters.from && dateOnly < filters.from) return false;
        if (filters.to && dateOnly > filters.to) return false;

        if (
          filters.doctor_id &&
          String(item.doctor_id || "") !== String(filters.doctor_id)
        ) {
          return false;
        }

        if (
          filters.status &&
          String(item.status || "").toLowerCase() !==
            String(filters.status).toLowerCase()
        ) {
          return false;
        }

        return true;
      });

      const total = filtered.length;
      const scheduled = filtered.filter((x) => x.status === "scheduled").length;
      const completed = filtered.filter((x) => x.status === "completed").length;
      const cancelled = filtered.filter((x) => x.status === "cancelled").length;
      const no_show = filtered.filter((x) => x.status === "no_show").length;
      const in_progress = filtered.filter(
        (x) => x.status === "in_progress",
      ).length;

      setRows(filtered);
      setDoctors(doctorRows);
      setSummary({
        total,
        scheduled,
        completed,
        cancelled,
        no_show,
        in_progress,
      });
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.msg ||
          "Failed to load appointments report.",
      );
    } finally {
      setLoading(false);
    }
  };

  const doctorLabel = useMemo(() => {
    if (!filters.doctor_id) return "All Doctors";
    const doctor = doctors.find(
      (d) => String(d.id) === String(filters.doctor_id),
    );
    return doctor?.name || `Doctor #${filters.doctor_id}`;
  }, [filters.doctor_id, doctors]);

  const applyFilters = async (e) => {
    e.preventDefault();
    await loadReport();
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
          <h3 className="fw-bold mb-1">Appointments Report</h3>
          <p className="text-muted mb-0">
            Operational report for scheduling, completion, cancellation, and
            no-show trends
          </p>
        </div>

        <div className="d-flex gap-2">
          <Link to="/admin/erp/reports" className="btn btn-outline-secondary">
            Back to Reports
          </Link>

          <button className="btn btn-primary" onClick={loadReport}>
            Refresh
          </button>
        </div>
      </div>

      {error ? (
        <div className="alert alert-danger d-flex justify-content-between align-items-center">
          <span>{error}</span>
          <button
            className="btn btn-sm btn-outline-danger"
            onClick={loadReport}
          >
            Retry
          </button>
        </div>
      ) : null}

      <div className="card shadow-sm border-0 mb-4">
        <div className="card-header bg-white">
          <h5 className="mb-0">Filters</h5>
        </div>

        <div className="card-body">
          <form className="row g-3 align-items-end" onSubmit={applyFilters}>
            <div className="col-12 col-md-3">
              <label className="form-label fw-semibold">From</label>
              <input
                type="date"
                className="form-control"
                name="from"
                value={filters.from}
                onChange={handleChange}
              />
            </div>

            <div className="col-12 col-md-3">
              <label className="form-label fw-semibold">To</label>
              <input
                type="date"
                className="form-control"
                name="to"
                value={filters.to}
                onChange={handleChange}
              />
            </div>

            <div className="col-12 col-md-3">
              <label className="form-label fw-semibold">Doctor</label>
              <select
                className="form-select"
                name="doctor_id"
                value={filters.doctor_id}
                onChange={handleChange}
              >
                <option value="">All Doctors</option>
                {doctors.map((doctor) => (
                  <option key={doctor.id} value={doctor.id}>
                    {doctor.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-12 col-md-3">
              <label className="form-label fw-semibold">Status</label>
              <select
                className="form-select"
                name="status"
                value={filters.status}
                onChange={handleChange}
              >
                <option value="">All Statuses</option>
                <option value="scheduled">scheduled</option>
                <option value="completed">completed</option>
                <option value="cancelled">cancelled</option>
                <option value="no_show">no_show</option>
                <option value="in_progress">in_progress</option>
              </select>
            </div>

            <div className="col-12 d-grid d-md-block">
              <button type="submit" className="btn btn-outline-primary">
                Apply Filters
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="row g-3 mb-4">
        <ReportCard
          title="Total Appointments"
          value={summary.total}
          color="primary"
        />
        <ReportCard
          title="Scheduled"
          value={summary.scheduled}
          color="warning"
        />
        <ReportCard
          title="Completed"
          value={summary.completed}
          color="success"
        />
        <ReportCard
          title="Cancelled"
          value={summary.cancelled}
          color="danger"
        />
        <ReportCard title="No Show" value={summary.no_show} color="dark" />
        <ReportCard
          title="In Progress"
          value={summary.in_progress}
          color="info"
        />
      </div>

      <div className="card shadow-sm border-0 mb-4">
        <div className="card-header bg-white d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Report Summary</h5>
          <span className="badge bg-light text-dark">
            {doctorLabel} | {filters.from || "-"} → {filters.to || "-"}
          </span>
        </div>

        <div className="card-body">
          <p className="text-muted mb-0">
            This report is currently built from the appointments listing
            response and is ready to be switched later to a dedicated reporting
            API.
          </p>
        </div>
      </div>

      <div className="card shadow-sm border-0">
        <div className="card-header bg-white">
          <h5 className="mb-0">Appointment Rows</h5>
        </div>

        <div className="card-body p-0">
          {rows.length === 0 ? (
            <div className="p-4 text-muted">
              No appointments found for this report.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th style={{ minWidth: 180 }}>Patient</th>
                    <th style={{ minWidth: 180 }}>Doctor</th>
                    <th style={{ minWidth: 130 }}>Date</th>
                    <th style={{ minWidth: 100 }}>Time</th>
                    <th style={{ minWidth: 120 }}>Status</th>
                    <th style={{ minWidth: 220 }}>Notes</th>
                    <th style={{ minWidth: 180 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div className="fw-semibold">
                          {item.patient?.name || "-"}
                        </div>
                        <div className="small text-muted">
                          {item.patient?.email || "-"}
                        </div>
                      </td>

                      <td>{item.doctor?.name || item.doctor_name || "-"}</td>
                      <td>{formatDate(item.appointment_date)}</td>
                      <td>
                        {String(item.appointment_time || "").slice(0, 5) || "-"}
                      </td>

                      <td>
                        <StatusBadge status={item.status} />
                      </td>

                      <td>{item.notes || "-"}</td>

                      <td>
                        <div className="d-flex flex-wrap gap-2">
                          {item.patient?.id ? (
                            <Link
                              to={`/admin/erp/patients/${item.patient.id}/profile`}
                              className="btn btn-sm btn-outline-primary"
                            >
                              Patient
                            </Link>
                          ) : null}

                          <Link
                            to={`/admin/erp/appointments/${item.id}/activity`}
                            className="btn btn-sm btn-outline-secondary"
                          >
                            Activity
                          </Link>
                        </div>
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
  );
}

function ReportCard({ title, value, color = "primary" }) {
  return (
    <div className="col-12 col-sm-6 col-xl-4">
      <div className="card border-0 shadow-sm h-100">
        <div className="card-body">
          <div className="text-muted small mb-1">{title}</div>
          <div className={`fs-4 fw-bold text-${color}`}>{value}</div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const value = String(status || "").toLowerCase();

  let cls = "secondary";
  if (["completed"].includes(value)) cls = "success";
  else if (["cancelled", "no_show"].includes(value)) cls = "danger";
  else if (["scheduled"].includes(value)) cls = "warning";
  else if (["in_progress"].includes(value)) cls = "info";

  return <span className={`badge bg-${cls}`}>{status}</span>;
}

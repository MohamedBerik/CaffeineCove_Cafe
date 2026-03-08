import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "../../../services/axios";

export default function DoctorPerformanceReportPage() {
  const today = new Date().toISOString().slice(0, 10);

  const [filters, setFilters] = useState({
    from: today,
    to: today,
  });

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadReport();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
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

      const appointments = Array.isArray(appointmentsPayload.data)
        ? appointmentsPayload.data
        : appointmentsPayload.data?.data || [];

      const doctors = Array.isArray(doctorsPayload.data)
        ? doctorsPayload.data
        : doctorsPayload.data?.data || [];

      const filtered = appointments.filter((a) => {
        const d = String(a.appointment_date || "").slice(0, 10);

        if (filters.from && d < filters.from) return false;
        if (filters.to && d > filters.to) return false;

        return true;
      });

      const doctorStats = doctors.map((doc) => {
        const items = filtered.filter(
          (a) => String(a.doctor_id) === String(doc.id),
        );

        const total = items.length;
        const completed = items.filter((x) => x.status === "completed").length;
        const cancelled = items.filter((x) => x.status === "cancelled").length;
        const no_show = items.filter((x) => x.status === "no_show").length;
        const scheduled = items.filter((x) => x.status === "scheduled").length;

        const completionRate = total
          ? Math.round((completed / total) * 100)
          : 0;

        return {
          id: doc.id,
          name: doc.name,
          specialty: doc.specialty || "-",
          total,
          completed,
          cancelled,
          no_show,
          scheduled,
          completionRate,
        };
      });

      setRows(doctorStats);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.msg ||
          "Failed to load doctor performance report.",
      );
    } finally {
      setLoading(false);
    }
  };

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
        <div className="spinner-border text-primary" />
      </div>
    );
  }

  return (
    <div className="container-fluid px-0">
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
        <div>
          <h3 className="fw-bold mb-1">Doctor Performance Report</h3>
          <p className="text-muted mb-0">
            Compare doctors by appointments, completion rate, and attendance
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

      {error && (
        <div className="alert alert-danger d-flex justify-content-between align-items-center">
          <span>{error}</span>
          <button
            className="btn btn-sm btn-outline-danger"
            onClick={loadReport}
          >
            Retry
          </button>
        </div>
      )}

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

      <div className="card shadow-sm border-0">
        <div className="card-header bg-white">
          <h5 className="mb-0">Doctor Statistics</h5>
        </div>

        <div className="card-body p-0">
          {rows.length === 0 ? (
            <div className="p-4 text-muted">No data available.</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Doctor</th>
                    <th>Specialty</th>
                    <th>Total</th>
                    <th>Completed</th>
                    <th>Scheduled</th>
                    <th>Cancelled</th>
                    <th>No Show</th>
                    <th>Completion Rate</th>
                  </tr>
                </thead>

                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id}>
                      <td className="fw-semibold">{row.name}</td>

                      <td>{row.specialty}</td>

                      <td>{row.total}</td>
                      <td>{row.completed}</td>
                      <td>{row.scheduled}</td>
                      <td>{row.cancelled}</td>
                      <td>{row.no_show}</td>

                      <td>
                        <span
                          className={`badge bg-${row.completionRate >= 70 ? "success" : row.completionRate >= 40 ? "warning" : "danger"}`}
                        >
                          {row.completionRate}%
                        </span>
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

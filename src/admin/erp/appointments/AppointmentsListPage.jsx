import { useEffect, useMemo, useState } from "react";
import axios from "../../../services/axios";

export default function AppointmentsListPage() {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await axios.get("/erp/appointments", {
        params: search ? { search } : {},
      });

      const payload = res.data || {};
      const rowsData = Array.isArray(payload.data) ? payload.data : [];

      setRows(rowsData);
      setMeta(payload.meta || null);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.msg ||
          "Failed to load appointments.",
      );
    } finally {
      setLoading(false);
    }
  };

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;

    return rows.filter((item) => {
      const patientName = String(item.patient?.name || "").toLowerCase();
      const patientEmail = String(item.patient?.email || "").toLowerCase();
      const doctorName = String(
        item.doctor?.name || item.doctor_name || "",
      ).toLowerCase();
      const status = String(item.status || "").toLowerCase();
      const notes = String(item.notes || "").toLowerCase();
      const date = String(item.appointment_date || "").toLowerCase();

      return (
        patientName.includes(q) ||
        patientEmail.includes(q) ||
        doctorName.includes(q) ||
        status.includes(q) ||
        notes.includes(q) ||
        date.includes(q)
      );
    });
  }, [rows, search]);

  const applySearch = (e) => {
    e.preventDefault();
    loadAppointments();
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
          <h3 className="fw-bold mb-1">Appointments</h3>
          <p className="text-muted mb-0">
            Daily schedule, doctor bookings, and patient appointments
          </p>
        </div>

        <button className="btn btn-primary" onClick={loadAppointments}>
          Refresh
        </button>
      </div>

      {error ? (
        <div className="alert alert-danger d-flex justify-content-between align-items-center">
          <span>{error}</span>
          <button
            className="btn btn-sm btn-outline-danger"
            onClick={loadAppointments}
          >
            Retry
          </button>
        </div>
      ) : null}

      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body">
          <form className="row g-3 align-items-end" onSubmit={applySearch}>
            <div className="col-12 col-lg-8">
              <label className="form-label fw-semibold">Search</label>
              <input
                type="text"
                className="form-control"
                placeholder="Patient, doctor, date, status, notes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="col-12 col-lg-2">
              <label className="form-label fw-semibold">Total Loaded</label>
              <div className="form-control bg-light">
                {meta?.total ?? rows.length}
              </div>
            </div>

            <div className="col-12 col-lg-2">
              <button type="submit" className="btn btn-outline-primary w-100">
                Search
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="card shadow-sm border-0">
        <div className="card-header bg-white">
          <h5 className="mb-0">Appointments List</h5>
        </div>

        <div className="card-body p-0">
          {filteredRows.length === 0 ? (
            <div className="p-4 text-muted">No appointments found.</div>
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
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((item) => (
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

                      <td>{item.appointment_date || "-"}</td>

                      <td>
                        {String(item.appointment_time || "").slice(0, 5) || "-"}
                      </td>

                      <td>
                        <StatusBadge status={item.status} />
                      </td>

                      <td>{item.notes || "-"}</td>
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

function StatusBadge({ status }) {
  const value = String(status || "").toLowerCase();

  let cls = "secondary";

  if (["completed"].includes(value)) cls = "success";
  else if (["cancelled", "no_show"].includes(value)) cls = "danger";
  else if (["scheduled"].includes(value)) cls = "warning";
  else if (["in_progress"].includes(value)) cls = "info";

  return <span className={`badge bg-${cls}`}>{status}</span>;
}

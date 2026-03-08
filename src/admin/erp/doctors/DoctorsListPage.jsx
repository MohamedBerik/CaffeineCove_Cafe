import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import axios from "../../../services/axios";

export default function DoctorsListPage() {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadDoctors();
  }, []);

  const loadDoctors = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await axios.get("/erp/doctors");
      const payload = res.data || {};

      const rowsData = Array.isArray(payload.data)
        ? payload.data
        : payload.data?.data || [];

      setRows(rowsData);
      setMeta(payload.meta || payload.data?.meta || null);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.msg ||
          "Failed to load doctors.",
      );
    } finally {
      setLoading(false);
    }
  };

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;

    return rows.filter((item) => {
      const name = String(item.name || "").toLowerCase();
      const email = String(item.email || "").toLowerCase();
      const phone = String(item.phone || "").toLowerCase();
      const specialty = String(item.specialty || "").toLowerCase();
      const status = String(
        item.is_active === true || item.is_active === 1 ? "active" : "inactive",
      ).toLowerCase();

      return (
        name.includes(q) ||
        email.includes(q) ||
        phone.includes(q) ||
        specialty.includes(q) ||
        status.includes(q)
      );
    });
  }, [rows, search]);

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
          <h3 className="fw-bold mb-1">Doctors</h3>
          <p className="text-muted mb-0">
            Manage doctors, working hours, and availability
          </p>
        </div>

        <div className="d-flex gap-2">
          <Link
            to="/admin/erp/doctors/create"
            className="btn btn-outline-primary"
          >
            New Doctor
          </Link>

          <button className="btn btn-primary" onClick={loadDoctors}>
            Refresh
          </button>
        </div>
      </div>

      {error ? (
        <div className="alert alert-danger d-flex justify-content-between align-items-center">
          <span>{error}</span>
          <button
            className="btn btn-sm btn-outline-danger"
            onClick={loadDoctors}
          >
            Retry
          </button>
        </div>
      ) : null}

      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body">
          <div className="row g-3 align-items-center">
            <div className="col-12 col-lg-8">
              <label className="form-label fw-semibold">Search</label>
              <input
                type="text"
                className="form-control"
                placeholder="Name, email, phone, specialty..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="col-12 col-lg-4">
              <label className="form-label fw-semibold">Total Loaded</label>
              <div className="form-control bg-light">
                {meta?.total ?? rows.length}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card shadow-sm border-0">
        <div className="card-header bg-white">
          <h5 className="mb-0">Doctors List</h5>
        </div>

        <div className="card-body p-0">
          {filteredRows.length === 0 ? (
            <div className="p-4 text-muted">No doctors found.</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th style={{ minWidth: 200 }}>Doctor</th>
                    <th style={{ minWidth: 180 }}>Specialty</th>
                    <th style={{ minWidth: 120 }}>Working Hours</th>
                    <th style={{ minWidth: 120 }}>Slot Minutes</th>
                    <th style={{ minWidth: 120 }}>Status</th>
                    <th style={{ minWidth: 220 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((doctor) => (
                    <tr key={doctor.id}>
                      <td>
                        <div className="fw-semibold">{doctor.name || "-"}</div>
                        <div className="small text-muted">
                          {doctor.email || "-"}{" "}
                          {doctor.phone ? `| ${doctor.phone}` : ""}
                        </div>
                      </td>

                      <td>{doctor.specialty || "-"}</td>

                      <td>
                        {doctor.work_start || "-"}{" "}
                        {doctor.work_end ? `→ ${doctor.work_end}` : ""}
                      </td>

                      <td>{doctor.slot_minutes || "-"}</td>

                      <td>
                        <StatusBadge
                          active={
                            doctor.is_active === true || doctor.is_active === 1
                          }
                        />
                      </td>

                      <td>
                        <div className="d-flex flex-wrap gap-2">
                          <Link
                            to={`/admin/erp/doctors/${doctor.id}/availability`}
                            className="btn btn-sm btn-outline-primary"
                          >
                            Availability
                          </Link>

                          <Link
                            to={`/admin/erp/doctors/${doctor.id}/edit`}
                            className="btn btn-sm btn-outline-warning"
                          >
                            Edit
                          </Link>

                          <Link
                            to={`/admin/erp/appointments/create?doctor_id=${doctor.id}`}
                            className="btn btn-sm btn-outline-success"
                          >
                            Book Appointment
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

function StatusBadge({ active }) {
  return (
    <span className={`badge bg-${active ? "success" : "danger"}`}>
      {active ? "active" : "inactive"}
    </span>
  );
}

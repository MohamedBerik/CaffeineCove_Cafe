import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import axios from "../../../services/axios";

export default function PatientsList() {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await axios.get("/erp/customers");
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
          "Failed to load patients.",
      );
    } finally {
      setLoading(false);
    }
  };

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;

    return rows.filter((item) => {
      const patientCode = String(item.patient_code || "").toLowerCase();
      const name = String(item.name || "").toLowerCase();
      const email = String(item.email || "").toLowerCase();
      const phone = String(item.phone || "").toLowerCase();
      const status = String(item.status || "").toLowerCase();

      return (
        patientCode.includes(q) ||
        name.includes(q) ||
        email.includes(q) ||
        phone.includes(q) ||
        status.includes(q)
      );
    });
  }, [rows, search]);

  const normalizeStatus = (value) => {
    if (String(value) === "1") return "active";
    if (String(value) === "0") return "inactive";
    return String(value || "-");
  };

  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "300px" }}
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
          <h3 className="fw-bold mb-1">Patients</h3>
          <p className="text-muted mb-0">
            Manage patients, open profile, timeline, and statement
          </p>
        </div>
        <div className="d-flex gap-2">
          <Link
            to="/admin/erp/customers/create"
            className="btn btn-outline-primary"
          >
            New Patient
          </Link>
          <button className="btn btn-primary" onClick={loadPatients}>
            Refresh
          </button>
        </div>
      </div>

      {error ? (
        <div className="alert alert-danger d-flex justify-content-between align-items-center">
          <span>{error}</span>
          <button
            className="btn btn-sm btn-outline-danger"
            onClick={loadPatients}
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
                placeholder="Search by code, name, email, phone, or status..."
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
          <h5 className="mb-0">Patients List</h5>
        </div>

        <div className="card-body p-0">
          {filteredRows.length === 0 ? (
            <div className="p-4 text-muted">No patients found.</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th style={{ minWidth: 120 }}>Code</th>
                    <th style={{ minWidth: 180 }}>Name</th>
                    <th style={{ minWidth: 220 }}>Email</th>
                    <th style={{ minWidth: 150 }}>Phone</th>
                    <th style={{ minWidth: 120 }}>Status</th>
                    <th style={{ minWidth: 320 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((patient) => (
                    <tr key={patient.id}>
                      <td>{patient.patient_code || "-"}</td>
                      <td className="fw-semibold">{patient.name || "-"}</td>
                      <td>{patient.email || "-"}</td>
                      <td>{patient.phone || "-"}</td>
                      <td>
                        <StatusBadge status={normalizeStatus(patient.status)} />
                      </td>
                      <td>
                        <div className="d-flex flex-wrap gap-2">
                          <Link
                            to={`/admin/erp/patients/${patient.id}/profile`}
                            className="btn btn-sm btn-outline-primary"
                          >
                            Profile
                          </Link>

                          <Link
                            to={`/admin/erp/patients/${patient.id}/timeline`}
                            className="btn btn-sm btn-outline-info"
                          >
                            Timeline
                          </Link>

                          <Link
                            to={`/admin/erp/patients/${patient.id}/statement`}
                            className="btn btn-sm btn-outline-success"
                          >
                            Statement
                          </Link>
                          <Link
                            to={`/admin/erp/patients/${patient.id}/edit`}
                            className="btn btn-sm btn-outline-warning"
                          >
                            <i className="fas fa-edit me-1"></i> Edit
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

function StatusBadge({ status }) {
  const value = String(status || "").toLowerCase();

  let cls = "secondary";
  if (value === "active") cls = "success";
  if (value === "inactive") cls = "danger";

  return <span className={`badge bg-${cls}`}>{status}</span>;
}

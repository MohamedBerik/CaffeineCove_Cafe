import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import axios from "../../../services/axios";

export default function DentalRecordsListPage() {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await axios.get("/erp/dental-records");
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
          "Failed to load dental records.",
      );
    } finally {
      setLoading(false);
    }
  };

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;

    return rows.filter((item) => {
      const patientName = String(item.customer?.name || "").toLowerCase();
      const patientEmail = String(item.customer?.email || "").toLowerCase();
      const procedureName = String(item.procedure?.name || "").toLowerCase();
      const tooth = String(item.tooth_number || "").toLowerCase();
      const surface = String(item.surface || "").toLowerCase();
      const status = String(item.status || "").toLowerCase();
      const notes = String(item.notes || "").toLowerCase();

      return (
        patientName.includes(q) ||
        patientEmail.includes(q) ||
        procedureName.includes(q) ||
        tooth.includes(q) ||
        surface.includes(q) ||
        status.includes(q) ||
        notes.includes(q)
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
          <h3 className="fw-bold mb-1">Dental Records</h3>
          <p className="text-muted mb-0">
            Review patient chart records, procedures, teeth, and statuses
          </p>
        </div>
        <Link
          to="/admin/erp/dental-records/create"
          className="btn btn-outline-primary"
        >
          Create Dental Record
        </Link>
        <button className="btn btn-primary" onClick={loadRecords}>
          Refresh
        </button>
      </div>

      {error ? (
        <div className="alert alert-danger d-flex justify-content-between align-items-center">
          <span>{error}</span>
          <button
            className="btn btn-sm btn-outline-danger"
            onClick={loadRecords}
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
                placeholder="Patient, procedure, tooth, surface, status, notes..."
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
          <h5 className="mb-0">Dental Records List</h5>
        </div>

        <div className="card-body p-0">
          {filteredRows.length === 0 ? (
            <div className="p-4 text-muted">No dental records found.</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th style={{ minWidth: 220 }}>Patient</th>
                    <th style={{ minWidth: 180 }}>Procedure</th>
                    <th style={{ minWidth: 100 }}>Tooth</th>
                    <th style={{ minWidth: 120 }}>Surface</th>
                    <th style={{ minWidth: 120 }}>Status</th>
                    <th style={{ minWidth: 220 }}>Notes</th>
                    <th style={{ minWidth: 180 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((record) => (
                    <tr key={record.id}>
                      <td>
                        <div className="fw-semibold">
                          {record.customer?.name || "-"}
                        </div>
                        <div className="small text-muted">
                          {record.customer?.email || "-"}
                        </div>
                      </td>

                      <td>{record.procedure?.name || "-"}</td>
                      <td>{record.tooth_number || "-"}</td>
                      <td>{record.surface || "-"}</td>
                      <td>
                        <StatusBadge status={record.status} />
                      </td>
                      <td>{record.notes || "-"}</td>
                      <td>
                        <div className="d-flex flex-wrap gap-2">
                          {record.customer?.id ? (
                            <Link
                              to={`/admin/erp/patients/${record.customer.id}/profile`}
                              className="btn btn-sm btn-outline-primary"
                            >
                              Patient
                            </Link>
                          ) : null}

                          {record.customer?.id ? (
                            <Link
                              to={`/admin/erp/patients/${record.customer.id}/timeline`}
                              className="btn btn-sm btn-outline-info"
                            >
                              Timeline
                            </Link>
                          ) : null}
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

  if (["completed"].includes(value)) cls = "success";
  else if (["cancelled"].includes(value)) cls = "danger";
  else if (["planned"].includes(value)) cls = "warning";
  else if (["in_progress"].includes(value)) cls = "info";

  return <span className={`badge bg-${cls}`}>{status}</span>;
}

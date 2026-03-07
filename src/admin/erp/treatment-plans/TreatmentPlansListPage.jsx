import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import axios from "../../../services/axios";

export default function TreatmentPlansListPage() {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await axios.get("/erp/treatment-plans");
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
          "Failed to load treatment plans.",
      );
    } finally {
      setLoading(false);
    }
  };

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;

    return rows.filter((item) => {
      const title = String(item.title || "").toLowerCase();
      const patientName = String(item.customer?.name || "").toLowerCase();
      const patientEmail = String(item.customer?.email || "").toLowerCase();
      const status = String(item.status || "").toLowerCase();
      const notes = String(item.notes || "").toLowerCase();

      return (
        title.includes(q) ||
        patientName.includes(q) ||
        patientEmail.includes(q) ||
        status.includes(q) ||
        notes.includes(q)
      );
    });
  }, [rows, search]);

  const money = (value) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(Number(value || 0));

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
          <h3 className="fw-bold mb-1">Treatment Plans</h3>
          <p className="text-muted mb-0">
            View treatment plans, balances, progress, and linked patient data
          </p>
        </div>

        <div className="d-flex gap-2">
          <Link
            to="/admin/erp/treatment-plans/create"
            className="btn btn-outline-primary"
          >
            Create Treatment Plan
          </Link>

          <button className="btn btn-primary" onClick={loadPlans}>
            Refresh
          </button>
        </div>
      </div>

      {error ? (
        <div className="alert alert-danger d-flex justify-content-between align-items-center">
          <span>{error}</span>
          <button className="btn btn-sm btn-outline-danger" onClick={loadPlans}>
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
                placeholder="Search by title, patient, email, status, or notes..."
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
          <h5 className="mb-0">Treatment Plans List</h5>
        </div>

        <div className="card-body p-0">
          {filteredRows.length === 0 ? (
            <div className="p-4 text-muted">No treatment plans found.</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th style={{ minWidth: 240 }}>Title</th>
                    <th style={{ minWidth: 220 }}>Patient</th>
                    <th style={{ minWidth: 130 }}>Total Cost</th>
                    <th style={{ minWidth: 130 }}>Total Paid</th>
                    <th style={{ minWidth: 130 }}>Net Paid</th>
                    <th style={{ minWidth: 130 }}>Remaining</th>
                    <th style={{ minWidth: 120 }}>Status</th>
                    <th style={{ minWidth: 180 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((plan) => (
                    <tr key={plan.id}>
                      <td>
                        <div className="fw-semibold">{plan.title || "-"}</div>
                        <div className="small text-muted">
                          {plan.notes || "-"}
                        </div>
                      </td>

                      <td>
                        <div className="fw-semibold">
                          {plan.customer?.name || "-"}
                        </div>
                        <div className="small text-muted">
                          {plan.customer?.email || "-"}
                        </div>
                      </td>

                      <td>{money(plan.total_cost)}</td>
                      <td>{money(plan.total_paid)}</td>
                      <td>{money(plan.net_paid)}</td>
                      <td>{money(plan.remaining)}</td>

                      <td>
                        <StatusBadge status={plan.status} />
                      </td>

                      <td>
                        <div className="d-flex flex-wrap gap-2">
                          <Link
                            to={`/admin/erp/treatment-plans/${plan.id}`}
                            className="btn btn-sm btn-outline-primary"
                          >
                            View
                          </Link>

                          {plan.customer?.id ? (
                            <Link
                              to={`/admin/erp/patients/${plan.customer.id}/profile`}
                              className="btn btn-sm btn-outline-secondary"
                            >
                              Patient
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
  else if (["active"].includes(value)) cls = "warning";

  return <span className={`badge bg-${cls}`}>{status}</span>;
}

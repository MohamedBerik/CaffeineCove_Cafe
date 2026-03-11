import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import axios from "../../../services/axios";

export default function ProceduresListPage() {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");
  const [actingId, setActingId] = useState(null);

  useEffect(() => {
    loadProcedures();
  }, []);

  const loadProcedures = async () => {
    try {
      setLoading(true);
      setError("");
      setActionError("");
      setActionSuccess("");

      const res = await axios.get("/erp/procedures");
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
          "Failed to load procedures.",
      );
    } finally {
      setLoading(false);
    }
  };

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();

    return rows.filter((item) => {
      const id = String(item.id || "").toLowerCase();
      const name = String(item.name || "").toLowerCase();
      const price = String(item.default_price || "").toLowerCase();

      const activeValue =
        Number(item.is_active) === 1 || item.is_active === true
          ? "active"
          : "inactive";

      const matchesSearch =
        !q || id.includes(q) || name.includes(q) || price.includes(q);

      const matchesStatus = !statusFilter || activeValue === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [rows, search, statusFilter]);

  const money = (value) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(Number(value || 0));

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

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("");
  };

  const toggleProcedureStatus = async (item) => {
    const nextStatus =
      Number(item.is_active) === 1 || item.is_active === true ? 0 : 1;

    const confirmText =
      nextStatus === 1
        ? `Activate procedure "${item.name}"?`
        : `Deactivate procedure "${item.name}"?`;

    const ok = window.confirm(confirmText);
    if (!ok) return;

    try {
      setActionError("");
      setActionSuccess("");
      setActingId(item.id);

      await axios.put(`/erp/procedures/${item.id}`, {
        name: item.name,
        default_price: Number(item.default_price || 0),
        is_active: nextStatus,
      });

      setActionSuccess(
        nextStatus === 1
          ? "Procedure activated successfully."
          : "Procedure deactivated successfully.",
      );

      await loadProcedures();
    } catch (err) {
      const errors = err?.response?.data?.errors;
      if (errors) {
        const firstError = Object.values(errors)?.[0]?.[0];
        setActionError(firstError || "Failed to update procedure.");
      } else {
        setActionError(
          err?.response?.data?.message ||
            err?.response?.data?.msg ||
            "Failed to update procedure.",
        );
      }
    } finally {
      setActingId(null);
    }
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
          <h3 className="fw-bold mb-1">Procedures</h3>
          <p className="text-muted mb-0">
            Manage clinic procedures, default prices, and active status
          </p>
        </div>

        <div className="d-flex gap-2">
          <Link
            to="/admin/erp/procedures/create"
            className="btn btn-outline-primary"
          >
            Add Procedure
          </Link>

          <button className="btn btn-primary" onClick={loadProcedures}>
            Refresh
          </button>
        </div>
      </div>

      {error ? (
        <div className="alert alert-danger d-flex justify-content-between align-items-center">
          <span>{error}</span>
          <button
            className="btn btn-sm btn-outline-danger"
            onClick={loadProcedures}
          >
            Retry
          </button>
        </div>
      ) : null}

      {actionError ? (
        <div className="alert alert-danger">{actionError}</div>
      ) : null}

      {actionSuccess ? (
        <div className="alert alert-success">{actionSuccess}</div>
      ) : null}

      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body">
          <div className="row g-3 align-items-end">
            <div className="col-12 col-lg-5">
              <label className="form-label fw-semibold">Search</label>
              <input
                type="text"
                className="form-control"
                placeholder="ID, procedure name, default price..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="col-12 col-lg-3">
              <label className="form-label fw-semibold">Status</label>
              <select
                className="form-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div className="col-12 col-lg-2">
              <label className="form-label fw-semibold">Total Loaded</label>
              <div className="form-control bg-light">
                {meta?.total ?? rows.length}
              </div>
            </div>

            <div className="col-12 col-lg-2">
              <label className="form-label fw-semibold">Filtered</label>
              <div className="form-control bg-light">{filteredRows.length}</div>
            </div>

            <div className="col-12 d-flex gap-2">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={clearFilters}
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="card shadow-sm border-0">
        <div className="card-header bg-white">
          <h5 className="mb-0">Procedures List</h5>
        </div>

        <div className="card-body p-0">
          {filteredRows.length === 0 ? (
            <div className="p-4 text-muted">No procedures found.</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th style={{ minWidth: 90 }}>ID</th>
                    <th style={{ minWidth: 240 }}>Procedure</th>
                    <th style={{ minWidth: 150 }}>Default Price</th>
                    <th style={{ minWidth: 140 }}>Status</th>
                    <th style={{ minWidth: 160 }}>Created</th>
                    <th style={{ minWidth: 220 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <span className="fw-semibold">#{item.id}</span>
                      </td>

                      <td>
                        <div className="fw-semibold">{item.name || "-"}</div>
                      </td>

                      <td>{money(item.default_price)}</td>

                      <td>
                        <ProcedureActiveBadge isActive={item.is_active} />
                      </td>

                      <td>{formatDate(item.created_at)}</td>

                      <td>
                        <div className="d-flex flex-wrap gap-2">
                          <Link
                            to={`/admin/erp/procedures/${item.id}/edit`}
                            className="btn btn-sm btn-outline-primary"
                          >
                            Edit
                          </Link>

                          <button
                            type="button"
                            className={`btn btn-sm ${
                              Number(item.is_active) === 1 ||
                              item.is_active === true
                                ? "btn-outline-warning"
                                : "btn-outline-success"
                            }`}
                            onClick={() => toggleProcedureStatus(item)}
                            disabled={actingId === item.id}
                          >
                            {actingId === item.id
                              ? "Saving..."
                              : Number(item.is_active) === 1 ||
                                  item.is_active === true
                                ? "Deactivate"
                                : "Activate"}
                          </button>
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

function ProcedureActiveBadge({ isActive }) {
  const active = Number(isActive) === 1 || isActive === true;

  return (
    <span className={`badge ${active ? "bg-success" : "bg-secondary"}`}>
      {active ? "Active" : "Inactive"}
    </span>
  );
}

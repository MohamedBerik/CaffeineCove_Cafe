import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../../services/axios";

export default function InvoicesList() {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await api.get("/erp/invoices");
      const payload = res.data || {};

      const rowsData = extractInvoiceRows(payload);
      const metaData = extractMeta(payload, rowsData);

      setRows(rowsData);
      setMeta(metaData);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.msg ||
          "Failed to load invoices.",
      );
    } finally {
      setLoading(false);
    }
  };

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;

    return rows.filter((item) => {
      const number = String(item.number || item.id || "").toLowerCase();
      const customerName = String(item.customer?.name || "").toLowerCase();
      const customerEmail = String(item.customer?.email || "").toLowerCase();
      const status = String(item.status || "").toLowerCase();
      const issuedAt = String(
        item.issued_at || item.created_at || "",
      ).toLowerCase();

      return (
        number.includes(q) ||
        customerName.includes(q) ||
        customerEmail.includes(q) ||
        status.includes(q) ||
        issuedAt.includes(q)
      );
    });
  }, [rows, search]);

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
          <h3 className="fw-bold mb-1">Invoices</h3>
          <p className="text-muted mb-0">
            Review invoice balances, payment status, and customer billing
          </p>
        </div>

        <button className="btn btn-primary" onClick={loadInvoices}>
          Refresh
        </button>
      </div>

      {error ? (
        <div className="alert alert-danger d-flex justify-content-between align-items-center">
          <span>{error}</span>
          <button
            className="btn btn-sm btn-outline-danger"
            onClick={loadInvoices}
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
                placeholder="Invoice number, customer, email, status..."
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
          <h5 className="mb-0">Invoices List</h5>
        </div>

        <div className="card-body p-0">
          {filteredRows.length === 0 ? (
            <div className="p-4 text-muted">No invoices found.</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th style={{ minWidth: 160 }}>Invoice</th>
                    <th style={{ minWidth: 220 }}>Customer</th>
                    <th style={{ minWidth: 120 }}>Total</th>
                    <th style={{ minWidth: 120 }}>Paid</th>
                    <th style={{ minWidth: 120 }}>Remaining</th>
                    <th style={{ minWidth: 140 }}>Status</th>
                    <th style={{ minWidth: 140 }}>Issued</th>
                    <th style={{ minWidth: 220 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((inv) => {
                    const total = Number(inv.total || 0);
                    const totalPaid = Number(
                      inv.net_paid ?? inv.total_paid ?? 0,
                    );
                    const remaining =
                      inv.remaining != null
                        ? Number(inv.remaining)
                        : Math.max(total - totalPaid, 0);

                    return (
                      <tr key={inv.id}>
                        <td>
                          <div className="fw-semibold">
                            {inv.number ? (
                              <Link
                                to={`/admin/erp/invoices/${inv.id}`}
                                className="text-decoration-none"
                              >
                                {inv.number}
                              </Link>
                            ) : (
                              `#${inv.id}`
                            )}
                          </div>
                          <div className="small text-muted">ID: {inv.id}</div>
                        </td>

                        <td>
                          <div className="fw-semibold">
                            {inv.customer?.name || "-"}
                          </div>
                          <div className="small text-muted">
                            {inv.customer?.email || "-"}
                          </div>
                        </td>

                        <td>{money(total)}</td>
                        <td>{money(totalPaid)}</td>
                        <td>{money(remaining)}</td>

                        <td>
                          <StatusBadge status={inv.status} />
                        </td>

                        <td>{formatDate(inv.issued_at || inv.created_at)}</td>

                        <td>
                          <div className="d-flex flex-wrap gap-2">
                            <Link
                              to={`/admin/erp/invoices/${inv.id}`}
                              className="btn btn-sm btn-outline-primary"
                            >
                              View
                            </Link>

                            {inv.customer_id ? (
                              <Link
                                to={`/admin/erp/patients/${inv.customer_id}/profile`}
                                className="btn btn-sm btn-outline-secondary"
                              >
                                Patient
                              </Link>
                            ) : null}

                            {inv.treatment_plan_id ? (
                              <Link
                                to={`/admin/erp/treatment-plans/${inv.treatment_plan_id}`}
                                className="btn btn-sm btn-outline-info"
                              >
                                Plan
                              </Link>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function extractInvoiceRows(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.data?.data)) return payload.data.data;
  if (Array.isArray(payload.invoices)) return payload.invoices;
  if (Array.isArray(payload.invoices?.data)) return payload.invoices.data;
  return [];
}

function extractMeta(payload, rowsData) {
  return (
    payload.meta ||
    payload.data?.meta ||
    payload.invoices?.meta || {
      total: rowsData.length,
    }
  );
}

function StatusBadge({ status }) {
  const value = String(status || "").toLowerCase();

  let cls = "secondary";
  if (["paid"].includes(value)) cls = "success";
  else if (["unpaid", "cancelled"].includes(value)) cls = "danger";
  else if (["partially_paid"].includes(value)) cls = "warning";

  return <span className={`badge bg-${cls}`}>{status}</span>;
}

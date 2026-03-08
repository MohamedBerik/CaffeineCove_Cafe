import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import axios from "../../../services/axios";
import { exportToCsv } from "./utils/exportCsv";

export default function RevenueReportPage() {
  const today = new Date().toISOString().slice(0, 10);

  const [filters, setFilters] = useState({
    from: today,
    to: today,
  });

  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState({
    total_invoiced: 0,
    gross_paid: 0,
    refunded: 0,
    net_paid: 0,
    remaining: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadRevenueReport();
  }, []);

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const loadRevenueReport = async () => {
    try {
      setLoading(true);
      setError("");

      // مؤقتًا نعتمد على invoices list الموجودة
      const res = await axios.get("/erp/invoices");
      const payload = res.data || {};

      const invoiceRows = Array.isArray(payload.data)
        ? payload.data
        : payload.data?.data || payload.invoices || [];

      const filtered = invoiceRows.filter((item) => {
        const rawDate = item.issued_at || item.created_at;
        const dateOnly = rawDate ? String(rawDate).slice(0, 10) : "";

        if (filters.from && dateOnly < filters.from) return false;
        if (filters.to && dateOnly > filters.to) return false;

        return true;
      });

      const normalized = filtered.map((item) => {
        const total = Number(item.total || 0);
        const grossPaid = Number(
          item.total_paid ?? item.gross_paid ?? item.net_paid ?? 0,
        );
        const refunded = Number(item.total_refunded ?? item.refunded ?? 0);
        const netPaid =
          item.net_paid != null
            ? Number(item.net_paid)
            : Math.max(grossPaid - refunded, 0);
        const remaining =
          item.remaining != null
            ? Number(item.remaining)
            : Math.max(total - netPaid, 0);

        return {
          id: item.id,
          number: item.number || `#${item.id}`,
          customer_name: item.customer?.name || "-",
          total,
          gross_paid: grossPaid,
          refunded,
          net_paid: netPaid,
          remaining,
          status: item.status || "-",
          issued_at: item.issued_at || item.created_at || null,
        };
      });

      const totalInvoiced = normalized.reduce(
        (sum, item) => sum + item.total,
        0,
      );
      const grossPaid = normalized.reduce(
        (sum, item) => sum + item.gross_paid,
        0,
      );
      const refunded = normalized.reduce((sum, item) => sum + item.refunded, 0);
      const netPaid = normalized.reduce((sum, item) => sum + item.net_paid, 0);
      const remaining = normalized.reduce(
        (sum, item) => sum + item.remaining,
        0,
      );

      setRows(normalized);
      setSummary({
        total_invoiced: totalInvoiced,
        gross_paid: grossPaid,
        refunded: refunded,
        net_paid: netPaid,
        remaining: remaining,
      });
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.msg ||
          "Failed to load revenue report.",
      );
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = async (e) => {
    e.preventDefault();
    await loadRevenueReport();
  };

  const exportHint = useMemo(() => {
    return `Range: ${filters.from || "-"} → ${filters.to || "-"}`;
  }, [filters]);

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

  const exportRows = () => {
    const csvRows = rows.map((row) => ({
      invoice_number: row.number,
      customer_name: row.customer_name,
      invoiced: row.total,
      gross_paid: row.gross_paid,
      refunded: row.refunded,
      net_paid: row.net_paid,
      remaining: row.remaining,
      status: row.status,
      issued_at: row.issued_at,
    }));

    exportToCsv("revenue-report.csv", csvRows);
  };

  const printReport = () => {
    window.print();
  };
  return (
    <div className="container-fluid px-0">
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
        <div>
          <h3 className="fw-bold mb-1">Revenue Report</h3>
          <p className="text-muted mb-0">
            Revenue analysis based on invoices, payments, refunds, and balances
          </p>
        </div>

        <div className="d-flex gap-2">
          <Link to="/admin/erp/reports" className="btn btn-outline-secondary">
            Back to Reports
          </Link>

          <button className="btn btn-outline-dark" onClick={printReport}>
            Print
          </button>

          <button className="btn btn-outline-success" onClick={exportRows}>
            Export CSV
          </button>

          <button className="btn btn-primary" onClick={loadRevenueReport}>
            Refresh
          </button>
        </div>
      </div>

      {error ? (
        <div className="alert alert-danger d-flex justify-content-between align-items-center">
          <span>{error}</span>
          <button
            className="btn btn-sm btn-outline-danger"
            onClick={loadRevenueReport}
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
        <ReportCard
          title="Total Invoiced"
          value={money(summary.total_invoiced)}
          color="primary"
        />
        <ReportCard
          title="Gross Paid"
          value={money(summary.gross_paid)}
          color="success"
        />
        <ReportCard
          title="Refunded"
          value={money(summary.refunded)}
          color="danger"
        />
        <ReportCard
          title="Net Paid"
          value={money(summary.net_paid)}
          color="info"
        />
        <ReportCard
          title="Remaining"
          value={money(summary.remaining)}
          color="warning"
        />
      </div>

      <div className="card shadow-sm border-0 mb-4">
        <div className="card-header bg-white d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Report Summary</h5>
          <span className="badge bg-light text-dark">{exportHint}</span>
        </div>

        <div className="card-body">
          <p className="text-muted mb-0">
            This report is currently derived from the invoices listing response.
            It is ready to be switched later to a dedicated revenue-report API
            without changing the UI structure.
          </p>
        </div>
      </div>

      <div className="card shadow-sm border-0">
        <div className="card-header bg-white">
          <h5 className="mb-0">Revenue Rows</h5>
        </div>

        <div className="card-body p-0">
          {rows.length === 0 ? (
            <div className="p-4 text-muted">No revenue rows found.</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th style={{ minWidth: 160 }}>Invoice</th>
                    <th style={{ minWidth: 180 }}>Customer</th>
                    <th style={{ minWidth: 120 }}>Invoiced</th>
                    <th style={{ minWidth: 120 }}>Gross Paid</th>
                    <th style={{ minWidth: 120 }}>Refunded</th>
                    <th style={{ minWidth: 120 }}>Net Paid</th>
                    <th style={{ minWidth: 120 }}>Remaining</th>
                    <th style={{ minWidth: 120 }}>Status</th>
                    <th style={{ minWidth: 140 }}>Issued</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id}>
                      <td>
                        <Link
                          to={`/admin/erp/invoices/${row.id}`}
                          className="text-decoration-none fw-semibold"
                        >
                          {row.number}
                        </Link>
                      </td>
                      <td>{row.customer_name}</td>
                      <td>{money(row.total)}</td>
                      <td>{money(row.gross_paid)}</td>
                      <td>{money(row.refunded)}</td>
                      <td>{money(row.net_paid)}</td>
                      <td>{money(row.remaining)}</td>
                      <td>
                        <StatusBadge status={row.status} />
                      </td>
                      <td>{formatDate(row.issued_at)}</td>
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
  if (["paid"].includes(value)) cls = "success";
  else if (["unpaid", "cancelled"].includes(value)) cls = "danger";
  else if (["partially_paid"].includes(value)) cls = "warning";

  return <span className={`badge bg-${cls}`}>{status}</span>;
}

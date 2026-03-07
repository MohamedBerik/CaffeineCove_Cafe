import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "../../../services/axios";

export default function TreatmentPlanDetailsPage() {
  const { id } = useParams();

  const [plan, setPlan] = useState(null);
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState(null);
  const [cashSummary, setCashSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadAll();
  }, [id]);

  const loadAll = async () => {
    try {
      setLoading(true);
      setError("");

      const [planRes, itemsRes, summaryRes, cashRes] = await Promise.all([
        axios.get(`/erp/treatment-plans/${id}`),
        axios.get(`/erp/treatment-plans/${id}/items`),
        axios.get(`/erp/treatment-plans/${id}/summary`),
        axios.get(`/erp/treatment-plans/${id}/cash-summary`),
      ]);

      setPlan(planRes.data || null);
      setItems(itemsRes.data?.data || []);
      setSummary(summaryRes.data?.data || null);
      setCashSummary(cashRes.data?.data || null);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.msg ||
          "Failed to load treatment plan details.",
      );
    } finally {
      setLoading(false);
    }
  };

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

  if (error) {
    return (
      <div className="alert alert-danger d-flex justify-content-between align-items-center">
        <span>{error}</span>
        <button className="btn btn-sm btn-outline-danger" onClick={loadAll}>
          Retry
        </button>
      </div>
    );
  }

  const planData = plan?.data || plan || {};
  const customer = planData.customer || {};
  const invoices = summary?.invoices || [];
  const totals = summary?.totals || {};
  const cash = cashSummary?.cash || {};
  const credit = cashSummary?.customer_credit_balance || {};

  return (
    <div className="container-fluid px-0">
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
        <div>
          <h3 className="fw-bold mb-1">Treatment Plan Details</h3>
          <p className="text-muted mb-0">
            Review plan items, invoices, summary, and cash flow
          </p>
        </div>

        <div className="d-flex flex-wrap gap-2">
          <Link
            to="/admin/erp/treatment-plans"
            className="btn btn-outline-secondary"
          >
            Back to Plans
          </Link>

          {customer.id ? (
            <Link
              to={`/admin/erp/patients/${customer.id}/profile`}
              className="btn btn-outline-primary"
            >
              Patient Profile
            </Link>
          ) : null}

          <button className="btn btn-primary" onClick={loadAll}>
            Refresh
          </button>
        </div>
      </div>

      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body">
          <div className="row g-3">
            <InfoItem label="Title" value={planData.title} />
            <InfoItem label="Patient" value={customer.name} />
            <InfoItem label="Email" value={customer.email} />
            <InfoItem label="Status" value={planData.status} />
            <InfoItem label="Total Cost" value={money(planData.total_cost)} />
            <InfoItem label="Created" value={formatDate(planData.created_at)} />
            <div className="col-12">
              <div className="small text-muted">Notes</div>
              <div className="fw-semibold">{planData.notes || "-"}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-3 mb-4">
        <KpiCard
          title="Total Invoiced"
          value={money(totals.total_invoiced)}
          color="primary"
        />
        <KpiCard
          title="Total Paid"
          value={money(totals.total_paid)}
          color="success"
        />
        <KpiCard
          title="Total Refunded"
          value={money(totals.total_refunded)}
          color="danger"
        />
        <KpiCard title="Net Paid" value={money(totals.net_paid)} color="info" />
        <KpiCard
          title="Remaining"
          value={money(totals.remaining_on_plan)}
          color="warning"
        />
        <KpiCard title="Cash In" value={money(cash.cash_in)} color="success" />
        <KpiCard title="Net Cash" value={money(cash.net_cash)} color="dark" />
        <KpiCard
          title="Customer Credit"
          value={money(credit.net_credit)}
          color="secondary"
        />
      </div>

      <div className="row g-4">
        <div className="col-12 col-xl-6">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-header bg-white">
              <h5 className="mb-0">Plan Items</h5>
            </div>
            <div className="card-body p-0">
              {items.length === 0 ? (
                <div className="p-3 text-muted">No items found.</div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Procedure</th>
                        <th>Tooth</th>
                        <th>Surface</th>
                        <th>Price</th>
                        <th>Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item) => (
                        <tr key={item.id}>
                          <td>
                            {item.procedureRef?.name || item.procedure || "-"}
                          </td>
                          <td>{item.tooth_number || "-"}</td>
                          <td>{item.surface || "-"}</td>
                          <td>{money(item.price)}</td>
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

        <div className="col-12 col-xl-6">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-header bg-white">
              <h5 className="mb-0">Linked Invoices</h5>
            </div>
            <div className="card-body p-0">
              {invoices.length === 0 ? (
                <div className="p-3 text-muted">
                  No invoices linked to this plan.
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Number</th>
                        <th>Total</th>
                        <th>Net Paid</th>
                        <th>Remaining</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoices.map((inv) => (
                        <tr key={inv.id}>
                          <td>{inv.number}</td>
                          <td>{money(inv.total)}</td>
                          <td>{money(inv.net_paid)}</td>
                          <td>{money(inv.remaining)}</td>
                          <td>
                            <StatusBadge status={inv.status} />
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

        <div className="col-12">
          <div className="card shadow-sm border-0">
            <div className="card-header bg-white">
              <h5 className="mb-0">Cash Summary</h5>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <InfoItem label="Cash In" value={money(cash.cash_in)} />
                <InfoItem
                  label="Invoice Refunds"
                  value={money(cash.cash_out_invoice_refunds)}
                />
                <InfoItem
                  label="Credit Refunds"
                  value={money(cash.cash_out_credit_refunds)}
                />
                <InfoItem label="Net Cash" value={money(cash.net_cash)} />
                <InfoItem
                  label="Credit Issued"
                  value={money(credit.credit_issued)}
                />
                <InfoItem
                  label="Credit Used"
                  value={money(credit.credit_used)}
                />
                <InfoItem label="Net Credit" value={money(credit.net_credit)} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ title, value, color = "primary" }) {
  return (
    <div className="col-12 col-sm-6 col-xl-3">
      <div className="card border-0 shadow-sm h-100">
        <div className="card-body">
          <div className="text-muted small mb-1">{title}</div>
          <div className={`fs-4 fw-bold text-${color}`}>{value}</div>
        </div>
      </div>
    </div>
  );
}

function InfoItem({ label, value }) {
  return (
    <div className="col-12 col-md-6">
      <div className="small text-muted">{label}</div>
      <div className="fw-semibold">{value || "-"}</div>
    </div>
  );
}

function StatusBadge({ status }) {
  const value = String(status || "").toLowerCase();

  let cls = "secondary";
  if (["completed", "paid"].includes(value)) cls = "success";
  else if (["cancelled", "unpaid"].includes(value)) cls = "danger";
  else if (["active", "partially_paid"].includes(value)) cls = "warning";

  return <span className={`badge bg-${cls}`}>{status}</span>;
}

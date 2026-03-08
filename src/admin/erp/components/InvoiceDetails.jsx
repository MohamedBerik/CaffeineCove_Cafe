import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../../../services/axios";

export default function InvoiceDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [payForm, setPayForm] = useState({
    amount: "",
    method: "cash",
  });
  const [payLoading, setPayLoading] = useState(false);

  const [refundForms, setRefundForms] = useState({});
  const [refundLoadingId, setRefundLoadingId] = useState(null);

  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");

  useEffect(() => {
    loadInvoice();
  }, [id]);

  const loadInvoice = async () => {
    try {
      setLoading(true);
      setError("");
      setActionError("");
      setActionSuccess("");

      const res = await api.get(`/erp/invoices/${id}/full`);
      setInvoice(res.data?.invoice || null);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.msg ||
          "Failed to load invoice.",
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

  const formatDateTime = (value) => {
    if (!value) return "-";
    try {
      return new Date(value).toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return value;
    }
  };

  const payments = invoice?.payments || [];
  const items = invoice?.items || [];
  const journalEntries = invoice?.journal_entries || [];

  const refunds = useMemo(() => {
    return payments.flatMap((p) =>
      (p.refunds || []).map((r) => ({
        ...r,
        payment_id: p.id,
        invoice_id: p.invoice_id,
      })),
    );
  }, [payments]);

  const grossPaid = useMemo(
    () => payments.reduce((sum, p) => sum + Number(p.amount || 0), 0),
    [payments],
  );

  const totalRefunded = useMemo(
    () =>
      payments.reduce(
        (sum, p) =>
          sum +
          (p.refunds || []).reduce((s, r) => s + Number(r.amount || 0), 0),
        0,
      ),
    [payments],
  );

  const netPaid = grossPaid - totalRefunded;
  const remaining = Math.max(Number(invoice?.total || 0) - netPaid, 0);
  const overpaid = Math.max(netPaid - Number(invoice?.total || 0), 0);

  const customerId = invoice?.customer_id;
  const appointmentId = invoice?.appointment_id;
  const treatmentPlanId = invoice?.treatment_plan_id;

  const handlePayChange = (e) => {
    const { name, value } = e.target;
    setPayForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const submitPayment = async (e) => {
    e.preventDefault();

    try {
      setPayLoading(true);
      setActionError("");
      setActionSuccess("");

      await api.post(`/erp/invoices/${id}/payments`, {
        amount: Number(payForm.amount),
        method: payForm.method,
      });

      setActionSuccess("Payment recorded successfully.");
      setPayForm({
        amount: "",
        method: "cash",
      });

      await loadInvoice();
    } catch (err) {
      const errors = err?.response?.data?.errors;
      if (errors) {
        const firstError = Object.values(errors)?.[0]?.[0];
        setActionError(firstError || "Failed to record payment.");
      } else {
        setActionError(
          err?.response?.data?.message ||
            err?.response?.data?.msg ||
            "Failed to record payment.",
        );
      }
    } finally {
      setPayLoading(false);
    }
  };

  const setRefundAmount = (paymentId, value) => {
    setRefundForms((prev) => ({
      ...prev,
      [paymentId]: value,
    }));
  };

  const submitRefund = async (paymentId) => {
    try {
      setRefundLoadingId(paymentId);
      setActionError("");
      setActionSuccess("");

      const amount = refundForms[paymentId];
      if (!amount || Number(amount) <= 0) {
        setActionError("Enter a valid refund amount.");
        return;
      }

      await api.post(`/erp/payments/${paymentId}/refund`, {
        amount: Number(amount),
      });

      setActionSuccess("Refund recorded successfully.");
      setRefundForms((prev) => ({
        ...prev,
        [paymentId]: "",
      }));

      await loadInvoice();
    } catch (err) {
      const errors = err?.response?.data?.errors;
      if (errors) {
        const firstError = Object.values(errors)?.[0]?.[0];
        setActionError(firstError || "Failed to record refund.");
      } else {
        setActionError(
          err?.response?.data?.message ||
            err?.response?.data?.msg ||
            "Failed to record refund.",
        );
      }
    } finally {
      setRefundLoadingId(null);
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
        <button className="btn btn-sm btn-outline-danger" onClick={loadInvoice}>
          Retry
        </button>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="alert alert-warning d-flex justify-content-between align-items-center">
        <span>Invoice not found.</span>
        <button
          className="btn btn-sm btn-outline-secondary"
          onClick={() => navigate("/admin/erp/invoices")}
        >
          Back
        </button>
      </div>
    );
  }

  return (
    <div className="container-fluid px-0">
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
        <div>
          <h3 className="fw-bold mb-1">Invoice Details</h3>
          <p className="text-muted mb-0">
            Review invoice, payments, refunds, and accounting impact
          </p>
        </div>

        <div className="d-flex flex-wrap gap-2">
          <Link to="/admin/erp/invoices" className="btn btn-outline-secondary">
            Back to Invoices
          </Link>

          {customerId ? (
            <Link
              to={`/admin/erp/patients/${customerId}/profile`}
              className="btn btn-outline-primary"
            >
              Patient Profile
            </Link>
          ) : null}

          <button className="btn btn-primary" onClick={loadInvoice}>
            Refresh
          </button>
        </div>
      </div>

      {actionError ? (
        <div className="alert alert-danger">{actionError}</div>
      ) : null}
      {actionSuccess ? (
        <div className="alert alert-success">{actionSuccess}</div>
      ) : null}

      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body">
          <div className="row g-3">
            <InfoItem label="Invoice Number" value={invoice.number} />
            <InfoItem
              label="Status"
              value={<StatusBadge status={invoice.status} />}
            />
            <InfoItem label="Customer ID" value={customerId} />
            <InfoItem label="Appointment ID" value={appointmentId} />
            <InfoItem label="Treatment Plan ID" value={treatmentPlanId} />
            <InfoItem
              label="Issued At"
              value={formatDateTime(invoice.issued_at)}
            />
          </div>
        </div>
      </div>

      <div className="row g-3 mb-4">
        <KpiCard
          title="Invoice Total"
          value={money(invoice.total)}
          color="primary"
        />
        <KpiCard title="Gross Paid" value={money(grossPaid)} color="success" />
        <KpiCard title="Refunded" value={money(totalRefunded)} color="danger" />
        <KpiCard title="Net Paid" value={money(netPaid)} color="info" />
        <KpiCard title="Remaining" value={money(remaining)} color="warning" />
        <KpiCard title="Overpaid" value={money(overpaid)} color="secondary" />
      </div>

      <div className="row g-4">
        <div className="col-12">
          <div className="card shadow-sm border-0">
            <div className="card-header bg-white">
              <h5 className="mb-0">Receive Payment</h5>
            </div>
            <div className="card-body">
              <form
                className="row g-3 align-items-end"
                onSubmit={submitPayment}
              >
                <div className="col-12 col-md-4">
                  <label className="form-label fw-semibold">Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    className="form-control"
                    name="amount"
                    value={payForm.amount}
                    onChange={handlePayChange}
                    placeholder="100"
                    required
                  />
                </div>

                <div className="col-12 col-md-4">
                  <label className="form-label fw-semibold">Method</label>
                  <select
                    className="form-select"
                    name="method"
                    value={payForm.method}
                    onChange={handlePayChange}
                  >
                    <option value="cash">cash</option>
                    <option value="card">card</option>
                    <option value="bank">bank</option>
                  </select>
                </div>

                <div className="col-12 col-md-4 d-grid">
                  <button
                    type="submit"
                    className="btn btn-success"
                    disabled={payLoading}
                  >
                    {payLoading ? "Processing..." : "Receive Payment"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        <div className="col-12 col-xl-6">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-header bg-white">
              <h5 className="mb-0">Invoice Items</h5>
            </div>
            <div className="card-body p-0">
              {items.length === 0 ? (
                <div className="p-3 text-muted">No invoice items found.</div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>#</th>
                        <th>Product</th>
                        <th>Qty</th>
                        <th>Unit Price</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, index) => (
                        <tr key={item.id}>
                          <td>{index + 1}</td>
                          <td>
                            {item.product?.title_en ||
                              item.product?.title_ar ||
                              "-"}
                          </td>
                          <td>{item.quantity}</td>
                          <td>{money(item.unit_price)}</td>
                          <td>{money(item.total)}</td>
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
              <h5 className="mb-0">Payments</h5>
            </div>
            <div className="card-body p-0">
              {payments.length === 0 ? (
                <div className="p-3 text-muted">No payments recorded yet.</div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>ID</th>
                        <th>Amount</th>
                        <th>Applied</th>
                        <th>Method</th>
                        <th>Paid At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((payment) => (
                        <tr key={payment.id}>
                          <td>#{payment.id}</td>
                          <td>{money(payment.amount)}</td>
                          <td>{money(payment.applied_amount)}</td>
                          <td className="text-capitalize">
                            {payment.method || "-"}
                          </td>
                          <td>
                            {formatDateTime(
                              payment.paid_at || payment.created_at,
                            )}
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
              <h5 className="mb-0">Refund Payments</h5>
            </div>
            <div className="card-body">
              {payments.length === 0 ? (
                <div className="text-muted">
                  No payments available for refund.
                </div>
              ) : (
                <div className="row g-3">
                  {payments.map((payment) => {
                    const refundedAmount = (payment.refunds || []).reduce(
                      (sum, r) => sum + Number(r.amount || 0),
                      0,
                    );

                    const refundable = Math.max(
                      Number(payment.amount || 0) - refundedAmount,
                      0,
                    );

                    return (
                      <div className="col-12" key={payment.id}>
                        <div className="border rounded p-3 bg-light">
                          <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-3">
                            <div>
                              <div className="fw-bold">
                                Payment #{payment.id}
                              </div>
                              <div className="small text-muted">
                                Method: {payment.method || "-"} | Paid at:{" "}
                                {formatDateTime(
                                  payment.paid_at || payment.created_at,
                                )}
                              </div>
                            </div>

                            <div className="text-end">
                              <div>Amount: {money(payment.amount)}</div>
                              <div>Refunded: {money(refundedAmount)}</div>
                              <div className="fw-semibold">
                                Refundable: {money(refundable)}
                              </div>
                            </div>
                          </div>

                          <div className="row g-2 align-items-end">
                            <div className="col-12 col-md-4">
                              <label className="form-label fw-semibold">
                                Refund Amount
                              </label>
                              <input
                                type="number"
                                step="0.01"
                                min="0.01"
                                max={refundable}
                                className="form-control"
                                value={refundForms[payment.id] || ""}
                                onChange={(e) =>
                                  setRefundAmount(payment.id, e.target.value)
                                }
                                placeholder="50"
                                disabled={refundable <= 0}
                              />
                            </div>

                            <div className="col-12 col-md-3 d-grid">
                              <button
                                className="btn btn-warning"
                                onClick={() => submitRefund(payment.id)}
                                disabled={
                                  refundable <= 0 ||
                                  refundLoadingId === payment.id
                                }
                              >
                                {refundLoadingId === payment.id
                                  ? "Processing..."
                                  : "Refund"}
                              </button>
                            </div>
                          </div>

                          {(payment.refunds || []).length > 0 ? (
                            <div className="mt-3">
                              <div className="fw-semibold mb-2">
                                Previous Refunds
                              </div>
                              <div className="table-responsive">
                                <table className="table table-sm mb-0">
                                  <thead>
                                    <tr>
                                      <th>ID</th>
                                      <th>Amount</th>
                                      <th>Refunded At</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {payment.refunds.map((refund) => (
                                      <tr key={refund.id}>
                                        <td>#{refund.id}</td>
                                        <td>{money(refund.amount)}</td>
                                        <td>
                                          {formatDateTime(
                                            refund.refunded_at ||
                                              refund.created_at,
                                          )}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-12 col-xl-6">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-header bg-white">
              <h5 className="mb-0">All Refunds</h5>
            </div>
            <div className="card-body p-0">
              {refunds.length === 0 ? (
                <div className="p-3 text-muted">No refunds found.</div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>ID</th>
                        <th>Payment ID</th>
                        <th>Amount</th>
                        <th>Refunded At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {refunds.map((refund) => (
                        <tr key={refund.id}>
                          <td>#{refund.id}</td>
                          <td>#{refund.payment_id}</td>
                          <td>{money(refund.amount)}</td>
                          <td>
                            {formatDateTime(
                              refund.refunded_at || refund.created_at,
                            )}
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

        <div className="col-12 col-xl-6">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-header bg-white">
              <h5 className="mb-0">Journal Entries</h5>
            </div>
            <div className="card-body">
              {journalEntries.length === 0 ? (
                <div className="text-muted">No journal entries found.</div>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {journalEntries.map((entry) => (
                    <div key={entry.id} className="border rounded p-3 bg-light">
                      <div className="fw-bold mb-2">Entry #{entry.id}</div>
                      <div className="small text-muted mb-2">
                        {entry.description || "-"}
                      </div>

                      <div className="table-responsive">
                        <table className="table table-sm mb-0">
                          <thead>
                            <tr>
                              <th>Account</th>
                              <th>Debit</th>
                              <th>Credit</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(entry.lines || []).map((line) => (
                              <tr key={line.id}>
                                <td>{line.account?.name || line.account_id}</td>
                                <td>{money(line.debit)}</td>
                                <td>{money(line.credit)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ title, value, color = "primary" }) {
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

function InfoItem({ label, value }) {
  return (
    <div className="col-12 col-md-4">
      <div className="small text-muted">{label}</div>
      <div className="fw-semibold">{value || "-"}</div>
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

import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../../../services/axios";
import { useTranslation } from "react-i18next";
import "./InvoiceDetails.css";

export default function InvoiceDetails() {
  const { t, i18n } = useTranslation();
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

  const formatCurrency = (value) => {
    const lang = i18n.language === "ar" ? "ar-EG" : "en-US";
    return new Intl.NumberFormat(lang, {
      style: "currency",
      currency: "EGP",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(value || 0));
  };

  const formatDateTime = (value) => {
    if (!value) return "-";
    try {
      const lang = i18n.language === "ar" ? "ar-EG" : "en-US";
      return new Date(value).toLocaleString(lang, {
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

  const loadInvoice = async () => {
    try {
      setLoading(true);
      setError("");
      setActionError("");
      setActionSuccess("");

      const res = await api.get(`/erp/invoices/${id}/full`);
      const payload = res.data || {};

      const invoiceData =
        payload.data?.invoice || payload.invoice || payload.data || payload;

      setInvoice(
        invoiceData && (invoiceData.id || invoiceData.number)
          ? invoiceData
          : null,
      );
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.msg ||
          t("Failed to load invoice."),
      );
    } finally {
      setLoading(false);
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

  const directPaid = Number(invoice?.total_paid || 0);
  const totalRefunded = Number(invoice?.total_refunded || 0);
  const totalCreditApplied = Number(invoice?.total_credit_applied || 0);
  const netPaid = Number(invoice?.net_paid || 0);
  const remaining = Number(invoice?.remaining || 0);
  const overpaid = Number(invoice?.net_credit || 0);
  const customerCreditBalance = Number(invoice?.customer_credit_balance || 0);
  const customerCreditIssuedTotal = Number(
    invoice?.customer_credit_issued_total || 0,
  );
  const customerCreditUsedTotal = Number(
    invoice?.customer_credit_used_total || 0,
  );
  const cashReceived = Number(invoice?.cash_received || 0);

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
        allow_overpayment: true,
      });

      setActionSuccess(t("Payment recorded successfully."));
      setPayForm({
        amount: "",
        method: "cash",
      });

      await loadInvoice();
    } catch (err) {
      const errors = err?.response?.data?.errors;
      if (errors) {
        const firstError = Object.values(errors)?.[0]?.[0];
        setActionError(firstError || t("Failed to record payment."));
      } else {
        setActionError(
          err?.response?.data?.message ||
            err?.response?.data?.msg ||
            t("Failed to record payment."),
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
        setActionError(t("Enter a valid refund amount."));
        return;
      }

      await api.post(`/erp/payments/${paymentId}/refund`, {
        amount: Number(amount),
      });

      setActionSuccess(t("Refund recorded successfully."));
      setRefundForms((prev) => ({
        ...prev,
        [paymentId]: "",
      }));

      await loadInvoice();
    } catch (err) {
      const errors = err?.response?.data?.errors;
      if (errors) {
        const firstError = Object.values(errors)?.[0]?.[0];
        setActionError(firstError || t("Failed to record refund."));
      } else {
        setActionError(
          err?.response?.data?.message ||
            err?.response?.data?.msg ||
            t("Failed to record refund."),
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
          <span className="visually-hidden">{t("Loading...")}</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger d-flex justify-content-between align-items-center">
        <span>{error}</span>
        <button className="btn btn-sm btn-outline-danger" onClick={loadInvoice}>
          {t("Retry")}
        </button>
        <Link
          to={`/admin/erp/invoices/${invoice.id}/print`}
          className="btn btn-outline-secondary"
          target="_blank"
          rel="noopener noreferrer"
        >
          <i className="fas fa-print me-2"></i>
          {t("Print")}
        </Link>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="alert alert-warning d-flex justify-content-between align-items-center">
        <span>{t("Invoice not found.")}</span>
        <button
          className="btn btn-sm btn-outline-secondary"
          onClick={() => navigate("/admin/erp/invoices")}
        >
          {t("Back")}
        </button>
      </div>
    );
  }

  return (
    <div className="invoice-details-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-text">
          <h1 className="page-title">{t("Invoice Details")}</h1>
          <p className="page-subtitle">
            {t("Review invoice, payments, refunds, and accounting impact")}
          </p>
        </div>

        <div className="header-actions">
          <Link to="/admin/erp/invoices" className="btn btn-outline-secondary">
            <i className="fas fa-arrow-left me-2"></i>
            {t("Back to Invoices")}
          </Link>

          {customerId && (
            <Link
              to={`/admin/erp/patients/${customerId}/profile`}
              className="btn btn-outline-primary"
            >
              <i className="fas fa-user me-2"></i>
              {t("Patient Profile")}
            </Link>
          )}

          <button className="btn btn-primary" onClick={loadInvoice}>
            <i className="fas fa-sync-alt me-2"></i>
            {t("Refresh")}
          </button>
        </div>
      </div>

      {/* Action Alerts */}
      {actionError && (
        <div className="alert alert-danger alert-dismissible fade show">
          <i className="fas fa-exclamation-circle me-2"></i>
          {actionError}
          <button
            type="button"
            className="btn-close"
            onClick={() => setActionError("")}
          ></button>
        </div>
      )}
      {actionSuccess && (
        <div className="alert alert-success alert-dismissible fade show">
          <i className="fas fa-check-circle me-2"></i>
          {actionSuccess}
          <button
            type="button"
            className="btn-close"
            onClick={() => setActionSuccess("")}
          ></button>
        </div>
      )}

      {/* Invoice Info Card */}
      <div className="info-card">
        <div className="info-card-header">
          <i className="fas fa-file-invoice me-2"></i>
          <h5 className="mb-0">{t("Invoice Information")}</h5>
        </div>
        <div className="info-card-body">
          <div className="info-grid">
            <InfoItem label={t("Invoice Number")} value={invoice.number} />
            <InfoItem
              label={t("Status")}
              value={<StatusBadge status={invoice.status} t={t} />}
            />
            <InfoItem label={t("Customer ID")} value={customerId} />
            <InfoItem label={t("Appointment ID")} value={appointmentId} />
            <InfoItem label={t("Treatment Plan ID")} value={treatmentPlanId} />
            <InfoItem
              label={t("Issued At")}
              value={formatDateTime(invoice.issued_at)}
            />
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="kpi-grid">
        <KpiCard
          title={t("Invoice Total")}
          value={formatCurrency(invoice.total)}
          color="primary"
        />
        <KpiCard
          title={t("Direct Paid")}
          value={formatCurrency(directPaid)}
          color="success"
        />
        <KpiCard
          title={t("Credit Applied")}
          value={formatCurrency(totalCreditApplied)}
          color="secondary"
        />
        <KpiCard
          title={t("Refunded")}
          value={formatCurrency(totalRefunded)}
          color="danger"
        />
        <KpiCard
          title={t("Net Paid")}
          value={formatCurrency(netPaid)}
          color="info"
        />
        <KpiCard
          title={t("Remaining")}
          value={formatCurrency(remaining)}
          color="warning"
        />
        <KpiCard
          title={t("Invoice Credit")}
          value={formatCurrency(overpaid)}
          color="dark"
        />
        <KpiCard
          title={t("Customer Credit Balance")}
          value={formatCurrency(customerCreditBalance)}
          color="primary"
        />
        <KpiCard
          title={t("Cash Received")}
          value={formatCurrency(cashReceived)}
          color="success"
        />
      </div>

      <div className="two-columns">
        {/* Payment Form */}
        <div className="payment-card">
          <div className="card-header-custom">
            <i className="fas fa-money-bill-wave me-2"></i>
            <h5 className="mb-0">{t("Receive Payment")}</h5>
          </div>
          <div className="card-body-custom">
            <form onSubmit={submitPayment}>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">{t("Amount")} *</label>
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

                <div className="form-group">
                  <label className="form-label">{t("Method")}</label>
                  <select
                    className="form-select"
                    name="method"
                    value={payForm.method}
                    onChange={handlePayChange}
                  >
                    <option value="cash">{t("cash")}</option>
                    <option value="card">{t("card")}</option>
                    <option value="bank">{t("bank")}</option>
                  </select>
                </div>

                <div className="form-actions">
                  <button
                    type="submit"
                    className="btn btn-success"
                    disabled={payLoading}
                  >
                    {payLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        {t("Processing...")}
                      </>
                    ) : (
                      <>
                        <i className="fas fa-check-circle me-2"></i>
                        {t("Receive Payment")}
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="info-note">
                <i className="fas fa-info-circle me-2"></i>
                {t(
                  "Any available customer credit is applied automatically when the invoice is created. Any extra payment above remaining becomes new customer credit.",
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Invoice Items */}
        <div className="items-card">
          <div className="card-header-custom">
            <i className="fas fa-list me-2"></i>
            <h5 className="mb-0">{t("Invoice Items")}</h5>
          </div>
          <div className="card-body-custom">
            {items.length === 0 ? (
              <div className="empty-state small">
                <p className="empty-text">{t("No invoice items found.")}</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="items-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>{t("Product")}</th>
                      <th>{t("Qty")}</th>
                      <th>{t("Unit Price")}</th>
                      <th>{t("Total")}</th>
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
                        <td>{formatCurrency(item.unit_price)}</td>
                        <td>{formatCurrency(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="payments-card">
        <div className="card-header-custom">
          <i className="fas fa-credit-card me-2"></i>
          <h5 className="mb-0">{t("Payments")}</h5>
        </div>
        <div className="card-body-custom">
          {payments.length === 0 ? (
            <div className="empty-state small">
              <p className="empty-text">{t("No payments recorded yet.")}</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="payments-table">
                <thead>
                  <tr>
                    <th>{t("ID")}</th>
                    <th>{t("Amount")}</th>
                    <th>{t("Applied")}</th>
                    <th>{t("Credit")}</th>
                    <th>{t("Method")}</th>
                    <th>{t("Paid At")}</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment.id}>
                      <td>#{payment.id}</td>
                      <td>{formatCurrency(payment.amount)}</td>
                      <td>{formatCurrency(payment.applied_amount)}</td>
                      <td>{formatCurrency(payment.credit_amount)}</td>
                      <td className="text-capitalize">
                        {t(payment.method) || "-"}
                      </td>
                      <td>
                        {formatDateTime(payment.paid_at || payment.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Refunds Section */}
      <div className="refunds-card">
        <div className="card-header-custom">
          <i className="fas fa-undo-alt me-2"></i>
          <h5 className="mb-0">{t("Refund Payments")}</h5>
        </div>
        <div className="card-body-custom">
          {payments.length === 0 ? (
            <div className="empty-state small">
              <p className="empty-text">
                {t("No payments available for refund.")}
              </p>
            </div>
          ) : (
            <div className="refunds-list">
              {payments.map((payment) => {
                const refundableInvoice = Number(
                  payment.available_invoice_refund || 0,
                );
                const refundableCredit = Number(
                  payment.available_credit_refund || 0,
                );
                const refundable = refundableInvoice + refundableCredit;

                return (
                  <div key={payment.id} className="refund-item">
                    <div className="refund-item-header">
                      <div>
                        <div className="fw-bold">
                          {t("Payment")} #{payment.id}
                        </div>
                        <div className="small text-muted">
                          {t("Method")}: {t(payment.method) || "-"} |{" "}
                          {t("Paid at")}:{" "}
                          {formatDateTime(
                            payment.paid_at || payment.created_at,
                          )}
                        </div>
                      </div>
                      <div className="refund-amounts">
                        <div>
                          {t("Amount")}: {formatCurrency(payment.amount)}
                        </div>
                        <div>
                          {t("Invoice Refundable")}:{" "}
                          {formatCurrency(refundableInvoice)}
                        </div>
                        <div>
                          {t("Credit Refundable")}:{" "}
                          {formatCurrency(refundableCredit)}
                        </div>
                        <div className="fw-semibold">
                          {t("Total Refundable")}: {formatCurrency(refundable)}
                        </div>
                      </div>
                    </div>

                    <div className="refund-form">
                      <div className="refund-field">
                        <label>{t("Refund Amount")}</label>
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
                      <button
                        className="btn btn-warning"
                        onClick={() => submitRefund(payment.id)}
                        disabled={
                          refundable <= 0 || refundLoadingId === payment.id
                        }
                      >
                        {refundLoadingId === payment.id ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2"></span>
                            {t("Processing...")}
                          </>
                        ) : (
                          <>
                            <i className="fas fa-undo-alt me-2"></i>
                            {t("Refund")}
                          </>
                        )}
                      </button>
                    </div>

                    {(payment.refunds || []).length > 0 && (
                      <div className="previous-refunds">
                        <div className="fw-semibold mb-2">
                          {t("Previous Refunds")}
                        </div>
                        <div className="table-responsive">
                          <table className="refunds-table-mini">
                            <thead>
                              <tr>
                                <th>{t("ID")}</th>
                                <th>{t("Amount")}</th>
                                <th>{t("Type")}</th>
                                <th>{t("Refunded At")}</th>
                              </tr>
                            </thead>
                            <tbody>
                              {payment.refunds.map((refund) => (
                                <tr key={refund.id}>
                                  <td>#{refund.id}</td>
                                  <td>{formatCurrency(refund.amount)}</td>
                                  <td>{refund.applies_to || "-"}</td>
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
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* All Refunds & Customer Credit */}
      <div className="two-columns">
        <div className="all-refunds-card">
          <div className="card-header-custom">
            <i className="fas fa-list-alt me-2"></i>
            <h5 className="mb-0">{t("All Refunds")}</h5>
          </div>
          <div className="card-body-custom">
            {refunds.length === 0 ? (
              <div className="empty-state small">
                <p className="empty-text">{t("No refunds found.")}</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="refunds-table">
                  <thead>
                    <tr>
                      <th>{t("ID")}</th>
                      <th>{t("Payment ID")}</th>
                      <th>{t("Amount")}</th>
                      <th>{t("Type")}</th>
                      <th>{t("Refunded At")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {refunds.map((refund) => (
                      <tr key={refund.id}>
                        <td>#{refund.id}</td>
                        <td>#{refund.payment_id}</td>
                        <td>{formatCurrency(refund.amount)}</td>
                        <td>{refund.applies_to || "-"}</td>
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

        <div className="credit-summary-card">
          <div className="card-header-custom">
            <i className="fas fa-wallet me-2"></i>
            <h5 className="mb-0">{t("Customer Credit Summary")}</h5>
          </div>
          <div className="card-body-custom">
            <div className="credit-grid">
              <InfoItem
                label={t("Credit Issued Total")}
                value={formatCurrency(customerCreditIssuedTotal)}
              />
              <InfoItem
                label={t("Credit Used Total")}
                value={formatCurrency(customerCreditUsedTotal)}
              />
              <InfoItem
                label={t("Current Credit Balance")}
                value={formatCurrency(customerCreditBalance)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Journal Entries */}
      <div className="journal-card">
        <div className="card-header-custom">
          <i className="fas fa-book me-2"></i>
          <h5 className="mb-0">{t("Journal Entries")}</h5>
        </div>
        <div className="card-body-custom">
          {journalEntries.length === 0 ? (
            <div className="empty-state small">
              <p className="empty-text">{t("No journal entries found.")}</p>
            </div>
          ) : (
            <div className="journal-list">
              {journalEntries.map((entry) => (
                <div key={entry.id} className="journal-item">
                  <div className="journal-header">
                    <div className="fw-bold">
                      {t("Entry")} #{entry.id}
                    </div>
                    <div className="small text-muted">
                      {entry.description || "-"}
                    </div>
                  </div>
                  <div className="table-responsive">
                    <table className="journal-table">
                      <thead>
                        <tr>
                          <th>{t("Account")}</th>
                          <th>{t("Debit")}</th>
                          <th>{t("Credit")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(entry.lines || []).map((line) => (
                          <tr key={line.id}>
                            <td>{line.account?.name || line.account_id}</td>
                            <td>{formatCurrency(line.debit)}</td>
                            <td>{formatCurrency(line.credit)}</td>
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
  );
}

// Helper Components
function KpiCard({ title, value, color = "primary" }) {
  const colorMap = {
    primary: { bg: "rgba(26, 35, 126, 0.1)", text: "#1a237e" },
    success: { bg: "rgba(76, 175, 80, 0.1)", text: "#4caf50" },
    danger: { bg: "rgba(244, 67, 54, 0.1)", text: "#f44336" },
    warning: { bg: "rgba(255, 152, 0, 0.1)", text: "#ff9800" },
    info: { bg: "rgba(3, 169, 244, 0.1)", text: "#03a9f4" },
    secondary: { bg: "rgba(108, 117, 125, 0.1)", text: "#6c757d" },
    dark: { bg: "rgba(33, 37, 41, 0.1)", text: "#212529" },
  };
  const colors = colorMap[color] || colorMap.primary;

  return (
    <div className="kpi-card">
      <div className="kpi-card-content">
        <div className="kpi-title">{title}</div>
        <div className="kpi-value" style={{ color: colors.text }}>
          {value}
        </div>
      </div>
    </div>
  );
}

function InfoItem({ label, value }) {
  return (
    <div className="info-item">
      <div className="info-label">{label}</div>
      <div className="info-value">{value ?? "-"}</div>
    </div>
  );
}

function StatusBadge({ status, t }) {
  const value = String(status || "").toLowerCase();
  let variant = "secondary";
  let label = status || "-";

  if (value === "paid") {
    variant = "success";
    label = t("Paid");
  } else if (value === "unpaid" || value === "cancelled") {
    variant = "danger";
    label = t(value === "cancelled" ? "Cancelled" : "Unpaid");
  } else if (value === "partially_paid") {
    variant = "warning";
    label = t("Partially Paid");
  }

  return <span className={`status-badge status-${variant}`}>{label}</span>;
}

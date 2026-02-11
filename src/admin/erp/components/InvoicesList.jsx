import React, { useEffect, useState } from "react";
import api from "../../../services/axios";
import { notifyError, notifySuccess } from "../../../utils/notify";
import { useNavigate } from "react-router-dom";
import "./InvoicesList.css";
import { useLocation } from "react-router-dom";

const InvoicesList = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payAmounts, setPayAmounts] = useState({});
  const [payMethods, setPayMethods] = useState({});
  const [refundAmounts, setRefundAmounts] = useState({});
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [expandedPayments, setExpandedPayments] = useState({});

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fetchInvoices = () => {
    setLoading(true);
    api
      .get("/erp/invoices")
      .then((res) => setInvoices(res.data))
      .catch((err) => {
        console.error(err);
        notifyError("Failed to fetch invoices");
      })
      .finally(() => setLoading(false));
  };
  const location = useLocation();

  useEffect(() => fetchInvoices(), [location.key]);

  const handlePay = async (invoiceId) => {
    const amount = payAmounts[invoiceId];
    if (!amount || Number(amount) <= 0) {
      notifyError("Enter valid payment amount");
      return;
    }
    try {
      const res = await api.post(`/erp/invoices/${invoiceId}/payments`, {
        amount: amount,
        method: payMethods[invoiceId] || "cash",
      });
      notifySuccess(res.data.msg);
      setPayAmounts((prev) => ({ ...prev, [invoiceId]: "" }));
      fetchInvoices();
    } catch (err) {
      console.error(err);
      notifyError(err.response?.data?.msg || "Payment failed");
    }
  };

  const handleRefund = async (paymentId) => {
    const amount = refundAmounts[paymentId];
    if (!amount || Number(amount) <= 0) {
      notifyError("Enter valid refund amount");
      return;
    }
    try {
      const res = await api.post(`/erp/payments/${paymentId}/refund`, {
        amount: amount,
      });
      notifySuccess(res.data.msg);
      setRefundAmounts((prev) => ({ ...prev, [paymentId]: "" }));
      fetchInvoices();
    } catch (err) {
      console.error(err);
      notifyError(err.response?.data?.msg || "Refund failed");
    }
  };

  const togglePaymentView = (invoiceId) => {
    setExpandedPayments((prev) => ({
      ...prev,
      [invoiceId]: !prev[invoiceId],
    }));
  };

  if (loading)
    return (
      <div className="loading-container">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2">Loading invoices...</p>
      </div>
    );

  return (
    <div className="invoices-container">
      <div className="invoices-header">
        <h2>Invoices Management</h2>
        <button
          className="btn btn-primary"
          onClick={() => navigate("/admin/erp/invoices/create")}
        >
          <i className="fas fa-plus"></i>
          {!isMobile && " New Invoice"}
        </button>
      </div>

      {invoices.length === 0 ? (
        <div className="no-data">
          <i className="fas fa-file-invoice-dollar"></i>
          <p>No invoices found</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="invoices-table">
            <thead>
              <tr>
                {!isMobile && (
                  <>
                    <th>ID</th>
                    <th>Customer</th>
                    <th>Total</th>
                    <th>Paid</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </>
                )}
                {isMobile && <th>Invoice Details</th>}
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <React.Fragment key={inv.id}>
                  <tr className="invoice-row">
                    {!isMobile ? (
                      <>
                        <td>
                          <button
                            className="btn-invoice-id"
                            onClick={() =>
                              navigate(`/admin/erp/invoices/${inv.id}`)
                            }
                            title="View details"
                          >
                            #{inv.id}
                          </button>
                        </td>
                        <td>{inv.customer?.name || "N/A"}</td>
                        <td>${parseFloat(inv.total).toFixed(2)}</td>
                        <td>${parseFloat(inv.total_paid).toFixed(2)}</td>
                        <td>
                          <span className={`status-badge status-${inv.status}`}>
                            {inv.status}
                          </span>
                        </td>
                        <td>
                          <div className="invoice-actions">
                            <button
                              className="btn btn-sm btn-outline-primary"
                              onClick={() =>
                                navigate(`/admin/erp/invoices/${inv.id}`)
                              }
                              title="View"
                            >
                              <i className="fas fa-eye"></i>
                            </button>
                            <button
                              className="btn btn-sm btn-outline-warning"
                              onClick={() =>
                                navigate(`/admin/erp/invoices/${inv.id}/edit`)
                              }
                              title="Edit"
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <td>
                        <div className="mobile-invoice-card">
                          <div className="mobile-invoice-header">
                            <div>
                              <strong>Invoice #{inv.id}</strong>
                              <div className="mobile-customer">
                                {inv.customer?.name}
                              </div>
                            </div>
                            <span
                              className={`status-badge status-${inv.status}`}
                            >
                              {inv.status}
                            </span>
                          </div>

                          <div className="mobile-invoice-details">
                            <div className="detail-row">
                              <span>Total:</span>
                              <span>${parseFloat(inv.total).toFixed(2)}</span>
                            </div>
                            <div className="detail-row">
                              <span>Paid:</span>
                              <span>
                                ${parseFloat(inv.total_paid).toFixed(2)}
                              </span>
                            </div>
                            <div className="detail-row">
                              <span>Remaining:</span>
                              <span className="remaining-amount">
                                ${parseFloat(inv.remaining).toFixed(2)}
                              </span>
                            </div>
                          </div>

                          <div className="mobile-invoice-actions">
                            <button
                              className="btn btn-sm btn-outline-primary"
                              onClick={() =>
                                navigate(`/admin/erp/invoices/${inv.id}`)
                              }
                            >
                              <i className="fas fa-eye"></i>
                            </button>
                            <button
                              className="btn btn-sm btn-outline-warning"
                              onClick={() =>
                                navigate(`/admin/erp/invoices/${inv.id}/edit`)
                              }
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                            <button
                              className="btn btn-sm btn-outline-info"
                              onClick={() => togglePaymentView(inv.id)}
                            >
                              <i
                                className={`fas fa-chevron-${expandedPayments[inv.id] ? "up" : "down"}`}
                              ></i>
                            </button>
                          </div>
                        </div>
                      </td>
                    )}
                  </tr>

                  {/* Payment and Refund Section */}
                  {(!isMobile || expandedPayments[inv.id]) && (
                    <tr className="payment-section-row">
                      <td colSpan={isMobile ? 1 : 6}>
                        <div className="payment-section">
                          <div className="payment-section-header">
                            <h5>Payment & Refund Management</h5>
                            <div className="remaining-badge">
                              Remaining:{" "}
                              <strong>
                                ${parseFloat(inv.remaining).toFixed(2)}
                              </strong>
                            </div>
                          </div>

                          <div className="payment-controls">
                            <div className="payment-input-group">
                              <div className="input-label">Pay Invoice</div>
                              <div className="input-row">
                                <input
                                  type="number"
                                  className="form-control"
                                  placeholder="Amount"
                                  value={payAmounts[inv.id] || ""}
                                  onChange={(e) =>
                                    setPayAmounts({
                                      ...payAmounts,
                                      [inv.id]: e.target.value,
                                    })
                                  }
                                  min="0"
                                  step="0.01"
                                />
                                <select
                                  className="form-select"
                                  value={payMethods[inv.id] || "cash"}
                                  onChange={(e) =>
                                    setPayMethods({
                                      ...payMethods,
                                      [inv.id]: e.target.value,
                                    })
                                  }
                                >
                                  <option value="cash">Cash</option>
                                  <option value="card">Card</option>
                                  <option value="bank">Bank</option>
                                </select>
                                <button
                                  className="btn btn-success"
                                  disabled={inv.remaining <= 0}
                                  onClick={() => handlePay(inv.id)}
                                >
                                  <i className="fas fa-money-check-alt"></i>
                                  Pay
                                </button>
                              </div>
                            </div>

                            {inv.payments && inv.payments.length > 0 && (
                              <div className="payments-list">
                                <div className="payments-label">
                                  Existing Payments:
                                </div>
                                {inv.payments.map((p) => {
                                  const refundable =
                                    Number(p.amount) -
                                    Number(p.refunded_amount || 0);

                                  return (
                                    <div key={p.id} className="payment-item">
                                      <div className="payment-info">
                                        <div>
                                          <strong>Payment #{p.id}</strong>
                                          <span className="payment-method">
                                            ({p.method})
                                          </span>
                                        </div>
                                        <div className="payment-amounts">
                                          <span>
                                            Amount: $
                                            {parseFloat(p.amount).toFixed(2)}
                                          </span>
                                          <span>
                                            Refunded: $
                                            {parseFloat(
                                              p.refunded_amount || 0,
                                            ).toFixed(2)}
                                          </span>
                                          <span>
                                            Refundable: $
                                            {parseFloat(refundable).toFixed(2)}
                                          </span>
                                        </div>
                                      </div>

                                      {refundable > 0 && (
                                        <div className="refund-controls">
                                          <input
                                            type="number"
                                            className="form-control"
                                            placeholder="Refund amount"
                                            value={refundAmounts[p.id] || ""}
                                            onChange={(e) =>
                                              setRefundAmounts({
                                                ...refundAmounts,
                                                [p.id]: e.target.value,
                                              })
                                            }
                                            min="0"
                                            max={refundable}
                                            step="0.01"
                                          />
                                          <button
                                            className="btn btn-warning"
                                            onClick={() => handleRefund(p.id)}
                                          >
                                            <i className="fas fa-undo"></i>
                                            Refund
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default InvoicesList;

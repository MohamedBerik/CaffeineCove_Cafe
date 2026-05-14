import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../../services/axios";
import { notifyError, notifySuccess } from "../../../utils/notify";
import { useTranslation } from "react-i18next";
import "./PurchaseOrderDetails.css";

const PurchaseOrderDetails = () => {
  const { t, i18n } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();

  const [po, setPo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("items");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("cash");
  const [payLoading, setPayLoading] = useState(false);
  const [receiveLoading, setReceiveLoading] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const formatCurrency = (value) => {
    const lang = i18n.language === "ar" ? "ar-EG" : "en-US";
    return new Intl.NumberFormat(lang, {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(value || 0));
  };

  const formatDate = (value) => {
    if (!value) return "-";
    try {
      const lang = i18n.language === "ar" ? "ar-EG" : "en-US";
      return new Date(value).toLocaleDateString(lang, {
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

  const fetchPO = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/erp/purchase-orders/${id}`);
      setPo(res.data);
    } catch (e) {
      console.error(e);
      notifyError(t("Failed to load purchase order"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPO();
  }, [id]);

  const handleReceive = async () => {
    if (!window.confirm(t("Receive this purchase order and add stock?")))
      return;

    try {
      setReceiveLoading(true);
      const res = await api.post(`/erp/purchase-orders/${id}/receive`);
      notifySuccess(res.data.msg || t("Received successfully"));
      fetchPO();
    } catch (e) {
      console.error(e);
      notifyError(e.response?.data?.msg || t("Receive failed"));
    } finally {
      setReceiveLoading(false);
    }
  };

  const handlePay = async () => {
    if (!payAmount || Number(payAmount) <= 0) {
      notifyError(t("Enter valid amount"));
      return;
    }

    try {
      setPayLoading(true);
      const res = await api.post(`/erp/purchase-orders/${id}/pay`, {
        amount: payAmount,
        method: payMethod,
      });
      notifySuccess(res.data.msg || t("Payment recorded"));
      setPayAmount("");
      fetchPO();
    } catch (e) {
      console.error(e);
      notifyError(e.response?.data?.msg || t("Payment failed"));
    } finally {
      setPayLoading(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "status-pending";
      case "confirmed":
        return "status-confirmed";
      case "cancelled":
        return "status-cancelled";
      case "delivered":
        return "status-delivered";
      default:
        return "status-default";
    }
  };

  const getStatusLabel = (status) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return t("Pending");
      case "confirmed":
        return t("Confirmed");
      case "cancelled":
        return t("Cancelled");
      case "delivered":
        return t("Delivered");
      default:
        return status || "-";
    }
  };

  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "400px" }}
      >
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">{t("Loading...")}</span>
        </div>
      </div>
    );
  }

  if (!po) {
    return (
      <div className="text-center py-5">
        <i className="fas fa-exclamation-circle fa-3x text-muted mb-3"></i>
        <h4>{t("Purchase order not found")}</h4>
        <button className="btn btn-primary mt-3" onClick={() => navigate(-1)}>
          <i className="fas fa-arrow-left me-2"></i>
          {t("Go Back")}
        </button>
      </div>
    );
  }

  const renderMobileView = () => (
    <div className="po-details-mobile">
      <div className="mobile-header">
        <button className="btn-back" onClick={() => navigate(-1)}>
          <i className="fas fa-arrow-left"></i>
        </button>
        <div className="header-title">
          <h4>
            {t("PO")} #{po.number}
          </h4>
          <span className={`status-badge ${getStatusBadgeClass(po.status)}`}>
            {getStatusLabel(po.status)}
          </span>
        </div>
      </div>

      <div className="supplier-card">
        <div className="supplier-avatar">
          <i className="fas fa-truck"></i>
        </div>
        <div>
          <div className="supplier-label">{t("Supplier")}</div>
          <div className="supplier-name">{po.supplier?.name || t("N/A")}</div>
        </div>
      </div>

      <div className="summary-cards">
        <div className="summary-card">
          <div className="summary-label">{t("Total")}</div>
          <div className="summary-value total">{formatCurrency(po.total)}</div>
        </div>
        <div className="summary-card">
          <div className="summary-label">{t("Paid")}</div>
          <div className="summary-value paid">
            {formatCurrency(po.total_paid)}
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-label">{t("Remaining")}</div>
          <div className="summary-value remaining">
            {formatCurrency(po.remaining)}
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-label">{t("Received")}</div>
          <div
            className={`summary-value ${po.is_received ? "received-yes" : "received-no"}`}
          >
            {po.is_received ? t("Yes") : t("No")}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="action-cards">
        {!po.is_received && (
          <button
            className="action-card receive"
            disabled={receiveLoading}
            onClick={handleReceive}
          >
            <i className="fas fa-archive"></i>
            <div>
              <h6>{t("Receive Items")}</h6>
              <p>{t("Add to stock")}</p>
            </div>
            {receiveLoading && (
              <span className="spinner-border spinner-border-sm ms-auto"></span>
            )}
          </button>
        )}

        {Number(po.remaining) > 0 && (
          <div className="payment-card">
            <div className="payment-header">
              <i className="fas fa-credit-card"></i>
              <h6>{t("Make Payment")}</h6>
            </div>
            <input
              type="number"
              className="form-control mb-2"
              placeholder={t("Amount")}
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
              min="0"
              step="0.01"
            />
            <select
              className="form-select mb-2"
              value={payMethod}
              onChange={(e) => setPayMethod(e.target.value)}
            >
              <option value="cash">{t("Cash")}</option>
              <option value="bank">{t("Bank")}</option>
              <option value="card">{t("Card")}</option>
            </select>
            <button
              className="btn-pay"
              disabled={payLoading}
              onClick={handlePay}
            >
              {payLoading ? t("Processing...") : t("Pay Now")}
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="mobile-tabs">
        {["items", "payments"].map((tab) => (
          <button
            key={tab}
            className={`tab-btn ${activeTab === tab ? "active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === "items" ? t("Items") : t("Payments")}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === "items" && (
          <div className="items-section">
            {po.items.map((item, i) => (
              <div key={item.id} className="item-card">
                <div className="item-header">
                  <span className="item-number">#{i + 1}</span>
                  <span className="item-product">
                    {item.supply?.name || t("N/A")}
                  </span>
                </div>
                <div className="item-details">
                  <div className="detail-row">
                    <span>{t("Quantity")}:</span>
                    <span>{item.quantity}</span>
                  </div>
                  <div className="detail-row">
                    <span>{t("Unit Cost")}:</span>
                    <span>{formatCurrency(item.unit_cost)}</span>
                  </div>
                  <div className="detail-row total-row">
                    <span>{t("Line Total")}:</span>
                    <span className="item-total">
                      {formatCurrency(item.total)}
                    </span>
                  </div>
                </div>
                <div className="item-actions">
                  <button
                    className="btn-action returns"
                    onClick={() =>
                      navigate(`/admin/erp/purchase-orders/${po.id}/returns`)
                    }
                  >
                    <i className="fas fa-undo-alt me-1"></i>
                    {t("Returns")}
                  </button>
                  <button
                    className="btn-action log"
                    onClick={() =>
                      navigate(
                        `/admin/erp/purchase-orders/${po.id}/returns-history`,
                      )
                    }
                  >
                    <i className="fas fa-history me-1"></i>
                    {t("Log")}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "payments" && (
          <div className="payments-section">
            {po.payments && po.payments.length > 0 ? (
              po.payments.map((p) => (
                <div key={p.id} className="payment-item">
                  <div className="payment-info">
                    <div className="payment-id">
                      {t("Payment")} #{p.id}
                    </div>
                    <div className="payment-method">{t(p.method)}</div>
                  </div>
                  <div className="payment-details">
                    <div className="payment-amount">
                      {formatCurrency(p.amount)}
                    </div>
                    <div className="payment-date">{formatDate(p.paid_at)}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-payments">
                <i className="fas fa-credit-card"></i>
                <p>{t("No payments yet")}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const renderDesktopView = () => (
    <div className="po-details-desktop">
      <div className="page-header">
        <div className="header-left">
          <button className="btn-back" onClick={() => navigate(-1)}>
            <i className="fas fa-arrow-left me-2"></i>
            {t("Back")}
          </button>
          <div className="header-info">
            <h2>
              {t("Purchase Order")} #{po.number}
            </h2>
            <div className="meta-info">
              <span
                className={`status-badge ${getStatusBadgeClass(po.status)}`}
              >
                {getStatusLabel(po.status)}
              </span>
              <span className="supplier-badge">
                <i className="fas fa-truck me-1"></i>
                {po.supplier?.name || t("N/A")}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="summary-grid">
        <div className="summary-card">
          <div className="card-icon bg-primary">
            <i className="fas fa-dollar-sign"></i>
          </div>
          <div>
            <div className="card-label">{t("Total Amount")}</div>
            <div className="card-value total">{formatCurrency(po.total)}</div>
          </div>
        </div>
        <div className="summary-card">
          <div className="card-icon bg-success">
            <i className="fas fa-check-circle"></i>
          </div>
          <div>
            <div className="card-label">{t("Paid")}</div>
            <div className="card-value paid">
              {formatCurrency(po.total_paid)}
            </div>
          </div>
        </div>
        <div className="summary-card">
          <div className="card-icon bg-warning">
            <i className="fas fa-clock"></i>
          </div>
          <div>
            <div className="card-label">{t("Remaining")}</div>
            <div className="card-value remaining">
              {formatCurrency(po.remaining)}
            </div>
          </div>
        </div>
        <div className="summary-card">
          <div className="card-icon bg-info">
            <i className="fas fa-archive"></i>
          </div>
          <div>
            <div className="card-label">{t("Received")}</div>
            <div
              className={`card-value ${po.is_received ? "text-success" : "text-warning"}`}
            >
              {po.is_received ? t("Yes") : t("No")}
            </div>
          </div>
        </div>
      </div>

      {/* Action Panels */}
      <div className="action-panels">
        {!po.is_received && (
          <div className="action-panel">
            <h5>
              <i className="fas fa-archive me-2"></i>
              {t("Receive Items")}
            </h5>
            <p className="text-muted small mb-3">
              {t("Receive this order and add items to stock")}
            </p>
            <button
              className="btn btn-success"
              disabled={receiveLoading}
              onClick={handleReceive}
            >
              {receiveLoading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  {t("Processing...")}
                </>
              ) : (
                <>
                  <i className="fas fa-check me-2"></i>
                  {t("Receive Items")}
                </>
              )}
            </button>
          </div>
        )}

        {Number(po.remaining) > 0 && (
          <div className="action-panel payment">
            <h5>
              <i className="fas fa-credit-card me-2"></i>
              {t("Make Payment")}
            </h5>
            <div className="row g-3">
              <div className="col-md-4">
                <label className="form-label">{t("Amount")}</label>
                <input
                  type="number"
                  className="form-control"
                  placeholder={t("Enter amount")}
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">{t("Payment Method")}</label>
                <select
                  className="form-select"
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                >
                  <option value="cash">{t("Cash")}</option>
                  <option value="bank">{t("Bank Transfer")}</option>
                  <option value="card">{t("Credit Card")}</option>
                </select>
              </div>
              <div className="col-md-4 d-flex align-items-end">
                <button
                  className="btn btn-primary w-100"
                  disabled={payLoading}
                  onClick={handlePay}
                >
                  {payLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      {t("Processing...")}
                    </>
                  ) : (
                    <>
                      <i className="fas fa-paper-plane me-2"></i>
                      {t("Pay Now")}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Items Table */}
      <div className="card mb-4">
        <div className="card-header bg-white">
          <h5 className="mb-0">
            <i className="fas fa-boxes me-2"></i>
            {t("Order Items")}
          </h5>
        </div>
        <div className="table-responsive">
          <table className="table table-bordered mb-0">
            <thead className="table-light">
              <tr>
                <th style={{ width: 60 }}>#</th>
                <th>{t("Supply")}</th>
                <th style={{ width: 100 }}>{t("Quantity")}</th>
                <th style={{ width: 120 }}>{t("Unit Cost")}</th>
                <th style={{ width: 120 }}>{t("Line Total")}</th>
                <th style={{ width: 200 }}>{t("Actions")}</th>
              </tr>
            </thead>
            <tbody>
              {po.items.map((item, i) => (
                <tr key={item.id}>
                  <td className="fw-semibold">{i + 1}</td>
                  <td>{item.supply?.name ?? item.supply_id}</td>
                  <td>{item.quantity}</td>
                  <td>{formatCurrency(item.unit_cost)}</td>
                  <td className="fw-semibold">{formatCurrency(item.total)}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn btn-sm btn-outline-warning"
                        onClick={() =>
                          navigate(
                            `/admin/erp/purchase-orders/${po.id}/returns`,
                          )
                        }
                      >
                        <i className="fas fa-undo-alt me-1"></i>
                        {t("Returns")}
                      </button>
                      <button
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() =>
                          navigate(
                            `/admin/erp/purchase-orders/${po.id}/returns-history`,
                          )
                        }
                      >
                        <i className="fas fa-history me-1"></i>
                        {t("Log")}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payments Table */}
      <div className="card">
        <div className="card-header bg-white">
          <h5 className="mb-0">
            <i className="fas fa-credit-card me-2"></i>
            {t("Payment History")}
          </h5>
        </div>
        <div className="table-responsive">
          {po.payments && po.payments.length > 0 ? (
            <table className="table mb-0">
              <thead className="table-light">
                <tr>
                  <th>{t("Payment ID")}</th>
                  <th>{t("Amount")}</th>
                  <th>{t("Method")}</th>
                  <th>{t("Date")}</th>
                </tr>
              </thead>
              <tbody>
                {po.payments.map((p) => (
                  <tr key={p.id}>
                    <td>#{p.id}</td>
                    <td className="fw-semibold">{formatCurrency(p.amount)}</td>
                    <td>
                      <span className="badge bg-light text-dark text-capitalize">
                        {t(p.method)}
                      </span>
                    </td>
                    <td>{formatDate(p.paid_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-5">
              <i className="fas fa-credit-card fa-3x text-muted mb-3"></i>
              <p className="text-muted">{t("No payments recorded yet")}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return isMobile ? renderMobileView() : renderDesktopView();
};

export default PurchaseOrderDetails;

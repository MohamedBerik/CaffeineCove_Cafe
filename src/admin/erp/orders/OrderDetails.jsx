import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../../services/axios";
import { notifyError, notifySuccess } from "../../../utils/notify";
import { useTranslation } from "react-i18next";
import "./OrderDetails.css";

const OrderDetails = () => {
  const { t, i18n } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const formatCurrency = (value) => {
    const lang = i18n.language === "ar" ? "ar-EG" : "en-US";
    return new Intl.NumberFormat(lang, {
      style: "currency",
      currency: "EGP",
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
      });
    } catch {
      return value;
    }
  };

  const fetchOrder = () => {
    setLoading(true);
    api
      .get(`/erp/orders/${id}`)
      .then((res) => {
        setOrder(res.data);
      })
      .catch((err) => {
        console.error(err);
        notifyError(t("Failed to load order"));
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const handleConfirm = async () => {
    if (!window.confirm(t("Confirm this order and create invoice?"))) return;

    try {
      const res = await api.post(`/erp/orders/${id}/confirm`);
      notifySuccess(res.data.msg);
      fetchOrder();
    } catch (err) {
      console.error(err);
      notifyError(err.response?.data?.msg || t("Confirm failed"));
    }
  };

  const handleCancel = async () => {
    if (!window.confirm(t("Cancel this order and restore stock?"))) return;

    try {
      const res = await api.post(`/erp/orders/${id}/cancel`);
      notifySuccess(res.data.msg);
      fetchOrder();
    } catch (err) {
      console.error(err);
      notifyError(err.response?.data?.msg || t("Cancel failed"));
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "status-pending";
      case "confirmed":
        return "status-confirmed";
      case "cancelled":
        return "status-cancelled";
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
      default:
        return status || "-";
    }
  };

  if (loading)
    return (
      <div className="order-loading">
        <div className="loading-spinner"></div>
        <p>{t("Loading order details...")}</p>
      </div>
    );

  if (!order)
    return (
      <div className="order-not-found">
        <i className="fas fa-exclamation-circle"></i>
        <h3>{t("Order not found")}</h3>
        <button className="btn btn-primary" onClick={() => navigate(-1)}>
          <i className="fas fa-arrow-left"></i> {t("Go Back")}
        </button>
      </div>
    );

  const canConfirm =
    order.status === "pending" &&
    !order.invoice &&
    order.items &&
    order.items.length > 0;

  const canCancel = order.status === "pending";

  const renderMobileView = () => (
    <div className="order-details-mobile">
      <div className="mobile-header">
        <button className="btn-back" onClick={() => navigate(-1)}>
          <i className="fas fa-arrow-left"></i>
        </button>
        <div className="header-title">
          <h2>
            {t("Order")} #{order.id}
          </h2>
          <span className={`status-badge ${getStatusBadgeClass(order.status)}`}>
            {getStatusLabel(order.status)}
          </span>
        </div>
        <button className="btn-print" onClick={handlePrint}>
          <i className="fas fa-print"></i>
        </button>
      </div>

      <div className="order-summary">
        <div className="summary-card">
          <div className="summary-row">
            <span>{t("Customer")}:</span>
            <span className="customer-name">
              {order.customer?.name || t("N/A")}
            </span>
          </div>
          <div className="summary-row">
            <span>{t("Date")}:</span>
            <span>{formatDate(order.created_at)}</span>
          </div>
          <div className="summary-row total-row">
            <span>{t("Total Amount")}:</span>
            <span className="total-amount">{formatCurrency(order.total)}</span>
          </div>
        </div>

        {order.invoice && (
          <div className="invoice-card">
            <div className="invoice-header">
              <i className="fas fa-file-invoice-dollar"></i>
              <span>{t("Invoice Details")}</span>
            </div>
            <div className="invoice-info">
              <div className="info-row">
                <span>{t("Invoice")} #:</span>
                <span>{order.invoice.id}</span>
              </div>
              <div className="info-row">
                <span>{t("Invoice Status")}:</span>
                <span
                  className={`status-badge ${getStatusBadgeClass(order.invoice.status)}`}
                >
                  {getStatusLabel(order.invoice.status)}
                </span>
              </div>
              <button
                className="btn-view-invoice"
                onClick={() =>
                  navigate(`/admin/erp/invoices/${order.invoice.id}`)
                }
              >
                <i className="fas fa-external-link-alt"></i> {t("View Invoice")}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="order-items">
        <h3>
          <i className="fas fa-box"></i> {t("Order Items")}
        </h3>
        <div className="items-list">
          {order.items.map((item, i) => (
            <div key={item.id} className="item-card">
              <div className="item-header">
                <span className="item-number">#{i + 1}</span>
                <span className="item-product">{item.product?.title_en}</span>
              </div>
              <div className="item-details">
                <div className="detail">
                  <span>{t("Quantity")}:</span>
                  <span>{item.quantity}</span>
                </div>
                <div className="detail">
                  <span>{t("Unit Price")}:</span>
                  <span>{formatCurrency(item.unit_price)}</span>
                </div>
                <div className="detail">
                  <span>{t("Total")}:</span>
                  <span className="item-total">
                    {formatCurrency(item.total)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="order-actions-mobile">
        {order.status === "pending" && (
          <>
            <button
              className="btn-action btn-confirm"
              disabled={!canConfirm}
              onClick={handleConfirm}
            >
              <i className="fas fa-check-circle"></i>
              {t("Confirm Order")}
            </button>
            <button
              className="btn-action btn-cancel"
              disabled={!canCancel}
              onClick={handleCancel}
            >
              <i className="fas fa-times-circle"></i>
              {t("Cancel Order")}
            </button>
          </>
        )}

        {order.status === "confirmed" && (
          <div className="confirmed-status">
            <i className="fas fa-check-circle"></i>
            <span>{t("Order Confirmed")}</span>
          </div>
        )}

        {order.status === "cancelled" && (
          <div className="cancelled-status">
            <i className="fas fa-times-circle"></i>
            <span>{t("Order Cancelled")}</span>
          </div>
        )}

        {!canConfirm && order.status === "pending" && (
          <div className="info-note">
            <i className="fas fa-info-circle"></i>
            <p>
              {t(
                "Order can be confirmed only when it's pending, has items, and no invoice exists.",
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );

  const renderDesktopView = () => (
    <div className="order-details-desktop">
      <div className="order-header">
        <div className="header-left">
          <button className="btn-back" onClick={() => navigate(-1)}>
            <i className="fas fa-arrow-left"></i>
          </button>
          <div className="header-info">
            <h1>
              {t("Order")} #{order.id}
            </h1>
            <div className="order-meta">
              <span
                className={`status-badge ${getStatusBadgeClass(order.status)}`}
              >
                {getStatusLabel(order.status)}
              </span>
              <span className="order-date">
                <i className="far fa-calendar"></i>{" "}
                {formatDate(order.created_at)}
              </span>
              {order.invoice && (
                <span className="invoice-link">
                  <i className="fas fa-file-invoice"></i> {t("Invoice")} #
                  {order.invoice.id}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="header-right">
          <button className="btn-print" onClick={handlePrint}>
            <i className="fas fa-print"></i> {t("Print")}
          </button>
          {order.invoice && (
            <button
              className="btn-view-invoice"
              onClick={() =>
                navigate(`/admin/erp/invoices/${order.invoice.id}`)
              }
            >
              <i className="fas fa-external-link-alt"></i> {t("View Invoice")}
            </button>
          )}
        </div>
      </div>

      <div className="order-content">
        <div className="customer-section">
          <div className="section-header">
            <h3>
              <i className="fas fa-user"></i> {t("Customer Information")}
            </h3>
          </div>
          <div className="customer-details">
            <div className="detail-group">
              <span className="detail-label">{t("Name")}:</span>
              <span className="detail-value">
                {order.customer?.name || t("N/A")}
              </span>
            </div>
            <div className="detail-group">
              <span className="detail-label">{t("Email")}:</span>
              <span className="detail-value">
                {order.customer?.email || t("N/A")}
              </span>
            </div>
            <div className="detail-group">
              <span className="detail-label">{t("Phone")}:</span>
              <span className="detail-value">
                {order.customer?.phone || t("N/A")}
              </span>
            </div>
          </div>
        </div>

        <div className="order-section">
          <div className="section-header">
            <h3>
              <i className="fas fa-box"></i> {t("Order Items")}
            </h3>
            <div className="order-total">
              <span>{t("Total")}:</span>
              <span className="total-amount">
                {formatCurrency(order.total)}
              </span>
            </div>
          </div>

          <div className="items-table">
            <div className="table-header">
              <div className="header-col">#</div>
              <div className="header-col">{t("Product")}</div>
              <div className="header-col">{t("Quantity")}</div>
              <div className="header-col">{t("Unit Price")}</div>
              <div className="header-col">{t("Total")}</div>
            </div>
            <div className="table-body">
              {order.items.map((item, i) => (
                <div key={item.id} className="table-row">
                  <div className="row-col index-col">{i + 1}</div>
                  <div className="row-col product-col">
                    {item.product?.title_en}
                  </div>
                  <div className="row-col quantity-col">{item.quantity}</div>
                  <div className="row-col price-col">
                    {formatCurrency(item.unit_price)}
                  </div>
                  <div className="row-col total-col">
                    {formatCurrency(item.total)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="order-actions">
          <div className="actions-section">
            <h3>
              <i className="fas fa-cogs"></i> {t("Order Actions")}
            </h3>
            <div className="action-buttons">
              {order.status === "pending" && (
                <>
                  <button
                    className="btn-action btn-confirm"
                    disabled={!canConfirm}
                    onClick={handleConfirm}
                    title={
                      canConfirm
                        ? t("Confirm order and create invoice")
                        : t("Cannot confirm order")
                    }
                  >
                    <i className="fas fa-check-circle"></i>
                    {t("Confirm Order")}
                  </button>
                  <button
                    className="btn-action btn-cancel"
                    disabled={!canCancel}
                    onClick={handleCancel}
                    title={
                      canCancel
                        ? t("Cancel order and restore stock")
                        : t("Cannot cancel order")
                    }
                  >
                    <i className="fas fa-times-circle"></i>
                    {t("Cancel Order")}
                  </button>
                </>
              )}

              {order.status === "confirmed" && (
                <div className="status-display confirmed">
                  <i className="fas fa-check-circle"></i>
                  <div>
                    <strong>{t("Order Confirmed")}</strong>
                    <p>
                      {t("Invoice #{id} has been created", {
                        id: order.invoice?.id,
                      })}
                    </p>
                  </div>
                </div>
              )}

              {order.status === "cancelled" && (
                <div className="status-display cancelled">
                  <i className="fas fa-times-circle"></i>
                  <div>
                    <strong>{t("Order Cancelled")}</strong>
                    <p>{t("Stock has been restored")}</p>
                  </div>
                </div>
              )}
            </div>

            {!canConfirm && order.status === "pending" && (
              <div className="action-info">
                <i className="fas fa-info-circle"></i>
                <div>
                  <strong>{t("Confirm is disabled because")}:</strong>
                  <ul>
                    {order.status !== "pending" && (
                      <li>{t("Order is not in pending status")}</li>
                    )}
                    {(!order.items || order.items.length === 0) && (
                      <li>{t("Order has no items")}</li>
                    )}
                    {order.invoice && (
                      <li>
                        {t("Invoice already exists (#{id})", {
                          id: order.invoice.id,
                        })}
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return isMobile ? renderMobileView() : renderDesktopView();
};

export default OrderDetails;

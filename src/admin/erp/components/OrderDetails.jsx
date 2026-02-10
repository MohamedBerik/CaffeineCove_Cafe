import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../../services/axios";
import { notifyError, notifySuccess } from "../../../utils/notify";
import "./OrderDetails.css";

const OrderDetails = () => {
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

  const fetchOrder = () => {
    setLoading(true);
    api
      .get(`/erp/orders/${id}`)
      .then((res) => {
        setOrder(res.data);
      })
      .catch((err) => {
        console.error(err);
        notifyError("Failed to load order");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const handleConfirm = async () => {
    if (!window.confirm("Confirm this order and create invoice?")) return;

    try {
      const res = await api.post(`/erp/orders/${id}/confirm`);
      notifySuccess(res.data.msg);
      fetchOrder();
    } catch (err) {
      console.error(err);
      notifyError(err.response?.data?.msg || "Confirm failed");
    }
  };

  const handleCancel = async () => {
    if (!window.confirm("Cancel this order and restore stock?")) return;

    try {
      const res = await api.post(`/erp/orders/${id}/cancel`);
      notifySuccess(res.data.msg);
      fetchOrder();
    } catch (err) {
      console.error(err);
      notifyError(err.response?.data?.msg || "Cancel failed");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading)
    return (
      <div className="order-loading">
        <div className="loading-spinner"></div>
        <p>Loading order details...</p>
      </div>
    );

  if (!order)
    return (
      <div className="order-not-found">
        <i className="fas fa-exclamation-circle"></i>
        <h3>Order not found</h3>
        <button className="btn btn-primary" onClick={() => navigate(-1)}>
          <i className="fas fa-arrow-left"></i> Go Back
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
          <h2>Order #{order.id}</h2>
          <span className={`status-badge status-${order.status}`}>
            {order.status}
          </span>
        </div>
        <button className="btn-print" onClick={handlePrint}>
          <i className="fas fa-print"></i>
        </button>
      </div>

      <div className="order-summary">
        <div className="summary-card">
          <div className="summary-row">
            <span>Customer:</span>
            <span className="customer-name">
              {order.customer?.name || "N/A"}
            </span>
          </div>
          <div className="summary-row">
            <span>Date:</span>
            <span>{order.created_at?.split("T")[0] || "N/A"}</span>
          </div>
          <div className="summary-row total-row">
            <span>Total Amount:</span>
            <span className="total-amount">
              ${parseFloat(order.total).toFixed(2)}
            </span>
          </div>
        </div>

        {order.invoice && (
          <div className="invoice-card">
            <div className="invoice-header">
              <i className="fas fa-file-invoice-dollar"></i>
              <span>Invoice Details</span>
            </div>
            <div className="invoice-info">
              <div className="info-row">
                <span>Invoice #:</span>
                <span>{order.invoice.id}</span>
              </div>
              <div className="info-row">
                <span>Invoice Status:</span>
                <span className={`status-badge status-${order.invoice.status}`}>
                  {order.invoice.status}
                </span>
              </div>
              <button
                className="btn-view-invoice"
                onClick={() =>
                  navigate(`/admin/erp/invoices/${order.invoice.id}`)
                }
              >
                <i className="fas fa-external-link-alt"></i> View Invoice
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="order-items">
        <h3>
          <i className="fas fa-box"></i> Order Items
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
                  <span>Quantity:</span>
                  <span>{item.quantity}</span>
                </div>
                <div className="detail">
                  <span>Unit Price:</span>
                  <span>${parseFloat(item.unit_price).toFixed(2)}</span>
                </div>
                <div className="detail">
                  <span>Total:</span>
                  <span className="item-total">
                    ${parseFloat(item.total).toFixed(2)}
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
              Confirm Order
            </button>
            <button
              className="btn-action btn-cancel"
              disabled={!canCancel}
              onClick={handleCancel}
            >
              <i className="fas fa-times-circle"></i>
              Cancel Order
            </button>
          </>
        )}

        {order.status === "confirmed" && (
          <div className="confirmed-status">
            <i className="fas fa-check-circle"></i>
            <span>Order Confirmed</span>
          </div>
        )}

        {order.status === "cancelled" && (
          <div className="cancelled-status">
            <i className="fas fa-times-circle"></i>
            <span>Order Cancelled</span>
          </div>
        )}

        {!canConfirm && order.status === "pending" && (
          <div className="info-note">
            <i className="fas fa-info-circle"></i>
            <p>
              Order can be confirmed only when it's pending, has items, and no
              invoice exists.
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
            <i className="fas fa-arrow-left"></i> Back to Orders
          </button>
          <div className="header-info">
            <h1>Order #{order.id}</h1>
            <div className="order-meta">
              <span className={`status-badge status-${order.status}`}>
                {order.status}
              </span>
              <span className="order-date">
                <i className="far fa-calendar"></i>{" "}
                {order.created_at?.split("T")[0] || "N/A"}
              </span>
              {order.invoice && (
                <span className="invoice-link">
                  <i className="fas fa-file-invoice"></i> Invoice #
                  {order.invoice.id}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="header-right">
          <button className="btn-print" onClick={handlePrint}>
            <i className="fas fa-print"></i> Print
          </button>
          {order.invoice && (
            <button
              className="btn-view-invoice"
              onClick={() =>
                navigate(`/admin/erp/invoices/${order.invoice.id}`)
              }
            >
              <i className="fas fa-external-link-alt"></i> View Invoice
            </button>
          )}
        </div>
      </div>

      <div className="order-content">
        <div className="customer-section">
          <div className="section-header">
            <h3>
              <i className="fas fa-user"></i> Customer Information
            </h3>
          </div>
          <div className="customer-details">
            <div className="detail-group">
              <span className="detail-label">Name:</span>
              <span className="detail-value">
                {order.customer?.name || "N/A"}
              </span>
            </div>
            <div className="detail-group">
              <span className="detail-label">Email:</span>
              <span className="detail-value">
                {order.customer?.email || "N/A"}
              </span>
            </div>
            <div className="detail-group">
              <span className="detail-label">Phone:</span>
              <span className="detail-value">
                {order.customer?.phone || "N/A"}
              </span>
            </div>
          </div>
        </div>

        <div className="order-section">
          <div className="section-header">
            <h3>
              <i className="fas fa-box"></i> Order Items
            </h3>
            <div className="order-total">
              <span>Total:</span>
              <span className="total-amount">
                ${parseFloat(order.total).toFixed(2)}
              </span>
            </div>
          </div>

          <div className="items-table">
            <div className="table-header">
              <div className="header-col">#</div>
              <div className="header-col">Product</div>
              <div className="header-col">Quantity</div>
              <div className="header-col">Unit Price</div>
              <div className="header-col">Total</div>
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
                    ${parseFloat(item.unit_price).toFixed(2)}
                  </div>
                  <div className="row-col total-col">
                    ${parseFloat(item.total).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="order-actions">
          <div className="actions-section">
            <h3>
              <i className="fas fa-cogs"></i> Order Actions
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
                        ? "Confirm order and create invoice"
                        : "Cannot confirm order"
                    }
                  >
                    <i className="fas fa-check-circle"></i>
                    Confirm Order
                  </button>
                  <button
                    className="btn-action btn-cancel"
                    disabled={!canCancel}
                    onClick={handleCancel}
                    title={
                      canCancel
                        ? "Cancel order and restore stock"
                        : "Cannot cancel order"
                    }
                  >
                    <i className="fas fa-times-circle"></i>
                    Cancel Order
                  </button>
                </>
              )}

              {order.status === "confirmed" && (
                <div className="status-display confirmed">
                  <i className="fas fa-check-circle"></i>
                  <div>
                    <strong>Order Confirmed</strong>
                    <p>Invoice #{order.invoice?.id} has been created</p>
                  </div>
                </div>
              )}

              {order.status === "cancelled" && (
                <div className="status-display cancelled">
                  <i className="fas fa-times-circle"></i>
                  <div>
                    <strong>Order Cancelled</strong>
                    <p>Stock has been restored</p>
                  </div>
                </div>
              )}
            </div>

            {!canConfirm && order.status === "pending" && (
              <div className="action-info">
                <i className="fas fa-info-circle"></i>
                <div>
                  <strong>Confirm is disabled because:</strong>
                  <ul>
                    {order.status !== "pending" && (
                      <li>Order is not in pending status</li>
                    )}
                    {(!order.items || order.items.length === 0) && (
                      <li>Order has no items</li>
                    )}
                    {order.invoice && (
                      <li>Invoice already exists (#{order.invoice.id})</li>
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

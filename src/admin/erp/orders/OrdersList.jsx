import React, { useEffect, useState } from "react";
import api from "../../../services/axios";
import { notifyError, notifySuccess } from "../../../utils/notify";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "./OrdersList.css";

const OrdersList = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [filter, setFilter] = useState("all");

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

  const fetchOrders = () => {
    setLoading(true);
    api
      .get("/erp/orders")
      .then((res) => setOrders(res.data))
      .catch((err) => {
        console.error(err);
        notifyError(t("Failed to fetch orders"));
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleConfirm = async (id) => {
    if (!window.confirm(t("Confirm this order?"))) return;
    try {
      const res = await api.post(`/erp/orders/${id}/confirm`);
      notifySuccess(res.data.msg);
      fetchOrders();
    } catch (err) {
      console.error(err);
      notifyError(err.response?.data?.msg || t("Confirm failed"));
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm(t("Cancel this order?"))) return;
    try {
      const res = await api.post(`/erp/orders/${id}/cancel`);
      notifySuccess(res.data.msg);
      fetchOrders();
    } catch (err) {
      console.error(err);
      notifyError(err.response?.data?.msg || t("Cancel failed"));
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

  const filteredOrders = orders.filter((order) => {
    if (filter === "all") return true;
    if (filter === "pending") return order.status === "pending";
    if (filter === "confirmed") return order.status === "confirmed";
    if (filter === "cancelled") return order.status === "cancelled";
    return true;
  });

  if (loading)
    return (
      <div className="orders-loading">
        <div className="loading-spinner"></div>
        <p>{t("Loading orders...")}</p>
      </div>
    );

  const renderMobileView = () => (
    <div className="orders-mobile">
      <div className="mobile-header">
        <h3>{t("Orders")}</h3>
        <button
          className="btn-new-order"
          onClick={() => navigate("/admin/erp/orders/create")}
          title={t("New Order")}
        >
          <i className="fas fa-plus"></i>
        </button>
      </div>

      <div className="filters-row">
        {["all", "pending", "confirmed", "cancelled"].map((status) => (
          <button
            key={status}
            className={`filter-btn ${filter === status ? "active" : ""}`}
            onClick={() => setFilter(status)}
          >
            {status === "all"
              ? t("All")
              : t(status.charAt(0).toUpperCase() + status.slice(1))}
          </button>
        ))}
      </div>

      {filteredOrders.length === 0 ? (
        <div className="no-orders">
          <i className="fas fa-box-open"></i>
          <p>
            {filter === "all"
              ? t("No orders found")
              : t("No {status} orders found", {
                  status: t(filter.charAt(0).toUpperCase() + filter.slice(1)),
                })}
          </p>
          <button
            className="btn-create"
            onClick={() => navigate("/admin/erp/orders/create")}
          >
            <i className="fas fa-plus me-2"></i>
            {t("Create New Order")}
          </button>
        </div>
      ) : (
        <div className="orders-grid">
          {filteredOrders.map((order) => (
            <div key={order.id} className="order-card">
              <div className="order-header">
                <div>
                  <h4 className="order-id">
                    {t("Order")} #{order.id}
                  </h4>
                  <p className="order-customer">
                    {order.customer?.name || t("No Customer")}
                  </p>
                </div>
                <span
                  className={`status-badge ${getStatusBadgeClass(order.status)}`}
                >
                  {getStatusLabel(order.status)}
                </span>
              </div>

              <div className="order-details">
                <div className="detail-row">
                  <span>{t("Total")}:</span>
                  <span className="order-total">
                    {formatCurrency(order.total)}
                  </span>
                </div>
                <div className="detail-row">
                  <span>{t("Date")}:</span>
                  <span>{formatDate(order.created_at)}</span>
                </div>
              </div>

              <div className="order-actions">
                <button
                  className={`btn-action ${order.status !== "pending" ? "disabled" : "confirm"}`}
                  onClick={() => handleConfirm(order.id)}
                  disabled={order.status !== "pending"}
                  title={t("Confirm order")}
                >
                  <i className="fas fa-check-circle"></i>
                  {t("Confirm")}
                </button>
                <button
                  className={`btn-action ${order.status === "cancelled" ? "disabled" : "cancel"}`}
                  onClick={() => handleCancel(order.id)}
                  disabled={order.status === "cancelled"}
                  title={t("Cancel order")}
                >
                  <i className="fas fa-times-circle"></i>
                  {t("Cancel")}
                </button>
                <button
                  className="btn-action details"
                  onClick={() => navigate(`/admin/erp/orders/${order.id}`)}
                  title={t("View details")}
                >
                  <i className="fas fa-eye"></i>
                  {t("Details")}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderDesktopView = () => (
    <div className="orders-desktop">
      <div className="orders-header">
        <div>
          <h2>{t("Orders Management")}</h2>
          <p className="header-subtitle">
            {t("Manage and track all customer orders")}
          </p>
        </div>
        <div className="header-actions">
          <div className="filters">
            {["all", "pending", "confirmed", "cancelled"].map((status) => (
              <button
                key={status}
                className={`filter-btn ${filter === status ? "active" : ""}`}
                onClick={() => setFilter(status)}
              >
                {status === "all"
                  ? t("All")
                  : t(status.charAt(0).toUpperCase() + status.slice(1))}
              </button>
            ))}
          </div>
          <button
            className="btn-new-order"
            onClick={() => navigate("/admin/erp/orders/create")}
          >
            <i className="fas fa-plus me-2"></i>
            {t("New Order")}
          </button>
        </div>
      </div>

      <div className="table-container">
        <table className="orders-table">
          <thead>
            <tr>
              <th>{t("ID")}</th>
              <th>{t("Customer")}</th>
              <th>{t("Total")}</th>
              <th>{t("Status")}</th>
              <th>{t("Date")}</th>
              <th>{t("Actions")}</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan="6" className="no-data">
                  <i className="fas fa-box-open"></i>
                  <p>
                    {filter === "all"
                      ? t("No orders found")
                      : t("No {status} orders found", {
                          status: t(
                            filter.charAt(0).toUpperCase() + filter.slice(1),
                          ),
                        })}
                  </p>
                  <button
                    className="btn-create"
                    onClick={() => navigate("/admin/erp/orders/create")}
                  >
                    <i className="fas fa-plus me-2"></i>
                    {t("Create New Order")}
                  </button>
                </td>
              </tr>
            ) : (
              filteredOrders.map((order) => (
                <tr key={order.id} className="order-row">
                  <td className="order-id-cell">
                    <button
                      className="btn-order-id"
                      onClick={() => navigate(`/admin/erp/orders/${order.id}`)}
                      title={t("View order #{id}", { id: order.id })}
                    >
                      #{order.id}
                    </button>
                  </td>
                  <td>{order.customer?.name || "-"}</td>
                  <td className="total-cell">{formatCurrency(order.total)}</td>
                  <td>
                    <span
                      className={`status-badge ${getStatusBadgeClass(order.status)}`}
                    >
                      {getStatusLabel(order.status)}
                    </span>
                  </td>
                  <td>{formatDate(order.created_at)}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-action-icon btn-success"
                        onClick={() => handleConfirm(order.id)}
                        disabled={order.status !== "pending"}
                        title={t("Confirm order")}
                      >
                        <i className="fas fa-check"></i>
                      </button>
                      <button
                        className="btn-action-icon btn-danger"
                        onClick={() => handleCancel(order.id)}
                        disabled={order.status === "cancelled"}
                        title={t("Cancel order")}
                      >
                        <i className="fas fa-times"></i>
                      </button>
                      <button
                        className="btn-action-icon btn-primary"
                        onClick={() =>
                          navigate(`/admin/erp/orders/${order.id}`)
                        }
                        title={t("View details")}
                      >
                        <i className="fas fa-eye"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {filteredOrders.length > 0 && (
        <div className="table-footer">
          <span className="text-muted">
            {t("Showing")} {filteredOrders.length} {t("of")} {orders.length}{" "}
            {t("orders")}
          </span>
        </div>
      )}
    </div>
  );

  return isMobile ? renderMobileView() : renderDesktopView();
};

export default OrdersList;

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../services/axios";
import { notifyError } from "../../../utils/notify";
import { useTranslation } from "react-i18next";
import "./PurchaseOrdersList.css";

const PurchaseOrdersList = () => {
  const { t, i18n } = useTranslation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const navigate = useNavigate();

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

  const fetchPOs = () => {
    setLoading(true);
    api
      .get("/erp/purchase-orders")
      .then((res) => setOrders(res.data))
      .catch((err) => {
        console.error(err);
        notifyError(t("Failed to fetch purchase orders"));
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPOs();
  }, []);

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

  const filteredOrders = orders.filter((order) => {
    if (filter !== "all" && order.status !== filter) return false;
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        order.id?.toString().includes(searchLower) ||
        order.supplier?.name?.toLowerCase().includes(searchLower) ||
        order.status?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

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

  const renderMobileView = () => (
    <div className="purchase-orders-mobile">
      <div className="mobile-header">
        <h3>{t("Purchase Orders")}</h3>
        <button
          className="btn-add"
          onClick={() => navigate("/admin/erp/purchase-orders/create")}
          title={t("Create new order")}
        >
          <i className="fas fa-plus"></i>
        </button>
      </div>

      <div className="filters-section">
        <div className="search-box">
          <i className="fas fa-search"></i>
          <input
            type="text"
            placeholder={t("Search orders...")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          {searchTerm && (
            <button className="clear-search" onClick={() => setSearchTerm("")}>
              <i className="fas fa-times"></i>
            </button>
          )}
        </div>

        <div className="filter-buttons">
          {["all", "pending", "confirmed", "delivered", "cancelled"].map(
            (status) => (
              <button
                key={status}
                className={`filter-btn ${filter === status ? "active" : ""}`}
                onClick={() => setFilter(status)}
              >
                {status === "all"
                  ? t("All")
                  : t(status.charAt(0).toUpperCase() + status.slice(1))}
              </button>
            ),
          )}
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="no-orders">
          <i className="fas fa-clipboard-list"></i>
          <p>{t("No purchase orders found")}</p>
          <button
            className="btn-create"
            onClick={() => navigate("/admin/erp/purchase-orders/create")}
          >
            <i className="fas fa-plus me-2"></i>
            {t("Create New Order")}
          </button>
        </div>
      ) : (
        <div className="orders-list">
          {filteredOrders.map((po) => (
            <div
              key={po.id}
              className="order-card"
              onClick={() => navigate(`/admin/erp/purchase-orders/${po.id}`)}
            >
              <div className="order-header">
                <div>
                  <span className="order-id">
                    {t("PO")} #{po.id}
                  </span>
                  <span
                    className={`status-badge ${getStatusBadgeClass(po.status)}`}
                  >
                    {getStatusLabel(po.status)}
                  </span>
                </div>
                <i className="fas fa-chevron-right text-muted"></i>
              </div>

              <div className="order-supplier">
                <i className="fas fa-truck me-2 text-muted"></i>
                {po.supplier?.name || t("N/A")}
              </div>

              <div className="order-details">
                <div className="detail-row">
                  <span>{t("Total")}:</span>
                  <span className="amount total">
                    {formatCurrency(po.total)}
                  </span>
                </div>
                <div className="detail-row">
                  <span>{t("Paid")}:</span>
                  <span className="amount paid">
                    {formatCurrency(po.total_paid)}
                  </span>
                </div>
                <div className="detail-row">
                  <span>{t("Remaining")}:</span>
                  <span className="amount remaining">
                    {formatCurrency(po.remaining)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderDesktopView = () => (
    <div className="purchase-orders-desktop">
      <div className="page-header">
        <div>
          <h2>{t("Purchase Orders")}</h2>
          <p className="text-muted">
            {t("Manage and track all purchase orders")}
          </p>
        </div>
        <button
          className="btn-create"
          onClick={() => navigate("/admin/erp/purchase-orders/create")}
        >
          <i className="fas fa-plus me-2"></i>
          {t("New Purchase Order")}
        </button>
      </div>

      <div className="filters-panel">
        <div className="search-box">
          <i className="fas fa-search"></i>
          <input
            type="text"
            placeholder={t("Search by ID, supplier or status...")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          {searchTerm && (
            <button className="clear-search" onClick={() => setSearchTerm("")}>
              <i className="fas fa-times"></i>
            </button>
          )}
        </div>

        <div className="filter-buttons">
          {["all", "pending", "confirmed", "delivered", "cancelled"].map(
            (status) => (
              <button
                key={status}
                className={`filter-btn ${filter === status ? "active" : ""}`}
                onClick={() => setFilter(status)}
              >
                {status === "all"
                  ? t("All")
                  : t(status.charAt(0).toUpperCase() + status.slice(1))}
              </button>
            ),
          )}
        </div>
      </div>

      <div className="table-container">
        <table className="orders-table">
          <thead>
            <tr>
              <th>{t("PO #")}</th>
              <th>{t("Supplier")}</th>
              <th>{t("Total")}</th>
              <th>{t("Paid")}</th>
              <th>{t("Remaining")}</th>
              <th>{t("Status")}</th>
              <th>{t("Actions")}</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center py-5">
                  <i className="fas fa-clipboard-list fa-3x text-muted mb-3"></i>
                  <p className="text-muted">{t("No purchase orders found")}</p>
                </td>
              </tr>
            ) : (
              filteredOrders.map((po) => (
                <tr key={po.id} className="order-row">
                  <td className="fw-semibold">#{po.id}</td>
                  <td>
                    <div className="supplier-info">
                      <i className="fas fa-truck me-2 text-muted"></i>
                      {po.supplier?.name || t("N/A")}
                    </div>
                  </td>
                  <td className="amount total">{formatCurrency(po.total)}</td>
                  <td className="amount paid">
                    {formatCurrency(po.total_paid)}
                  </td>
                  <td className="amount remaining">
                    {formatCurrency(po.remaining)}
                  </td>
                  <td>
                    <span
                      className={`status-badge ${getStatusBadgeClass(po.status)}`}
                    >
                      {getStatusLabel(po.status)}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-view"
                        onClick={() =>
                          navigate(`/admin/erp/purchase-orders/${po.id}`)
                        }
                        title={t("View details")}
                      >
                        <i className="fas fa-eye"></i>
                      </button>
                      <button
                        className="btn-edit"
                        onClick={() =>
                          navigate(`/admin/erp/purchase-orders/${po.id}/edit`)
                        }
                        title={t("Edit order")}
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="table-footer">
        <span className="text-muted">
          {t("Showing")} {filteredOrders.length} {t("of")} {orders.length}{" "}
          {t("orders")}
        </span>
      </div>
    </div>
  );

  return isMobile ? renderMobileView() : renderDesktopView();
};

export default PurchaseOrdersList;

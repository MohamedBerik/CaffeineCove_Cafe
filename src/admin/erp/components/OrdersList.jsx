import React, { useEffect, useState } from "react";
import api from "../../../services/axios";
import { notifyError, notifySuccess } from "../../../utils/notify";
import { useNavigate } from "react-router-dom";

const OrdersList = () => {
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

  const fetchOrders = () => {
    setLoading(true);
    api
      .get("/erp/orders")
      .then((res) => setOrders(res.data))
      .catch((err) => {
        console.error(err);
        notifyError("Failed to fetch orders");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleConfirm = async (id) => {
    try {
      const res = await api.post(`/erp/orders/${id}/confirm`);
      notifySuccess(res.data.msg);
      fetchOrders();
    } catch (err) {
      console.error(err);
      notifyError(err.response?.data?.msg || "Confirm failed");
    }
  };

  const handleCancel = async (id) => {
    try {
      const res = await api.post(`/erp/orders/${id}/cancel`);
      notifySuccess(res.data.msg);
      fetchOrders();
    } catch (err) {
      console.error(err);
      notifyError(err.response?.data?.msg || "Cancel failed");
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
        <p>Loading orders...</p>
      </div>
    );

  const renderMobileView = () => (
    <div className="orders-mobile">
      <div className="filters-row">
        {["all", "pending", "confirmed", "cancelled"].map((status) => (
          <button
            key={status}
            className={`filter-btn ${filter === status ? "active" : ""}`}
            onClick={() => setFilter(status)}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {filteredOrders.length === 0 ? (
        <div className="no-orders">
          <i className="fas fa-box-open"></i>
          <p>No {filter === "all" ? "" : filter} orders found</p>
        </div>
      ) : (
        <div className="orders-grid">
          {filteredOrders.map((order) => (
            <div key={order.id} className="order-card">
              <div className="order-header">
                <div>
                  <h4 className="order-id">Order #{order.id}</h4>
                  <p className="order-customer">
                    {order.customer?.name || "No Customer"}
                  </p>
                </div>
                <span className={`status-badge status-${order.status}`}>
                  {order.status}
                </span>
              </div>

              <div className="order-details">
                <div className="detail-row">
                  <span>Total:</span>
                  <span className="order-total">
                    ${parseFloat(order.total).toFixed(2)}
                  </span>
                </div>
                <div className="detail-row">
                  <span>Date:</span>
                  <span>{order.created_at?.split("T")[0] || "N/A"}</span>
                </div>
              </div>

              <div className="order-actions">
                <button
                  className={`btn-action ${order.status === "confirmed" || order.status === "cancelled" ? "disabled" : "confirm"}`}
                  onClick={() => handleConfirm(order.id)}
                  disabled={
                    order.status === "confirmed" || order.status === "cancelled"
                  }
                  title="Confirm order"
                >
                  <i className="fas fa-check-circle"></i>
                  Confirm
                </button>
                <button
                  className={`btn-action ${order.status === "cancelled" ? "disabled" : "cancel"}`}
                  onClick={() => handleCancel(order.id)}
                  disabled={order.status === "cancelled"}
                  title="Cancel order"
                >
                  <i className="fas fa-times-circle"></i>
                  Cancel
                </button>
                <button
                  className="btn-action details"
                  onClick={() => navigate(`/admin/erp/orders/${order.id}`)}
                  title="View details"
                >
                  <i className="fas fa-eye"></i>
                  Details
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
        <h2>Orders Management</h2>
        <div className="header-actions">
          <div className="filters">
            {["all", "pending", "confirmed", "cancelled"].map((status) => (
              <button
                key={status}
                className={`filter-btn ${filter === status ? "active" : ""}`}
                onClick={() => setFilter(status)}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
          <button
            className="btn-new-order"
            onClick={() => navigate("/admin/erp/orders/create")}
          >
            <i className="fas fa-plus"></i> New Order
          </button>
        </div>
      </div>

      <div className="table-container">
        <table className="orders-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Customer</th>
              <th>Total</th>
              <th>Status</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan="6" className="no-data">
                  <i className="fas fa-box-open"></i>
                  <p>No {filter === "all" ? "" : filter} orders found</p>
                </td>
              </tr>
            ) : (
              filteredOrders.map((order) => (
                <tr key={order.id} className="order-row">
                  <td className="order-id-cell">
                    <button
                      className="btn-order-id"
                      onClick={() => navigate(`/admin/erp/orders/${order.id}`)}
                    >
                      #{order.id}
                    </button>
                  </td>
                  <td>{order.customer?.name || "-"}</td>
                  <td className="total-cell">
                    ${parseFloat(order.total).toFixed(2)}
                  </td>
                  <td>
                    <span className={`status-badge status-${order.status}`}>
                      {order.status}
                    </span>
                  </td>
                  <td>{order.created_at?.split("T")[0] || "N/A"}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-action-icon btn-success"
                        onClick={() => handleConfirm(order.id)}
                        disabled={
                          order.status === "confirmed" ||
                          order.status === "cancelled"
                        }
                        title="Confirm order"
                      >
                        <i className="fas fa-check"></i>
                      </button>
                      <button
                        className="btn-action-icon btn-danger"
                        onClick={() => handleCancel(order.id)}
                        disabled={order.status === "cancelled"}
                        title="Cancel order"
                      >
                        <i className="fas fa-times"></i>
                      </button>
                      <button
                        className="btn-action-icon btn-primary"
                        onClick={() =>
                          navigate(`/admin/erp/orders/${order.id}`)
                        }
                        title="View details"
                      >
                        <i className="fas fa-eye"></i>
                      </button>
                      <button
                        className="btn-action-icon btn-secondary"
                        onClick={() =>
                          navigate(`/admin/erp/orders/${order.id}/edit`)
                        }
                        title="Edit order"
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
    </div>
  );

  return isMobile ? renderMobileView() : renderDesktopView();
};

export default OrdersList;

// src/admin/erp/components/OrdersList.jsx
import React, { useEffect, useState } from "react";
import api from "../../../services/axios";
import { notifyError, notifySuccess } from "../../../utils/notify";

const OrdersList = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

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
      await api.post(`/erp/orders/${id}/confirm`);
      notifySuccess("Order confirmed successfully");
      fetchOrders();
    } catch (err) {
      console.error(err);
      notifyError(err?.response?.data?.msg || "Failed to confirm order");
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm("Are you sure you want to cancel this order?")) return;

    try {
      await api.post(`/erp/orders/${id}/cancel`);
      notifySuccess("Order cancelled successfully");
      fetchOrders();
    } catch (err) {
      console.error(err);
      notifyError(err?.response?.data?.msg || "Failed to cancel order");
    }
  };

  if (loading) return <p>Loading orders...</p>;

  return (
    <div className="mt-4 pt-4">
      <h3>Orders List</h3>

      <table className="table table-striped">
        <thead>
          <tr>
            <th>ID</th>
            <th>Customer</th>
            <th>Total</th>
            <th>Status</th>
            <th style={{ width: 180 }}>Actions</th>
          </tr>
        </thead>

        <tbody>
          {orders.length === 0 && (
            <tr>
              <td colSpan="5" className="text-center">
                No orders found
              </td>
            </tr>
          )}

          {orders.map((o) => (
            <tr key={o.id}>
              <td>{o.id}</td>
              <td>{o.customer?.name}</td>
              <td>{o.total}</td>
              <td>
                <span
                  className={`badge ${
                    o.status === "confirmed"
                      ? "badge-success"
                      : o.status === "cancelled"
                        ? "badge-danger"
                        : "badge-secondary"
                  }`}
                >
                  {o.status}
                </span>
              </td>

              <td>
                {/* Confirm */}
                <button
                  className="btn btn-sm btn-success mr-2"
                  disabled={o.status !== "pending"}
                  onClick={() => handleConfirm(o.id)}
                >
                  Confirm
                </button>

                {/* Cancel */}
                <button
                  className="btn btn-sm btn-danger"
                  disabled={o.status === "cancelled"}
                  onClick={() => handleCancel(o.id)}
                >
                  Cancel
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default OrdersList;

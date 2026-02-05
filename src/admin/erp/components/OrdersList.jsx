// src/admin/erp/components/OrdersList.jsx
import React, { useEffect, useState } from "react";
import api from "../../../services/axios";
import { notifyError, notifySuccess } from "../../../utils/notify";

const OrdersList = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null); // لتحديد الأوردر الجاري معالجته

  // Fetch Orders
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

  const handleConfirm = async (orderId) => {
    if (!window.confirm("Are you sure you want to confirm this order?")) return;

    setProcessingId(orderId);
    try {
      await api.post(`/erp/orders/${orderId}/confirm`);
      notifySuccess("Order confirmed successfully");
      fetchOrders(); // تحديث القائمة بعد التأكيد
    } catch (err) {
      console.error(err);
      notifyError(err.response?.data?.msg || "Failed to confirm order");
    } finally {
      setProcessingId(null);
    }
  };

  const handleCancel = async (orderId) => {
    if (!window.confirm("Are you sure you want to cancel this order?")) return;

    setProcessingId(orderId);
    try {
      await api.post(`/erp/orders/${orderId}/cancel`);
      notifySuccess("Order cancelled successfully");
      fetchOrders(); // تحديث القائمة بعد الإلغاء
    } catch (err) {
      console.error(err);
      notifyError(err.response?.data?.msg || "Failed to cancel order");
    } finally {
      setProcessingId(null);
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
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id}>
              <td>{o.id}</td>
              <td>{o.customer?.name || "N/A"}</td>
              <td>{o.total}</td>
              <td>{o.status}</td>
              <td>
                {o.status === "pending" && (
                  <>
                    <button
                      className="btn btn-sm btn-success mr-2"
                      onClick={() => handleConfirm(o.id)}
                      disabled={processingId === o.id}
                    >
                      Confirm
                    </button>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleCancel(o.id)}
                      disabled={processingId === o.id}
                    >
                      Cancel
                    </button>
                  </>
                )}

                {o.status === "confirmed" && o.invoice && (
                  <a
                    href={`/admin/erp/invoices/${o.invoice.id}`}
                    className="btn btn-sm btn-primary"
                  >
                    View Invoice
                  </a>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default OrdersList;

import React, { useEffect, useState } from "react";
import api from "../../../services/axios";
import { notifyError, notifySuccess } from "../../../utils/notify";
import { useNavigate } from "react-router-dom";

const OrdersList = () => {
  const navigate = useNavigate();
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

  if (loading)
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: "200px" }}
      >
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );

  return (
    <div className="container mt-4">
      <h3 className="mb-4">Orders List</h3>

      {/* Responsive table */}
      <div className="table-responsive shadow rounded">
        <table className="table table-striped table-hover align-middle">
          <thead className="table-light">
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
                <td>{o.customer?.name || "-"}</td>
                <td>${o.total}</td>
                <td>
                  {o.status === "confirmed" && (
                    <span className="badge bg-success">{o.status}</span>
                  )}
                  {o.status === "cancelled" && (
                    <span className="badge bg-danger">{o.status}</span>
                  )}
                  {o.status !== "confirmed" && o.status !== "cancelled" && (
                    <span className="badge bg-warning text-dark">
                      {o.status}
                    </span>
                  )}
                </td>
                <td className="d-flex flex-wrap gap-2">
                  <button
                    className="btn btn-success btn-sm"
                    onClick={() => handleConfirm(o.id)}
                    disabled={
                      o.status === "confirmed" || o.status === "cancelled"
                    }
                  >
                    Confirm
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleCancel(o.id)}
                    disabled={o.status === "cancelled"}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => navigate(`/admin/erp/orders/${o.id}`)}
                  >
                    Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OrdersList;

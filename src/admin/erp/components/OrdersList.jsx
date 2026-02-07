import React, { useEffect, useState } from "react";
import api from "../../../services/axios";
import { notifyError, notifySuccess } from "../../../utils/notify";
import { Link } from "react-router-dom";
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
              <td>
                <button
                  className="btn btn-link p-0"
                  onClick={() => navigate(`/admin/erp/orders/${o.id}`)}
                >
                  {o.id}
                </button>
              </td>

              <td>{o.customer?.name}</td>
              <td>{o.total}</td>
              <td>{o.status}</td>
              <td>
                <button
                  className="btn btn-success btn-sm mr-1"
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
                  className="btn btn-primary"
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
  );
};

export default OrdersList;

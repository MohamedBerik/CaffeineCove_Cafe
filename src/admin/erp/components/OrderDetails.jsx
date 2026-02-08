import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../../services/axios";
import { notifyError, notifySuccess } from "../../../utils/notify";

const OrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <p>Loading...</p>;
  if (!order) return <p>Order not found</p>;

  const canConfirm =
    order.status === "pending" &&
    !order.invoice &&
    order.items &&
    order.items.length > 0;

  const canCancel = order.status === "pending";

  return (
    <div className="container mt-4 pt-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3>Order #{order.id}</h3>

        <button
          className="btn btn-secondary btn-sm"
          onClick={() => navigate(-1)}
        >
          Back
        </button>
      </div>

      <div className="card mb-3">
        <div className="card-body">
          <p>
            <strong>Status:</strong> {order.status}
          </p>
          <p>
            <strong>Customer:</strong> {order.customer?.name}
          </p>
          <p>
            <strong>Total:</strong> {order.total}
          </p>

          {order.invoice && (
            <p>
              <strong>Invoice ID:</strong> {order.invoice.id}
            </p>
          )}
        </div>
      </div>

      <h5>Items</h5>

      <table className="table table-bordered">
        <thead>
          <tr>
            <th>#</th>
            <th>Product</th>
            <th>Qty</th>
            <th>Unit price</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item, i) => (
            <tr key={item.id}>
              <td>{i + 1}</td>
              <td>{item.product?.title_en}</td>
              <td>{item.quantity}</td>
              <td>{item.unit_price}</td>
              <td>{item.total}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-3 d-flex gap-2">
        <button
          className="btn btn-success"
          disabled={!canConfirm}
          onClick={handleConfirm}
        >
          Confirm & create invoice
        </button>

        <button
          className="btn btn-danger"
          disabled={!canCancel}
          onClick={handleCancel}
        >
          Cancel order
        </button>
      </div>

      {!canConfirm && (
        <div className="alert alert-secondary mt-3">
          Confirm is disabled unless the order is <b>pending</b>, has items and
          has no invoice.
        </div>
      )}
    </div>
  );
};

export default OrderDetails;

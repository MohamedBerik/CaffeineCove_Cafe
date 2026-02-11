import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../../services/axios";
import { notifyError } from "../../../utils/notify";

const PurchaseOrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [po, setPo] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchPO = async () => {
    try {
      const res = await api.get(`/erp/purchase-orders/${id}`);
      setPo(res.data);
    } catch (e) {
      console.error(e);
      notifyError("Failed to load purchase order");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPO();
  }, [id]);

  if (loading) return <p>Loading purchase order...</p>;

  if (!po) return <p>Purchase order not found</p>;

  const totalPaid = po.payments?.reduce((s, p) => s + Number(p.amount), 0) || 0;

  const remaining = Math.max(Number(po.total) - totalPaid, 0);

  return (
    <div className="container mt-4">
      <button className="btn btn-link mb-3" onClick={() => navigate(-1)}>
        ← Back
      </button>

      <h3>Purchase Order #{po.number}</h3>

      <div className="mb-3">
        <strong>Supplier:</strong> {po.supplier?.name}
        <br />
        <strong>Status:</strong> {po.status}
        <br />
        <strong>Total:</strong> ${Number(po.total).toFixed(2)}
        <br />
        <strong>Paid:</strong> ${totalPaid.toFixed(2)}
        <br />
        <strong>Remaining:</strong> ${remaining.toFixed(2)}
      </div>

      <hr />

      <h5>Items</h5>

      <table className="table table-bordered">
        <thead>
          <tr>
            <th>#</th>
            <th>Product</th>
            <th>Qty</th>
            <th>Unit cost</th>
            <th>Line total</th>
          </tr>
        </thead>
        <tbody>
          {po.items.map((item, i) => (
            <tr key={item.id}>
              <td>{i + 1}</td>
              <td>{item.product?.title_en ?? item.product_id}</td>
              <td>{item.quantity}</td>
              <td>${Number(item.unit_cost).toFixed(2)}</td>
              <td>${Number(item.total).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <hr />

      <h5>Payments</h5>

      {po.payments && po.payments.length > 0 ? (
        <table className="table table-sm">
          <thead>
            <tr>
              <th>ID</th>
              <th>Amount</th>
              <th>Method</th>
              <th>Paid at</th>
            </tr>
          </thead>
          <tbody>
            {po.payments.map((p) => (
              <tr key={p.id}>
                <td>{p.id}</td>
                <td>${Number(p.amount).toFixed(2)}</td>
                <td>{p.method}</td>
                <td>{p.paid_at}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No payments yet</p>
      )}
    </div>
  );
};

export default PurchaseOrderDetails;

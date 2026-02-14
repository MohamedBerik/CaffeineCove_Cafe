import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../../services/axios";
import { notifyError, notifySuccess } from "../../../utils/notify";

const PurchaseOrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [po, setPo] = useState(null);
  const [loading, setLoading] = useState(true);

  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("cash");
  const [payLoading, setPayLoading] = useState(false);
  const [receiveLoading, setReceiveLoading] = useState(false);

  const fetchPO = async () => {
    try {
      setLoading(true);
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

  const handleReceive = async () => {
    if (!window.confirm("Receive this purchase order and add stock?")) return;

    try {
      setReceiveLoading(true);
      const res = await api.post(`/erp/purchase-orders/${id}/receive`);
      notifySuccess(res.data.msg || "Received successfully");
      fetchPO();
    } catch (e) {
      console.error(e);
      notifyError(e.response?.data?.msg || "Receive failed");
    } finally {
      setReceiveLoading(false);
    }
  };

  const handlePay = async () => {
    if (!payAmount || Number(payAmount) <= 0) {
      notifyError("Enter valid amount");
      return;
    }

    try {
      setPayLoading(true);

      const res = await api.post(`/erp/purchase-orders/${id}/pay`, {
        amount: payAmount,
        method: payMethod,
      });

      notifySuccess(res.data.msg || "Payment recorded");

      setPayAmount("");
      fetchPO();
    } catch (e) {
      console.error(e);
      notifyError(e.response?.data?.msg || "Payment failed");
    } finally {
      setPayLoading(false);
    }
  };

  if (loading) return <p>Loading purchase order...</p>;

  if (!po) return <p>Purchase order not found</p>;

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
        <strong>Paid:</strong> ${Number(po.total_paid).toFixed(2)}
        <br />
        <strong>Remaining:</strong> ${Number(po.remaining).toFixed(2)}
        <br />
        <strong>Received:</strong> {po.is_received ? "Yes" : "No"}
      </div>

      <hr />

      {/* Receive section */}
      {!po.is_received && (
        <div className="mb-4">
          <button
            className="btn btn-outline-success"
            disabled={receiveLoading}
            onClick={handleReceive}
          >
            {receiveLoading ? "Receiving..." : "Receive items to stock"}
          </button>
        </div>
      )}

      {/* Pay section */}
      {Number(po.remaining) > 0 && (
        <div className="card p-3 mb-4">
          <h5>Pay supplier</h5>

          <div className="row">
            <div className="col-md-4">
              <input
                type="number"
                className="form-control"
                placeholder="Amount"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                min="0"
                step="0.01"
              />
            </div>

            <div className="col-md-4">
              <select
                className="form-select"
                value={payMethod}
                onChange={(e) => setPayMethod(e.target.value)}
              >
                <option value="cash">Cash</option>
                <option value="bank">Bank</option>
                <option value="card">Card</option>
              </select>
            </div>

            <div className="col-md-4">
              <button
                className="btn btn-primary w-100"
                disabled={payLoading}
                onClick={handlePay}
              >
                {payLoading ? "Saving..." : "Pay"}
              </button>
            </div>
          </div>
        </div>
      )}

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
                <td>
                  <button
                    className="btn btn-sm btn-outline-primary"
                    onClick={() => navigate(`/admin/erp/returnItems`)}
                    title="View details"
                  >
                    View
                  </button>
                </td>
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

// src/admin/erp/components/InvoiceDetails.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../../services/axios";
import { notifyError, notifySuccess } from "../../../utils/notify";

const InvoiceDetails = () => {
  const { id } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [payAmount, setPayAmount] = useState(0);
  const [refundAmount, setRefundAmount] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const fetchInvoice = () => {
    setLoading(true);
    api
      .get(`/erp/invoices/${id}`)
      .then((res) => setInvoice(res.data))
      .catch((err) => {
        console.error(err);
        notifyError("Failed to fetch invoice details");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchInvoice();
  }, [id]);

  if (loading) return <p>Loading invoice details...</p>;
  if (!invoice) return <p>Invoice not found</p>;

  const { number, customer, total, status, items, payments, refunds } = invoice;

  const totalPaid = payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
  const totalRefunded = refunds?.reduce((sum, r) => sum + r.amount, 0) || 0;
  const remaining = Math.max(0, total - totalPaid + totalRefunded);

  const handlePay = async () => {
    if (payAmount <= 0) return notifyError("Enter a valid amount");
    setSubmitting(true);
    try {
      await api.post(`/erp/invoices/${id}/pay`, { amount: payAmount });
      notifySuccess("Payment registered successfully");
      setPayAmount(0);
      fetchInvoice();
    } catch (err) {
      console.error(err);
      notifyError("Failed to register payment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRefund = async () => {
    if (refundAmount <= 0) return notifyError("Enter a valid amount");
    setSubmitting(true);
    try {
      await api.post(`/erp/invoices/${id}/refund`, { amount: refundAmount });
      notifySuccess("Refund registered successfully");
      setRefundAmount(0);
      fetchInvoice();
    } catch (err) {
      console.error(err);
      notifyError("Failed to register refund");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-4 pt-4">
      <h3>Invoice #{number}</h3>
      <p>
        <strong>Customer:</strong> {customer?.name || "N/A"}
      </p>
      <p>
        <strong>Status:</strong> {status}
      </p>
      <p>
        <strong>Total:</strong> {total}
      </p>
      <p>
        <strong>Paid:</strong> {totalPaid}
      </p>
      <p>
        <strong>Refunded:</strong> {totalRefunded}
      </p>
      <p>
        <strong>Remaining:</strong> {remaining}
      </p>

      {/* Items Table */}
      <h5 className="mt-4">Items</h5>
      <table className="table table-striped">
        <thead>
          <tr>
            <th>Product</th>
            <th>Quantity</th>
            <th>Unit Price</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {items?.map((item) => (
            <tr key={item.id}>
              <td>{item.product?.title_en || "N/A"}</td>
              <td>{item.quantity}</td>
              <td>{item.unit_price}</td>
              <td>{item.total}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Payments Table */}
      <h5 className="mt-4">Payments</h5>
      <table className="table table-striped">
        <thead>
          <tr>
            <th>ID</th>
            <th>Amount</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {payments?.map((p) => (
            <tr key={p.id}>
              <td>{p.id}</td>
              <td>{p.amount}</td>
              <td>{p.created_at}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Refunds Table */}
      <h5 className="mt-4">Refunds</h5>
      <table className="table table-striped">
        <thead>
          <tr>
            <th>ID</th>
            <th>Amount</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {refunds?.map((r) => (
            <tr key={r.id}>
              <td>{r.id}</td>
              <td>{r.amount}</td>
              <td>{r.created_at}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Payment / Refund Form */}
      <div className="mt-4">
        <div className="mb-2">
          <label>Pay Amount:</label>
          <input
            type="number"
            value={payAmount}
            onChange={(e) => setPayAmount(Number(e.target.value))}
            className="form-control mb-2"
          />
          <button
            className="btn btn-success"
            onClick={handlePay}
            disabled={submitting || payAmount <= 0}
          >
            {submitting ? "Processing..." : "Pay"}
          </button>
        </div>

        <div className="mb-2 mt-3">
          <label>Refund Amount:</label>
          <input
            type="number"
            value={refundAmount}
            onChange={(e) => setRefundAmount(Number(e.target.value))}
            className="form-control mb-2"
          />
          <button
            className="btn btn-warning"
            onClick={handleRefund}
            disabled={submitting || refundAmount <= 0}
          >
            {submitting ? "Processing..." : "Refund"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvoiceDetails;

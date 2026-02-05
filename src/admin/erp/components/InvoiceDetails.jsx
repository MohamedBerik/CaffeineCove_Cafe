// src/admin/erp/components/InvoiceDetails.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../../services/axios";
import { notifyError } from "../../../utils/notify";

const InvoiceDetails = () => {
  const { id } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get(`/erp/invoices/${id}`)
      .then((res) => setInvoice(res.data))
      .catch((err) => {
        console.error(err);
        notifyError("Failed to fetch invoice details");
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p>Loading invoice details...</p>;
  if (!invoice) return <p>Invoice not found</p>;

  const { number, customer, total, status, items, payments, refunds } = invoice;

  const totalPaid = payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
  const totalRefunded = refunds?.reduce((sum, r) => sum + r.amount, 0) || 0;
  const remaining = Math.max(0, total - totalPaid + totalRefunded);

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
    </div>
  );
};

export default InvoiceDetails;

import React, { useEffect, useState } from "react";
import api from "../../../services/axios";
import { notifyError, notifySuccess } from "../../../utils/notify";

const InvoicesList = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payAmount, setPayAmount] = useState(0);
  const [payMethod, setPayMethod] = useState("cash");
  const [refundAmount, setRefundAmount] = useState(0);
  const [refundMethod, setRefundMethod] = useState("cash");

  const fetchInvoices = () => {
    setLoading(true);
    api
      .get("/erp/invoices")
      .then((res) => setInvoices(res.data))
      .catch((err) => {
        console.error(err);
        notifyError("Failed to fetch invoices");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handlePay = async (invoiceId) => {
    try {
      const res = await api.post(`/erp/invoices/${invoiceId}/pay`, {
        amount: payAmount,
        method: payMethod,
      });
      notifySuccess(res.data.msg);
      fetchInvoices();
    } catch (err) {
      console.error(err);
      notifyError(err.response?.data?.msg || "Payment failed");
    }
  };

  const handleRefund = async (invoiceId) => {
    try {
      const res = await api.post(`/erp/invoices/${invoiceId}/refund`, {
        amount: refundAmount,
        method: refundMethod,
      });
      notifySuccess(res.data.msg);
      fetchInvoices();
    } catch (err) {
      console.error(err);
      notifyError(err.response?.data?.msg || "Refund failed");
    }
  };

  if (loading) return <p>Loading invoices...</p>;

  return (
    <div className="mt-4 pt-4">
      <h3>Invoices List</h3>
      <table className="table table-striped">
        <thead>
          <tr>
            <th>ID</th>
            <th>Customer</th>
            <th>Total</th>
            <th>Paid</th>
            <th>Refunded</th>
            <th>Remaining</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((inv) => (
            <tr key={inv.id}>
              <td>{inv.id}</td>
              <td>{inv.customer.name}</td>
              <td>{inv.total}</td>
              <td>{inv.total_paid}</td>
              <td>{inv.total_refunded}</td>
              <td>{inv.remaining}</td>
              <td>{inv.status}</td>
              <td>
                <div className="d-flex flex-column">
                  <div className="mb-2">
                    <input
                      type="number"
                      placeholder="Pay amount"
                      value={payAmount}
                      onChange={(e) => setPayAmount(e.target.value)}
                      className="form-control mb-1"
                    />
                    <select
                      value={payMethod}
                      onChange={(e) => setPayMethod(e.target.value)}
                      className="form-control mb-1"
                    >
                      <option value="cash">Cash</option>
                      <option value="card">Card</option>
                      <option value="bank">Bank</option>
                    </select>
                    <button
                      className="btn btn-success btn-sm"
                      onClick={() => handlePay(inv.id)}
                      disabled={inv.status === "paid"}
                    >
                      Pay
                    </button>
                  </div>

                  <div>
                    <input
                      type="number"
                      placeholder="Refund amount"
                      value={refundAmount}
                      onChange={(e) => setRefundAmount(e.target.value)}
                      className="form-control mb-1"
                    />
                    <select
                      value={refundMethod}
                      onChange={(e) => setRefundMethod(e.target.value)}
                      className="form-control mb-1"
                    >
                      <option value="cash">Cash</option>
                      <option value="card">Card</option>
                      <option value="bank">Bank</option>
                    </select>
                    <button
                      className="btn btn-warning btn-sm"
                      onClick={() => handleRefund(inv.id)}
                      disabled={inv.status === "unpaid" && inv.total_paid === 0}
                    >
                      Refund
                    </button>
                  </div>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default InvoicesList;

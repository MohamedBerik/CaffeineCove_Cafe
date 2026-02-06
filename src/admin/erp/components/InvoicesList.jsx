import React, { useEffect, useState } from "react";
import api from "../../../services/axios";
import { notifyError, notifySuccess } from "../../../utils/notify";

const InvoicesList = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  const [payAmounts, setPayAmounts] = useState({});
  const [refundAmounts, setRefundAmounts] = useState({});
  const [payMethod, setPayMethod] = useState("cash");

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
    const amount = payAmounts[invoiceId];
    try {
      const res = await api.post(`/erp/invoices/${invoiceId}/pay`, {
        amount,
        method: payMethod,
      });
      notifySuccess(res.data.msg);
      fetchInvoices();
    } catch (err) {
      console.error(err);
      notifyError(err.response?.data?.msg || "Payment failed");
    }
  };

  const handleRefund = async (paymentId) => {
    const amount = refundAmounts[paymentId];
    try {
      const res = await api.post(`/erp/payments/${paymentId}/refund`, {
        amount,
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
                  {/* Pay Section */}
                  <div className="mb-2">
                    <input
                      type="number"
                      placeholder="Pay amount"
                      value={payAmounts[inv.id] || ""}
                      onChange={(e) =>
                        setPayAmounts({
                          ...payAmounts,
                          [inv.id]: e.target.value,
                        })
                      }
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

                  {/* Refund Section */}
                  {inv.payments &&
                    inv.payments.length > 0 &&
                    inv.payments.map((p) => (
                      <div
                        key={p.id}
                        className="d-flex align-items-center mb-1"
                      >
                        <span className="me-2">
                          #{p.id} - {p.amount}
                        </span>
                        <input
                          type="number"
                          placeholder="Refund amount"
                          value={refundAmounts[p.id] || ""}
                          onChange={(e) =>
                            setRefundAmounts({
                              ...refundAmounts,
                              [p.id]: e.target.value,
                            })
                          }
                          className="form-control me-1"
                        />
                        <button
                          className="btn btn-warning btn-sm"
                          onClick={() => handleRefund(p.id)}
                        >
                          Refund
                        </button>
                      </div>
                    ))}
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

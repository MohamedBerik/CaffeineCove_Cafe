import React, { useEffect, useState } from "react";
import api from "../../../services/axios";
import { notifyError, notifySuccess } from "../../../utils/notify";
import { useNavigate } from "react-router-dom";

const InvoicesList = () => {
  const navigate = useNavigate();

  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  // pay per invoice
  const [payAmounts, setPayAmounts] = useState({});
  const [payMethods, setPayMethods] = useState({});

  // refund per payment
  const [refundAmounts, setRefundAmounts] = useState({});

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

    if (!amount || Number(amount) <= 0) {
      notifyError("Enter valid payment amount");
      return;
    }

    try {
      const res = await api.post(`/erp/invoices/${invoiceId}/pay`, {
        amount: amount,
        method: payMethods[invoiceId] || "cash",
      });

      notifySuccess(res.data.msg);
      setPayAmounts((prev) => ({ ...prev, [invoiceId]: "" }));
      fetchInvoices();
    } catch (err) {
      console.error(err);
      notifyError(err.response?.data?.msg || "Payment failed");
    }
  };

  const handleRefund = async (paymentId) => {
    const amount = refundAmounts[paymentId];

    if (!amount || Number(amount) <= 0) {
      notifyError("Enter valid refund amount");
      return;
    }

    try {
      const res = await api.post(`/erp/payments/${paymentId}/refund`, {
        amount: amount,
      });

      notifySuccess(res.data.msg);
      setRefundAmounts((prev) => ({ ...prev, [paymentId]: "" }));
      fetchInvoices();
    } catch (err) {
      console.error(err);
      notifyError(err.response?.data?.msg || "Refund failed");
    }
  };

  if (loading) return <p>Loading invoices...</p>;

  return (
    <div className="mt-4 pt-4">
      <h3>Invoices</h3>

      <table className="table table-bordered align-middle">
        <thead>
          <tr>
            <th>ID</th>
            <th>Customer</th>
            <th>Total</th>
            <th>Paid</th>
            <th>Refunded</th>
            <th>Remaining</th>
            <th>Status</th>
            <th style={{ width: 420 }}>Actions</th>
          </tr>
        </thead>

        <tbody>
          {invoices.map((inv) => (
            <tr key={inv.id}>
              <td>
                <button
                  className="btn btn-link p-0"
                  onClick={() => navigate(`/admin/erp/invoices/${inv.id}`)}
                >
                  {inv.id}
                </button>
              </td>

              <td>{inv.customer?.name}</td>
              <td>{inv.total}</td>
              <td>{inv.total_paid}</td>
              <td>{inv.total_refunded}</td>
              <td>{inv.remaining}</td>
              <td>{inv.status}</td>

              <td>
                {/* ================== PAY ================== */}

                <div className="border rounded p-2 mb-2">
                  <strong>Pay invoice</strong>

                  <input
                    type="number"
                    className="form-control form-control-sm my-1"
                    placeholder="Amount"
                    value={payAmounts[inv.id] || ""}
                    onChange={(e) =>
                      setPayAmounts({
                        ...payAmounts,
                        [inv.id]: e.target.value,
                      })
                    }
                  />

                  <select
                    className="form-control form-control-sm my-1"
                    value={payMethods[inv.id] || "cash"}
                    onChange={(e) =>
                      setPayMethods({
                        ...payMethods,
                        [inv.id]: e.target.value,
                      })
                    }
                  >
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="bank">Bank</option>
                  </select>

                  <button
                    className="btn btn-success btn-sm"
                    disabled={inv.remaining <= 0}
                    onClick={() => handlePay(inv.id)}
                  >
                    Pay
                  </button>
                </div>

                {/* ================== PAYMENTS + REFUNDS ================== */}

                <div className="border rounded p-2">
                  <strong>Payments</strong>

                  {inv.payments && inv.payments.length > 0 ? (
                    inv.payments.map((p) => {
                      const refundable =
                        Number(p.amount) - Number(p.refunded_amount || 0);

                      return (
                        <div key={p.id} className="border rounded p-2 my-2">
                          <div className="small">
                            <div>
                              <strong>Payment #{p.id}</strong>
                            </div>
                            <div>Amount: {p.amount}</div>
                            <div>Refunded: {p.refunded_amount || 0}</div>
                            <div>Remaining: {refundable}</div>
                            <div>Method: {p.method}</div>
                          </div>

                          {refundable > 0 && (
                            <>
                              <input
                                type="number"
                                className="form-control form-control-sm my-1"
                                placeholder="Refund amount"
                                value={refundAmounts[p.id] || ""}
                                onChange={(e) =>
                                  setRefundAmounts({
                                    ...refundAmounts,
                                    [p.id]: e.target.value,
                                  })
                                }
                              />

                              <button
                                className="btn btn-warning btn-sm"
                                onClick={() => handleRefund(p.id)}
                              >
                                Refund
                              </button>
                            </>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-muted small mt-1">No payments yet</div>
                  )}
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

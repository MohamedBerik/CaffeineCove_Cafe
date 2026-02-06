import React, { useEffect, useState } from "react";
import api from "../../../services/axios";
import { notifyError, notifySuccess } from "../../../utils/notify";
import { useNavigate } from "react-router-dom";

const InvoicesList = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payAmounts, setPayAmounts] = useState({});
  const [payMethods, setPayMethods] = useState({});

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
        amount: payAmounts[invoiceId],
        method: payMethods[invoiceId] || "cash",
      });
      notifySuccess(res.data.msg);
      fetchInvoices();
    } catch (err) {
      console.error(err);
      notifyError(err.response?.data?.msg || "Payment failed");
    }
  };

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
                <input
                  type="number"
                  placeholder="Pay amount"
                  value={payAmounts[inv.id] || ""}
                  onChange={(e) =>
                    setPayAmounts({ ...payAmounts, [inv.id]: e.target.value })
                  }
                  className="form-control mb-1"
                />
                <select
                  value={payMethods[inv.id] || "cash"}
                  onChange={(e) =>
                    setPayMethods({ ...payMethods, [inv.id]: e.target.value })
                  }
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
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default InvoicesList;

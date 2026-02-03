import { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import api from "../../services/axios";
import { toast } from "react-toastify";

export default function InvoiceDetails() {
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [invoice, setInvoice] = useState(null);

  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("");

  const [refundAmount, setRefundAmount] = useState("");
  const [selectedPayment, setSelectedPayment] = useState("");

  const fetchInvoice = async () => {
    try {
      setLoading(true);

      const res = await api.get(`/erp/invoices/${id}/full`);
      setInvoice(res.data.invoice);
    } catch (e) {
      toast.error("Failed to load invoice");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoice();
  }, [id]);

  const totalPaid = useMemo(() => {
    if (!invoice) return 0;
    return invoice.payments.reduce((s, p) => s + parseFloat(p.amount), 0);
  }, [invoice]);

  const totalRefunded = useMemo(() => {
    if (!invoice) return 0;
    return invoice.refunds.reduce((s, r) => s + parseFloat(r.amount), 0);
  }, [invoice]);

  const netPaid = totalPaid - totalRefunded;

  const handlePay = async (e) => {
    e.preventDefault();

    try {
      await api.post(`/erp/invoices/${id}/pay`, {
        amount: payAmount,
        method: payMethod || null,
      });

      toast.success("Payment recorded");
      setPayAmount("");
      setPayMethod("");
      fetchInvoice();
    } catch (e) {
      toast.error(e.response?.data?.msg || "Payment failed");
    }
  };

  const handleRefund = async (e) => {
    e.preventDefault();

    if (!selectedPayment) {
      toast.error("Select payment first");
      return;
    }

    try {
      await api.post(`/erp/payments/${selectedPayment}/refund`, {
        amount: refundAmount,
      });

      toast.success("Refund recorded");
      setRefundAmount("");
      setSelectedPayment("");
      fetchInvoice();
    } catch (e) {
      toast.error(e.response?.data?.msg || "Refund failed");
    }
  };

  if (loading) return <p>Loading...</p>;
  if (!invoice) return null;

  return (
    <div>
      <h2>Invoice {invoice.number}</h2>

      <p>Status: {invoice.status}</p>
      <p>Total: {invoice.total}</p>
      <p>Issued at: {invoice.issued_at}</p>

      <hr />

      <h3>Summary</h3>
      <p>Total paid: {totalPaid}</p>
      <p>Total refunded: {totalRefunded}</p>
      <p>Net paid: {netPaid}</p>

      <hr />

      <h3>Payments</h3>

      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Amount</th>
            <th>Paid at</th>
          </tr>
        </thead>
        <tbody>
          {invoice.payments.map((p) => (
            <tr key={p.id}>
              <td>{p.id}</td>
              <td>{p.amount}</td>
              <td>{p.paid_at}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <hr />

      <h3>Refunds</h3>

      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Payment</th>
            <th>Amount</th>
            <th>Refunded at</th>
          </tr>
        </thead>
        <tbody>
          {invoice.refunds.map((r) => (
            <tr key={r.id}>
              <td>{r.id}</td>
              <td>{r.payment_id}</td>
              <td>{r.amount}</td>
              <td>{r.refunded_at}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <hr />

      <h3>Journal Entries</h3>

      {invoice.journal_entries.map((entry) => (
        <div
          key={entry.id}
          style={{ border: "1px solid #ccc", marginBottom: 10, padding: 10 }}
        >
          <div>
            #{entry.id} — {entry.entry_date} — {entry.description}
          </div>

          <table>
            <thead>
              <tr>
                <th>Account</th>
                <th>Debit</th>
                <th>Credit</th>
              </tr>
            </thead>
            <tbody>
              {entry.lines.map((l) => (
                <tr key={l.id}>
                  <td>{l.account_id}</td>
                  <td>{l.debit}</td>
                  <td>{l.credit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      <hr />

      <h3>Pay invoice</h3>

      <form onSubmit={handlePay}>
        <input
          type="number"
          step="0.01"
          placeholder="amount"
          value={payAmount}
          onChange={(e) => setPayAmount(e.target.value)}
        />

        <input
          type="text"
          placeholder="method (optional)"
          value={payMethod}
          onChange={(e) => setPayMethod(e.target.value)}
        />

        <button type="submit">Pay</button>
      </form>

      <hr />

      <h3>Refund payment</h3>

      <form onSubmit={handleRefund}>
        <select
          value={selectedPayment}
          onChange={(e) => setSelectedPayment(e.target.value)}
        >
          <option value="">Select payment</option>
          {invoice.payments.map((p) => (
            <option key={p.id} value={p.id}>
              Payment #{p.id} - {p.amount}
            </option>
          ))}
        </select>

        <input
          type="number"
          step="0.01"
          placeholder="refund amount"
          value={refundAmount}
          onChange={(e) => setRefundAmount(e.target.value)}
        />

        <button type="submit">Refund</button>
      </form>
    </div>
  );
}

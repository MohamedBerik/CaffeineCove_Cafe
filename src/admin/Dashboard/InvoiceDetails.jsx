import { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import api from "../../services/axios";
import { toast } from "react-toastify";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
} from "../../utils/formatters";

// يمكنك استيراد مكتبة UI مثل Tailwind CSS أو استخدام styled-components
// هذه الأمثلة تستخدم كلاسات Tailwind CSS مبسطة

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
  const balanceDue = parseFloat(invoice?.total || 0) - netPaid;
  const isFullyPaid = balanceDue <= 0;

  const handlePay = async (e) => {
    e.preventDefault();

    if (!payAmount || parseFloat(payAmount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (!payMethod.trim()) {
      toast.error("Payment method is required");
      return;
    }

    try {
      await api.post(`/erp/invoices/${id}/pay`, {
        amount: payAmount,
        method: payMethod,
      });

      toast.success("Payment recorded successfully");
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

    if (!refundAmount || parseFloat(refundAmount) <= 0) {
      toast.error("Please enter a valid refund amount");
      return;
    }

    try {
      await api.post(`/erp/payments/${selectedPayment}/refund`, {
        amount: refundAmount,
      });

      toast.success("Refund recorded successfully");
      setRefundAmount("");
      setSelectedPayment("");
      fetchInvoice();
    } catch (e) {
      toast.error(e.response?.data?.msg || "Refund failed");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold text-gray-600">
          Invoice not found
        </h2>
        <p className="text-gray-500 mt-2">
          The requested invoice could not be loaded.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Invoice #{invoice.number}
          </h1>
          <p className="text-gray-600 mt-2">ID: {invoice.id}</p>
        </div>
        <div className="flex flex-col items-end">
          <span
            className={`px-4 py-2 rounded-full font-semibold ${
              invoice.status === "paid"
                ? "bg-green-100 text-green-800"
                : invoice.status === "pending"
                  ? "bg-yellow-100 text-yellow-800"
                  : invoice.status === "overdue"
                    ? "bg-red-100 text-red-800"
                    : "bg-gray-100 text-gray-800"
            }`}
          >
            {invoice.status.toUpperCase()}
          </span>
          <p className="text-gray-600 mt-2">
            Issued: {formatDate(invoice.issued_at)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Invoice Details */}
        <div className="lg:col-span-2 space-y-8">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <p className="text-gray-500 text-sm font-medium">Invoice Total</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {formatCurrency(invoice.total)}
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <p className="text-gray-500 text-sm font-medium">Total Paid</p>
              <p className="text-2xl font-bold text-green-600 mt-2">
                {formatCurrency(totalPaid)}
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <p className="text-gray-500 text-sm font-medium">
                Total Refunded
              </p>
              <p className="text-2xl font-bold text-red-600 mt-2">
                {formatCurrency(totalRefunded)}
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <p className="text-gray-500 text-sm font-medium">Balance Due</p>
              <p className="text-2xl font-bold text-blue-600 mt-2">
                {formatCurrency(balanceDue)}
              </p>
              {isFullyPaid && (
                <span className="inline-block mt-2 text-sm text-green-600 font-medium">
                  ✓ Fully Paid
                </span>
              )}
            </div>
          </div>

          {/* Payments Section */}
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="px-6 py-4 border-b bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-900">Payments</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Method
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Paid At
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {invoice.payments.map((p) => (
                    <tr
                      key={p.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{p.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                        {formatCurrency(p.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {p.method || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDateTime(p.paid_at)}
                      </td>
                    </tr>
                  ))}
                  {invoice.payments.length === 0 && (
                    <tr>
                      <td
                        colSpan="4"
                        className="px-6 py-8 text-center text-gray-500"
                      >
                        No payments recorded
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Refunds Section */}
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="px-6 py-4 border-b bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-900">Refunds</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Refunded At
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {invoice.refunds.map((r) => (
                    <tr
                      key={r.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{r.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        Payment #{r.payment_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">
                        {formatCurrency(r.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDateTime(r.refunded_at)}
                      </td>
                    </tr>
                  ))}
                  {invoice.refunds.length === 0 && (
                    <tr>
                      <td
                        colSpan="4"
                        className="px-6 py-8 text-center text-gray-500"
                      >
                        No refunds recorded
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Journal Entries */}
          {invoice.journal_entries.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="px-6 py-4 border-b bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-900">
                  Journal Entries
                </h3>
              </div>
              <div className="p-6 space-y-6">
                {invoice.journal_entries.map((entry) => (
                  <div
                    key={entry.id}
                    className="border rounded-lg overflow-hidden"
                  >
                    <div className="px-4 py-3 bg-gray-50 border-b">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-900">
                          #{entry.id}
                        </span>
                        <span className="text-sm text-gray-500">
                          {formatDate(entry.entry_date)}
                        </span>
                      </div>
                      {entry.description && (
                        <p className="text-sm text-gray-600 mt-1">
                          {entry.description}
                        </p>
                      )}
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              Account
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              Debit
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              Credit
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {entry.lines.map((l) => (
                            <tr key={l.id}>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                {l.account_id}
                              </td>
                              <td className="px-4 py-3 text-sm text-blue-600 font-medium">
                                {l.debit ? formatCurrency(l.debit) : "-"}
                              </td>
                              <td className="px-4 py-3 text-sm text-green-600 font-medium">
                                {l.credit ? formatCurrency(l.credit) : "-"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Actions */}
        <div className="space-y-6">
          {/* Pay Invoice Card */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Record Payment
            </h3>
            <form onSubmit={handlePay} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={balanceDue}
                  placeholder="0.00"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                />
                {balanceDue > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    Balance due: {formatCurrency(balanceDue)}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Method *
                </label>
                <input
                  type="text"
                  placeholder="e.g., Cash, Card, Bank Transfer"
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={!payAmount || !payMethod || balanceDue <= 0}
                className="w-full py-2.5 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Record Payment
              </button>
            </form>
          </div>

          {/* Refund Payment Card */}
          {invoice.payments.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Issue Refund
              </h3>
              <form onSubmit={handleRefund} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Payment
                  </label>
                  <select
                    value={selectedPayment}
                    onChange={(e) => setSelectedPayment(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  >
                    <option value="">Choose a payment...</option>
                    {invoice.payments.map((p) => (
                      <option key={p.id} value={p.id}>
                        Payment #{p.id} - {formatCurrency(p.amount)} (
                        {formatDate(p.paid_at)})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Refund Amount
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="0.00"
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!selectedPayment || !refundAmount}
                  className="w-full py-2.5 px-4 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Issue Refund
                </button>
              </form>
            </div>
          )}

          {/* Quick Actions */}
          <div className="bg-gray-50 rounded-xl border p-6">
            <h4 className="font-medium text-gray-900 mb-4">Quick Actions</h4>
            <div className="space-y-3">
              <button
                onClick={fetchInvoice}
                className="w-full py-2 px-4 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 transition text-sm"
              >
                ↻ Refresh Data
              </button>
              <button
                onClick={() => window.print()}
                className="w-full py-2 px-4 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 transition text-sm"
              >
                🖨️ Print Invoice
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

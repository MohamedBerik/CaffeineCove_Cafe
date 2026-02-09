import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../../services/axios";
import { notifyError } from "../../../utils/notify";

const InvoiceDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchInvoice = async () => {
    try {
      const res = await api.get(`/erp/invoices/${id}/full`);
      setInvoice(res.data.invoice);
    } catch (e) {
      console.error(e);
      notifyError("Failed to load invoice");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoice();
  }, [id]);

  if (loading) return <p>Loading invoice...</p>;
  if (!invoice) return <p>Invoice not found</p>;
  const payments = invoice.payments || [];

  const refunds = payments.flatMap((p) => p.refunds || []);

  const paidAmount = payments.reduce((sum, p) => sum + Number(p.amount), 0);

  const refundedAmount = refunds.reduce((sum, r) => sum + Number(r.amount), 0);

  const netPaid = paidAmount - refundedAmount;

  return (
    <div className="container mt-4 pt-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3>Invoice #{invoice.number}</h3>

        <button
          className="btn btn-secondary btn-sm"
          onClick={() => navigate(-1)}
        >
          Back
        </button>
      </div>

      {/* ===== Basic info ===== */}
      <div className="card mb-3">
        <div className="card-body">
          <div>
            <strong>Status:</strong> {invoice.status}
          </div>
          <div>
            <strong>Total:</strong> {invoice.total}
          </div>
          <div>
            <strong>Issued at:</strong> {invoice.issued_at}
          </div>
          <div>
            <strong>Customer ID:</strong> {invoice.customer_id}
          </div>
        </div>
      </div>

      <div className="card mb-3">
        <div className="card-body">
          <div>
            <strong>Total:</strong> {invoice.total}
          </div>
          <div>
            <strong>Paid:</strong> {paidAmount}
          </div>
          <div>
            <strong>Refunded:</strong> {refundedAmount}
          </div>
          <div>
            <strong>Net paid:</strong> {netPaid}
          </div>
        </div>
      </div>

      {/* ===== Items ===== */}
      <div className="card mb-3">
        <div className="card-header">Items</div>
        <div className="card-body p-0">
          <table className="table mb-0">
            <thead>
              <tr>
                <th>#</th>
                <th>Product</th>
                <th>Qty</th>
                <th>Unit price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, i) => (
                <tr key={item.id}>
                  <td>{i + 1}</td>
                  <td>{item.product?.title_en}</td>
                  <td>{item.quantity}</td>
                  <td>{item.unit_price}</td>
                  <td>{item.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===== Payments ===== */}
      <div className="card mb-3">
        <div className="card-header">Payments</div>
        <div className="card-body p-0">
          {invoice.payments.length === 0 ? (
            <p className="p-3 mb-0">No payments yet.</p>
          ) : (
            <table className="table mb-0">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Paid at</th>
                </tr>
              </thead>
              <tbody>
                {invoice.payments.map((p) => (
                  <tr key={p.id}>
                    <td>{p.id}</td>
                    <td>{p.amount}</td>
                    <td>{p.method}</td>
                    <td>{p.paid_at}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ===== Refunds ===== */}
      <div className="card mb-3">
        <div className="card-header">Refunds</div>
        <div className="card-body p-0">
          {refunds.length === 0 ? (
            <p className="p-3 mb-0">No refunds.</p>
          ) : (
            <table className="table mb-0">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Amount</th>
                  <th>Refunded at</th>
                </tr>
              </thead>
              <tbody>
                {refunds.map((r) => (
                  <tr key={r.id}>
                    <td>{r.id}</td>
                    <td>{r.amount}</td>
                    <td>{r.refunded_at}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ===== Accounting entries ===== */}
      <div className="card mb-3">
        <div className="card-header">Journal entries</div>
        <div className="card-body p-0">
          {invoice.journal_entries?.length === 0 ? (
            <p className="p-3 mb-0">No journal entries.</p>
          ) : (
            invoice.journal_entries?.map((je) => (
              <div key={je.id} className="border-bottom p-2">
                <div>
                  <strong>Entry #{je.id}</strong> – {je.description}
                </div>

                <table className="table table-sm mb-0 mt-2">
                  <thead>
                    <tr>
                      <th>Account</th>
                      <th>Debit</th>
                      <th>Credit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {je.lines.map((l) => (
                      <tr key={l.id}>
                        <td>{l.account?.name ?? l.account_id}</td>
                        <td>{l.debit}</td>
                        <td>{l.credit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default InvoiceDetails;

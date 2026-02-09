import React, { useEffect, useMemo, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../../services/axios";
import { notifyError } from "../../../utils/notify";

const InvoiceDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const printRef = useRef(null);

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

  /* ================= SAFE DEFAULTS (before any return) ================= */

  const payments = invoice?.payments || [];
  const items = invoice?.items || [];

  const refunds = useMemo(() => {
    return payments.flatMap((p) => p.refunds || []);
  }, [payments]);

  const grossPaid = useMemo(() => {
    return payments.reduce((sum, p) => sum + Number(p.amount), 0);
  }, [payments]);

  const refundedTotal = useMemo(() => {
    return payments.reduce(
      (sum, p) =>
        sum + (p.refunds?.reduce((s, r) => s + Number(r.amount), 0) || 0),
      0,
    );
  }, [payments]);

  const netPaid = useMemo(() => {
    return grossPaid - refundedTotal;
  }, [grossPaid, refundedTotal]);

  const remaining = useMemo(() => {
    if (!invoice) return 0;
    return Math.max(Number(invoice.total) - netPaid, 0);
  }, [invoice, netPaid]);

  const overpaid = useMemo(() => {
    if (!invoice) return 0;
    return Math.max(netPaid - Number(invoice.total), 0);
  }, [invoice, netPaid]);

  const paymentRows = useMemo(() => {
    if (!invoice) return [];

    let runningNet = 0;

    return payments.map((p) => {
      const refunded =
        p.refunds?.reduce((s, r) => s + Number(r.amount), 0) || 0;

      const net = Number(p.amount) - refunded;

      runningNet += net;

      const remainingAfter = Math.max(Number(invoice.total) - runningNet, 0);

      return {
        ...p,
        refunded,
        net,
        runningNet,
        remainingAfter,
      };
    });
  }, [payments, invoice]);

  /* ================= PRINT ================= */

  const handlePrint = () => {
    if (!printRef.current) return;

    const printContents = printRef.current.innerHTML;
    const win = window.open("", "", "width=900,height=700");

    win.document.write(`
      <html>
        <head>
          <title>Invoice ${invoice?.number}</title>
          <link
            rel="stylesheet"
            href="https://cdn.jsdelivr.net/npm/bootstrap@4.6.2/dist/css/bootstrap.min.css"
          />
          <style>
            body { padding:20px; }
            .no-print { display:none !important; }
            table { font-size: 12px; }
          </style>
        </head>
        <body>
          ${printContents}
        </body>
      </html>
    `);

    win.document.close();
    win.focus();
    win.print();
    win.close();
  };

  /* ================= STATES ================= */

  if (loading) return <p className="p-4">Loading invoice...</p>;
  if (!invoice) return <p className="p-4">Invoice not found</p>;

  /* ================= UI ================= */

  return (
    <div className="container-fluid mt-4 px-3">
      {/* ================= Header ================= */}

      <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 no-print">
        <h4 className="mb-2 mb-md-0">Invoice details</h4>

        <div className="d-flex">
          <button
            className="btn btn-outline-secondary btn-sm mr-2"
            onClick={() => navigate(-1)}
          >
            Back
          </button>

          <button className="btn btn-primary btn-sm" onClick={handlePrint}>
            Print invoice
          </button>
        </div>
      </div>

      <div ref={printRef}>
        {/* ================= Invoice header ================= */}

        <div className="mb-3">
          <h5 className="mb-0">Invoice #{invoice.number}</h5>
        </div>

        {/* ================= Basic info ================= */}

        <div className="card mb-3">
          <div className="card-header font-weight-bold">
            Invoice information
          </div>

          <div className="card-body">
            <div className="row">
              <div className="col-sm-6 col-md-3 mb-3">
                <div className="text-muted">Status</div>
                <div className="font-weight-bold">{invoice.status}</div>
              </div>

              <div className="col-sm-6 col-md-3 mb-3">
                <div className="text-muted">Invoice total</div>
                <div className="font-weight-bold">{invoice.total}</div>
              </div>

              <div className="col-sm-6 col-md-3 mb-3">
                <div className="text-muted">Issued at</div>
                <div>{invoice.issued_at}</div>
              </div>

              <div className="col-sm-6 col-md-3 mb-3">
                <div className="text-muted">Customer</div>
                <div>{invoice.customer?.name ?? `#${invoice.customer_id}`}</div>
              </div>
            </div>
          </div>
        </div>

        {/* ================= Financial summary ================= */}

        <div className="card mb-3">
          <div className="card-header font-weight-bold">Financial summary</div>

          <div className="card-body">
            <div className="row">
              <div className="col-sm-6 col-md-3 mb-3">
                <div className="text-muted">Gross paid</div>
                <div className="font-weight-bold">{grossPaid}</div>
              </div>

              <div className="col-sm-6 col-md-3 mb-3">
                <div className="text-muted">Refunded</div>
                <div className="font-weight-bold">{refundedTotal}</div>
              </div>

              <div className="col-sm-6 col-md-3 mb-3">
                <div className="text-muted">Net paid</div>
                <div className="font-weight-bold">{netPaid}</div>
              </div>

              <div className="col-sm-6 col-md-3 mb-3">
                <div className="text-muted">Remaining balance</div>
                <div className="font-weight-bold">{remaining}</div>
              </div>

              {overpaid > 0 && (
                <div className="col-12 text-danger font-weight-bold">
                  Overpaid: {overpaid}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ================= Items ================= */}

        <div className="card mb-3">
          <div className="card-header font-weight-bold">Invoice items</div>

          <div className="table-responsive">
            <table className="table mb-0">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Product</th>
                  <th className="text-right">Qty</th>
                  <th className="text-right">Unit price</th>
                  <th className="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={item.id}>
                    <td>{i + 1}</td>
                    <td>{item.product?.title_en}</td>
                    <td className="text-right">{item.quantity}</td>
                    <td className="text-right">{item.unit_price}</td>
                    <td className="text-right">{item.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ================= Payments ================= */}

        <div className="card mb-3">
          <div className="card-header font-weight-bold">
            Payments & settlement
          </div>

          <div className="table-responsive">
            {paymentRows.length === 0 ? (
              <p className="p-3 mb-0">No payments yet.</p>
            ) : (
              <table className="table mb-0">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th className="text-right">Gross</th>
                    <th className="text-right">Refunded</th>
                    <th className="text-right">Net</th>
                    <th className="text-right">Paid so far</th>
                    <th className="text-right">Remaining after payment</th>
                    <th>Method</th>
                    <th>Paid at</th>
                  </tr>
                </thead>

                <tbody>
                  {paymentRows.map((p) => (
                    <tr key={p.id}>
                      <td>{p.id}</td>
                      <td className="text-right">{p.amount}</td>
                      <td className="text-right">{p.refunded}</td>
                      <td className="text-right">{p.net}</td>
                      <td className="text-right">{p.runningNet}</td>
                      <td className="text-right">{p.remainingAfter}</td>
                      <td>{p.method}</td>
                      <td>{p.paid_at}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* ================= Refunds ================= */}

        <div className="card mb-3">
          <div className="card-header font-weight-bold">
            Refund transactions
          </div>

          <div className="table-responsive">
            {refunds.length === 0 ? (
              <p className="p-3 mb-0">No refunds.</p>
            ) : (
              <table className="table mb-0">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th className="text-right">Amount</th>
                    <th>Refunded at</th>
                  </tr>
                </thead>
                <tbody>
                  {refunds.map((r) => (
                    <tr key={r.id}>
                      <td>{r.id}</td>
                      <td className="text-right">{r.amount}</td>
                      <td>{r.refunded_at}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* ================= Journal entries ================= */}

        <div className="card mb-3">
          <div className="card-header font-weight-bold">
            Accounting journal entries
          </div>

          <div className="card-body p-0">
            {invoice.journal_entries?.length === 0 ? (
              <p className="p-3 mb-0">No journal entries.</p>
            ) : (
              invoice.journal_entries?.map((je) => (
                <div key={je.id} className="border-bottom p-3">
                  <div className="mb-2">
                    <strong>Entry #{je.id}</strong> – {je.description}
                  </div>

                  <div className="table-responsive">
                    <table className="table table-sm mb-0">
                      <thead>
                        <tr>
                          <th>Account</th>
                          <th className="text-right">Debit</th>
                          <th className="text-right">Credit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {je.lines.map((l) => (
                          <tr key={l.id}>
                            <td>{l.account?.name ?? l.account_id}</td>
                            <td className="text-right">{l.debit}</td>
                            <td className="text-right">{l.credit}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceDetails;

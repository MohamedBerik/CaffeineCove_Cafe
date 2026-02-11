import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../../services/axios";
import { notifyError } from "../../../utils/notify";
import "./InvoiceDetails.css";

const InvoiceDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("overview");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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

  useEffect(() => fetchInvoice(), [location.key]);

  const handlePrint = () => window.print();

  if (loading)
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading invoice details...</p>
      </div>
    );

  if (!invoice)
    return (
      <div className="error-screen">
        <i className="fas fa-file-invoice-dollar"></i>
        <h3>Invoice not found</h3>
        <button className="btn btn-primary" onClick={() => navigate(-1)}>
          Go Back
        </button>
      </div>
    );

  const payments = invoice.payments || [];
  const refunds = payments.flatMap((p) => p.refunds || []);
  const grossPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const refundedTotal = payments.reduce(
    (sum, p) =>
      sum + (p.refunds?.reduce((s, r) => s + Number(r.amount), 0) || 0),
    0,
  );
  const netPaid = grossPaid - refundedTotal;
  const remaining = Math.max(Number(invoice.total) - netPaid, 0);
  const overpaid = Math.max(netPaid - Number(invoice.total), 0);

  const renderPaymentRows = () => {
    let runningNet = 0;
    return payments.map((p) => {
      const refundedPerPayment =
        p.refunds?.reduce((s, r) => s + Number(r.amount), 0) || 0;
      const netPerPayment = Number(p.amount) - refundedPerPayment;
      runningNet += netPerPayment;
      const remainingPerPayment = Math.max(
        Number(invoice.total) - runningNet,
        0,
      );
      const overpaidPerPayment = Math.max(
        runningNet - Number(invoice.total),
        0,
      );

      return (
        <tr key={p.id}>
          <td data-label="ID">{p.id}</td>
          <td data-label="Gross">{p.amount}</td>
          <td data-label="Refunded">{refundedPerPayment}</td>
          <td data-label="Net">{netPerPayment}</td>
          <td data-label="Remaining">{remainingPerPayment}</td>
          <td data-label="Overpaid">{overpaidPerPayment}</td>
          <td data-label="Method">
            <span className={`method-badge method-${p.method}`}>
              {p.method}
            </span>
          </td>
          <td data-label="Paid at">{p.paid_at}</td>
        </tr>
      );
    });
  };

  const renderMobileView = () => (
    <div className="invoice-details-mobile">
      <div className="mobile-header">
        <button className="btn-back" onClick={() => navigate(-1)}>
          <i className="fas fa-arrow-left"></i>
        </button>
        <h2>Invoice #{invoice.number}</h2>
        <button className="btn-print" onClick={handlePrint}>
          <i className="fas fa-print"></i>
        </button>
      </div>

      <div className="mobile-status">
        <span className={`status-badge status-${invoice.status}`}>
          {invoice.status}
        </span>
        <div className="amount-display">
          ${parseFloat(invoice.total).toFixed(2)}
        </div>
      </div>

      <div className="mobile-sections">
        {["overview", "items", "payments", "refunds", "journal"].map(
          (section) => (
            <button
              key={section}
              className={`section-tab ${activeSection === section ? "active" : ""}`}
              onClick={() => setActiveSection(section)}
            >
              {section.charAt(0).toUpperCase() + section.slice(1)}
            </button>
          ),
        )}
      </div>

      <div className="mobile-content">
        {activeSection === "overview" && (
          <div className="overview-card">
            <div className="info-row">
              <span>Customer:</span>
              <span>#{invoice.customer_id}</span>
            </div>
            <div className="info-row">
              <span>Issued:</span>
              <span>{invoice.issued_at}</span>
            </div>
            <div className="stats-grid">
              <div className="stat-item">
                <div className="stat-label">Gross Paid</div>
                <div className="stat-value">
                  ${parseFloat(grossPaid).toFixed(2)}
                </div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Refunded</div>
                <div className="stat-value">
                  ${parseFloat(refundedTotal).toFixed(2)}
                </div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Net Paid</div>
                <div className="stat-value">
                  ${parseFloat(netPaid).toFixed(2)}
                </div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Remaining</div>
                <div
                  className={`stat-value ${remaining > 0 ? "text-danger" : "text-success"}`}
                >
                  ${parseFloat(remaining).toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === "items" && (
          <div className="items-card">
            <h4>Invoice Items</h4>
            {invoice.items.map((item, i) => (
              <div key={item.id} className="item-row">
                <div className="item-header">
                  <span className="item-index">#{i + 1}</span>
                  <span className="item-title">
                    {item.product?.title_en || "N/A"}
                  </span>
                </div>
                <div className="item-details">
                  <div className="detail">
                    <span>Quantity:</span>
                    <span>{item.quantity}</span>
                  </div>
                  <div className="detail">
                    <span>Unit Price:</span>
                    <span>${parseFloat(item.unit_price).toFixed(2)}</span>
                  </div>
                  <div className="detail">
                    <span>Total:</span>
                    <span className="item-total">
                      ${parseFloat(item.total).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeSection === "payments" && (
          <div className="payments-card">
            <h4>Payments</h4>
            {payments.length === 0 ? (
              <p className="no-data">No payments yet</p>
            ) : (
              payments.map((p) => {
                const refunded =
                  p.refunds?.reduce((s, r) => s + Number(r.amount), 0) || 0;
                const net = Number(p.amount) - refunded;
                return (
                  <div key={p.id} className="payment-row">
                    <div className="payment-header">
                      <span className="payment-id">Payment #{p.id}</span>
                      <span className={`method-badge method-${p.method}`}>
                        {p.method}
                      </span>
                    </div>
                    <div className="payment-details">
                      <div className="detail">
                        <span>Gross:</span>
                        <span>${parseFloat(p.amount).toFixed(2)}</span>
                      </div>
                      <div className="detail">
                        <span>Refunded:</span>
                        <span>${parseFloat(refunded).toFixed(2)}</span>
                      </div>
                      <div className="detail">
                        <span>Net:</span>
                        <span className="text-success">
                          ${parseFloat(net).toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <div className="payment-date">{p.paid_at}</div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {activeSection === "refunds" && (
          <div className="refunds-card">
            <h4>Refunds</h4>
            {refunds.length === 0 ? (
              <p className="no-data">No refunds</p>
            ) : (
              refunds.map((r) => (
                <div key={r.id} className="refund-row">
                  <div className="refund-header">
                    <span className="refund-id">Refund #{r.id}</span>
                    <span className="refund-amount">
                      ${parseFloat(r.amount).toFixed(2)}
                    </span>
                  </div>
                  <div className="refund-date">{r.refunded_at}</div>
                </div>
              ))
            )}
          </div>
        )}

        {activeSection === "journal" && (
          <div className="journal-card">
            <h4>Journal Entries</h4>
            {invoice.journal_entries?.length === 0 ? (
              <p className="no-data">No journal entries</p>
            ) : (
              invoice.journal_entries?.map((je) => (
                <div key={je.id} className="journal-entry">
                  <div className="entry-header">
                    <span className="entry-id">Entry #{je.id}</span>
                    <span className="entry-desc">{je.description}</span>
                  </div>
                  {je.lines.map((l) => (
                    <div key={l.id} className="entry-line">
                      <span className="account">
                        {l.account?.name || l.account_id}
                      </span>
                      <div className="amounts">
                        <span className="debit">
                          ${parseFloat(l.debit).toFixed(2)}
                        </span>
                        <span className="credit">
                          ${parseFloat(l.credit).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );

  const renderDesktopView = () => (
    <div className="invoice-details-desktop">
      <div className="invoice-header">
        <div className="header-left">
          <button className="btn-back" onClick={() => navigate(-1)}>
            <i className="fas fa-arrow-left"></i> Back
          </button>
          <h1>Invoice #{invoice.number}</h1>
          <div className="invoice-meta">
            <span className={`status-badge status-${invoice.status}`}>
              {invoice.status}
            </span>
            <span className="invoice-date">Issued: {invoice.issued_at}</span>
            <span className="customer-id">
              Customer: #{invoice.customer_id}
            </span>
          </div>
        </div>
        <div className="header-right">
          <button className="btn-print" onClick={handlePrint}>
            <i className="fas fa-print"></i> Print
          </button>
        </div>
      </div>

      <div className="invoice-summary">
        <div className="summary-grid">
          <div className="summary-card">
            <div className="summary-label">Total Amount</div>
            <div className="summary-value total-amount">
              ${parseFloat(invoice.total).toFixed(2)}
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-label">Gross Paid</div>
            <div className="summary-value">
              ${parseFloat(grossPaid).toFixed(2)}
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-label">Total Refunded</div>
            <div className="summary-value refunded">
              ${parseFloat(refundedTotal).toFixed(2)}
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-label">Net Paid</div>
            <div className="summary-value net-paid">
              ${parseFloat(netPaid).toFixed(2)}
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-label">Remaining</div>
            <div
              className={`summary-value ${remaining > 0 ? "remaining" : "paid"}`}
            >
              ${parseFloat(remaining).toFixed(2)}
            </div>
          </div>
          {overpaid > 0 && (
            <div className="summary-card">
              <div className="summary-label">Overpaid</div>
              <div className="summary-value overpaid">
                ${parseFloat(overpaid).toFixed(2)}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="invoice-sections">
        <div className="section">
          <h3>
            <i className="fas fa-box"></i> Items
          </h3>
          <div className="table-container">
            <table className="items-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th>Unit Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, i) => (
                  <tr key={item.id}>
                    <td>{i + 1}</td>
                    <td>{item.product?.title_en}</td>
                    <td>{item.quantity}</td>
                    <td>${parseFloat(item.unit_price).toFixed(2)}</td>
                    <td>${parseFloat(item.total).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="section">
          <h3>
            <i className="fas fa-credit-card"></i> Payments
          </h3>
          <div className="table-container">
            {payments.length === 0 ? (
              <p className="no-data">No payments yet</p>
            ) : (
              <table className="payments-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Gross</th>
                    <th>Refunded</th>
                    <th>Net</th>
                    <th>Remaining</th>
                    <th>Overpaid</th>
                    <th>Method</th>
                    <th>Paid at</th>
                  </tr>
                </thead>
                <tbody>{renderPaymentRows()}</tbody>
              </table>
            )}
          </div>
        </div>

        <div className="section">
          <h3>
            <i className="fas fa-undo"></i> Refunds
          </h3>
          <div className="table-container">
            {refunds.length === 0 ? (
              <p className="no-data">No refunds</p>
            ) : (
              <table className="refunds-table">
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
                      <td>${parseFloat(r.amount).toFixed(2)}</td>
                      <td>{r.refunded_at}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="section">
          <h3>
            <i className="fas fa-book"></i> Journal Entries
          </h3>
          <div className="table-container">
            {invoice.journal_entries?.length === 0 ? (
              <p className="no-data">No journal entries</p>
            ) : (
              invoice.journal_entries?.map((je) => (
                <div key={je.id} className="journal-entry">
                  <div className="entry-header">
                    <strong>Entry #{je.id}</strong>
                    <span className="entry-description">{je.description}</span>
                  </div>
                  <table className="journal-table">
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
                          <td>${parseFloat(l.debit).toFixed(2)}</td>
                          <td>${parseFloat(l.credit).toFixed(2)}</td>
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
    </div>
  );

  return isMobile ? renderMobileView() : renderDesktopView();
};

export default InvoiceDetails;

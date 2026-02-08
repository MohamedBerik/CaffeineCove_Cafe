import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import api from "../../../services/axios";
import { notifyError } from "../../../utils/notify";

const CustomerStatement = () => {
  const { id } = useParams();
  const printRef = useRef();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const fetchStatement = async (params = {}) => {
    setLoading(true);
    try {
      const res = await api.get(`/erp/customers/${id}/statement`, {
        params,
      });
      setData(res.data);
    } catch (e) {
      console.error(e);
      notifyError("Failed to load customer statement");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatement();
  }, [id]);

  const handleFilter = () => {
    fetchStatement({
      from: from || undefined,
      to: to || undefined,
    });
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <p className="p-4">Loading statement...</p>;
  if (!data) return null;

  const { customer, period, opening_balance, entries, closing_balance } = data;

  return (
    <div className="container-fluid mt-4 pt-3 customer-statement-page">
      {/* ===== Actions ===== */}
      <div className="d-flex flex-wrap gap-2 mb-3 no-print">
        <div>
          <label className="form-label mb-0">From</label>
          <input
            type="date"
            className="form-control form-control-sm"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </div>

        <div>
          <label className="form-label mb-0">To</label>
          <input
            type="date"
            className="form-control form-control-sm"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>

        <div className="align-self-end">
          <button className="btn btn-primary btn-sm" onClick={handleFilter}>
            Apply
          </button>
        </div>

        <div className="align-self-end ms-auto">
          <button
            className="btn btn-outline-secondary btn-sm"
            onClick={handlePrint}
          >
            Print
          </button>
        </div>
      </div>

      {/* ===== Printable Area ===== */}
      <div ref={printRef} className="print-area">
        {/* ===== Header ===== */}
        <div className="card mb-3">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-start flex-wrap">
              <div>
                <h4 className="mb-1">Customer Statement</h4>
                <div className="text-muted small">
                  Period: {period.from} → {period.to}
                </div>
              </div>

              <div className="text-end">
                <div className="small">Name: {customer.name}</div>
                {customer.code && (
                  <div className="small">Code: {customer.code}</div>
                )}
                {customer.phone && (
                  <div className="small">Phone: {customer.phone}</div>
                )}
                {customer.email && (
                  <div className="small">Email: {customer.email}</div>
                )}
              </div>
            </div>

            <hr />

            <div className="row">
              <div className="col-md-4 col-12 mb-2">
                <strong>Opening balance:</strong>{" "}
                {Number(opening_balance).toFixed(2)}
              </div>

              <div className="col-md-4 col-12 mb-2">
                <strong>Closing balance:</strong>{" "}
                {Number(closing_balance).toFixed(2)}
              </div>

              <div className="col-md-4 col-12 mb-2">
                <strong>Total entries:</strong> {entries.length}
              </div>
            </div>
          </div>
        </div>

        {/* ===== Statement table ===== */}
        <div className="card">
          <div className="table-responsive">
            <table className="table table-bordered table-sm mb-0">
              <thead className="table-light">
                <tr>
                  <th style={{ width: 110 }}>Date</th>
                  <th>Description</th>
                  <th style={{ width: 120 }} className="text-end">
                    Debit
                  </th>
                  <th style={{ width: 120 }} className="text-end">
                    Credit
                  </th>
                  <th style={{ width: 140 }} className="text-end">
                    Balance
                  </th>
                </tr>
              </thead>

              <tbody>
                {/* Opening balance row */}
                <tr className="table-secondary">
                  <td colSpan={4}>
                    <strong>Opening balance</strong>
                  </td>
                  <td className="text-end fw-bold">
                    {Number(opening_balance).toFixed(2)}
                  </td>
                </tr>

                {entries.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center text-muted py-3">
                      No entries in this period
                    </td>
                  </tr>
                )}

                {entries.map((row, index) => (
                  <tr key={row.id || index}>
                    <td>{row.entry_date}</td>

                    <td>
                      <div className="fw-semibold">{row.description}</div>
                      <div className="small text-muted">
                        {row.type}
                        {row.invoice_id && <> · Invoice #{row.invoice_id}</>}
                        {row.payment_id && <> · Payment #{row.payment_id}</>}
                        {row.refund_id && <> · Refund #{row.refund_id}</>}
                      </div>
                    </td>

                    <td className="text-end">
                      {Number(row.debit) > 0
                        ? Number(row.debit).toFixed(2)
                        : ""}
                    </td>

                    <td className="text-end">
                      {Number(row.credit) > 0
                        ? Number(row.credit).toFixed(2)
                        : ""}
                    </td>

                    <td className="text-end fw-semibold">
                      {Number(row.balance).toFixed(2)}
                    </td>
                  </tr>
                ))}

                {/* Closing balance */}
                <tr className="table-light">
                  <td colSpan={4} className="fw-bold">
                    Closing balance
                  </td>
                  <td className="text-end fw-bold">
                    {Number(closing_balance).toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ===== Print styles ===== */}
      <style>{`
        @media print {

          body {
            background: #fff !important;
          }

          .no-print {
            display: none !important;
          }

          .print-area {
            margin: 0;
          }

          .card {
            border: none !important;
          }

          .table th,
          .table td {
            font-size: 12px;
          }

          .container-fluid {
            padding: 0 !important;
          }

        }
      `}</style>
    </div>
  );
};

export default CustomerStatement;

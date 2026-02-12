import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../../services/axios";
import { notifyError } from "../../../utils/notify";
import "./SupplierStatement.css";

const SupplierStatement = () => {
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [supplier, setSupplier] = useState(null);
  const [entries, setEntries] = useState([]);
  const [openingBalance, setOpeningBalance] = useState(0);
  const [closingBalance, setClosingBalance] = useState(0);

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const fetchStatement = async () => {
    try {
      setLoading(true);

      const params = {};
      if (from) params.from = from;
      if (to) params.to = to;

      const res = await api.get(`/erp/suppliers/${id}/statement`, { params });

      setSupplier(res.data.supplier);
      setEntries(res.data.entries);
      setOpeningBalance(res.data.opening_balance);
      setClosingBalance(res.data.closing_balance);
    } catch (e) {
      console.error(e);
      notifyError("Failed to load supplier statement");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatement();
  }, [id]);

  const handleFilter = () => {
    fetchStatement();
  };

  if (loading) return <p>Loading statement...</p>;

  return (
    <div className="supplier-statement-page">
      <div className="statement-header">
        <div>
          <h3>Supplier Statement</h3>
          <div className="supplier-info">
            <strong>{supplier?.name}</strong>
            {supplier?.phone && <span> | {supplier.phone}</span>}
            {supplier?.email && <span> | {supplier.email}</span>}
          </div>
        </div>

        <div className="statement-filters">
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
          <button className="btn btn-primary" onClick={handleFilter}>
            Filter
          </button>
        </div>
      </div>

      <div className="statement-entries">
        <div className="entry-section">
          <div className="entry-header opening">
            <h5>Opening Balance</h5>
            <span className="balance">{Number(openingBalance).toFixed(2)}</span>
          </div>
        </div>

        {entries.length === 0 ? (
          <div className="no-entries">
            <p>No entries in this period</p>
          </div>
        ) : (
          entries.map((row, index) => (
            <div key={row.id || index} className="entry-card">
              <div className="entry-date">
                <span className="date">{row.entry_date}</span>
                <span className={`entry-type type-${row.type}`}>
                  {row.type}
                </span>
              </div>

              <div className="entry-details">
                <h6>{row.description}</h6>
                <div className="entry-meta">
                  {row.purchase_order_id && (
                    <span>PO #{row.purchase_order_id}</span>
                  )}
                  {row.supplier_payment_id && (
                    <span>Payment #{row.supplier_payment_id}</span>
                  )}
                </div>
              </div>

              <div className="entry-amounts">
                {Number(row.debit) > 0 && (
                  <div className="amount debit">
                    <span>Debit</span>
                    <span>{Number(row.debit).toFixed(2)}</span>
                  </div>
                )}

                {Number(row.credit) > 0 && (
                  <div className="amount credit">
                    <span>Credit</span>
                    <span>{Number(row.credit).toFixed(2)}</span>
                  </div>
                )}

                <div className="amount balance">
                  <span>Balance</span>
                  <span>{Number(row.balance).toFixed(2)}</span>
                </div>
              </div>
            </div>
          ))
        )}

        <div className="entry-section">
          <div className="entry-header closing">
            <h5>Closing Balance</h5>
            <span className="balance">{Number(closingBalance).toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupplierStatement;

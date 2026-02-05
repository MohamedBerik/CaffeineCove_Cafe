// src/admin/erp/components/InvoicesList.jsx
import React, { useEffect, useState } from "react";
import api from "../../../services/axios";
import { notifyError } from "../../../utils/notify";

const InvoicesList = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <p>Loading invoices...</p>;

  return (
    <div className="mt-4 pt-4">
      <h3>Invoices List</h3>
      <table className="table table-striped">
        <thead>
          <tr>
            <th>ID</th>
            <th>Number</th>
            <th>Customer</th>
            <th>Total</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((inv) => (
            <tr key={inv.id}>
              <td>{inv.id}</td>
              <td>{inv.number}</td>
              <td>{inv.customer?.name || "N/A"}</td>
              <td>{inv.total}</td>
              <td>{inv.status}</td>
              <td>
                <a
                  href={`/admin/erp/invoices/${inv.id}`}
                  className="btn btn-sm btn-primary"
                >
                  View Details
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default InvoicesList;

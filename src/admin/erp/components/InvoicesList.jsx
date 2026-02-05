// src/admin/erp/components/InvoicesList.jsx
import React, { useEffect, useState } from "react";
import api from "../../../services/axios";
import { notifyError } from "../../../utils/notify";

const InvoicesList = () => {
  const [invoices, setInvoices] = useState([]);

  useEffect(() => {
    api
      .get("/erp/invoices")
      .then((res) => setInvoices(res.data.data))
      .catch((err) => notifyError("Failed to fetch invoices"));
  }, []);

  return (
    <div>
      <h3>Invoices</h3>
      <table className="table table-striped">
        <thead>
          <tr>
            <th>ID</th>
            <th>Order ID</th>
            <th>Customer</th>
            <th>Total</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((inv) => (
            <tr key={inv.id}>
              <td>{inv.id}</td>
              <td>{inv.order_id}</td>
              <td>{inv.customer.name}</td>
              <td>{inv.total}</td>
              <td>{inv.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default InvoicesList;

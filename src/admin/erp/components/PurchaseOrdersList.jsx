// src/admin/erp/components/PurchaseOrdersList.jsx
import React, { useEffect, useState } from "react";
import api from "../../../services/axios";
import { notifyError } from "../../../utils/notify";

const PurchaseOrdersList = () => {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    api
      .get("/erp/purchase-orders")
      .then((res) => setOrders(res.data.data))
      .catch((err) => notifyError("Failed to fetch purchase orders"));
  }, []);

  return (
    <div>
      <h3>Purchase Orders</h3>
      <table className="table table-striped">
        <thead>
          <tr>
            <th>ID</th>
            <th>Supplier</th>
            <th>Total</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((po) => (
            <tr key={po.id}>
              <td>{po.id}</td>
              <td>{po.supplier.name}</td>
              <td>{po.total}</td>
              <td>{po.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PurchaseOrdersList;

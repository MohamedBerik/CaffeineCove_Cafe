// src/admin/erp/components/OrdersList.jsx
import React, { useEffect, useState } from "react";
import api from "../../../services/axios";
import { notifyError } from "../../../utils/notify";

const OrdersList = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/erp/orders")
      .then((res) => setOrders(res.data.data))
      .catch((err) => {
        console.error(err);
        notifyError("Failed to fetch orders");
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading orders...</p>;

  return (
    <div>
      <h3>Orders List</h3>
      <table className="table table-striped">
        <thead>
          <tr>
            <th>ID</th>
            <th>Customer</th>
            <th>Total</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id}>
              <td>{o.id}</td>
              <td>{o.customer.name}</td>
              <td>{o.total}</td>
              <td>{o.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default OrdersList;

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../services/axios";
import { notifyError } from "../../../utils/notify";

const PurchaseOrdersList = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchPOs = () => {
    setLoading(true);
    api
      .get("/erp/purchase-orders")
      .then((res) => setOrders(res.data))
      .catch((err) => {
        console.error(err);
        notifyError("Failed to fetch purchase orders");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPOs();
  }, []);

  if (loading) return <p>Loading purchase orders...</p>;

  return (
    <div className="mt-4 pt-4">
      <h3>Purchase Orders List</h3>
      <table className="table table-striped">
        <thead>
          <tr>
            <th>ID</th>
            <th>Supplier</th>
            <th>Total</th>
            <th>Status</th>
            <th>Paid</th>
            <th>Remaining</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((po) => (
            <tr key={po.id}>
              <td>{po.id}</td>
              <td>{po.supplier?.name}</td>
              <td>{po.total}</td>
              <td>{po.status}</td>
              <td>{po.total_paid}</td>
              <td>{po.remaining}</td>
              <td>
                <button
                  className="btn btn-sm btn-outline-primary"
                  onClick={() =>
                    navigate(`/admin/erp/purchase-orders/${po.id}`)
                  }
                  title="View details"
                >
                  View
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PurchaseOrdersList;

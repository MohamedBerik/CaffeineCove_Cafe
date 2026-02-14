import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../../services/axios";

export default function PurchaseOrderReturnsHistory() {
  const { id } = useParams();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/erp/purchase-orders/${id}/returns-history`);

      setRows(res.data.returns || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) loadHistory();
  }, [id]);

  return (
    <div>
      <h3>Purchase Order Returns Log</h3>

      {loading && <p>Loading...</p>}

      {!loading && (
        <table border="1" cellPadding="6">
          <thead>
            <tr>
              <th>#</th>
              <th>Item</th>
              <th>Returned Quantity</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, index) => (
              <tr key={r.id}>
                <td>{index + 1}</td>
                <td>{r.product}</td>
                <td>{r.quantity}</td>
                <td>
                  {r.created_at ? new Date(r.created_at).toLocaleString() : ""}
                </td>
              </tr>
            ))}

            {rows.length === 0 && (
              <tr>
                <td colSpan="4">No Returns</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}

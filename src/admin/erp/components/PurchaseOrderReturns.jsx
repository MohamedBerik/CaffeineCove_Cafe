import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../../services/axios";

export default function PurchaseOrderReturns() {
  const { id } = useParams();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadItems = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/erp/purchase-orders/${id}/returnable-items`);

      const rows = res.data.items.map((i) => ({
        ...i,
        return_qty: "",
      }));

      setItems(rows);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      loadItems();
    }
  }, [id]);

  const handleReturn = async (row) => {
    const qty = Number(row.return_qty);

    if (!qty || qty <= 0) {
      alert("ادخل كمية صحيحة");
      return;
    }
    if (qty > row.available_to_return) {
      alert("Quantity exceeds the available return quantity");
      return;
    }

    try {
      await api.post(`/erp/purchase-orders/${id}/return`, {
        product_id: row.product_id,
        quantity: qty,
      });

      await loadItems();
      alert("Return recorded successfully");
    } catch (e) {
      alert(
        e.response?.data?.msg ||
          "An error occurred while processing the return",
      );
    }
  };

  return (
    <div>
      <h3>Purchase Order Returns</h3>

      {loading && <p>Loading ...</p>}

      {!loading && (
        <table border="1" cellPadding="6">
          <thead>
            <tr>
              <th>Item</th>
              <th>Received</th>
              <th>Returned</th>
              <th>Available for Return</th>
              <th>Quantity</th>
              <th></th>
            </tr>
          </thead>

          <tbody>
            {items.map((row) => (
              <tr key={row.product_id}>
                <td>{row.product_name}</td>
                <td>{row.received_quantity}</td>
                <td>{row.returned_quantity}</td>
                <td>{row.available_to_return}</td>
                <td>
                  <input
                    type="number"
                    min="0"
                    max={row.available_to_return}
                    value={row.return_qty}
                    onChange={(e) => {
                      const v = e.target.value;
                      setItems((prev) =>
                        prev.map((r) =>
                          r.product_id === row.product_id
                            ? { ...r, return_qty: v }
                            : r,
                        ),
                      );
                    }}
                    style={{ width: 80 }}
                  />
                </td>
                <td>
                  <button
                    onClick={() => handleReturn(row)}
                    disabled={row.available_to_return <= 0}
                  >
                    Return
                  </button>
                </td>
              </tr>
            ))}

            {items.length === 0 && (
              <tr>
                <td colSpan="6">No items available</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}

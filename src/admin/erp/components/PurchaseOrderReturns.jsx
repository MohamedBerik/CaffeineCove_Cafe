import { useEffect, useState } from "react";
import api from "services/axios";

export default function PurchaseOrderReturns({ purchaseOrderId }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadItems = async () => {
    setLoading(true);
    try {
      const res = await api.get(
        `/purchase-orders/${purchaseOrderId}/returnable-items`,
      );

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
    loadItems();
  }, [purchaseOrderId]);

  const handleReturn = async (row) => {
    const qty = Number(row.return_qty);

    if (!qty || qty <= 0) {
      alert("ادخل كمية صحيحة");
      return;
    }

    try {
      await api.post(`/purchase-orders/${purchaseOrderId}/return`, {
        product_id: row.product_id,
        quantity: qty,
      });

      await loadItems();
      alert("تم تسجيل المرتجع بنجاح");
    } catch (e) {
      alert(e.response?.data?.msg || "حدث خطأ أثناء تنفيذ المرتجع");
    }
  };

  return (
    <div>
      <h3>مرتجعات أمر الشراء</h3>

      {loading && <p>جاري التحميل ...</p>}

      {!loading && (
        <table border="1" cellPadding="6">
          <thead>
            <tr>
              <th>الصنف</th>
              <th>تم استلامه</th>
              <th>تم إرجاعه</th>
              <th>المتاح للإرجاع</th>
              <th>الكمية</th>
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
                    إرجاع
                  </button>
                </td>
              </tr>
            ))}

            {items.length === 0 && (
              <tr>
                <td colSpan="6">لا توجد أصناف</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}

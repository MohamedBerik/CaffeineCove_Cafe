import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../services/axios";
import { notifyError, notifySuccess } from "../../../utils/notify";

const PurchaseOrderCreate = () => {
  const navigate = useNavigate();

  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);

  const [supplierId, setSupplierId] = useState("");
  const [items, setItems] = useState([
    { product_id: "", quantity: 1, unit_cost: "" },
  ]);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [supRes, prodRes] = await Promise.all([
        api.get("/admin/suppliers"),
        api.get("/admin/products"),
      ]);

      setSuppliers(supRes.data);
      setProducts(prodRes.data);
    } catch (e) {
      console.error(e);
      notifyError("Failed to load suppliers or products");
    }
  };

  const handleItemChange = (index, field, value) => {
    const copy = [...items];
    copy[index][field] = value;
    setItems(copy);
  };

  const addRow = () => {
    setItems([...items, { product_id: "", quantity: 1, unit_cost: "" }]);
  };

  const removeRow = (index) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const calcLineTotal = (row) => {
    return (Number(row.quantity || 0) * Number(row.unit_cost || 0)).toFixed(2);
  };

  const grandTotal = items.reduce(
    (s, r) => s + Number(r.quantity || 0) * Number(r.unit_cost || 0),
    0,
  );

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!supplierId) {
      notifyError("Please select supplier");
      return;
    }

    const cleanItems = items.filter(
      (i) => i.product_id && Number(i.quantity) > 0,
    );

    if (cleanItems.length === 0) {
      notifyError("Add at least one item");
      return;
    }

    try {
      setLoading(true);

      await api.post("/admin/purchase-orders", {
        supplier_id: supplierId,
        items: cleanItems.map((i) => ({
          product_id: i.product_id,
          quantity: Number(i.quantity),
          unit_cost: Number(i.unit_cost),
        })),
      });

      notifySuccess("Purchase order created");

      navigate("/admin/purchase-orders");
    } catch (e) {
      console.error(e);
      notifyError(
        e.response?.data?.message || "Failed to create purchase order",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-4">
      <h3>Create Purchase Order</h3>

      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label">Supplier</label>
          <select
            className="form-select"
            value={supplierId}
            onChange={(e) => setSupplierId(e.target.value)}
          >
            <option value="">Select supplier</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <hr />

        <h5>Items</h5>

        <table className="table table-bordered align-middle">
          <thead>
            <tr>
              <th style={{ width: 60 }}>#</th>
              <th>Product</th>
              <th style={{ width: 140 }}>Qty</th>
              <th style={{ width: 160 }}>Unit cost</th>
              <th style={{ width: 140 }}>Total</th>
              <th style={{ width: 60 }}></th>
            </tr>
          </thead>

          <tbody>
            {items.map((row, i) => (
              <tr key={i}>
                <td>{i + 1}</td>

                <td>
                  <select
                    className="form-select"
                    value={row.product_id}
                    onChange={(e) =>
                      handleItemChange(i, "product_id", e.target.value)
                    }
                  >
                    <option value="">Select product</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title_en ?? p.name}
                      </option>
                    ))}
                  </select>
                </td>

                <td>
                  <input
                    type="number"
                    className="form-control"
                    min="1"
                    value={row.quantity}
                    onChange={(e) =>
                      handleItemChange(i, "quantity", e.target.value)
                    }
                  />
                </td>

                <td>
                  <input
                    type="number"
                    className="form-control"
                    min="0"
                    step="0.01"
                    value={row.unit_cost}
                    onChange={(e) =>
                      handleItemChange(i, "unit_cost", e.target.value)
                    }
                  />
                </td>

                <td>${calcLineTotal(row)}</td>

                <td className="text-center">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => removeRow(i)}
                  >
                    ×
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <button
          type="button"
          className="btn btn-sm btn-outline-secondary mb-3"
          onClick={addRow}
        >
          + Add item
        </button>

        <div className="text-end mb-4">
          <strong>Total: ${grandTotal.toFixed(2)}</strong>
        </div>

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Saving..." : "Create purchase order"}
        </button>
      </form>
    </div>
  );
};

export default PurchaseOrderCreate;

import React, { useState, useEffect } from "react";
import api from "../../../services/axios";
import { notifyError, notifySuccess } from "../../../utils/notify";

const CreateOrder = () => {
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [items, setItems] = useState([{ product_id: "", quantity: 1 }]);
  const [customer_id, setCustomerId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get("/admin/customers").then((res) => setCustomers(res.data.data));
    api.get("/admin/products").then((res) => setProducts(res.data.data));
  }, []);

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const addItem = () => setItems([...items, { product_id: "", quantity: 1 }]);
  const removeItem = (index) => setItems(items.filter((_, i) => i !== index));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post("/erp/orders", { customer_id, items });
      notifySuccess("Order created successfully");
      setCustomerId("");
      setItems([{ product_id: "", quantity: 1 }]);
    } catch (err) {
      console.error(err);
      notifyError(err.response?.data?.msg || "Failed to create order");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container mt-5">
      <h3 className="mb-4">Create ERP Order</h3>
      <form onSubmit={handleSubmit}>
        {/* Customer Select */}
        <div className="mb-3">
          <label className="form-label">Customer</label>
          <select
            className="form-select"
            value={customer_id}
            onChange={(e) => setCustomerId(e.target.value)}
            required
          >
            <option value="">Select Customer</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Products List */}
        {items.map((item, idx) => (
          <div key={idx} className="row g-2 align-items-center mb-2">
            <div className="col-12 col-md-6">
              <select
                className="form-select"
                value={item.product_id}
                onChange={(e) =>
                  handleItemChange(idx, "product_id", e.target.value)
                }
                required
              >
                <option value="">Select Product</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title_en} (${p.unit_price})
                  </option>
                ))}
              </select>
            </div>

            <div className="col-6 col-md-3">
              <input
                type="number"
                min="1"
                className="form-control"
                value={item.quantity}
                onChange={(e) =>
                  handleItemChange(idx, "quantity", e.target.value)
                }
                required
              />
            </div>

            <div className="col-6 col-md-3 d-flex justify-content-end">
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => removeItem(idx)}
              >
                &times;
              </button>
            </div>
          </div>
        ))}

        {/* Add Product */}
        <div className="mb-3">
          <button type="button" className="btn btn-secondary" onClick={addItem}>
            + Add Product
          </button>
        </div>

        {/* Submit */}
        <div>
          <button
            type="submit"
            className="btn btn-success"
            disabled={submitting}
          >
            {submitting ? "Saving..." : "Create Order"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateOrder;

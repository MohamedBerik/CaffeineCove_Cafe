import { useEffect, useState } from "react";
import api from "../../services/axios";
import { notifyError, notifySuccess } from "../../utils/notify";
import AdminLayout from "../../admin/layouts/AdminLayout";
import { useNavigate } from "react-router-dom";

const CreateOrder = () => {
  const navigate = useNavigate();

  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);

  const [customerId, setCustomerId] = useState("");
  const [items, setItems] = useState([{ product_id: "", quantity: 1 }]);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [customersRes, productsRes] = await Promise.all([
        api.get("/admin/customers"),
        api.get("/admin/products"),
      ]);

      setCustomers(customersRes.data.data ?? customersRes.data);
      setProducts(productsRes.data.data ?? productsRes.data);
    } catch (e) {
      notifyError("Failed to load data");
    }
  };

  const addRow = () => {
    setItems((prev) => [...prev, { product_id: "", quantity: 1 }]);
  };

  const removeRow = (index) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const changeItem = (index, field, value) => {
    const copy = [...items];
    copy[index][field] = value;
    setItems(copy);
  };

  const submit = async (e) => {
    e.preventDefault();

    if (!customerId) {
      notifyError("Select customer");
      return;
    }

    if (items.length === 0) {
      notifyError("Add at least one item");
      return;
    }

    setLoading(true);

    try {
      await api.post("/erp/orders", {
        customer_id: customerId,
        items: items.map((i) => ({
          product_id: i.product_id,
          quantity: Number(i.quantity),
        })),
      });

      notifySuccess("Order created successfully");
      navigate("/admin/dashboard");
    } catch (err) {
      console.error(err);

      const msg = err?.response?.data?.message || "Failed to create order";

      notifyError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AdminLayout />

      <div className="container-fluid mt-3">
        <div className="card">
          <div className="card-header">
            <h4>Create ERP Order</h4>
          </div>

          <div className="card-body">
            <form onSubmit={submit}>
              {/* Customer */}
              <div className="form-group">
                <label>Customer</label>
                <select
                  className="form-control"
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                >
                  <option value="">Select customer</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <hr />

              <h5>Items</h5>

              {items.map((row, index) => (
                <div className="form-row mb-2" key={index}>
                  <div className="col-md-6">
                    <select
                      className="form-control"
                      value={row.product_id}
                      onChange={(e) =>
                        changeItem(index, "product_id", e.target.value)
                      }
                    >
                      <option value="">Select product</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.title_en}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-md-3">
                    <input
                      type="number"
                      min="1"
                      className="form-control"
                      value={row.quantity}
                      onChange={(e) =>
                        changeItem(index, "quantity", e.target.value)
                      }
                    />
                  </div>

                  <div className="col-md-3">
                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={() => removeRow(index)}
                      disabled={items.length === 1}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}

              <button
                type="button"
                className="btn btn-secondary mb-3"
                onClick={addRow}
              >
                + Add item
              </button>

              <div>
                <button className="btn btn-success" disabled={loading}>
                  {loading ? "Saving..." : "Create order"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default CreateOrder;

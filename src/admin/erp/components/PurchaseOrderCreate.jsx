import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../services/axios";
import { notifyError, notifySuccess } from "../../../utils/notify";
import "./PurchaseOrderCreate.css";

const PurchaseOrderCreate = () => {
  const navigate = useNavigate();

  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [supplierId, setSupplierId] = useState("");
  const [items, setItems] = useState([
    { product_id: "", quantity: 1, unit_cost: "" },
  ]);
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [supRes, prodRes] = await Promise.all([
        api.get("/admin/suppliers"),
        api.get("/admin/products"),
      ]);

      setSuppliers(supRes.data.data ?? supRes.data);
      setProducts(prodRes.data.data ?? prodRes.data);
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
      (i) => i.product_id && Number(i.quantity) > 0 && Number(i.unit_cost) > 0,
    );

    if (cleanItems.length === 0) {
      notifyError("Add at least one item with valid quantity and cost");
      return;
    }

    try {
      setLoading(true);

      await api.post("/erp/purchase-orders", {
        supplier_id: supplierId,
        items: cleanItems.map((i) => ({
          product_id: i.product_id,
          quantity: Number(i.quantity),
          unit_cost: Number(i.unit_cost),
        })),
      });

      notifySuccess("Purchase order created");
      navigate("/admin/erp/purchase-orders");
    } catch (e) {
      console.error(e);
      notifyError(
        e.response?.data?.message || "Failed to create purchase order",
      );
    } finally {
      setLoading(false);
    }
  };

  const renderMobileView = () => (
    <div className="purchase-order-mobile">
      <div className="mobile-header">
        <button className="btn-back" onClick={() => navigate(-1)}>
          <i className="fas fa-arrow-left"></i>
        </button>
        <h3>Create Purchase Order</h3>
        <button className="btn-submit-mobile" onClick={handleSubmit}>
          <i className="fas fa-check"></i>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mobile-form">
        {/* Supplier Section */}
        <div className="form-section">
          <h5>
            <i className="fas fa-truck me-2"></i>Supplier Information
          </h5>
          <div className="form-group">
            <label>Select Supplier</label>
            <select
              className="form-select"
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              required
            >
              <option value="">Choose supplier...</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Items Section */}
        <div className="form-section">
          <div className="section-header">
            <h5>
              <i className="fas fa-boxes me-2"></i>Order Items
            </h5>
            <button type="button" className="btn-add-item" onClick={addRow}>
              <i className="fas fa-plus"></i> Add
            </button>
          </div>

          {items.map((row, i) => (
            <div key={i} className="item-card">
              <div className="item-header">
                <span className="item-number">Item #{i + 1}</span>
                {items.length > 1 && (
                  <button
                    type="button"
                    className="btn-remove-item"
                    onClick={() => removeRow(i)}
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                )}
              </div>

              <div className="item-form">
                <div className="form-group">
                  <label>Product</label>
                  <select
                    className="form-select"
                    value={row.product_id}
                    onChange={(e) =>
                      handleItemChange(i, "product_id", e.target.value)
                    }
                    required
                  >
                    <option value="">Select product...</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title_en ?? p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="row g-2">
                  <div className="col-6">
                    <div className="form-group">
                      <label>Quantity</label>
                      <div className="quantity-control">
                        <button
                          type="button"
                          className="quantity-btn"
                          onClick={() =>
                            handleItemChange(
                              i,
                              "quantity",
                              Math.max(1, (parseInt(row.quantity) || 1) - 1),
                            )
                          }
                        >
                          <i className="fas fa-minus"></i>
                        </button>
                        <input
                          type="number"
                          className="form-control text-center"
                          min="1"
                          value={row.quantity}
                          onChange={(e) =>
                            handleItemChange(i, "quantity", e.target.value)
                          }
                          required
                        />
                        <button
                          type="button"
                          className="quantity-btn"
                          onClick={() =>
                            handleItemChange(
                              i,
                              "quantity",
                              (parseInt(row.quantity) || 1) + 1,
                            )
                          }
                        >
                          <i className="fas fa-plus"></i>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="col-6">
                    <div className="form-group">
                      <label>Unit Cost ($)</label>
                      <input
                        type="number"
                        className="form-control"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={row.unit_cost}
                        onChange={(e) =>
                          handleItemChange(i, "unit_cost", e.target.value)
                        }
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="item-total">
                  <span>Line Total:</span>
                  <span className="total-amount">${calcLineTotal(row)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary Section */}
        <div className="summary-section">
          <h5>
            <i className="fas fa-calculator me-2"></i>Order Summary
          </h5>
          <div className="summary-details">
            <div className="summary-row">
              <span>Supplier:</span>
              <span className="summary-value">
                {supplierId
                  ? suppliers.find((s) => s.id == supplierId)?.name ||
                    "Not selected"
                  : "Not selected"}
              </span>
            </div>
            <div className="summary-row">
              <span>Total Items:</span>
              <span className="summary-value">{items.length}</span>
            </div>
            <div className="summary-row total-row">
              <span>Grand Total:</span>
              <span className="grand-total">${grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </form>
    </div>
  );

  const renderDesktopView = () => (
    <div className="purchase-order-desktop">
      <div className="page-header">
        <h2>
          <i className="fas fa-clipboard-list me-2"></i>Create Purchase Order
        </h2>
        <p className="text-muted">
          Fill in the details to create a new purchase order
        </p>
      </div>

      <form onSubmit={handleSubmit} className="order-form">
        {/* Supplier Selection Card */}
        <div className="card mb-4">
          <div className="card-header bg-white">
            <h5 className="mb-0">
              <i className="fas fa-truck me-2"></i>Supplier Information
            </h5>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-6">
                <label className="form-label fw-medium">Select Supplier</label>
                <select
                  className="form-select form-select-lg"
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  required
                >
                  <option value="">Choose a supplier...</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              {supplierId && (
                <div className="col-md-6 d-flex align-items-end">
                  <div className="alert alert-success py-2 px-3 mb-0 w-100">
                    <i className="fas fa-check-circle me-2"></i>
                    Supplier selected:{" "}
                    {suppliers.find((s) => s.id == supplierId)?.name}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Items Table Card */}
        <div className="card mb-4">
          <div className="card-header bg-white d-flex justify-content-between align-items-center">
            <h5 className="mb-0">
              <i className="fas fa-boxes me-2"></i>Order Items
            </h5>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={addRow}
            >
              <i className="fas fa-plus me-1"></i>Add Item
            </button>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-bordered align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th className="text-center" style={{ width: 50 }}>
                      #
                    </th>
                    <th>Product</th>
                    <th style={{ width: 120 }}>Quantity</th>
                    <th style={{ width: 150 }}>Unit Cost ($)</th>
                    <th style={{ width: 120 }}>Line Total</th>
                    <th style={{ width: 60 }} className="text-center"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((row, i) => (
                    <tr key={i}>
                      <td className="text-center fw-semibold">{i + 1}</td>
                      <td>
                        <select
                          className="form-select"
                          value={row.product_id}
                          onChange={(e) =>
                            handleItemChange(i, "product_id", e.target.value)
                          }
                          required
                        >
                          <option value="">Select product...</option>
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
                          required
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          className="form-control"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          value={row.unit_cost}
                          onChange={(e) =>
                            handleItemChange(i, "unit_cost", e.target.value)
                          }
                          required
                        />
                      </td>
                      <td className="fw-semibold">${calcLineTotal(row)}</td>
                      <td className="text-center">
                        {items.length > 1 && (
                          <button
                            type="button"
                            className="btn btn-outline-danger btn-sm"
                            onClick={() => removeRow(i)}
                            title="Remove item"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Summary and Actions */}
        <div className="d-flex justify-content-between align-items-center">
          <div className="total-box bg-light p-3 rounded">
            <span className="h5 mb-0">
              Grand Total:{" "}
              <span className="text-primary">${grandTotal.toFixed(2)}</span>
            </span>
          </div>
          <div className="action-buttons">
            <button
              type="button"
              className="btn btn-outline-secondary me-2"
              onClick={() => navigate(-1)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-success"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Creating...
                </>
              ) : (
                <>
                  <i className="fas fa-check me-2"></i>
                  Create Purchase Order
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );

  return isMobile ? renderMobileView() : renderDesktopView();
};

export default PurchaseOrderCreate;

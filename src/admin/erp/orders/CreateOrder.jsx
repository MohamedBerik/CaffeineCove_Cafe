import React, { useState, useEffect } from "react";
import api from "../../../services/axios";
import { notifyError, notifySuccess } from "../../../utils/notify";
import { useTranslation } from "react-i18next";
import "./CreateOrder.css";

const CreateOrder = () => {
  const { t, i18n } = useTranslation();
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [items, setItems] = useState([{ product_id: "", quantity: 1 }]);
  const [customer_id, setCustomerId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [searchProduct, setSearchProduct] = useState("");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const formatCurrency = (value) => {
    const lang = i18n.language === "ar" ? "ar-EG" : "en-US";
    return new Intl.NumberFormat(lang, {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(value || 0));
  };

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

    if (!customer_id) {
      notifyError(t("Please select a customer"));
      return;
    }

    const hasEmptyProduct = items.some((item) => !item.product_id);
    if (hasEmptyProduct) {
      notifyError(t("Please select a product for all items"));
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/erp/orders", { customer_id, items });
      notifySuccess(t("Order created successfully"));
      setCustomerId("");
      setItems([{ product_id: "", quantity: 1 }]);
      setSearchProduct("");
    } catch (err) {
      console.error(err);
      notifyError(err.response?.data?.msg || t("Failed to create order"));
    } finally {
      setSubmitting(false);
    }
  };

  const filteredProducts = products.filter(
    (product) =>
      searchProduct === "" ||
      product.title_en?.toLowerCase().includes(searchProduct.toLowerCase()) ||
      product.id?.toString().includes(searchProduct),
  );

  const getProductPrice = (productId) => {
    const product = products.find((p) => p.id == productId);
    return product ? parseFloat(product.unit_price).toFixed(2) : "0.00";
  };

  const calculateTotal = () => {
    return items
      .reduce((total, item) => {
        if (item.product_id && item.quantity) {
          const price = parseFloat(getProductPrice(item.product_id));
          return total + (price * parseInt(item.quantity) || 0);
        }
        return total;
      }, 0)
      .toFixed(2);
  };

  const renderMobileView = () => (
    <div className="create-order-mobile">
      <div className="mobile-header">
        <h2>{t("Create New Order")}</h2>
        <div className="order-total-mobile">
          <span>{t("Total")}:</span>
          <span className="total-amount">
            {formatCurrency(calculateTotal())}
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mobile-form">
        {/* Customer Section */}
        <div className="form-section">
          <h3>{t("Customer Information")}</h3>
          <div className="form-group">
            <label>{t("Select Customer")}</label>
            <select
              className="form-select"
              value={customer_id}
              onChange={(e) => setCustomerId(e.target.value)}
              required
            >
              <option value="">{t("Choose a customer")}</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Products Section */}
        <div className="form-section">
          <div className="section-header">
            <h3>{t("Order Items")}</h3>
            <button type="button" className="btn-add-item" onClick={addItem}>
              <i className="fas fa-plus"></i> {t("Add Item")}
            </button>
          </div>

          {/* Product Search */}
          <div className="search-box">
            <i className="fas fa-search"></i>
            <input
              type="text"
              placeholder={t("Search products...")}
              value={searchProduct}
              onChange={(e) => setSearchProduct(e.target.value)}
              className="search-input"
            />
          </div>

          {items.map((item, idx) => (
            <div key={idx} className="item-card">
              <div className="item-header">
                <span className="item-number">
                  {t("Item")} #{idx + 1}
                </span>
                {items.length > 1 && (
                  <button
                    type="button"
                    className="btn-remove-item"
                    onClick={() => removeItem(idx)}
                    title={t("Remove item")}
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                )}
              </div>

              <div className="item-form">
                <div className="form-group">
                  <label>{t("Product")}</label>
                  <select
                    className="form-select"
                    value={item.product_id}
                    onChange={(e) =>
                      handleItemChange(idx, "product_id", e.target.value)
                    }
                    required
                  >
                    <option value="">{t("Select product")}</option>
                    {filteredProducts.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title_en} - {formatCurrency(p.unit_price)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="quantity-group">
                  <label>{t("Quantity")}</label>
                  <div className="quantity-control">
                    <button
                      type="button"
                      className="quantity-btn"
                      onClick={() =>
                        handleItemChange(
                          idx,
                          "quantity",
                          Math.max(1, (parseInt(item.quantity) || 1) - 1),
                        )
                      }
                    >
                      <i className="fas fa-minus"></i>
                    </button>
                    <input
                      type="number"
                      min="1"
                      className="quantity-input"
                      value={item.quantity}
                      onChange={(e) =>
                        handleItemChange(idx, "quantity", e.target.value)
                      }
                      required
                    />
                    <button
                      type="button"
                      className="quantity-btn"
                      onClick={() =>
                        handleItemChange(
                          idx,
                          "quantity",
                          (parseInt(item.quantity) || 1) + 1,
                        )
                      }
                    >
                      <i className="fas fa-plus"></i>
                    </button>
                  </div>
                </div>

                {item.product_id && (
                  <div className="item-subtotal">
                    <span>{t("Subtotal")}:</span>
                    <span className="subtotal-amount">
                      {formatCurrency(
                        parseFloat(getProductPrice(item.product_id)) *
                          parseInt(item.quantity || 1),
                      )}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Summary Section */}
        <div className="summary-section">
          <h3>{t("Order Summary")}</h3>
          <div className="summary-details">
            <div className="summary-row">
              <span>{t("Number of items")}:</span>
              <span>{items.length}</span>
            </div>
            <div className="summary-row">
              <span>{t("Customer")}:</span>
              <span>
                {customer_id
                  ? customers.find((c) => c.id == customer_id)?.name || t("N/A")
                  : t("Not selected")}
              </span>
            </div>
            <div className="summary-row total-row">
              <span>{t("Total Amount")}:</span>
              <span className="final-total">
                {formatCurrency(calculateTotal())}
              </span>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="submit-section">
          <button type="submit" className="btn-submit" disabled={submitting}>
            {submitting ? (
              <>
                <i className="fas fa-spinner fa-spin"></i>
                {t("Creating Order...")}
              </>
            ) : (
              <>
                <i className="fas fa-check-circle"></i>
                {t("Create Order")}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );

  const renderDesktopView = () => (
    <div className="create-order-desktop">
      <div className="order-header">
        <div>
          <h1>{t("Create New Order")}</h1>
          <p className="header-subtitle">
            {t("Fill in the details to create a new order")}
          </p>
        </div>
        <div className="order-summary-card">
          <div className="summary-header">
            <i className="fas fa-receipt"></i>
            <span>{t("Order Summary")}</span>
          </div>
          <div className="summary-content">
            <div className="summary-item">
              <span>{t("Items")}:</span>
              <span>{items.length}</span>
            </div>
            <div className="summary-item">
              <span>{t("Total")}:</span>
              <span className="total-display">
                {formatCurrency(calculateTotal())}
              </span>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="order-form">
        <div className="form-grid">
          {/* Customer Selection */}
          <div className="customer-section">
            <h3>
              <i className="fas fa-user"></i> {t("Customer Details")}
            </h3>
            <div className="form-group">
              <label>{t("Select Customer")}</label>
              <select
                className="form-select"
                value={customer_id}
                onChange={(e) => setCustomerId(e.target.value)}
                required
              >
                <option value="">{t("Select a customer...")}</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {customer_id && (
                <div className="customer-info">
                  <i className="fas fa-check-circle"></i>
                  <span>{t("Customer selected")}</span>
                </div>
              )}
            </div>
          </div>

          {/* Product Search */}
          <div className="search-section">
            <h3>
              <i className="fas fa-search"></i> {t("Find Products")}
            </h3>
            <div className="search-container">
              <i className="fas fa-search search-icon"></i>
              <input
                type="text"
                placeholder={t("Search products by name or ID...")}
                value={searchProduct}
                onChange={(e) => setSearchProduct(e.target.value)}
                className="search-input"
              />
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="items-section">
          <div className="section-header">
            <h3>
              <i className="fas fa-box"></i> {t("Order Items")}
            </h3>
            <button type="button" className="btn-add-item" onClick={addItem}>
              <i className="fas fa-plus"></i> {t("Add New Item")}
            </button>
          </div>

          <div className="items-table">
            <div className="table-header">
              <div className="header-col product-col">{t("Product")}</div>
              <div className="header-col price-col">{t("Unit Price")}</div>
              <div className="header-col quantity-col">{t("Quantity")}</div>
              <div className="header-col subtotal-col">{t("Subtotal")}</div>
              <div className="header-col actions-col">{t("Actions")}</div>
            </div>

            <div className="table-body">
              {items.map((item, idx) => (
                <div key={idx} className="table-row">
                  <div className="row-col product-col">
                    <select
                      className="form-select"
                      value={item.product_id}
                      onChange={(e) =>
                        handleItemChange(idx, "product_id", e.target.value)
                      }
                      required
                    >
                      <option value="">{t("Select product...")}</option>
                      {filteredProducts.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.title_en}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="row-col price-col">
                    {item.product_id ? (
                      <span className="price-display">
                        {formatCurrency(getProductPrice(item.product_id))}
                      </span>
                    ) : (
                      <span className="price-placeholder">-</span>
                    )}
                  </div>
                  <div className="row-col quantity-col">
                    <div className="quantity-control">
                      <button
                        type="button"
                        className="quantity-btn"
                        onClick={() =>
                          handleItemChange(
                            idx,
                            "quantity",
                            Math.max(1, (parseInt(item.quantity) || 1) - 1),
                          )
                        }
                      >
                        <i className="fas fa-minus"></i>
                      </button>
                      <input
                        type="number"
                        min="1"
                        className="quantity-input"
                        value={item.quantity}
                        onChange={(e) =>
                          handleItemChange(idx, "quantity", e.target.value)
                        }
                        required
                      />
                      <button
                        type="button"
                        className="quantity-btn"
                        onClick={() =>
                          handleItemChange(
                            idx,
                            "quantity",
                            (parseInt(item.quantity) || 1) + 1,
                          )
                        }
                      >
                        <i className="fas fa-plus"></i>
                      </button>
                    </div>
                  </div>
                  <div className="row-col subtotal-col">
                    {item.product_id ? (
                      <span className="subtotal-display">
                        {formatCurrency(
                          parseFloat(getProductPrice(item.product_id)) *
                            parseInt(item.quantity || 1),
                        )}
                      </span>
                    ) : (
                      <span className="subtotal-placeholder">-</span>
                    )}
                  </div>
                  <div className="row-col actions-col">
                    {items.length > 1 && (
                      <button
                        type="button"
                        className="btn-remove"
                        onClick={() => removeItem(idx)}
                        title={t("Remove item")}
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="form-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              setItems([{ product_id: "", quantity: 1 }]);
              setSearchProduct("");
            }}
          >
            <i className="fas fa-redo"></i>
            {t("Reset Form")}
          </button>
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? (
              <>
                <i className="fas fa-spinner fa-spin"></i>
                {t("Processing...")}
              </>
            ) : (
              <>
                <i className="fas fa-check"></i>
                {t("Create Order")}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );

  return isMobile ? renderMobileView() : renderDesktopView();
};

export default CreateOrder;

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../../services/axios";
import { notifyError, notifySuccess } from "../../../utils/notify";
import "./PurchaseOrderReturns.css";

export default function PurchaseOrderReturns() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const loadItems = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/erp/purchase-orders/${id}/returnable-items`);
      const rows = res.data.items.map((i) => ({
        ...i,
        return_qty: "",
      }));
      setItems(rows);
    } catch (error) {
      console.error(error);
      notifyError("Failed to load returnable items");
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
      notifyError("Enter a valid quantity");
      return;
    }
    if (qty > row.available_to_return) {
      notifyError("Quantity exceeds the available return quantity");
      return;
    }

    try {
      await api.post(`/erp/purchase-orders/${id}/return`, {
        product_id: row.product_id,
        quantity: qty,
      });

      await loadItems();
      notifySuccess("Return recorded successfully");
      setSelectedItem(null);
    } catch (error) {
      console.error(error);
      notifyError(error.response?.data?.msg || "Failed to process return");
    }
  };

  const handleQuantityChange = (productId, value) => {
    setItems((prev) =>
      prev.map((item) =>
        item.product_id === productId ? { ...item, return_qty: value } : item,
      ),
    );
  };

  const openReturnModal = (item) => {
    setSelectedItem(item);
  };

  const closeReturnModal = () => {
    setSelectedItem(null);
  };

  const processReturnFromModal = () => {
    if (selectedItem) {
      handleReturn(selectedItem);
    }
  };

  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "400px" }}
      >
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  const renderMobileView = () => (
    <div className="returns-mobile">
      <div className="mobile-header">
        <button className="btn-back" onClick={() => navigate(-1)}>
          <i className="fas fa-arrow-left"></i>
        </button>
        <h3>Purchase Order Returns</h3>
      </div>

      {items.length === 0 ? (
        <div className="no-items">
          <i className="fas fa-box-open"></i>
          <p>No items available for return</p>
          <button className="btn-back-home" onClick={() => navigate(-1)}>
            <i className="fas fa-arrow-left me-2"></i>
            Go Back
          </button>
        </div>
      ) : (
        <div className="items-list">
          {items.map((item) => (
            <div key={item.product_id} className="item-card">
              <div className="item-header">
                <h4>{item.product_name}</h4>
                <div className="item-stats">
                  <div className="stat-badge received">
                    <span className="stat-label">Received:</span>
                    <span className="stat-value">{item.received_quantity}</span>
                  </div>
                  <div className="stat-badge returned">
                    <span className="stat-label">Returned:</span>
                    <span className="stat-value">{item.returned_quantity}</span>
                  </div>
                </div>
              </div>

              <div className="available-section">
                <div className="available-label">Available for Return</div>
                <div className="available-value">
                  {item.available_to_return}
                </div>
              </div>

              {item.available_to_return > 0 ? (
                <div className="return-controls">
                  <input
                    type="number"
                    className="return-input"
                    min="0"
                    max={item.available_to_return}
                    placeholder="Qty"
                    value={item.return_qty}
                    onChange={(e) =>
                      handleQuantityChange(item.product_id, e.target.value)
                    }
                  />
                  <button
                    className="btn-return"
                    onClick={() => handleReturn(item)}
                    disabled={!item.return_qty || Number(item.return_qty) <= 0}
                  >
                    <i className="fas fa-undo-alt me-2"></i>
                    Return Item
                  </button>
                </div>
              ) : (
                <div className="no-return">
                  <i className="fas fa-ban me-2"></i>
                  No quantity available for return
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Return Modal */}
      {selectedItem && (
        <div className="modal-overlay" onClick={closeReturnModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h5>Confirm Return</h5>
              <button className="btn-close" onClick={closeReturnModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <p>
                <strong>Product:</strong> {selectedItem.product_name}
              </p>
              <p>
                <strong>Return Quantity:</strong> {selectedItem.return_qty}
              </p>
              <p>
                <strong>Available:</strong> {selectedItem.available_to_return}
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={closeReturnModal}>
                Cancel
              </button>
              <button className="btn-confirm" onClick={processReturnFromModal}>
                Confirm Return
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderDesktopView = () => (
    <div className="returns-desktop">
      <div className="page-header">
        <div>
          <h2>Purchase Order Returns</h2>
          <p className="text-muted">Return items from purchase order #{id}</p>
        </div>
        <button className="btn-back" onClick={() => navigate(-1)}>
          <i className="fas fa-arrow-left me-2"></i>
          {/* Back to Order */}
        </button>
      </div>

      <div className="table-container">
        <table className="returns-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Received</th>
              <th>Returned</th>
              <th>Available for Return</th>
              <th>Return Quantity</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan="6" className="no-data">
                  <i className="fas fa-box-open fa-3x text-muted mb-3"></i>
                  <p className="text-muted">No items available for return</p>
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.product_id}>
                  <td className="product-name">{item.product_name}</td>
                  <td className="text-center received-cell">
                    {item.received_quantity}
                  </td>
                  <td className="text-center returned-cell">
                    {item.returned_quantity}
                  </td>
                  <td className="text-center available-cell">
                    <span
                      className={`available-badge ${item.available_to_return > 0 ? "positive" : "zero"}`}
                    >
                      {item.available_to_return}
                    </span>
                  </td>
                  <td className="quantity-cell">
                    <input
                      type="number"
                      className={`quantity-input ${item.return_qty && Number(item.return_qty) > item.available_to_return ? "error" : ""}`}
                      min="0"
                      max={item.available_to_return}
                      placeholder="Qty"
                      value={item.return_qty}
                      onChange={(e) =>
                        handleQuantityChange(item.product_id, e.target.value)
                      }
                      disabled={item.available_to_return <= 0}
                    />
                    {item.return_qty &&
                      Number(item.return_qty) > item.available_to_return && (
                        <div className="error-message">
                          Exceeds available quantity
                        </div>
                      )}
                  </td>
                  <td className="action-cell">
                    <button
                      className="btn-return"
                      onClick={() => handleReturn(item)}
                      disabled={
                        !item.return_qty ||
                        Number(item.return_qty) <= 0 ||
                        Number(item.return_qty) > item.available_to_return
                      }
                    >
                      <i className="fas fa-undo-alt me-2"></i>
                      Return
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return isMobile ? renderMobileView() : renderDesktopView();
}

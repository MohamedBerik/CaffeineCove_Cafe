import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../../services/axios";
import { notifyError, notifySuccess } from "../../../utils/notify";
import { useTranslation } from "react-i18next";
import "./PurchaseOrderReturns.css";

export default function PurchaseOrderReturns() {
  const { t } = useTranslation();
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
      // الخادم يُرجع الآن supply_id و supply_name بدلاً من product
      const rows = res.data.items.map((i) => ({
        ...i,
        return_qty: "",
      }));
      setItems(rows);
    } catch (error) {
      console.error(error);
      notifyError(t("Failed to load returnable items"));
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
      notifyError(t("Enter a valid quantity"));
      return;
    }
    if (qty > row.available_to_return) {
      notifyError(t("Quantity exceeds the available return quantity"));
      return;
    }

    try {
      await api.post(`/erp/purchase-orders/${id}/return`, {
        supply_id: row.supply_id, // ✅ تم التغيير
        quantity: qty,
      });

      await loadItems();
      notifySuccess(t("Return recorded successfully"));
      setSelectedItem(null);
    } catch (error) {
      console.error(error);
      notifyError(error.response?.data?.msg || t("Failed to process return"));
    }
  };

  const handleQuantityChange = (supplyId, value) => {
    setItems((prev) =>
      prev.map((item) =>
        item.supply_id === supplyId ? { ...item, return_qty: value } : item,
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
          <span className="visually-hidden">{t("Loading...")}</span>
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
        <h3>{t("Purchase Order Returns")}</h3>
      </div>

      {items.length === 0 ? (
        <div className="no-items">
          <i className="fas fa-box-open"></i>
          <p>{t("No items available for return")}</p>
          <button className="btn-back-home" onClick={() => navigate(-1)}>
            <i className="fas fa-arrow-left me-2"></i>
            {t("Go Back")}
          </button>
        </div>
      ) : (
        <div className="items-list">
          {items.map((item) => (
            <div key={item.supply_id} className="item-card">
              {" "}
              {/* ✅ مفتاح supply_id */}
              <div className="item-header">
                <h4>{item.supply_name}</h4> {/* ✅ supply_name */}
                <div className="item-stats">
                  <div className="stat-badge received">
                    <span className="stat-label">{t("Received")}:</span>
                    <span className="stat-value">{item.received_quantity}</span>
                  </div>
                  <div className="stat-badge returned">
                    <span className="stat-label">{t("Returned")}:</span>
                    <span className="stat-value">{item.returned_quantity}</span>
                  </div>
                </div>
              </div>
              <div className="available-section">
                <div className="available-label">
                  {t("Available for Return")}
                </div>
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
                    placeholder={t("Qty")}
                    value={item.return_qty}
                    onChange={
                      (e) =>
                        handleQuantityChange(item.supply_id, e.target.value) // ✅
                    }
                  />
                  <button
                    className="btn-return"
                    onClick={() => handleReturn(item)}
                    disabled={!item.return_qty || Number(item.return_qty) <= 0}
                  >
                    <i className="fas fa-undo-alt me-2"></i>
                    {t("Return Item")}
                  </button>
                </div>
              ) : (
                <div className="no-return">
                  <i className="fas fa-ban me-2"></i>
                  {t("No quantity available for return")}
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
              <h5>{t("Confirm Return")}</h5>
              <button className="btn-close" onClick={closeReturnModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <p>
                <strong>{t("Supply")}:</strong> {selectedItem.supply_name}{" "}
                {/* ✅ */}
              </p>
              <p>
                <strong>{t("Return Quantity")}:</strong>{" "}
                {selectedItem.return_qty}
              </p>
              <p>
                <strong>{t("Available")}:</strong>{" "}
                {selectedItem.available_to_return}
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={closeReturnModal}>
                {t("Cancel")}
              </button>
              <button className="btn-confirm" onClick={processReturnFromModal}>
                {t("Confirm Return")}
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
          <h2>{t("Purchase Order Returns")}</h2>
          <p className="text-muted">
            {t("Return items from purchase order")} #{id}
          </p>
        </div>
        <button className="btn-back" onClick={() => navigate(-1)}>
          <i className="fas fa-arrow-left me-2"></i>
          {t("Back to Order")}
        </button>
      </div>

      <div className="table-container">
        <table className="returns-table">
          <thead>
            <tr>
              <th>{t("Supply")}</th> {/* ✅ */}
              <th>{t("Received")}</th>
              <th>{t("Returned")}</th>
              <th>{t("Available for Return")}</th>
              <th>{t("Return Quantity")}</th>
              <th>{t("Action")}</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan="6" className="no-data">
                  <i className="fas fa-box-open fa-3x text-muted mb-3"></i>
                  <p className="text-muted">
                    {t("No items available for return")}
                  </p>
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.supply_id}>
                  {" "}
                  {/* ✅ */}
                  <td className="supply-name">{item.supply_name}</td> {/* ✅ */}
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
                      placeholder={t("Qty")}
                      value={item.return_qty}
                      onChange={
                        (e) =>
                          handleQuantityChange(item.supply_id, e.target.value) // ✅
                      }
                      disabled={item.available_to_return <= 0}
                    />
                    {item.return_qty &&
                      Number(item.return_qty) > item.available_to_return && (
                        <div className="error-message">
                          {t("Exceeds available quantity")}
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
                      {t("Return")}
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

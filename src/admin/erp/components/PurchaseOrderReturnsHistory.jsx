import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../../services/axios";
import { notifyError } from "../../../utils/notify";
import "./PurchaseOrderReturnsHistory.css";

export default function PurchaseOrderReturnsHistory() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/erp/purchase-orders/${id}/returns-history`);
      setRows(res.data.returns || []);
    } catch (error) {
      console.error(error);
      notifyError("Failed to load returns history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) loadHistory();
  }, [id]);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
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
    <div className="history-mobile">
      <div className="mobile-header">
        <button className="btn-back" onClick={() => navigate(-1)}>
          <i className="fas fa-arrow-left"></i>
        </button>
        <h3>Returns Log</h3>
        <div className="order-badge">PO #{id}</div>
      </div>

      {rows.length === 0 ? (
        <div className="no-data">
          <i className="fas fa-history"></i>
          <h4>No Returns Found</h4>
          <p className="text-muted">
            This purchase order has no return records
          </p>
          <button className="btn-back-home" onClick={() => navigate(-1)}>
            <i className="fas fa-arrow-left me-2"></i>
            Go Back
          </button>
        </div>
      ) : (
        <div className="timeline">
          {rows.map((r, index) => (
            <div key={r.id} className="timeline-item">
              <div className="timeline-badge">
                <span className="badge-number">{index + 1}</span>
              </div>
              <div className="timeline-content">
                <div className="return-header">
                  <h5>{r.product}</h5>
                  <span className="return-quantity">
                    <i className="fas fa-undo-alt me-1"></i>
                    {r.quantity}
                  </span>
                </div>
                <div className="return-meta">
                  <i className="far fa-clock me-1"></i>
                  <span>{formatDate(r.created_at)}</span>
                </div>
                <div className="return-id text-muted small">
                  Return ID: #{r.id}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderDesktopView = () => (
    <div className="history-desktop">
      <div className="page-header">
        <div>
          <h2>Purchase Order Returns Log</h2>
          <p className="text-muted">Return history for purchase order #{id}</p>
        </div>
        <div className="header-actions">
          <button className="btn-back" onClick={() => navigate(-1)}>
            <i className="fas fa-arrow-left me-2"></i>
            Back to Order
          </button>
        </div>
      </div>

      <div className="stats-summary">
        <div className="stat-card">
          <div className="stat-icon bg-primary">
            <i className="fas fa-undo-alt"></i>
          </div>
          <div>
            <div className="stat-label">Total Returns</div>
            <div className="stat-value">{rows.length}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon bg-success">
            <i className="fas fa-cubes"></i>
          </div>
          <div>
            <div className="stat-label">Total Items Returned</div>
            <div className="stat-value">
              {rows.reduce((sum, r) => sum + (r.quantity || 0), 0)}
            </div>
          </div>
        </div>
      </div>

      <div className="table-container">
        <table className="history-table">
          <thead>
            <tr>
              <th style={{ width: 60 }}>#</th>
              <th>Product</th>
              <th style={{ width: 150 }}>Returned Quantity</th>
              <th style={{ width: 200 }}>Date & Time</th>
              <th style={{ width: 100 }}>Return ID</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan="5" className="no-data">
                  <i className="fas fa-history fa-3x text-muted mb-3"></i>
                  <p className="text-muted">No return records found</p>
                </td>
              </tr>
            ) : (
              rows.map((r, index) => (
                <tr key={r.id} className="history-row">
                  <td className="index-cell">
                    <span className="index-badge">{index + 1}</span>
                  </td>
                  <td className="product-cell">
                    <div className="product-info">
                      <i className="fas fa-box me-2 text-muted"></i>
                      {r.product}
                    </div>
                  </td>
                  <td className="quantity-cell">
                    <span className="quantity-badge">
                      <i className="fas fa-undo-alt me-1"></i>
                      {r.quantity}
                    </span>
                  </td>
                  <td className="date-cell">
                    <i className="far fa-calendar-alt me-2 text-muted"></i>
                    {formatDate(r.created_at)}
                  </td>
                  <td className="id-cell">
                    <span className="id-badge">#{r.id}</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {rows.length > 0 && (
        <div className="table-footer">
          <span className="text-muted">
            Showing {rows.length} return record{rows.length !== 1 ? "s" : ""}
          </span>
        </div>
      )}
    </div>
  );

  return isMobile ? renderMobileView() : renderDesktopView();
}

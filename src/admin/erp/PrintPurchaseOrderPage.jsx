import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../services/axios";
import { useTranslation } from "react-i18next";
import "./PrintPurchaseOrderPage.css";

export default function PrintPurchaseOrderPage() {
  const { t, i18n } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();

  const [po, setPo] = useState(null);
  const [clinicSettings, setClinicSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [poRes, clinicRes] = await Promise.all([
        api.get(`/erp/purchase-orders/${id}`),
        api.get("/erp/clinic-settings"),
      ]);

      setPo(poRes.data || poRes.data?.data || poRes);
      setClinicSettings(clinicRes.data?.data || clinicRes.data || {});
    } catch (err) {
      setError(
        err?.response?.data?.message || t("Failed to load purchase order"),
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat(i18n.language === "ar" ? "ar-EG" : "en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(value || 0));
  };

  const formatDate = (value) => {
    if (!value) return "-";
    return new Date(value).toLocaleDateString(
      i18n.language === "ar" ? "ar-EG" : "en-US",
      { year: "numeric", month: "short", day: "2-digit" },
    );
  };

  const clinicName =
    clinicSettings?.clinic_name || clinicSettings?.name || t("Dental Clinic");
  const clinicAddress = clinicSettings?.address || "";
  const clinicPhone = clinicSettings?.phone || "";
  const clinicEmail = clinicSettings?.email || "";

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

  if (error || !po) {
    return (
      <div className="text-center py-5">
        <i className="fas fa-exclamation-circle fa-3x text-muted mb-3"></i>
        <h4>{error || t("Purchase order not found")}</h4>
        <button className="btn btn-primary" onClick={() => navigate(-1)}>
          <i className="fas fa-arrow-left me-2"></i>
          {t("Go Back")}
        </button>
      </div>
    );
  }

  const totalPaid = po.total_paid || 0;
  const remaining = po.remaining || 0;

  return (
    <div className="print-po-page">
      <div className="no-print print-controls">
        <button className="btn btn-primary me-2" onClick={handlePrint}>
          <i className="fas fa-print me-2"></i>
          {t("Print Purchase Order")}
        </button>
        <button
          className="btn btn-outline-secondary"
          onClick={() => navigate(-1)}
        >
          <i className="fas fa-arrow-left me-2"></i>
          {t("Back")}
        </button>
      </div>

      <div className="po-container">
        <div className="po-header">
          <div className="clinic-info">
            <h2>{clinicName}</h2>
            {clinicAddress && <p>{clinicAddress}</p>}
            {clinicPhone && (
              <p>
                {t("Phone")}: {clinicPhone}
              </p>
            )}
            {clinicEmail && (
              <p>
                {t("Email")}: {clinicEmail}
              </p>
            )}
          </div>
          <div className="po-title">
            <h1>{t("PURCHASE ORDER")}</h1>
            <p>#{po.number || po.id}</p>
          </div>
        </div>

        <div className="po-meta">
          <div className="meta-item">
            <span className="meta-label">{t("Supplier")}:</span>
            <span className="meta-value">{po.supplier?.name || "-"}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">{t("Date")}:</span>
            <span className="meta-value">{formatDate(po.created_at)}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">{t("Status")}:</span>
            <span
              className={`meta-value badge-status-${(po.status || "").toLowerCase()}`}
            >
              {t(po.status)}
            </span>
          </div>
        </div>

        <table className="po-items-table">
          <thead>
            <tr>
              <th>#</th>
              <th>{t("Supply")}</th>
              <th>{t("Quantity")}</th>
              <th>{t("Unit Cost")}</th>
              <th>{t("Total")}</th>
            </tr>
          </thead>
          <tbody>
            {po.items && po.items.length > 0 ? (
              po.items.map((item, index) => (
                <tr key={item.id || index}>
                  <td>{index + 1}</td>
                  <td>{item.supply?.name || `#${item.supply_id}`}</td>
                  <td>{item.quantity}</td>
                  <td>{formatCurrency(item.unit_cost)}</td>
                  <td>{formatCurrency(item.total)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="text-center">
                  {t("No items found")}
                </td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan="4" className="text-end fw-bold">
                {t("Subtotal")}
              </td>
              <td className="fw-bold">{formatCurrency(po.total)}</td>
            </tr>
            <tr>
              <td colSpan="4" className="text-end">
                {t("Total Paid")}
              </td>
              <td>{formatCurrency(totalPaid)}</td>
            </tr>
            <tr className="total-row">
              <td colSpan="4" className="text-end fw-bold">
                {t("Remaining")}
              </td>
              <td className="fw-bold">{formatCurrency(remaining)}</td>
            </tr>
          </tfoot>
        </table>

        <div className="po-footer">
          <p>{t("Thank you for your business!")}</p>
          <p>{t("This purchase order was generated electronically.")}</p>
        </div>
      </div>
    </div>
  );
}

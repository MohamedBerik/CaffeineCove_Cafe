import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../../services/axios";
import { useTranslation } from "react-i18next";
import "./PrintInvoicePage.css";

export default function PrintInvoicePage() {
  const { t, i18n } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [clinicSettings, setClinicSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const printRef = useRef();

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [invoiceRes, clinicRes] = await Promise.all([
        api.get(`/erp/invoices/${id}`),
        api.get("/erp/clinic-settings"),
      ]);

      const invoicePayload = invoiceRes.data || {};
      const clinicPayload = clinicRes.data || {};

      setInvoice(invoicePayload.data || invoicePayload);
      setClinicSettings(clinicPayload.data || clinicPayload);
    } catch (err) {
      setError(err?.response?.data?.message || t("Failed to load invoice"));
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
      currency: "EGP",
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

  // ✅ استخراج بيانات العيادة من الإعدادات
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

  if (error || !invoice) {
    return (
      <div className="text-center py-5">
        <i className="fas fa-exclamation-circle fa-3x text-muted mb-3"></i>
        <h4>{error || t("Invoice not found")}</h4>
        <button className="btn btn-primary" onClick={() => navigate(-1)}>
          <i className="fas fa-arrow-left me-2"></i>
          {t("Go Back")}
        </button>
      </div>
    );
  }

  return (
    <div className="print-invoice-page">
      {/* أزرار التحكم (تختفي عند الطباعة) */}
      <div className="no-print print-controls">
        <button className="btn btn-primary me-2" onClick={handlePrint}>
          <i className="fas fa-print me-2"></i>
          {t("Print Invoice")}
        </button>
        <button
          className="btn btn-outline-secondary"
          onClick={() => navigate(-1)}
        >
          <i className="fas fa-arrow-left me-2"></i>
          {t("Back")}
        </button>
      </div>

      {/* محتوى الفاتورة */}
      <div className="invoice-container" ref={printRef}>
        <div className="invoice-header">
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
          <div className="invoice-title">
            <h1>{t("INVOICE")}</h1>
            <p>#{invoice.number || invoice.id}</p>
          </div>
        </div>

        <div className="invoice-meta">
          <div className="meta-item">
            <span className="meta-label">{t("Patient")}:</span>
            <span className="meta-value">
              {invoice.customer?.name || invoice.patient?.name || "-"}
            </span>
          </div>
          <div className="meta-item">
            <span className="meta-label">{t("Date")}:</span>
            <span className="meta-value">
              {formatDate(invoice.issued_at || invoice.created_at)}
            </span>
          </div>
          <div className="meta-item">
            <span className="meta-label">{t("Status")}:</span>
            <span
              className={`meta-value badge-status-${(invoice.status || "").toLowerCase()}`}
            >
              {t(invoice.status)}
            </span>
          </div>
        </div>

        <table className="invoice-items-table">
          <thead>
            <tr>
              <th>{t("Item")}</th>
              <th>{t("Quantity")}</th>
              <th>{t("Unit Price")}</th>
              <th>{t("Total")}</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items && invoice.items.length > 0 ? (
              invoice.items.map((item, index) => (
                <tr key={item.id || index}>
                  <td>
                    {item.product?.title ||
                      item.description ||
                      `${t("Item")} ${index + 1}`}
                  </td>
                  <td>{item.quantity}</td>
                  <td>{formatCurrency(item.unit_price)}</td>
                  <td>{formatCurrency(item.total)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="text-center">
                  {t("No items found")}
                </td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan="3" className="text-end fw-bold">
                {t("Subtotal")}
              </td>
              <td className="fw-bold">{formatCurrency(invoice.total)}</td>
            </tr>
            {invoice.discount > 0 && (
              <tr>
                <td colSpan="3" className="text-end">
                  {t("Discount")}
                </td>
                <td>{formatCurrency(invoice.discount)}</td>
              </tr>
            )}
            <tr className="total-row">
              <td colSpan="3" className="text-end fw-bold">
                {t("Total")}
              </td>
              <td className="fw-bold">
                {formatCurrency(invoice.total - (invoice.discount || 0))}
              </td>
            </tr>
          </tfoot>
        </table>

        <div className="invoice-footer">
          <p>{t("Thank you for your trust!")}</p>
          <p>{t("This invoice was generated electronically.")}</p>
        </div>
      </div>
    </div>
  );
}

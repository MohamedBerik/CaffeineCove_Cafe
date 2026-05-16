import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../services/axios";
import { useTranslation } from "react-i18next";
import "./PrintBillingInvoicePage.css";

export default function PrintBillingInvoicePage() {
  const { t, i18n } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [platform, setPlatform] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadInvoice();
    loadPlatformInfo();
  }, [id]);

  const loadInvoice = async () => {
    try {
      const res = await api.get(`/erp/billing/invoices/${id}`);
      setInvoice(res.data.data || res.data);
    } catch (err) {
      setError(err?.response?.data?.message || t("Failed to load invoice."));
    }
  };

  const loadPlatformInfo = async () => {
    try {
      const res = await api.get("/erp/platform-info");
      setPlatform(res.data);
    } catch {
      // استخدام قيم افتراضية إذا فشل التحميل
      setPlatform({
        name: "",
        email: "",
        phone: "",
        address: "",
      });
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
    }).format(Number(value || 0));
  };

  const formatDate = (value) => {
    if (!value) return "-";
    return new Date(value).toLocaleDateString(
      i18n.language === "ar" ? "ar-EG" : "en-US",
      { year: "numeric", month: "short", day: "2-digit" },
    );
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
    <div className="print-billing-invoice-page">
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

      <div className="invoice-container">
        <div className="invoice-header">
          <div className="clinic-info">
            <h2>{platform?.name || t("Dental Clinic")}</h2>
            {platform?.address && <p>{platform.address}</p>}
            {platform?.phone && (
              <p>
                {t("Phone")}: {platform.phone}
              </p>
            )}
            {platform?.email && (
              <p>
                {t("Email")}: {platform.email}
              </p>
            )}
            <p>{t("Subscription Invoice")}</p>
          </div>
          <div className="invoice-title">
            <h1>{t("INVOICE")}</h1>
            <p>#{invoice.number}</p>
          </div>
        </div>

        <div className="invoice-meta">
          <div className="meta-item">
            <span className="meta-label">{t("Date")}:</span>
            <span className="meta-value">{formatDate(invoice.created_at)}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">{t("Status")}:</span>
            <span className="meta-value">{t(invoice.status)}</span>
          </div>
          {invoice.paid_at && (
            <div className="meta-item">
              <span className="meta-label">{t("Paid At")}:</span>
              <span className="meta-value">{formatDate(invoice.paid_at)}</span>
            </div>
          )}
        </div>

        <table className="invoice-items-table">
          <thead>
            <tr>
              <th>{t("Description")}</th>
              <th>{t("Amount")}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{t("Subscription Fee")}</td>
              <td>{formatCurrency(invoice.amount)}</td>
            </tr>
            {invoice.tax > 0 && (
              <tr>
                <td>{t("Tax (14%)")}</td>
                <td>{formatCurrency(invoice.tax)}</td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr className="total-row">
              <td className="text-end fw-bold">{t("Total")}</td>
              <td className="fw-bold">{formatCurrency(invoice.total)}</td>
            </tr>
          </tfoot>
        </table>

        <div className="invoice-footer">
          <p>{t("Thank you for your subscription!")}</p>
          <p>{t("This invoice was generated electronically.")}</p>
        </div>
      </div>
    </div>
  );
}

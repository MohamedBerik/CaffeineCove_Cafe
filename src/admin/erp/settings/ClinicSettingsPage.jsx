import { useEffect, useState } from "react";
import axios from "../../../services/axios";
import { useTranslation } from "react-i18next";
import "./ClinicSettingsPage.css";

export default function ClinicSettingsPage() {
  const { t, i18n } = useTranslation();
  const [data, setData] = useState(null);
  const [form, setForm] = useState({
    clinic_name: "",
    phone: "",
    email: "",
    currency: "",
    timezone: "",
    invoice_prefix: "",
    invoice_start_number: "",
    language: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadSettings();
  }, []);

  const normalizePayload = (payload) => {
    const src = payload?.data || payload || {};

    return {
      clinic_name: src.clinic_name ?? "",
      phone: src.phone ?? "",
      email: src.email ?? "",
      currency: src.currency ?? "USD",
      timezone: src.timezone ?? "UTC",
      invoice_prefix: src.invoice_prefix ?? "INV",
      invoice_start_number:
        src.invoice_start_number != null
          ? String(src.invoice_start_number)
          : "1",
      language: src.language ?? "en",
    };
  };

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const res = await axios.get("/erp/clinic-settings");
      const payload = res.data || {};

      setData(payload.data || payload);
      setForm(normalizePayload(payload));
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.msg ||
          t("Failed to load clinic settings."),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const submit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const payload = {
        clinic_name: form.clinic_name || "",
        phone: form.phone || null,
        email: form.email || null,
        currency: form.currency || "USD",
        timezone: form.timezone || "UTC",
        invoice_prefix: form.invoice_prefix || "INV",
        invoice_start_number: Number(form.invoice_start_number || 1),
        language: form.language || "en",
      };

      const res = await axios.put("/erp/clinic-settings", payload);

      setSuccess(
        res?.data?.msg ||
          res?.data?.message ||
          t("Clinic settings updated successfully."),
      );

      const updatedPayload = res.data || {};
      setData(updatedPayload.data || updatedPayload);
      setForm(normalizePayload(updatedPayload));
    } catch (err) {
      const errors = err?.response?.data?.errors;
      if (errors) {
        const firstError = Object.values(errors)?.[0]?.[0];
        setError(firstError || t("Failed to update clinic settings."));
      } else {
        setError(
          err?.response?.data?.message ||
            err?.response?.data?.msg ||
            t("Failed to update clinic settings."),
        );
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "320px" }}
      >
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">{t("Loading...")}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="clinic-settings-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-text">
          <h1 className="page-title">{t("Clinic Settings")}</h1>
          <p className="page-subtitle">
            {t("Manage clinic profile, invoice settings, and defaults")}
          </p>
        </div>

        <button className="btn btn-primary" onClick={loadSettings}>
          <i className="fas fa-sync-alt me-2"></i>
          {t("Refresh")}
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="alert alert-danger alert-dismissible fade show">
          <i className="fas fa-exclamation-circle me-2"></i>
          {error}
          <button
            type="button"
            className="btn-close"
            onClick={() => setError("")}
          ></button>
        </div>
      )}
      {success && (
        <div className="alert alert-success alert-dismissible fade show">
          <i className="fas fa-check-circle me-2"></i>
          {success}
          <button
            type="button"
            className="btn-close"
            onClick={() => setSuccess("")}
          ></button>
        </div>
      )}

      <div className="settings-grid">
        {/* Settings Form */}
        <div className="form-card">
          <div className="form-card-header">
            <i className="fas fa-sliders-h me-2"></i>
            <h5 className="mb-0">{t("Settings Form")}</h5>
          </div>

          <div className="form-card-body">
            <form onSubmit={submit}>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">
                    <i className="fas fa-hospital me-2"></i>
                    {t("Clinic Name")}
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    name="clinic_name"
                    value={form.clinic_name}
                    onChange={handleChange}
                    placeholder={t("My Clinic")}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <i className="fas fa-phone me-2"></i>
                    {t("Phone")}
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder={t("+20...")}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <i className="fas fa-envelope me-2"></i>
                    {t("Email")}
                  </label>
                  <input
                    type="email"
                    className="form-control"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder={t("clinic@example.com")}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <i className="fas fa-dollar-sign me-2"></i>
                    {t("Currency")}
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    name="currency"
                    value={form.currency}
                    onChange={handleChange}
                    placeholder="USD"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <i className="fas fa-globe me-2"></i>
                    {t("Timezone")}
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    name="timezone"
                    value={form.timezone}
                    onChange={handleChange}
                    placeholder="UTC"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <i className="fas fa-language me-2"></i>
                    {t("Language")}
                  </label>
                  <select
                    className="form-select"
                    name="language"
                    value={form.language}
                    onChange={handleChange}
                  >
                    <option value="en">{t("English")}</option>
                    <option value="ar">{t("Arabic")}</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <i className="fas fa-tag me-2"></i>
                    {t("Invoice Prefix")}
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    name="invoice_prefix"
                    value={form.invoice_prefix}
                    onChange={handleChange}
                    placeholder="INV"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <i className="fas fa-sort-numeric-up me-2"></i>
                    {t("Invoice Start Number")}
                  </label>
                  <input
                    type="number"
                    min="1"
                    className="form-control"
                    name="invoice_start_number"
                    value={form.invoice_start_number}
                    onChange={handleChange}
                    placeholder="1"
                  />
                </div>

                <div className="form-actions full-width">
                  <button
                    type="submit"
                    className="btn btn-primary btn-lg"
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        {t("Saving...")}
                      </>
                    ) : (
                      <>
                        <i className="fas fa-save me-2"></i>
                        {t("Save Settings")}
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-lg"
                    onClick={loadSettings}
                    disabled={saving}
                  >
                    <i className="fas fa-undo me-2"></i>
                    {t("Reset")}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Current Summary */}
        <div className="summary-card">
          <div className="summary-card-header">
            <i className="fas fa-chart-simple me-2"></i>
            <h5 className="mb-0">{t("Current Summary")}</h5>
          </div>

          <div className="summary-card-body">
            <SummaryItem
              icon="fas fa-hospital"
              label={t("Clinic Name")}
              value={form.clinic_name}
            />
            <SummaryItem
              icon="fas fa-phone"
              label={t("Phone")}
              value={form.phone}
            />
            <SummaryItem
              icon="fas fa-envelope"
              label={t("Email")}
              value={form.email}
            />
            <SummaryItem
              icon="fas fa-dollar-sign"
              label={t("Currency")}
              value={form.currency}
            />
            <SummaryItem
              icon="fas fa-globe"
              label={t("Timezone")}
              value={form.timezone}
            />
            <SummaryItem
              icon="fas fa-language"
              label={t("Language")}
              value={form.language === "ar" ? t("Arabic") : t("English")}
            />
            <SummaryItem
              icon="fas fa-tag"
              label={t("Invoice Prefix")}
              value={form.invoice_prefix}
            />
            <SummaryItem
              icon="fas fa-sort-numeric-up"
              label={t("Invoice Start Number")}
              value={form.invoice_start_number}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// SummaryItem Component
function SummaryItem({ icon, label, value }) {
  return (
    <div className="summary-item">
      <div className="summary-icon">
        <i className={icon}></i>
      </div>
      <div className="summary-content">
        <div className="summary-label">{label}</div>
        <div className="summary-value">{value || "-"}</div>
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import axios from "../../../services/axios";

export default function ClinicSettingsPage() {
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
          "Failed to load clinic settings.",
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
          "Clinic settings updated successfully.",
      );

      const updatedPayload = res.data || {};
      setData(updatedPayload.data || updatedPayload);
      setForm(normalizePayload(updatedPayload));
    } catch (err) {
      const errors = err?.response?.data?.errors;
      if (errors) {
        const firstError = Object.values(errors)?.[0]?.[0];
        setError(firstError || "Failed to update clinic settings.");
      } else {
        setError(
          err?.response?.data?.message ||
            err?.response?.data?.msg ||
            "Failed to update clinic settings.",
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
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid px-0">
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
        <div>
          <h3 className="fw-bold mb-1">Clinic Settings</h3>
          <p className="text-muted mb-0">
            Manage clinic profile, invoice settings, and defaults
          </p>
        </div>

        <button className="btn btn-primary" onClick={loadSettings}>
          Refresh
        </button>
      </div>

      {error ? <div className="alert alert-danger">{error}</div> : null}
      {success ? <div className="alert alert-success">{success}</div> : null}

      <div className="row g-4">
        <div className="col-12 col-xl-8">
          <div className="card shadow-sm border-0">
            <div className="card-header bg-white">
              <h5 className="mb-0">Settings Form</h5>
            </div>

            <div className="card-body">
              <form className="row g-3" onSubmit={submit}>
                <div className="col-12 col-md-6">
                  <label className="form-label fw-semibold">Clinic Name</label>
                  <input
                    type="text"
                    className="form-control"
                    name="clinic_name"
                    value={form.clinic_name}
                    onChange={handleChange}
                    placeholder="My Clinic"
                  />
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label fw-semibold">Phone</label>
                  <input
                    type="text"
                    className="form-control"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="+20..."
                  />
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label fw-semibold">Email</label>
                  <input
                    type="email"
                    className="form-control"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="clinic@example.com"
                  />
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label fw-semibold">Currency</label>
                  <input
                    type="text"
                    className="form-control"
                    name="currency"
                    value={form.currency}
                    onChange={handleChange}
                    placeholder="USD"
                  />
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label fw-semibold">Timezone</label>
                  <input
                    type="text"
                    className="form-control"
                    name="timezone"
                    value={form.timezone}
                    onChange={handleChange}
                    placeholder="UTC"
                  />
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label fw-semibold">Language</label>
                  <input
                    type="text"
                    className="form-control"
                    name="language"
                    value={form.language}
                    onChange={handleChange}
                    placeholder="en"
                  />
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label fw-semibold">
                    Invoice Prefix
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

                <div className="col-12 col-md-6">
                  <label className="form-label fw-semibold">
                    Invoice Start Number
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

                <div className="col-12 d-flex gap-2">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={saving}
                  >
                    {saving ? "Saving..." : "Save Settings"}
                  </button>

                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={loadSettings}
                    disabled={saving}
                  >
                    Reset
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        <div className="col-12 col-xl-4">
          <div className="card shadow-sm border-0">
            <div className="card-header bg-white">
              <h5 className="mb-0">Current Summary</h5>
            </div>

            <div className="card-body">
              <SummaryItem label="Clinic Name" value={form.clinic_name} />
              <SummaryItem label="Phone" value={form.phone} />
              <SummaryItem label="Email" value={form.email} />
              <SummaryItem label="Currency" value={form.currency} />
              <SummaryItem label="Timezone" value={form.timezone} />
              <SummaryItem label="Language" value={form.language} />
              <SummaryItem label="Invoice Prefix" value={form.invoice_prefix} />
              <SummaryItem
                label="Invoice Start Number"
                value={form.invoice_start_number}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryItem({ label, value }) {
  return (
    <div className="mb-3">
      <div className="small text-muted">{label}</div>
      <div className="fw-semibold">{value || "-"}</div>
    </div>
  );
}

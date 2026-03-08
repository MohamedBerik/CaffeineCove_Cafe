import { useEffect, useMemo, useState } from "react";
import axios from "../../../services/axios";

export default function ClinicSettingsPage() {
  const [data, setData] = useState(null);
  const [form, setForm] = useState({
    clinic_name: "",
    clinic_name_ar: "",
    phone: "",
    email: "",
    address: "",
    working_days: "",
    work_start: "",
    work_end: "",
    slot_minutes: "",
    notes: "",
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
      clinic_name: src.clinic_name ?? src.name ?? src.title ?? "",
      clinic_name_ar: src.clinic_name_ar ?? src.name_ar ?? src.title_ar ?? "",
      phone: src.phone ?? "",
      email: src.email ?? "",
      address: src.address ?? "",
      working_days: Array.isArray(src.working_days)
        ? src.working_days.join(", ")
        : (src.working_days ?? ""),
      work_start: src.work_start ?? "",
      work_end: src.work_end ?? "",
      slot_minutes: src.slot_minutes != null ? String(src.slot_minutes) : "",
      notes: src.notes ?? "",
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
        clinic_name: form.clinic_name || null,
        clinic_name_ar: form.clinic_name_ar || null,
        phone: form.phone || null,
        email: form.email || null,
        address: form.address || null,
        working_days: form.working_days || null,
        work_start: form.work_start || null,
        work_end: form.work_end || null,
        slot_minutes:
          form.slot_minutes !== "" ? Number(form.slot_minutes) : null,
        notes: form.notes || null,
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

  const summary = useMemo(() => {
    return [
      form.clinic_name || "-",
      form.phone || "-",
      form.email || "-",
      form.work_start && form.work_end
        ? `${form.work_start} → ${form.work_end}`
        : "-",
      form.slot_minutes ? `${form.slot_minutes} min` : "-",
    ];
  }, [form]);

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
            Manage clinic profile, schedule, and appointment defaults
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
                    placeholder="Caffeine Cove Clinic"
                  />
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label fw-semibold">
                    Clinic Name (AR)
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    name="clinic_name_ar"
                    value={form.clinic_name_ar}
                    onChange={handleChange}
                    placeholder="اسم العيادة"
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

                <div className="col-12">
                  <label className="form-label fw-semibold">Address</label>
                  <textarea
                    className="form-control"
                    rows="2"
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    placeholder="Clinic address..."
                  />
                </div>

                <div className="col-12 col-md-4">
                  <label className="form-label fw-semibold">Work Start</label>
                  <input
                    type="time"
                    className="form-control"
                    name="work_start"
                    value={form.work_start}
                    onChange={handleChange}
                  />
                </div>

                <div className="col-12 col-md-4">
                  <label className="form-label fw-semibold">Work End</label>
                  <input
                    type="time"
                    className="form-control"
                    name="work_end"
                    value={form.work_end}
                    onChange={handleChange}
                  />
                </div>

                <div className="col-12 col-md-4">
                  <label className="form-label fw-semibold">Slot Minutes</label>
                  <input
                    type="number"
                    min="5"
                    step="5"
                    className="form-control"
                    name="slot_minutes"
                    value={form.slot_minutes}
                    onChange={handleChange}
                    placeholder="30"
                  />
                </div>

                <div className="col-12">
                  <label className="form-label fw-semibold">Working Days</label>
                  <input
                    type="text"
                    className="form-control"
                    name="working_days"
                    value={form.working_days}
                    onChange={handleChange}
                    placeholder="Sat, Sun, Mon, Tue, Wed, Thu"
                  />
                  <div className="form-text">
                    Use a comma-separated list if your API stores text.
                  </div>
                </div>

                <div className="col-12">
                  <label className="form-label fw-semibold">Notes</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    name="notes"
                    value={form.notes}
                    onChange={handleChange}
                    placeholder="Internal clinic notes..."
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
              <div className="small text-muted mb-1">Clinic</div>
              <div className="fw-semibold mb-3">{summary[0]}</div>

              <div className="small text-muted mb-1">Phone</div>
              <div className="fw-semibold mb-3">{summary[1]}</div>

              <div className="small text-muted mb-1">Email</div>
              <div className="fw-semibold mb-3">{summary[2]}</div>

              <div className="small text-muted mb-1">Working Hours</div>
              <div className="fw-semibold mb-3">{summary[3]}</div>

              <div className="small text-muted mb-1">Slot Duration</div>
              <div className="fw-semibold">{summary[4]}</div>

              {data ? (
                <div className="mt-4">
                  <div className="small text-muted mb-2">Raw Loaded Data</div>
                  <pre
                    className="mb-0 p-3 bg-light border rounded"
                    style={{
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                      fontSize: "0.8rem",
                    }}
                  >
                    {JSON.stringify(data, null, 2)}
                  </pre>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

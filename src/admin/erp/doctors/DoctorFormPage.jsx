import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "../../../services/axios";

export default function DoctorFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const isEdit = Boolean(id);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    specialty: "",
    work_start: "",
    work_end: "",
    slot_minutes: "30",
    is_active: true,
  });

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isEdit) {
      loadDoctor();
    }
  }, [id]);

  const normalizeDoctor = (data) => {
    return {
      name: data?.name || "",
      email: data?.email || "",
      phone: data?.phone || "",
      specialty: data?.specialty || "",
      work_start: data?.work_start || "",
      work_end: data?.work_end || "",
      slot_minutes:
        data?.slot_minutes != null ? String(data.slot_minutes) : "30",
      is_active:
        data?.is_active === true ||
        data?.is_active === 1 ||
        String(data?.is_active) === "1",
    };
  };

  const loadDoctor = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await axios.get(`/erp/doctors/${id}`);
      const payload = res.data || {};
      const data = payload.data || payload;

      setForm(normalizeDoctor(data));
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.msg ||
          "Failed to load doctor.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const submit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");

      const payload = {
        name: form.name,
        email: form.email || null,
        phone: form.phone || null,
        specialty: form.specialty || null,
        work_start: form.work_start || null,
        work_end: form.work_end || null,
        slot_minutes: Number(form.slot_minutes || 30),
        is_active: form.is_active ? 1 : 0,
      };

      if (isEdit) {
        await axios.put(`/erp/doctors/${id}`, payload);
      } else {
        await axios.post("/erp/doctors", payload);
      }

      navigate("/admin/erp/doctors");
    } catch (err) {
      const errors = err?.response?.data?.errors;
      if (errors) {
        const firstError = Object.values(errors)?.[0]?.[0];
        setError(firstError || "Failed to save doctor.");
      } else {
        setError(
          err?.response?.data?.message ||
            err?.response?.data?.msg ||
            "Failed to save doctor.",
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
        style={{ minHeight: 320 }}
      >
        <div className="spinner-border text-primary" />
      </div>
    );
  }

  return (
    <div className="container-fluid px-0">
      <div className="d-flex justify-content-between align-items-center mb-4 gap-2">
        <div>
          <h3 className="fw-bold mb-1">
            {isEdit ? "Edit Doctor" : "Create Doctor"}
          </h3>
          <p className="text-muted mb-0">
            Manage doctor profile, hours, and booking slot settings
          </p>
        </div>

        <button
          className="btn btn-outline-secondary"
          onClick={() => navigate("/admin/erp/doctors")}
        >
          Back
        </button>
      </div>

      {error ? <div className="alert alert-danger">{error}</div> : null}

      <div className="card shadow-sm border-0">
        <div className="card-body">
          <form className="row g-3" onSubmit={submit}>
            <div className="col-12 col-md-6">
              <label className="form-label fw-semibold">Name</label>
              <input
                className="form-control"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label fw-semibold">Specialty</label>
              <input
                className="form-control"
                name="specialty"
                value={form.specialty}
                onChange={handleChange}
                placeholder="Dentist / Orthodontist / Surgeon..."
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
              />
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label fw-semibold">Phone</label>
              <input
                className="form-control"
                name="phone"
                value={form.phone}
                onChange={handleChange}
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
              />
            </div>

            <div className="col-12">
              <div className="form-check">
                <input
                  id="doctor-active"
                  type="checkbox"
                  className="form-check-input"
                  name="is_active"
                  checked={form.is_active}
                  onChange={handleChange}
                />
                <label htmlFor="doctor-active" className="form-check-label">
                  Active doctor
                </label>
              </div>
            </div>

            <div className="col-12">
              <button className="btn btn-primary" disabled={saving}>
                {saving ? "Saving..." : "Save Doctor"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

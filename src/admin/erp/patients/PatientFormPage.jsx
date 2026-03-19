import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "../../../services/axios";

export default function PatientFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    gender: "",
    address: "",
    date_of_birth: "",
    notes: "",
  });

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isEdit) {
      loadPatient();
    }
  }, [id]);

  const loadPatient = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await axios.get(`/erp/customers/${id}`);
      const data = res.data?.data || res.data || {};

      setForm({
        name: data.name || "",
        email: data.email || "",
        phone: data.phone || "",
        gender: data.gender || "",
        address: data.address || "",
        date_of_birth: data.date_of_birth || "",
        notes: data.notes || "",
      });
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.msg ||
          "Failed to load patient.",
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

      if (isEdit) {
        await axios.put(`/erp/customers/${id}`, form);
        navigate(`/admin/erp/patients/${id}/profile`);
        return;
      }

      const res = await axios.post("/erp/customers", form);
      const saved = res.data?.data || res.data;

      if (saved?.id) {
        navigate(`/admin/erp/patients/${saved.id}/profile`);
      } else {
        navigate("/admin/erp/patients");
      }
    } catch (err) {
      const errors = err?.response?.data?.errors;

      if (errors) {
        const firstError = Object.values(errors)?.[0]?.[0];
        setError(firstError || "Failed to save patient.");
      } else {
        setError(
          err?.response?.data?.message ||
            err?.response?.data?.msg ||
            "Failed to save patient.",
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
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h3 className="fw-bold mb-1">
            {isEdit ? "Edit Patient" : "Create Patient"}
          </h3>
          <p className="text-muted mb-0">
            {isEdit
              ? "Update patient basic information"
              : "Create a new patient profile"}
          </p>
        </div>

        <div className="d-flex gap-2">
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={() => navigate("/admin/erp/patients")}
          >
            Patients
          </button>

          {isEdit ? (
            <button
              type="button"
              className="btn btn-outline-primary"
              onClick={() => navigate(`/admin/erp/patients/${id}/profile`)}
            >
              Profile
            </button>
          ) : null}
        </div>
      </div>

      {error ? <div className="alert alert-danger">{error}</div> : null}

      <div className="card shadow-sm border-0">
        <div className="card-body">
          <form className="row g-3" onSubmit={submit}>
            <div className="col-md-6">
              <label className="form-label fw-semibold">Name</label>
              <input
                className="form-control"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="col-md-6">
              <label className="form-label fw-semibold">Email</label>
              <input
                className="form-control"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
              />
            </div>

            <div className="col-md-6">
              <label className="form-label fw-semibold">Phone</label>
              <input
                className="form-control"
                name="phone"
                value={form.phone}
                onChange={handleChange}
              />
            </div>

            <div className="col-md-3">
              <label className="form-label fw-semibold">Gender</label>
              <select
                className="form-select"
                name="gender"
                value={form.gender}
                onChange={handleChange}
              >
                <option value="">--</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>

            <div className="col-md-3">
              <label className="form-label fw-semibold">Birth Date</label>
              <input
                type="date"
                className="form-control"
                name="date_of_birth"
                value={form.date_of_birth}
                onChange={handleChange}
              />
            </div>

            <div className="col-12">
              <label className="form-label fw-semibold">Address</label>
              <input
                className="form-control"
                name="address"
                value={form.address}
                onChange={handleChange}
              />
            </div>

            <div className="col-12">
              <label className="form-label fw-semibold">Notes</label>
              <textarea
                className="form-control"
                rows="3"
                name="notes"
                value={form.notes}
                onChange={handleChange}
              />
            </div>

            <div className="col-12 d-flex gap-2">
              <button className="btn btn-primary" disabled={saving}>
                {saving
                  ? "Saving..."
                  : isEdit
                    ? "Update Patient"
                    : "Create Patient"}
              </button>

              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => navigate("/admin/erp/patients")}
                disabled={saving}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

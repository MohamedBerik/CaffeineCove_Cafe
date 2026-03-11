import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import axios from "../../../services/axios";

export default function ProcedureFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    name: "",
    default_price: "",
    is_active: true,
  });

  useEffect(() => {
    if (isEdit) {
      loadProcedure();
    }
  }, [id]);

  const loadProcedure = async () => {
    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const res = await axios.get(`/erp/procedures/${id}`);
      const payload = res.data || {};
      const procedure = payload.data || payload || {};

      setForm({
        name: procedure.name || "",
        default_price:
          procedure.default_price != null
            ? String(procedure.default_price)
            : "",
        is_active:
          Number(procedure.is_active) === 1 || procedure.is_active === true,
      });
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.msg ||
          "Failed to load procedure.",
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
      setSuccess("");

      const payload = {
        name: form.name.trim(),
        default_price: Number(form.default_price || 0),
        is_active: form.is_active ? 1 : 0,
      };

      let res;
      if (isEdit) {
        res = await axios.put(`/erp/procedures/${id}`, payload);
      } else {
        res = await axios.post("/erp/procedures", payload);
      }

      const saved = res?.data?.data || null;

      setSuccess(
        isEdit
          ? "Procedure updated successfully."
          : "Procedure created successfully.",
      );

      if (!isEdit && saved?.id) {
        navigate(`/admin/erp/procedures/${saved.id}/edit`);
        return;
      }
    } catch (err) {
      const errors = err?.response?.data?.errors;
      if (errors) {
        const firstError = Object.values(errors)?.[0]?.[0];
        setError(firstError || "Failed to save procedure.");
      } else {
        setError(
          err?.response?.data?.message ||
            err?.response?.data?.msg ||
            "Failed to save procedure.",
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
          <h3 className="fw-bold mb-1">
            {isEdit ? "Edit Procedure" : "Add Procedure"}
          </h3>
          <p className="text-muted mb-0">
            Manage procedure name, default price, and active status
          </p>
        </div>

        <div className="d-flex gap-2">
          <Link
            to="/admin/erp/procedures"
            className="btn btn-outline-secondary"
          >
            Back to Procedures
          </Link>

          {isEdit ? (
            <button className="btn btn-outline-primary" onClick={loadProcedure}>
              Refresh
            </button>
          ) : null}
        </div>
      </div>

      {error ? <div className="alert alert-danger">{error}</div> : null}
      {success ? <div className="alert alert-success">{success}</div> : null}

      <div className="card shadow-sm border-0">
        <div className="card-body">
          <form className="row g-3" onSubmit={submit}>
            <div className="col-12 col-lg-6">
              <label className="form-label fw-semibold">Procedure Name</label>
              <input
                type="text"
                className="form-control"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g. Root Canal"
                required
              />
            </div>

            <div className="col-12 col-lg-3">
              <label className="form-label fw-semibold">Default Price</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="form-control"
                name="default_price"
                value={form.default_price}
                onChange={handleChange}
                placeholder="1200"
                required
              />
            </div>

            <div className="col-12 col-lg-3">
              <label className="form-label fw-semibold d-block">Status</label>
              <div className="form-check form-switch mt-2">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="is_active"
                  name="is_active"
                  checked={form.is_active}
                  onChange={handleChange}
                />
                <label className="form-check-label" htmlFor="is_active">
                  {form.is_active ? "Active" : "Inactive"}
                </label>
              </div>
            </div>

            <div className="col-12">
              <div className="alert alert-light border mb-0">
                <div className="fw-semibold mb-1">Notes</div>
                <div className="small text-muted">
                  Default Price is used when adding this procedure to a
                  treatment plan. Existing treatment plan items keep their saved
                  price and will not be changed automatically.
                </div>
              </div>
            </div>

            <div className="col-12 d-flex gap-2">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
              >
                {saving
                  ? isEdit
                    ? "Saving..."
                    : "Creating..."
                  : isEdit
                    ? "Save Changes"
                    : "Create Procedure"}
              </button>

              <Link
                to="/admin/erp/procedures"
                className="btn btn-outline-secondary"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

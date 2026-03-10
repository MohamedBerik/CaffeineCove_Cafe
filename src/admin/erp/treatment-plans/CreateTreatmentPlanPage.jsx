import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import axios from "../../../services/axios";

export default function CreateTreatmentPlanPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const presetCustomerId = searchParams.get("customer_id") || "";

  const [patients, setPatients] = useState([]);
  const [loadingRefs, setLoadingRefs] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    customer_id: presetCustomerId,
    title: "",
    notes: "",
  });

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    try {
      setLoadingRefs(true);
      setError("");

      const res = await axios.get("/erp/customers");
      const payload = res.data || {};

      const patientRows = Array.isArray(payload.data)
        ? payload.data
        : payload.data?.data || [];

      setPatients(patientRows);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.msg ||
          "Failed to load patients.",
      );
    } finally {
      setLoadingRefs(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const selectedPatient = useMemo(() => {
    return patients.find((p) => String(p.id) === String(form.customer_id));
  }, [patients, form.customer_id]);

  const submit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const payload = {
        customer_id: Number(form.customer_id),
        title: form.title,
        notes: form.notes || null,
      };

      const res = await axios.post("/erp/treatment-plans", payload);
      const created = res.data?.data;

      setSuccess("Treatment plan created successfully.");

      if (created?.id) {
        navigate(`/admin/erp/treatment-plans/${created.id}`);
      }
    } catch (err) {
      const errors = err?.response?.data?.errors;
      if (errors) {
        const firstError = Object.values(errors)?.[0]?.[0];
        setError(firstError || "Failed to create treatment plan.");
      } else {
        setError(
          err?.response?.data?.message ||
            err?.response?.data?.msg ||
            "Failed to create treatment plan.",
        );
      }
    } finally {
      setSaving(false);
    }
  };

  if (loadingRefs) {
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
          <h3 className="fw-bold mb-1">Create Treatment Plan</h3>
          <p className="text-muted mb-0">
            Create a new treatment plan for a patient
          </p>
        </div>

        <div className="d-flex gap-2">
          <Link
            to="/admin/erp/treatment-plans"
            className="btn btn-outline-secondary"
          >
            Back to Plans
          </Link>
        </div>
      </div>

      {error ? <div className="alert alert-danger">{error}</div> : null}
      {success ? <div className="alert alert-success">{success}</div> : null}

      <div className="card shadow-sm border-0">
        <div className="card-body">
          <form className="row g-3" onSubmit={submit}>
            <div className="col-12 col-md-6">
              <label className="form-label fw-semibold">Patient</label>
              <select
                className="form-select"
                name="customer_id"
                value={form.customer_id}
                onChange={handleChange}
                required
              >
                <option value="">Select patient</option>
                {patients.map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.name}
                    {patient.patient_code ? ` (${patient.patient_code})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label fw-semibold">Title</label>
              <input
                type="text"
                className="form-control"
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="e.g. Ahmed Dental Plan"
                required
              />
            </div>

            <div className="col-12">
              <label className="form-label fw-semibold">Notes</label>
              <textarea
                className="form-control"
                rows="4"
                name="notes"
                value={form.notes}
                onChange={handleChange}
                placeholder="Optional notes..."
              />
            </div>

            <div className="col-12">
              <div className="alert alert-light border mb-0">
                <div className="fw-semibold">Plan Cost</div>
                <div className="small text-muted">
                  Total cost will be calculated automatically after adding plan
                  items.
                </div>
              </div>
            </div>

            {selectedPatient ? (
              <div className="col-12">
                <div className="alert alert-light border mb-0">
                  <div className="fw-semibold">Selected Patient</div>
                  <div>{selectedPatient.name}</div>
                  <div className="small text-muted">
                    {selectedPatient.email || "-"} |{" "}
                    {selectedPatient.phone || "-"}
                  </div>
                </div>
              </div>
            ) : null}

            <div className="col-12 d-flex gap-2">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
              >
                {saving ? "Saving..." : "Create Treatment Plan"}
              </button>

              <Link
                to="/admin/erp/treatment-plans"
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

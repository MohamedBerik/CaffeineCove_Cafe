import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "../../../services/axios";

export default function StartVisitPage() {
  const navigate = useNavigate();

  const [patients, setPatients] = useState([]);
  const [loadingRefs, setLoadingRefs] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [form, setForm] = useState({
    customer_id: "",
    visit_type: "consultation",
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

  const continueVisit = async (e) => {
    e.preventDefault();

    if (!form.customer_id) {
      setError("Please select a patient first.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const customerId = Number(form.customer_id);

      if (form.visit_type === "consultation") {
        navigate(`/admin/erp/appointments/create?customer_id=${customerId}`);
        return;
      }

      if (form.visit_type === "treatment") {
        navigate(`/admin/erp/dental-records/create?customer_id=${customerId}`);
        return;
      }

      setError("Invalid visit type selected.");
    } finally {
      setSubmitting(false);
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
          <h3 className="fw-bold mb-1">Start Visit</h3>
          <p className="text-muted mb-0">
            Begin the patient workflow by choosing the patient and visit type
          </p>
        </div>

        <div className="d-flex gap-2">
          <Link
            to="/admin/erp/patients/create"
            className="btn btn-outline-primary btn-sm"
          >
            <i className="fas fa-user-plus me-1"></i>
            New Patient
          </Link>
          <Link
            to="/admin/erp/treatment-plans/create"
            className="btn btn-outline-secondary btn-sm"
          >
            <i className="fas fa-notes-medical me-1"></i>
            New Treatment Plan
          </Link>
          <Link to="/admin/erp" className="btn btn-outline-secondary">
            Back to Dashboard
          </Link>
        </div>
      </div>

      {error ? <div className="alert alert-danger">{error}</div> : null}

      <div className="card shadow-sm border-0">
        <div className="card-body">
          <form className="row g-3" onSubmit={continueVisit}>
            <div className="col-12 col-lg-6">
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

            <div className="col-12 col-lg-6">
              <label className="form-label fw-semibold">Visit Type</label>
              <select
                className="form-select"
                name="visit_type"
                value={form.visit_type}
                onChange={handleChange}
              >
                <option value="consultation">Consultation</option>
                <option value="treatment">Treatment</option>
              </select>
            </div>

            <div className="col-12">
              <div className="alert alert-light border mb-0">
                <div className="fw-semibold mb-2">Workflow Preview</div>

                {form.visit_type === "consultation" ? (
                  <div className="small text-muted">
                    Consultation visit will continue to appointment booking.
                    After booking, the clinic can proceed with consultation
                    billing and the doctor can continue with examination and
                    dental record creation if needed.
                  </div>
                ) : (
                  <div className="small text-muted">
                    Treatment visit will continue to dental record creation
                    first, then treatment plan preparation, then procedure
                    scheduling and billing.
                  </div>
                )}
              </div>
            </div>

            {selectedPatient ? (
              <div className="col-12">
                <div className="alert alert-info mb-0">
                  <div className="fw-semibold mb-1">Selected Patient</div>
                  <div>{selectedPatient.name}</div>
                  <div className="small">
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
                disabled={submitting}
              >
                {submitting ? "Continuing..." : "Continue"}
              </button>

              <Link to="/admin/erp" className="btn btn-outline-secondary">
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

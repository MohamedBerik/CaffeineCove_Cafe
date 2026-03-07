import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import axios from "../../../services/axios";

export default function CreateDentalRecordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const presetCustomerId = searchParams.get("customer_id") || "";
  const presetAppointmentId = searchParams.get("appointment_id") || "";

  const [patients, setPatients] = useState([]);
  const [procedures, setProcedures] = useState([]);

  const [loadingRefs, setLoadingRefs] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    customer_id: presetCustomerId,
    appointment_id: presetAppointmentId,
    procedure_id: "",
    tooth_number: "",
    surface: "",
    status: "planned",
    notes: "",
  });

  useEffect(() => {
    loadRefs();
  }, []);

  const loadRefs = async () => {
    try {
      setLoadingRefs(true);
      setError("");

      const [patientsRes, proceduresRes] = await Promise.all([
        axios.get("/erp/customers"),
        axios.get("/erp/procedures"),
      ]);

      const patientsPayload = patientsRes.data || {};
      const proceduresPayload = proceduresRes.data || {};

      const patientRows = Array.isArray(patientsPayload.data)
        ? patientsPayload.data
        : patientsPayload.data?.data || [];

      const procedureRows = Array.isArray(proceduresPayload.data)
        ? proceduresPayload.data
        : proceduresPayload.data?.data || [];

      setPatients(patientRows);
      setProcedures(procedureRows);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.msg ||
          "Failed to load reference data.",
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
        tooth_number: form.tooth_number,
        status: form.status || "planned",
        surface: form.surface || null,
        notes: form.notes || null,
      };

      if (form.appointment_id) {
        payload.appointment_id = Number(form.appointment_id);
      }

      if (form.procedure_id) {
        payload.procedure_id = Number(form.procedure_id);
      }

      const res = await axios.post("/erp/dental-records", payload);
      const created = res.data?.data;

      setSuccess("Dental record created successfully.");

      if (created?.id) {
        navigate(`/admin/erp/dental-records`);
      }
    } catch (err) {
      const errors = err?.response?.data?.errors;
      if (errors) {
        const firstError = Object.values(errors)?.[0]?.[0];
        setError(firstError || "Failed to create dental record.");
      } else {
        setError(
          err?.response?.data?.message ||
            err?.response?.data?.msg ||
            "Failed to create dental record.",
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
          <h3 className="fw-bold mb-1">Create Dental Record</h3>
          <p className="text-muted mb-0">
            Add a new dental chart record for a patient
          </p>
        </div>

        <div className="d-flex gap-2">
          <Link
            to="/admin/erp/dental-records"
            className="btn btn-outline-secondary"
          >
            Back to Dental Records
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
              <label className="form-label fw-semibold">Appointment ID</label>
              <input
                type="number"
                className="form-control"
                name="appointment_id"
                value={form.appointment_id}
                onChange={handleChange}
                placeholder="Optional"
              />
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label fw-semibold">Procedure</label>
              <select
                className="form-select"
                name="procedure_id"
                value={form.procedure_id}
                onChange={handleChange}
              >
                <option value="">Select procedure</option>
                {procedures.map((procedure) => (
                  <option key={procedure.id} value={procedure.id}>
                    {procedure.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-12 col-md-3">
              <label className="form-label fw-semibold">Tooth Number</label>
              <input
                type="text"
                className="form-control"
                name="tooth_number"
                value={form.tooth_number}
                onChange={handleChange}
                placeholder="16"
                required
              />
            </div>

            <div className="col-12 col-md-3">
              <label className="form-label fw-semibold">Surface</label>
              <input
                type="text"
                className="form-control"
                name="surface"
                value={form.surface}
                onChange={handleChange}
                placeholder="occlusal"
              />
            </div>

            <div className="col-12 col-md-4">
              <label className="form-label fw-semibold">Status</label>
              <select
                className="form-select"
                name="status"
                value={form.status}
                onChange={handleChange}
              >
                <option value="planned">planned</option>
                <option value="in_progress">in_progress</option>
                <option value="completed">completed</option>
                <option value="cancelled">cancelled</option>
              </select>
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
                {saving ? "Saving..." : "Create Dental Record"}
              </button>

              <Link
                to="/admin/erp/dental-records"
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

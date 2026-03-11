import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import axios from "../../../services/axios";

export default function CreateDentalRecordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const presetCustomerId = searchParams.get("customer_id") || "";
  const presetAppointmentId = searchParams.get("appointment_id") || "";
  const presetDoctorId = searchParams.get("doctor_id") || "";

  const [patients, setPatients] = useState([]);
  const [procedures, setProcedures] = useState([]);
  const [doctors, setDoctors] = useState([]);

  const [loadingRefs, setLoadingRefs] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [createdRecord, setCreatedRecord] = useState(null);

  const [form, setForm] = useState({
    customer_id: presetCustomerId,
    appointment_id: presetAppointmentId,
    doctor_id: presetDoctorId,
    procedure_id: "",
    tooth_number: "",
    surface: "",
    notes: "",
  });

  useEffect(() => {
    loadRefs();
  }, []);

  const loadRefs = async () => {
    try {
      setLoadingRefs(true);
      setError("");

      const [patientsRes, proceduresRes, doctorsRes] = await Promise.all([
        axios.get("/erp/customers"),
        axios.get("/erp/procedures", {
          params: { is_active: true },
        }),
        axios.get("/erp/doctors"),
      ]);

      const patientsPayload = patientsRes.data || {};
      const proceduresPayload = proceduresRes.data || {};
      const doctorsPayload = doctorsRes.data || {};

      const patientRows = Array.isArray(patientsPayload.data)
        ? patientsPayload.data
        : patientsPayload.data?.data || [];

      const procedureRowsRaw = Array.isArray(proceduresPayload.data)
        ? proceduresPayload.data
        : proceduresPayload.data?.data || [];

      const doctorRows = Array.isArray(doctorsPayload.data)
        ? doctorsPayload.data
        : doctorsPayload.data?.data || [];

      const activeProcedureRows = procedureRowsRaw.filter(
        (p) => Number(p.is_active) === 1 || p.is_active === true,
      );

      setPatients(patientRows);
      setProcedures(activeProcedureRows);
      setDoctors(doctorRows);
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

  const selectedDoctor = useMemo(() => {
    return doctors.find((d) => String(d.id) === String(form.doctor_id));
  }, [doctors, form.doctor_id]);

  const selectedProcedure = useMemo(() => {
    return procedures.find((p) => String(p.id) === String(form.procedure_id));
  }, [procedures, form.procedure_id]);

  const submit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");
      setCreatedRecord(null);

      const payload = {
        customer_id: Number(form.customer_id),
        tooth_number: form.tooth_number,
        status: "planned",
        surface: form.surface || null,
        notes: form.notes || null,
      };

      if (form.appointment_id) {
        payload.appointment_id = Number(form.appointment_id);
      }

      if (form.procedure_id) {
        payload.procedure_id = Number(form.procedure_id);
      }

      if (form.doctor_id) {
        payload.doctor_id = Number(form.doctor_id);
      }

      const res = await axios.post("/erp/dental-records", payload);
      const created = res.data?.data || null;

      setCreatedRecord(created);
      setSuccess("Dental record created successfully.");
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

  const money = (value) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(Number(value || 0));

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
            Add a clinical dental record for a patient before treatment planning
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

      {presetAppointmentId ? (
        <div className="alert alert-info">
          This record is linked to appointment #{presetAppointmentId}.
        </div>
      ) : null}

      {createdRecord ? (
        <div className="alert alert-light border d-flex flex-wrap justify-content-between align-items-center gap-2">
          <div>
            <div className="fw-semibold">Next Step</div>
            <div className="small text-muted">
              You can now create a treatment plan directly for this patient.
            </div>
          </div>

          <div className="d-flex gap-2">
            <Link
              to={`/admin/erp/treatment-plans/create?customer_id=${form.customer_id}`}
              className="btn btn-primary"
            >
              Create Treatment Plan
            </Link>

            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => navigate("/admin/erp/dental-records")}
            >
              Go to Dental Records
            </button>
          </div>
        </div>
      ) : null}

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
                disabled={Boolean(createdRecord)}
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
              <label className="form-label fw-semibold">Doctor</label>
              <select
                className="form-select"
                name="doctor_id"
                value={form.doctor_id}
                onChange={handleChange}
                disabled={Boolean(createdRecord)}
              >
                <option value="">Select doctor</option>
                {doctors.map((doctor) => (
                  <option key={doctor.id} value={doctor.id}>
                    {doctor.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label fw-semibold">Procedure</label>
              <select
                className="form-select"
                name="procedure_id"
                value={form.procedure_id}
                onChange={handleChange}
                disabled={Boolean(createdRecord)}
              >
                <option value="">Select procedure</option>
                {procedures.map((procedure) => (
                  <option key={procedure.id} value={procedure.id}>
                    {procedure.name}
                    {procedure.default_price != null
                      ? ` (${money(procedure.default_price)})`
                      : ""}
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
                disabled={Boolean(createdRecord)}
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
                disabled={Boolean(createdRecord)}
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
                placeholder="Clinical findings, diagnosis, and observations..."
                disabled={Boolean(createdRecord)}
              />
            </div>

            {selectedPatient || selectedDoctor || selectedProcedure ? (
              <div className="col-12">
                <div className="alert alert-light border mb-0">
                  <div className="fw-semibold mb-1">Record Summary</div>

                  {selectedPatient ? (
                    <div>
                      Patient: {selectedPatient.name}
                      {selectedPatient.email
                        ? ` — ${selectedPatient.email}`
                        : ""}
                    </div>
                  ) : null}

                  {selectedDoctor ? (
                    <div>Doctor: {selectedDoctor.name}</div>
                  ) : null}

                  {selectedProcedure ? (
                    <div>
                      Procedure: {selectedProcedure.name}
                      {selectedProcedure.default_price != null
                        ? ` — ${money(selectedProcedure.default_price)}`
                        : ""}
                    </div>
                  ) : null}

                  {form.tooth_number ? (
                    <div>Tooth: {form.tooth_number}</div>
                  ) : null}
                  {form.surface ? <div>Surface: {form.surface}</div> : null}
                  {form.appointment_id ? (
                    <div>Linked Appointment: #{form.appointment_id}</div>
                  ) : null}
                </div>
              </div>
            ) : null}

            <div className="col-12 d-flex gap-2">
              {!createdRecord ? (
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Create Dental Record"}
                </button>
              ) : null}

              <Link
                to="/admin/erp/dental-records"
                className="btn btn-outline-secondary"
              >
                Cancel
              </Link>

              {!createdRecord && form.customer_id ? (
                <Link
                  to={`/admin/erp/treatment-plans/create?customer_id=${form.customer_id}`}
                  className="btn btn-outline-primary"
                >
                  Skip to Treatment Plan
                </Link>
              ) : null}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

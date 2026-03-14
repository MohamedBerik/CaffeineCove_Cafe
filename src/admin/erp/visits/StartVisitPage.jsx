import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "../../../services/axios";

export default function StartVisitPage() {
  const navigate = useNavigate();

  const [patients, setPatients] = useState([]);
  const [plans, setPlans] = useState([]);

  const [loadingRefs, setLoadingRefs] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    customer_id: "",
    visit_type: "consultation",
    treatment_plan_id: "",
  });

  useEffect(() => {
    loadRefs();
  }, []);

  useEffect(() => {
    if (form.visit_type !== "treatment_from_plan") {
      setForm((prev) => ({
        ...prev,
        treatment_plan_id: "",
      }));
    }
  }, [form.visit_type]);

  const loadRefs = async () => {
    try {
      setLoadingRefs(true);
      setError("");

      const [patientsRes, plansRes] = await Promise.all([
        axios.get("/erp/customers"),
        axios.get("/erp/treatment-plans"),
      ]);

      const patientsPayload = patientsRes.data || {};
      const plansPayload = plansRes.data || {};

      const patientRows = Array.isArray(patientsPayload.data)
        ? patientsPayload.data
        : patientsPayload.data?.data || [];

      const planRows = Array.isArray(plansPayload.data)
        ? plansPayload.data
        : plansPayload.data?.data || [];

      setPatients(patientRows);
      setPlans(planRows);
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

  const patientPlans = useMemo(() => {
    if (!form.customer_id) return [];

    return plans.filter(
      (plan) => String(plan.customer_id) === String(form.customer_id),
    );
  }, [plans, form.customer_id]);

  const selectedPlan = useMemo(() => {
    return patientPlans.find(
      (plan) => String(plan.id) === String(form.treatment_plan_id),
    );
  }, [patientPlans, form.treatment_plan_id]);

  const continueVisit = async (e) => {
    e.preventDefault();

    if (!form.customer_id) {
      setError("Please select a patient first.");
      return;
    }

    if (form.visit_type === "treatment_from_plan" && !form.treatment_plan_id) {
      setError("Please select a treatment plan first.");
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

      if (form.visit_type === "treatment_from_plan") {
        navigate(
          `/admin/erp/treatment-plans/${form.treatment_plan_id}?customer_id=${customerId}`,
        );
        return;
      }

      if (form.visit_type === "emergency_treatment") {
        navigate(`/admin/erp/dental-records/create?customer_id=${customerId}`);
        return;
      }

      setError("Invalid visit type selected.");
    } finally {
      setSubmitting(false);
    }
  };

  const visitCards = [
    {
      key: "consultation",
      title: "Consultation",
      icon: "fas fa-stethoscope",
      description:
        "Book a consultation appointment, collect consultation fee, then continue with exam and diagnosis.",
      nextStep: "Goes to appointment booking",
      color: "primary",
    },
    {
      key: "treatment_from_plan",
      title: "Treatment From Plan",
      icon: "fas fa-notes-medical",
      description:
        "Use an existing treatment plan, open the plan, then start the required procedure and continue to billing.",
      nextStep: "Goes to treatment plan details",
      color: "success",
    },
    {
      key: "emergency_treatment",
      title: "Emergency Treatment",
      icon: "fas fa-tooth",
      description:
        "Create a dental record first for an urgent case, then prepare treatment flow and schedule the needed procedure.",
      nextStep: "Goes to create dental record",
      color: "warning",
    },
  ];

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
            Start the patient journey by selecting the patient and visit path
          </p>
        </div>

        <div className="d-flex flex-wrap gap-2">
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
        </div>
      </div>

      {error ? <div className="alert alert-danger">{error}</div> : null}

      <div className="row g-4">
        <div className="col-12 col-xl-8">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-header bg-white">
              <h5 className="mb-0">Visit Starter</h5>
            </div>

            <div className="card-body">
              <form className="row g-3" onSubmit={continueVisit}>
                <div className="col-12">
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
                        {patient.patient_code
                          ? ` (${patient.patient_code})`
                          : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-12">
                  <label className="form-label fw-semibold">Visit Type</label>
                  <div className="row g-3">
                    {visitCards.map((card) => {
                      const active = form.visit_type === card.key;

                      return (
                        <div className="col-12 col-md-4" key={card.key}>
                          <label
                            className={`card h-100 border cursor-pointer ${
                              active ? `border-${card.color} shadow-sm` : ""
                            }`}
                            style={{ cursor: "pointer" }}
                          >
                            <div className="card-body">
                              <div className="form-check mb-2">
                                <input
                                  className="form-check-input"
                                  type="radio"
                                  name="visit_type"
                                  value={card.key}
                                  checked={active}
                                  onChange={handleChange}
                                  id={`visit_type_${card.key}`}
                                />
                                <label
                                  className="form-check-label fw-semibold"
                                  htmlFor={`visit_type_${card.key}`}
                                >
                                  <i className={`${card.icon} me-2`}></i>
                                  {card.title}
                                </label>
                              </div>

                              <div className="small text-muted mb-2">
                                {card.description}
                              </div>

                              <div
                                className={`small text-${card.color} fw-semibold`}
                              >
                                {card.nextStep}
                              </div>
                            </div>
                          </label>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {form.visit_type === "treatment_from_plan" ? (
                  <div className="col-12">
                    <label className="form-label fw-semibold">
                      Existing Treatment Plan
                    </label>
                    <select
                      className="form-select"
                      name="treatment_plan_id"
                      value={form.treatment_plan_id}
                      onChange={handleChange}
                      required
                      disabled={!form.customer_id}
                    >
                      <option value="">
                        {form.customer_id
                          ? "Select treatment plan"
                          : "Select patient first"}
                      </option>

                      {patientPlans.map((plan) => (
                        <option key={plan.id} value={plan.id}>
                          #{plan.id} - {plan.title}
                        </option>
                      ))}
                    </select>

                    {form.customer_id && patientPlans.length === 0 ? (
                      <div className="form-text text-danger">
                        This patient has no treatment plans yet. Create a dental
                        record or treatment plan first.
                      </div>
                    ) : null}
                  </div>
                ) : null}

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

                {selectedPlan ? (
                  <div className="col-12">
                    <div className="alert alert-light border mb-0">
                      <div className="fw-semibold mb-1">Selected Plan</div>
                      <div>{selectedPlan.title}</div>
                      <div className="small text-muted">
                        Status: {selectedPlan.status || "-"} | Total Cost:{" "}
                        {selectedPlan.total_cost ?? "-"}
                      </div>
                    </div>
                  </div>
                ) : null}

                <div className="col-12 d-flex flex-wrap gap-2">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={
                      submitting ||
                      !form.customer_id ||
                      (form.visit_type === "treatment_from_plan" &&
                        !form.treatment_plan_id)
                    }
                  >
                    {submitting
                      ? "Continuing..."
                      : form.visit_type === "consultation"
                        ? "Book Consultation"
                        : form.visit_type === "treatment_from_plan"
                          ? "Open Treatment Plan"
                          : "Start Emergency Treatment"}
                  </button>

                  <Link to="/admin/erp" className="btn btn-outline-secondary">
                    Cancel
                  </Link>
                </div>
              </form>
            </div>
          </div>
        </div>

        <div className="col-12 col-xl-4">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-header bg-white">
              <h5 className="mb-0">Workflow Preview</h5>
            </div>

            <div className="card-body">
              {form.visit_type === "consultation" ? (
                <>
                  <div className="fw-semibold mb-2">Consultation Flow</div>
                  <ol className="small text-muted ps-3 mb-0">
                    <li>Book consultation appointment</li>
                    <li>Consultation invoice is created</li>
                    <li>Doctor examines patient</li>
                    <li>Complete appointment</li>
                    <li>Go to invoice/payment page</li>
                    <li>Create dental record if treatment is needed</li>
                  </ol>
                </>
              ) : null}

              {form.visit_type === "treatment_from_plan" ? (
                <>
                  <div className="fw-semibold mb-2">
                    Treatment From Plan Flow
                  </div>
                  <ol className="small text-muted ps-3 mb-0">
                    <li>Open existing treatment plan</li>
                    <li>Select the required plan item</li>
                    <li>Start procedure</li>
                    <li>Create treatment appointment</li>
                    <li>Complete appointment</li>
                    <li>Create invoice and continue to payment</li>
                  </ol>
                </>
              ) : null}

              {form.visit_type === "emergency_treatment" ? (
                <>
                  <div className="fw-semibold mb-2">
                    Emergency Treatment Flow
                  </div>
                  <ol className="small text-muted ps-3 mb-0">
                    <li>Create dental record first</li>
                    <li>Document tooth and clinical notes</li>
                    <li>Create treatment plan if needed</li>
                    <li>Start procedure and book slot</li>
                    <li>Complete appointment</li>
                    <li>Create invoice and continue to payment</li>
                  </ol>
                </>
              ) : null}

              <hr />

              <div className="small text-muted">
                Dental Record and Treatment Plan are still important. Treatment
                should not jump directly to billing unless the doctor already
                has a valid plan item to execute.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "../../../services/axios";
import { useTranslation } from "react-i18next";
import "./StartVisitPage.css";

export default function StartVisitPage() {
  const { t, i18n } = useTranslation();
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
          t("Failed to load reference data."),
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
      setError(t("Please select a patient first."));
      return;
    }

    if (form.visit_type === "treatment_from_plan" && !form.treatment_plan_id) {
      setError(t("Please select a treatment plan first."));
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
        navigate(`/admin/erp/treatment-plans/${form.treatment_plan_id}`);
        return;
      }

      if (form.visit_type === "emergency_treatment") {
        navigate(`/admin/erp/patients/${customerId}/profile`);
        return;
      }

      setError(t("Invalid visit type selected."));
    } finally {
      setSubmitting(false);
    }
  };

  const visitCards = [
    {
      key: "consultation",
      titleKey: "Consultation",
      icon: "fas fa-stethoscope",
      descriptionKey: "consultation_desc",
      nextStepKey: "consultation_next",
      color: "primary",
    },
    {
      key: "treatment_from_plan",
      titleKey: "Treatment From Plan",
      icon: "fas fa-notes-medical",
      descriptionKey: "treatment_plan_desc",
      nextStepKey: "treatment_plan_next",
      color: "success",
    },
    {
      key: "emergency_treatment",
      titleKey: "Emergency Treatment",
      icon: "fas fa-tooth",
      descriptionKey: "emergency_desc",
      nextStepKey: "emergency_next",
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
          <span className="visually-hidden">{t("Loading...")}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="start-visit-page">
      {/* Header Section */}
      <div className="page-header">
        <div className="header-text">
          <h1 className="page-title">{t("Start Visit")}</h1>
          <p className="page-subtitle">
            {t(
              "Start the patient journey by selecting the patient and visit path",
            )}
          </p>
        </div>

        <div className="header-actions">
          <Link
            to="/admin/erp/patients/create"
            className="btn btn-outline-primary"
          >
            <i className="fas fa-user-plus me-2"></i>
            {t("New Patient")}
          </Link>

          <Link
            to="/admin/erp/treatment-plans/create"
            className="btn btn-outline-secondary"
          >
            <i className="fas fa-notes-medical me-2"></i>
            {t("New Treatment Plan")}
          </Link>
        </div>
      </div>

      {error && (
        <div
          className="alert alert-danger alert-dismissible fade show"
          role="alert"
        >
          <i className="fas fa-exclamation-circle me-2"></i>
          {error}
          <button
            type="button"
            className="btn-close"
            onClick={() => setError("")}
            aria-label={t("Close")}
          ></button>
        </div>
      )}

      <div className="visit-container">
        {/* Main Form Section */}
        <div className="visit-form-section">
          <div className="form-card">
            <div className="form-card-header">
              <i className="fas fa-play-circle me-2"></i>
              <h5 className="mb-0">{t("Visit Starter")}</h5>
            </div>

            <div className="form-card-body">
              <form onSubmit={continueVisit}>
                {/* Patient Selection */}
                <div className="form-group">
                  <label className="form-label">
                    <i className="fas fa-user me-2"></i>
                    {t("Patient")}
                    <span className="required-star">*</span>
                  </label>
                  <select
                    className="form-select"
                    name="customer_id"
                    value={form.customer_id}
                    onChange={handleChange}
                    required
                  >
                    <option value="">{t("Select patient")}</option>
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

                {/* Visit Type Selection */}
                <div className="form-group">
                  <label className="form-label">
                    <i className="fas fa-stethoscope me-2"></i>
                    {t("Visit Type")}
                    <span className="required-star">*</span>
                  </label>
                  <div className="visit-types-grid">
                    {visitCards.map((card) => {
                      const active = form.visit_type === card.key;
                      return (
                        <div
                          key={card.key}
                          className={`visit-card ${active ? `active ${card.color}` : ""}`}
                          onClick={() => {
                            setForm((prev) => ({
                              ...prev,
                              visit_type: card.key,
                            }));
                          }}
                        >
                          <div className="visit-card-radio">
                            <input
                              type="radio"
                              name="visit_type"
                              value={card.key}
                              checked={active}
                              onChange={handleChange}
                              id={`visit_type_${card.key}`}
                            />
                            <label
                              className="visit-card-title"
                              htmlFor={`visit_type_${card.key}`}
                            >
                              <i className={`${card.icon} me-2`}></i>
                              {t(card.titleKey)}
                            </label>
                          </div>
                          <p className="visit-card-description">
                            {t(card.descriptionKey)}
                          </p>
                          <div className={`visit-card-next text-${card.color}`}>
                            <i className="fas fa-arrow-right me-1"></i>
                            {t(card.nextStepKey)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Treatment Plan Selection */}
                {form.visit_type === "treatment_from_plan" && (
                  <div className="form-group">
                    <label className="form-label">
                      <i className="fas fa-notes-medical me-2"></i>
                      {t("Existing Treatment Plan")}
                      <span className="required-star">*</span>
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
                          ? t("Select treatment plan")
                          : t("Select patient first")}
                      </option>
                      {patientPlans.map((plan) => (
                        <option key={plan.id} value={plan.id}>
                          #{plan.id} - {plan.title}
                        </option>
                      ))}
                    </select>
                    {form.customer_id && patientPlans.length === 0 && (
                      <div className="form-hint error">
                        <i className="fas fa-exclamation-triangle me-1"></i>
                        {t("This patient has no treatment plans yet.")}
                      </div>
                    )}
                  </div>
                )}

                {/* Selected Patient Info */}
                {selectedPatient && (
                  <div className="info-card patient-info">
                    <div className="info-card-header">
                      <i className="fas fa-user-circle me-2"></i>
                      <span className="fw-semibold">
                        {t("Selected Patient")}
                      </span>
                    </div>
                    <div className="info-card-body">
                      <div className="patient-name">{selectedPatient.name}</div>
                      <div className="patient-contact">
                        <span>{selectedPatient.email || "-"}</span>
                        <span className="separator">|</span>
                        <span>{selectedPatient.phone || "-"}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Selected Plan Info */}
                {selectedPlan && (
                  <div className="info-card plan-info">
                    <div className="info-card-header">
                      <i className="fas fa-clipboard-list me-2"></i>
                      <span className="fw-semibold">{t("Selected Plan")}</span>
                    </div>
                    <div className="info-card-body">
                      <div className="plan-title">{selectedPlan.title}</div>
                      <div className="plan-details">
                        <span>
                          {t("Status")}: {selectedPlan.status || "-"}
                        </span>
                        <span className="separator">|</span>
                        <span>
                          {t("Total Cost")}: {selectedPlan.total_cost ?? "-"}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Form Actions */}
                <div className="form-actions">
                  <button
                    type="submit"
                    className="btn btn-primary btn-lg"
                    disabled={
                      submitting ||
                      !form.customer_id ||
                      (form.visit_type === "treatment_from_plan" &&
                        !form.treatment_plan_id)
                    }
                  >
                    {submitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        {t("Continuing...")}
                      </>
                    ) : (
                      <>
                        <i className="fas fa-arrow-right me-2"></i>
                        {form.visit_type === "consultation"
                          ? t("Book Consultation")
                          : form.visit_type === "treatment_from_plan"
                            ? t("Open Treatment Plan")
                            : t("Open Patient Profile")}
                      </>
                    )}
                  </button>

                  <Link to="/admin/erp" className="btn btn-outline-secondary">
                    <i className="fas fa-times me-2"></i>
                    {t("Cancel")}
                  </Link>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Workflow Preview Section */}
        <div className="workflow-section">
          <div className="workflow-card">
            <div className="workflow-card-header">
              <i className="fas fa-diagram-project me-2"></i>
              <h5 className="mb-0">{t("Workflow Preview")}</h5>
            </div>

            <div className="workflow-card-body">
              {form.visit_type === "consultation" && (
                <div className="workflow-steps">
                  <div className="workflow-title">
                    <i className="fas fa-stethoscope text-primary me-2"></i>
                    {t("Consultation Flow")}
                  </div>
                  <ol className="steps-list">
                    <li>{t("Book consultation appointment")}</li>
                    <li>{t("Consultation invoice is created")}</li>
                    <li>{t("Doctor examines patient")}</li>
                    <li>{t("Complete appointment")}</li>
                    <li>{t("Go to invoice/payment page")}</li>
                    <li>{t("Create dental record if treatment is needed")}</li>
                  </ol>
                </div>
              )}

              {form.visit_type === "treatment_from_plan" && (
                <div className="workflow-steps">
                  <div className="workflow-title">
                    <i className="fas fa-notes-medical text-success me-2"></i>
                    {t("Treatment From Plan Flow")}
                  </div>
                  <ol className="steps-list">
                    <li>{t("Open existing treatment plan")}</li>
                    <li>{t("Select the required plan item")}</li>
                    <li>{t("Start procedure")}</li>
                    <li>{t("Create treatment appointment")}</li>
                    <li>{t("Complete appointment")}</li>
                    <li>{t("Create invoice and continue to payment")}</li>
                  </ol>
                </div>
              )}

              {form.visit_type === "emergency_treatment" && (
                <div className="workflow-steps">
                  <div className="workflow-title">
                    <i className="fas fa-truck-medical text-warning me-2"></i>
                    {t("Emergency Treatment Flow")}
                  </div>
                  <ol className="steps-list">
                    <li>{t("Open patient profile")}</li>
                    <li>{t("Add dental record from dental chart")}</li>
                    <li>{t("Convert to treatment plan item if needed")}</li>
                    <li>{t("Open treatment plan")}</li>
                    <li>{t("Start procedure and book slot")}</li>
                    <li>{t("Complete appointment and continue to payment")}</li>
                  </ol>
                </div>
              )}

              <hr className="workflow-divider" />

              <div className="workflow-note">
                <i className="fas fa-info-circle me-2"></i>
                {t(
                  "Dental Record and Treatment Plan remain part of the treatment workflow. Billing should happen only after a valid consultation or a valid treatment appointment completion.",
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "../../../services/axios";
import { useTranslation } from "react-i18next";
import "./AppointmentActivityPage.css";

export default function AppointmentActivityPage() {
  const { t, i18n } = useTranslation();
  const { id } = useParams();

  const [appointment, setAppointment] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [notesForm, setNotesForm] = useState({
    clinical_notes: "",
    diagnosis: "",
    next_step: "",
  });
  const [savingNotes, setSavingNotes] = useState(false);
  const [notesSuccess, setNotesSuccess] = useState("");
  const [notesError, setNotesError] = useState("");

  const [completeForm, setCompleteForm] = useState({
    doctor_name: "",
    notes: "",
    clinical_notes: "",
    diagnosis: "",
    next_step: "",
  });
  const [completing, setCompleting] = useState(false);
  const [completeError, setCompleteError] = useState("");
  const [completeSuccess, setCompleteSuccess] = useState("");
  const [completeResult, setCompleteResult] = useState(null);

  useEffect(() => {
    loadPage();
  }, [id]);

  const loadPage = async () => {
    try {
      setLoading(true);
      setError("");
      setNotesError("");
      setNotesSuccess("");
      setCompleteError("");

      const [appointmentRes, activityRes] = await Promise.all([
        axios.get(`/erp/appointments/${id}`),
        axios.get(`/erp/appointments/${id}/activity`),
      ]);

      const appointmentPayload = appointmentRes.data || {};
      const activityPayload = activityRes.data || {};

      const appointmentData =
        appointmentPayload.data ||
        appointmentPayload.appointment ||
        appointmentPayload;

      const activityRows = Array.isArray(activityPayload.data)
        ? activityPayload.data
        : [];

      setAppointment(appointmentData || null);
      setRows(activityRows);

      setNotesForm({
        clinical_notes: appointmentData?.clinical_notes || "",
        diagnosis: appointmentData?.diagnosis || "",
        next_step: appointmentData?.next_step || "",
      });

      setCompleteForm({
        doctor_name:
          appointmentData?.doctor?.name || appointmentData?.doctor_name || "",
        notes: appointmentData?.notes || "",
        clinical_notes: appointmentData?.clinical_notes || "",
        diagnosis: appointmentData?.diagnosis || "",
        next_step: appointmentData?.next_step || "",
      });
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.msg ||
          t("Failed to load appointment details."),
      );
    } finally {
      setLoading(false);
    }
  };

  const sortedRows = useMemo(() => {
    return [...rows].sort((a, b) => {
      const da = new Date(a.created_at || 0).getTime();
      const db = new Date(b.created_at || 0).getTime();
      return db - da;
    });
  }, [rows]);

  const parseProperties = (value) => {
    if (!value) return null;
    try {
      if (typeof value === "string") {
        return JSON.parse(value);
      }
      return value;
    } catch {
      return value;
    }
  };

  const latestEvent = sortedRows[0] || null;
  const latestEventProperties = parseProperties(latestEvent?.properties);

  const patientId = appointment?.patient?.id || appointment?.patient_id || null;
  const invoiceId =
    appointment?.invoice_id || latestEventProperties?.invoice_id || null;
  const treatmentPlanId =
    appointment?.treatment_plan_id ||
    latestEventProperties?.treatment_plan_id ||
    null;

  const formatDateTime = (value) => {
    if (!value) return "-";
    try {
      const lang = i18n.language === "ar" ? "ar-EG" : "en-US";
      return new Date(value).toLocaleString(lang, {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return value;
    }
  };

  const formatDate = (value) => {
    if (!value) return "-";
    try {
      const lang = i18n.language === "ar" ? "ar-EG" : "en-US";
      return new Date(value).toLocaleDateString(lang, {
        year: "numeric",
        month: "short",
        day: "2-digit",
      });
    } catch {
      return value;
    }
  };

  const formatTime = (value) => {
    if (!value) return "-";
    return String(value).slice(0, 5) || "-";
  };

  const formatCurrency = (value) => {
    const lang = i18n.language === "ar" ? "ar-EG" : "en-US";
    return new Intl.NumberFormat(lang, {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(value || 0));
  };

  const formatJson = (value) => {
    if (!value) return "-";
    try {
      if (typeof value === "string") {
        const parsed = JSON.parse(value);
        return JSON.stringify(parsed, null, 2);
      }
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  };

  const handleNotesChange = (e) => {
    const { name, value } = e.target;
    setNotesForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCompleteChange = (e) => {
    const { name, value } = e.target;
    setCompleteForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const saveClinicalNotes = async (e) => {
    e.preventDefault();

    try {
      setSavingNotes(true);
      setNotesError("");
      setNotesSuccess("");

      await axios.put(`/erp/appointments/${id}`, {
        clinical_notes: notesForm.clinical_notes || null,
        diagnosis: notesForm.diagnosis || null,
        next_step: notesForm.next_step || null,
      });

      setNotesSuccess(t("Clinical notes saved successfully."));
      await loadPage();
    } catch (err) {
      const errors = err?.response?.data?.errors;
      if (errors) {
        const firstError = Object.values(errors)?.[0]?.[0];
        setNotesError(firstError || t("Failed to save clinical notes."));
      } else {
        setNotesError(
          err?.response?.data?.message ||
            err?.response?.data?.msg ||
            t("Failed to save clinical notes."),
        );
      }
    } finally {
      setSavingNotes(false);
    }
  };

  const completeAppointment = async (e) => {
    e.preventDefault();

    try {
      setCompleting(true);
      setCompleteError("");
      setCompleteSuccess("");
      setCompleteResult(null);

      const payload = {
        doctor_name: completeForm.doctor_name || null,
        notes: completeForm.notes || null,
        clinical_notes: completeForm.clinical_notes || null,
        diagnosis: completeForm.diagnosis || null,
        next_step: completeForm.next_step || null,
      };

      const res = await axios.post(`/erp/appointments/${id}/complete`, payload);
      const result = res.data || {};

      setCompleteResult(result);
      setCompleteSuccess(
        result?.msg || t("Appointment completed successfully."),
      );

      await loadPage();
    } catch (err) {
      const responseData = err?.response?.data || {};
      const errors = responseData?.errors;

      if (errors) {
        const firstError = Object.values(errors)?.[0]?.[0];
        setCompleteError(firstError || t("Failed to complete appointment."));
      } else {
        setCompleteError(
          responseData?.message ||
            responseData?.msg ||
            t("Failed to complete appointment."),
        );
      }

      if (responseData?.invoice_id) {
        setCompleteResult(responseData);
      }
    } finally {
      setCompleting(false);
    }
  };

  const resetClinicalNotesForm = () => {
    setNotesError("");
    setNotesSuccess("");
    setNotesForm({
      clinical_notes: appointment?.clinical_notes || "",
      diagnosis: appointment?.diagnosis || "",
      next_step: appointment?.next_step || "",
    });
  };

  const resetCompleteForm = () => {
    setCompleteError("");
    setCompleteSuccess("");
    setCompleteResult(null);
    setCompleteForm({
      doctor_name: appointment?.doctor?.name || appointment?.doctor_name || "",
      notes: appointment?.notes || "",
      clinical_notes: appointment?.clinical_notes || "",
      diagnosis: appointment?.diagnosis || "",
      next_step: appointment?.next_step || "",
    });
  };

  const isCompleted =
    String(appointment?.status || "").toLowerCase() === "completed";

  const isScheduled =
    String(appointment?.status || "").toLowerCase() === "scheduled";

  const hasNotesChanged =
    (appointment?.clinical_notes || "") !== notesForm.clinical_notes ||
    (appointment?.diagnosis || "") !== notesForm.diagnosis ||
    (appointment?.next_step || "") !== notesForm.next_step;

  if (loading) {
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
    <div className="appointment-activity-page">
      {/* Header Section */}
      <div className="page-header">
        <div className="header-text">
          <h1 className="page-title">{t("Appointment Activity")}</h1>
          <p className="page-subtitle">
            {t("Timeline of changes and actions for appointment")} #{id}
          </p>
        </div>

        <div className="header-actions">
          <Link
            to="/admin/erp/appointments"
            className="btn btn-outline-secondary"
          >
            <i className="fas fa-arrow-left me-2"></i>
            {t("Back to Appointments")}
          </Link>

          {patientId && (
            <Link
              to={`/admin/erp/patients/${patientId}/profile`}
              className="btn btn-outline-primary"
            >
              <i className="fas fa-user me-2"></i>
              {t("Patient Profile")}
            </Link>
          )}

          {treatmentPlanId && (
            <Link
              to={`/admin/erp/treatment-plans/${treatmentPlanId}`}
              className="btn btn-outline-info"
            >
              <i className="fas fa-notes-medical me-2"></i>
              {t("Treatment Plan")}
            </Link>
          )}

          {invoiceId && (
            <Link
              to={`/admin/erp/invoices/${invoiceId}`}
              className="btn btn-outline-success"
            >
              <i className="fas fa-file-invoice me-2"></i>
              {t("Invoice")}
            </Link>
          )}

          <button className="btn btn-primary" onClick={loadPage}>
            <i className="fas fa-sync-alt me-2"></i>
            {t("Refresh")}
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="alert alert-danger alert-dismissible fade show">
          <i className="fas fa-exclamation-circle me-2"></i>
          {error}
          <button
            type="button"
            className="btn-close"
            onClick={() => setError("")}
          ></button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="kpi-grid">
        <KpiCard title={t("Appointment ID")} value={`#${id}`} />
        <KpiCard
          title={t("Status")}
          value={<StatusBadge status={appointment?.status} t={t} />}
        />
        <KpiCard
          title={t("Type")}
          value={
            <AppointmentTypeBadge type={appointment?.appointment_type} t={t} />
          }
        />
        <KpiCard title={t("Events")} value={sortedRows.length} />
      </div>

      {/* Appointment Details Card */}
      <div className="details-card">
        <div className="card-header-custom">
          <i className="fas fa-info-circle me-2"></i>
          <h5 className="mb-0">{t("Appointment Details")}</h5>
        </div>
        <div className="card-body-custom">
          {!appointment ? (
            <div className="text-muted">
              {t("Appointment details not found.")}
            </div>
          ) : (
            <div className="details-grid">
              <InfoItem label={t("Appointment ID")} value={appointment.id} />

              <InfoItem
                label={t("Patient")}
                value={
                  patientId ? (
                    <Link
                      to={`/admin/erp/patients/${patientId}/profile`}
                      className="patient-link"
                    >
                      {appointment.patient?.name ||
                        appointment.patient_name ||
                        `${t("Patient")} #${patientId}`}
                    </Link>
                  ) : (
                    appointment.patient?.name || appointment.patient_name || "-"
                  )
                }
              />

              <InfoItem
                label={t("Doctor")}
                value={
                  appointment.doctor?.name || appointment.doctor_name || "-"
                }
              />

              <InfoItem
                label={t("Date")}
                value={formatDate(appointment.appointment_date)}
              />

              <InfoItem
                label={t("Time")}
                value={formatTime(appointment.appointment_time)}
              />

              <InfoItem
                label={t("Type")}
                value={
                  <AppointmentTypeBadge
                    type={appointment.appointment_type}
                    t={t}
                  />
                }
              />

              <InfoItem
                label={t("Status")}
                value={<StatusBadge status={appointment.status} t={t} />}
              />

              <InfoItem
                label={t("Created At")}
                value={formatDateTime(appointment.created_at)}
              />

              {"updated_at" in (appointment || {}) && (
                <InfoItem
                  label={t("Updated At")}
                  value={formatDateTime(appointment.updated_at)}
                />
              )}

              <InfoItem
                label={t("Clinical Notes")}
                value={appointment.clinical_notes || "-"}
              />

              <InfoItem
                label={t("Diagnosis")}
                value={appointment.diagnosis || "-"}
              />

              <InfoItem
                label={t("Next Step")}
                value={appointment.next_step || "-"}
              />

              {treatmentPlanId && (
                <InfoItem
                  label={t("Treatment Plan")}
                  value={
                    <Link
                      to={`/admin/erp/treatment-plans/${treatmentPlanId}`}
                      className="plan-link"
                    >
                      #{treatmentPlanId}
                    </Link>
                  }
                />
              )}

              {invoiceId && (
                <InfoItem
                  label={t("Invoice")}
                  value={
                    <Link
                      to={`/admin/erp/invoices/${invoiceId}`}
                      className="invoice-link"
                    >
                      #{invoiceId}
                    </Link>
                  }
                />
              )}

              <InfoItem label={t("Notes")} value={appointment.notes || "-"} />
            </div>
          )}
        </div>
      </div>

      {/* Complete Appointment Section (if scheduled) */}
      {isScheduled && (
        <div className="complete-card">
          <div className="card-header-custom">
            <i className="fas fa-check-circle me-2"></i>
            <h5 className="mb-0">{t("Complete Appointment")}</h5>
            <span className="badge-status-scheduled">{t("Scheduled")}</span>
          </div>

          <div className="card-body-custom">
            {completeError && (
              <div className="alert alert-danger">{completeError}</div>
            )}

            {completeSuccess && (
              <div className="alert alert-success">{completeSuccess}</div>
            )}

            {completeResult?.invoice_id && (
              <div className="completion-result">
                <div className="result-header">
                  <i className="fas fa-chart-line me-2"></i>
                  <span className="fw-semibold">{t("Completion Result")}</span>
                </div>
                <div className="result-grid">
                  <InfoItem
                    label={t("Invoice")}
                    value={
                      <Link
                        to={`/admin/erp/invoices/${completeResult.invoice_id}`}
                        className="invoice-link"
                      >
                        {completeResult.invoice_number ||
                          `#${completeResult.invoice_id}`}
                      </Link>
                    }
                  />

                  {completeResult.treatment_plan_id && (
                    <InfoItem
                      label={t("Treatment Plan")}
                      value={
                        <Link
                          to={`/admin/erp/treatment-plans/${completeResult.treatment_plan_id}`}
                          className="plan-link"
                        >
                          #{completeResult.treatment_plan_id}
                        </Link>
                      }
                    />
                  )}

                  {"total" in completeResult && (
                    <InfoItem
                      label={t("Invoice Total")}
                      value={formatCurrency(completeResult.total)}
                    />
                  )}

                  {"invoice_status" in completeResult && (
                    <InfoItem
                      label={t("Invoice Status")}
                      value={
                        <StatusBadge
                          status={completeResult.invoice_status}
                          t={t}
                        />
                      }
                    />
                  )}

                  {"completed_sessions" in completeResult && (
                    <InfoItem
                      label={t("Completed Sessions")}
                      value={completeResult.completed_sessions}
                    />
                  )}

                  {"planned_sessions" in completeResult && (
                    <InfoItem
                      label={t("Planned Sessions")}
                      value={completeResult.planned_sessions}
                    />
                  )}

                  {"remaining_sessions" in completeResult && (
                    <InfoItem
                      label={t("Remaining Sessions")}
                      value={completeResult.remaining_sessions}
                    />
                  )}

                  {"item_status" in completeResult && (
                    <InfoItem
                      label={t("Item Status")}
                      value={
                        <StatusBadge
                          status={completeResult.item_status}
                          t={t}
                        />
                      }
                    />
                  )}
                </div>
              </div>
            )}

            <form onSubmit={completeAppointment}>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">{t("Doctor Name")}</label>
                  <input
                    className="form-control"
                    name="doctor_name"
                    value={completeForm.doctor_name}
                    onChange={handleCompleteChange}
                    placeholder={t("Optional doctor name override")}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{t("General Notes")}</label>
                  <input
                    className="form-control"
                    name="notes"
                    value={completeForm.notes}
                    onChange={handleCompleteChange}
                    placeholder={t("Optional notes")}
                  />
                </div>

                <div className="form-group full-width">
                  <label className="form-label">{t("Clinical Notes")}</label>
                  <textarea
                    className="form-control"
                    rows="4"
                    name="clinical_notes"
                    value={completeForm.clinical_notes}
                    onChange={handleCompleteChange}
                    placeholder={t("Enter clinical notes...")}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{t("Diagnosis")}</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    name="diagnosis"
                    value={completeForm.diagnosis}
                    onChange={handleCompleteChange}
                    placeholder={t("Enter diagnosis...")}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{t("Next Step")}</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    name="next_step"
                    value={completeForm.next_step}
                    onChange={handleCompleteChange}
                    placeholder={t("Enter next step...")}
                  />
                </div>

                <div className="form-actions">
                  <button
                    type="submit"
                    className="btn btn-success btn-lg"
                    disabled={completing}
                  >
                    {completing ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        {t("Completing...")}
                      </>
                    ) : (
                      <>
                        <i className="fas fa-check-circle me-2"></i>
                        {t("Complete Appointment")}
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={resetCompleteForm}
                    disabled={completing}
                  >
                    <i className="fas fa-undo me-2"></i>
                    {t("Reset")}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Clinical Notes Card */}
      <div className="notes-card">
        <div className="card-header-custom">
          <i className="fas fa-notes-medical me-2"></i>
          <h5 className="mb-0">{t("Clinical Notes")}</h5>
          {isCompleted && (
            <span className="badge-status-completed">
              {t("Completed Appointment")}
            </span>
          )}
        </div>

        <div className="card-body-custom">
          {notesError && <div className="alert alert-danger">{notesError}</div>}
          {notesSuccess && (
            <div className="alert alert-success">{notesSuccess}</div>
          )}

          <form onSubmit={saveClinicalNotes}>
            <div className="form-grid">
              <div className="form-group full-width">
                <label className="form-label">{t("Clinical Notes")}</label>
                <textarea
                  className="form-control"
                  rows="4"
                  name="clinical_notes"
                  value={notesForm.clinical_notes}
                  onChange={handleNotesChange}
                  placeholder={t("Enter clinical notes...")}
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t("Diagnosis")}</label>
                <textarea
                  className="form-control"
                  rows="3"
                  name="diagnosis"
                  value={notesForm.diagnosis}
                  onChange={handleNotesChange}
                  placeholder={t("Enter diagnosis...")}
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t("Next Step")}</label>
                <textarea
                  className="form-control"
                  rows="3"
                  name="next_step"
                  value={notesForm.next_step}
                  onChange={handleNotesChange}
                  placeholder={t("Enter next step...")}
                />
              </div>

              <div className="form-actions">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={savingNotes || !appointment || !hasNotesChanged}
                >
                  {savingNotes ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      {t("Saving...")}
                    </>
                  ) : (
                    <>
                      <i className="fas fa-save me-2"></i>
                      {t("Save Clinical Notes")}
                    </>
                  )}
                </button>

                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={resetClinicalNotesForm}
                  disabled={savingNotes}
                >
                  <i className="fas fa-undo me-2"></i>
                  {t("Reset")}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Latest Activity Card */}
      {latestEvent && (
        <div className="latest-activity-card">
          <div className="card-header-custom">
            <i className="fas fa-clock me-2"></i>
            <h5 className="mb-0">{t("Latest Activity")}</h5>
          </div>
          <div className="card-body-custom">
            <div className="latest-activity-content">
              <span
                className={`activity-badge ${actionBadgeClass(latestEvent.action)}`}
              >
                {prettyAction(latestEvent.action, t)}
              </span>
              <span className="activity-time">
                {formatDateTime(latestEvent.created_at)}
              </span>
            </div>
            <div className="activity-note">
              {t("Last recorded action for this appointment.")}
            </div>
          </div>
        </div>
      )}

      {/* Activity Log Card */}
      <div className="activity-log-card">
        <div className="card-header-custom">
          <i className="fas fa-list-ul me-2"></i>
          <h5 className="mb-0">{t("Activity Log")}</h5>
          <span className="event-count">
            {sortedRows.length} {t("events")}
          </span>
        </div>

        <div className="card-body-custom">
          {sortedRows.length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-inbox empty-icon"></i>
              <p className="empty-text">
                {t("No activity found for this appointment.")}
              </p>
            </div>
          ) : (
            <div className="activity-timeline">
              {sortedRows.map((item) => {
                const properties = parseProperties(item.properties);

                const rowPatientId = properties?.patient_id || null;
                const rowInvoiceId = properties?.invoice_id || null;
                const rowTreatmentPlanId =
                  properties?.treatment_plan_id || null;
                const rowPlanItemId =
                  properties?.treatment_plan_item_id || null;

                return (
                  <div key={item.id} className="activity-item">
                    <div className="activity-item-header">
                      <div className="activity-badges">
                        <span
                          className={`activity-badge ${actionBadgeClass(item.action)}`}
                        >
                          {prettyAction(item.action, t)}
                        </span>
                        <span className="activity-time">
                          {formatDateTime(item.created_at)}
                        </span>
                      </div>
                      <span className="user-badge">
                        {t("User")} #{item.user_id || "-"}
                      </span>
                    </div>

                    <div className="activity-details">
                      <div className="details-grid compact">
                        <InfoItem label={t("Log ID")} value={item.id} />
                        <InfoItem
                          label={t("Company ID")}
                          value={item.company_id}
                        />
                        <InfoItem
                          label={t("Subject ID")}
                          value={item.subject_id}
                        />
                        <InfoItem
                          label={t("Subject Type")}
                          value={shortSubjectType(item.subject_type)}
                        />

                        {properties && typeof properties === "object" && (
                          <>
                            {"appointment_type" in properties && (
                              <InfoItem
                                label={t("Appointment Type")}
                                value={
                                  <AppointmentTypeBadge
                                    type={properties.appointment_type}
                                    t={t}
                                  />
                                }
                              />
                            )}

                            {"old_status" in properties && (
                              <InfoItem
                                label={t("Old Status")}
                                value={
                                  <StatusBadge
                                    status={properties.old_status}
                                    t={t}
                                  />
                                }
                              />
                            )}

                            {"new_status" in properties && (
                              <InfoItem
                                label={t("New Status")}
                                value={
                                  <StatusBadge
                                    status={properties.new_status}
                                    t={t}
                                  />
                                }
                              />
                            )}

                            {"item_status" in properties && (
                              <InfoItem
                                label={t("Item Status")}
                                value={
                                  <StatusBadge
                                    status={properties.item_status}
                                    t={t}
                                  />
                                }
                              />
                            )}

                            {"old_date" in properties && (
                              <InfoItem
                                label={t("Old Date")}
                                value={formatDate(properties.old_date)}
                              />
                            )}

                            {"new_date" in properties && (
                              <InfoItem
                                label={t("New Date")}
                                value={formatDate(properties.new_date)}
                              />
                            )}

                            {"date" in properties && (
                              <InfoItem
                                label={t("Date")}
                                value={formatDate(properties.date)}
                              />
                            )}

                            {"old_time" in properties && (
                              <InfoItem
                                label={t("Old Time")}
                                value={formatTime(properties.old_time)}
                              />
                            )}

                            {"new_time" in properties && (
                              <InfoItem
                                label={t("New Time")}
                                value={formatTime(properties.new_time)}
                              />
                            )}

                            {"time" in properties && (
                              <InfoItem
                                label={t("Time")}
                                value={formatTime(properties.time)}
                              />
                            )}

                            {"doctor_id" in properties && (
                              <InfoItem
                                label={t("Doctor ID")}
                                value={properties.doctor_id}
                              />
                            )}

                            {"clinical_notes" in properties && (
                              <InfoItem
                                label={t("Clinical Notes")}
                                value={properties.clinical_notes}
                              />
                            )}

                            {"diagnosis" in properties && (
                              <InfoItem
                                label={t("Diagnosis")}
                                value={properties.diagnosis}
                              />
                            )}

                            {"next_step" in properties && (
                              <InfoItem
                                label={t("Next Step")}
                                value={properties.next_step}
                              />
                            )}

                            {rowPatientId && (
                              <InfoItem
                                label={t("Patient")}
                                value={
                                  <Link
                                    to={`/admin/erp/patients/${rowPatientId}/profile`}
                                    className="patient-link"
                                  >
                                    #{rowPatientId}
                                  </Link>
                                }
                              />
                            )}

                            {rowInvoiceId && (
                              <InfoItem
                                label={t("Invoice")}
                                value={
                                  <Link
                                    to={`/admin/erp/invoices/${rowInvoiceId}`}
                                    className="invoice-link"
                                  >
                                    {properties.invoice_number
                                      ? properties.invoice_number
                                      : `#${rowInvoiceId}`}
                                  </Link>
                                }
                              />
                            )}

                            {rowTreatmentPlanId && (
                              <InfoItem
                                label={t("Treatment Plan")}
                                value={
                                  <Link
                                    to={`/admin/erp/treatment-plans/${rowTreatmentPlanId}`}
                                    className="plan-link"
                                  >
                                    #{rowTreatmentPlanId}
                                  </Link>
                                }
                              />
                            )}

                            {rowPlanItemId && (
                              <InfoItem
                                label={t("Plan Item ID")}
                                value={rowPlanItemId}
                              />
                            )}

                            {"procedure_id" in properties && (
                              <InfoItem
                                label={t("Procedure ID")}
                                value={properties.procedure_id}
                              />
                            )}

                            {"procedure" in properties && (
                              <InfoItem
                                label={t("Procedure")}
                                value={properties.procedure}
                              />
                            )}

                            {"total" in properties && (
                              <InfoItem
                                label={t("Total")}
                                value={formatCurrency(properties.total)}
                              />
                            )}

                            {"completed_sessions" in properties && (
                              <InfoItem
                                label={t("Completed Sessions")}
                                value={properties.completed_sessions}
                              />
                            )}

                            {"planned_sessions" in properties && (
                              <InfoItem
                                label={t("Planned Sessions")}
                                value={properties.planned_sessions}
                              />
                            )}

                            {"remaining_sessions" in properties && (
                              <InfoItem
                                label={t("Remaining Sessions")}
                                value={properties.remaining_sessions}
                              />
                            )}
                          </>
                        )}
                      </div>

                      {(rowPatientId || rowTreatmentPlanId || rowInvoiceId) && (
                        <div className="action-links">
                          {rowPatientId && (
                            <Link
                              to={`/admin/erp/patients/${rowPatientId}/profile`}
                              className="btn btn-sm btn-outline-primary"
                            >
                              <i className="fas fa-user"></i> {t("Patient")}
                            </Link>
                          )}
                          {rowTreatmentPlanId && (
                            <Link
                              to={`/admin/erp/treatment-plans/${rowTreatmentPlanId}`}
                              className="btn btn-sm btn-outline-info"
                            >
                              <i className="fas fa-notes-medical"></i>{" "}
                              {t("Plan")}
                            </Link>
                          )}
                          {rowInvoiceId && (
                            <Link
                              to={`/admin/erp/invoices/${rowInvoiceId}`}
                              className="btn btn-sm btn-outline-success"
                            >
                              <i className="fas fa-file-invoice"></i>{" "}
                              {t("Invoice")}
                            </Link>
                          )}
                        </div>
                      )}

                      <details className="raw-data">
                        <summary>
                          <i className="fas fa-code me-1"></i>
                          {t("Show raw properties")}
                        </summary>
                        <pre className="raw-json">
                          {formatJson(item.properties)}
                        </pre>
                      </details>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper Components
function KpiCard({ title, value }) {
  return (
    <div className="kpi-card">
      <div className="kpi-card-content">
        <div className="kpi-title">{title}</div>
        <div className="kpi-value">{value ?? "-"}</div>
      </div>
    </div>
  );
}

function InfoItem({ label, value }) {
  return (
    <div className="info-item">
      <div className="info-label">{label}</div>
      <div className="info-value">{value ?? "-"}</div>
    </div>
  );
}

function prettyAction(action, t) {
  const actionMap = {
    "appointment.booked": "Booked",
    "appointment.rebooked": "Rebooked",
    "appointment.rescheduled": "Rescheduled",
    "appointment.cancelled": "Cancelled",
    "appointment.no_show": "No Show",
    "appointment.completed": "Completed",
    "treatment_plan_item.started": "Procedure Started",
    "treatment_plan_item.session_completed": "Session Completed",
    "appointment.updated": "Updated",
  };
  return t(actionMap[action] || action || "-");
}

function actionBadgeClass(action) {
  const classMap = {
    "appointment.booked": "booked",
    "appointment.rebooked": "booked",
    "appointment.rescheduled": "rescheduled",
    "appointment.cancelled": "cancelled",
    "appointment.no_show": "no-show",
    "appointment.completed": "completed",
    "treatment_plan_item.started": "started",
    "treatment_plan_item.session_completed": "completed",
    "appointment.updated": "updated",
  };
  return classMap[action] || "default";
}

function shortSubjectType(value) {
  if (!value) return "-";
  const parts = String(value).split("\\");
  return parts[parts.length - 1] || value;
}

function StatusBadge({ status, t }) {
  const value = String(status || "").toLowerCase();

  let variant = "secondary";
  let label = status || "-";

  if (["completed", "paid"].includes(value)) variant = "success";
  else if (["cancelled", "no_show", "unpaid"].includes(value))
    variant = "danger";
  else if (["scheduled", "partially_paid", "planned"].includes(value))
    variant = "warning";
  else if (["in_progress", "active"].includes(value)) variant = "info";

  return <span className={`badge-status ${variant}`}>{t(label)}</span>;
}

function AppointmentTypeBadge({ type, t }) {
  const value = String(type || "").toLowerCase();

  let variant = "secondary";
  let label = type || "-";

  if (value === "consultation") {
    variant = "primary";
    label = t("Consultation");
  } else if (value === "treatment") {
    variant = "info";
    label = t("Treatment");
  }

  return <span className={`badge-type ${variant}`}>{label}</span>;
}

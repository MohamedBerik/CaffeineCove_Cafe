import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "../../../services/axios";

export default function AppointmentActivityPage() {
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

  useEffect(() => {
    loadPage();
  }, [id]);

  const loadPage = async () => {
    try {
      setLoading(true);
      setError("");
      setNotesError("");
      setNotesSuccess("");

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
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.msg ||
          "Failed to load appointment details.",
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
      return new Date(value).toLocaleString("en-US", {
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
      return new Date(value).toLocaleDateString("en-US", {
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

      setNotesSuccess("Clinical notes saved successfully.");
      await loadPage();
    } catch (err) {
      const errors = err?.response?.data?.errors;
      if (errors) {
        const firstError = Object.values(errors)?.[0]?.[0];
        setNotesError(firstError || "Failed to save clinical notes.");
      } else {
        setNotesError(
          err?.response?.data?.message ||
            err?.response?.data?.msg ||
            "Failed to save clinical notes.",
        );
      }
    } finally {
      setSavingNotes(false);
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

  const isCompleted =
    String(appointment?.status || "").toLowerCase() === "completed";

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
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid px-0">
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
        <div>
          <h3 className="fw-bold mb-1">Appointment Activity</h3>
          <p className="text-muted mb-0">
            Timeline of changes and actions for appointment #{id}
          </p>
        </div>

        <div className="d-flex flex-wrap gap-2">
          <Link
            to="/admin/erp/appointments"
            className="btn btn-outline-secondary"
          >
            Back to Appointments
          </Link>

          {patientId ? (
            <Link
              to={`/admin/erp/patients/${patientId}/profile`}
              className="btn btn-outline-primary"
            >
              Patient Profile
            </Link>
          ) : null}

          {treatmentPlanId ? (
            <Link
              to={`/admin/erp/treatment-plans/${treatmentPlanId}`}
              className="btn btn-outline-info"
            >
              Treatment Plan
            </Link>
          ) : null}

          {invoiceId ? (
            <Link
              to={`/admin/erp/invoices/${invoiceId}`}
              className="btn btn-outline-success"
            >
              Invoice
            </Link>
          ) : null}

          <button className="btn btn-primary" onClick={loadPage}>
            Refresh
          </button>
        </div>
      </div>

      {error ? (
        <div className="alert alert-danger d-flex justify-content-between align-items-center">
          <span>{error}</span>
          <button className="btn btn-sm btn-outline-danger" onClick={loadPage}>
            Retry
          </button>
        </div>
      ) : null}

      <div className="row g-3 mb-4">
        <KpiCard title="Appointment ID" value={`#${id}`} />
        <KpiCard
          title="Status"
          value={<StatusBadge status={appointment?.status} />}
        />
        <KpiCard
          title="Type"
          value={<AppointmentTypeBadge type={appointment?.appointment_type} />}
        />
        <KpiCard title="Events" value={sortedRows.length} />
      </div>

      <div className="card shadow-sm border-0 mb-4">
        <div className="card-header bg-white">
          <h5 className="mb-0">Appointment Details</h5>
        </div>
        <div className="card-body">
          {!appointment ? (
            <div className="text-muted">Appointment details not found.</div>
          ) : (
            <div className="row g-3">
              <InfoItem label="Appointment ID" value={appointment.id} />

              <InfoItem
                label="Patient"
                value={
                  patientId ? (
                    <Link
                      to={`/admin/erp/patients/${patientId}/profile`}
                      className="text-decoration-none"
                    >
                      {appointment.patient?.name ||
                        appointment.patient_name ||
                        `Patient #${patientId}`}
                    </Link>
                  ) : (
                    appointment.patient?.name || appointment.patient_name || "-"
                  )
                }
              />

              <InfoItem
                label="Doctor"
                value={
                  appointment.doctor?.name || appointment.doctor_name || "-"
                }
              />

              <InfoItem
                label="Date"
                value={formatDate(appointment.appointment_date)}
              />

              <InfoItem
                label="Time"
                value={formatTime(appointment.appointment_time)}
              />

              <InfoItem
                label="Type"
                value={
                  <AppointmentTypeBadge type={appointment.appointment_type} />
                }
              />

              <InfoItem
                label="Status"
                value={<StatusBadge status={appointment.status} />}
              />

              <InfoItem
                label="Created At"
                value={formatDateTime(appointment.created_at)}
              />

              {"updated_at" in (appointment || {}) ? (
                <InfoItem
                  label="Updated At"
                  value={formatDateTime(appointment.updated_at)}
                />
              ) : null}

              <div className="col-12">
                <div className="small text-muted">Clinical Notes</div>
                <div className="fw-semibold">
                  {appointment.clinical_notes || "-"}
                </div>
              </div>

              <div className="col-12 col-md-6">
                <div className="small text-muted">Diagnosis</div>
                <div className="fw-semibold">
                  {appointment.diagnosis || "-"}
                </div>
              </div>

              <div className="col-12 col-md-6">
                <div className="small text-muted">Next Step</div>
                <div className="fw-semibold">
                  {appointment.next_step || "-"}
                </div>
              </div>

              {treatmentPlanId ? (
                <InfoItem
                  label="Treatment Plan"
                  value={
                    <Link
                      to={`/admin/erp/treatment-plans/${treatmentPlanId}`}
                      className="text-decoration-none"
                    >
                      #{treatmentPlanId}
                    </Link>
                  }
                />
              ) : null}

              {invoiceId ? (
                <InfoItem
                  label="Invoice"
                  value={
                    <Link
                      to={`/admin/erp/invoices/${invoiceId}`}
                      className="text-decoration-none"
                    >
                      #{invoiceId}
                    </Link>
                  }
                />
              ) : null}

              <div className="col-12">
                <div className="small text-muted">Notes</div>
                <div className="fw-semibold">{appointment.notes || "-"}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="card shadow-sm border-0 mb-4">
        <div className="card-header bg-white d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Clinical Notes</h5>
          {isCompleted ? (
            <span className="badge bg-secondary">Completed Appointment</span>
          ) : null}
        </div>

        <div className="card-body">
          {notesError ? (
            <div className="alert alert-danger py-2">{notesError}</div>
          ) : null}

          {notesSuccess ? (
            <div className="alert alert-success py-2">{notesSuccess}</div>
          ) : null}

          <form onSubmit={saveClinicalNotes}>
            <div className="row g-3">
              <div className="col-12">
                <label className="form-label fw-semibold">Clinical Notes</label>
                <textarea
                  className="form-control"
                  rows="4"
                  name="clinical_notes"
                  value={notesForm.clinical_notes}
                  onChange={handleNotesChange}
                  placeholder="Enter clinical notes..."
                />
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label fw-semibold">Diagnosis</label>
                <textarea
                  className="form-control"
                  rows="3"
                  name="diagnosis"
                  value={notesForm.diagnosis}
                  onChange={handleNotesChange}
                  placeholder="Enter diagnosis..."
                />
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label fw-semibold">Next Step</label>
                <textarea
                  className="form-control"
                  rows="3"
                  name="next_step"
                  value={notesForm.next_step}
                  onChange={handleNotesChange}
                  placeholder="Enter next step..."
                />
              </div>

              <div className="col-12 d-flex gap-2">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={savingNotes || !appointment || !hasNotesChanged}
                >
                  {savingNotes ? "Saving..." : "Save Clinical Notes"}
                </button>

                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={resetClinicalNotesForm}
                  disabled={savingNotes}
                >
                  Reset
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {latestEvent ? (
        <div className="card shadow-sm border-0 mb-4">
          <div className="card-header bg-white">
            <h5 className="mb-0">Latest Activity</h5>
          </div>
          <div className="card-body">
            <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
              <span className={`badge ${actionBadgeClass(latestEvent.action)}`}>
                {prettyAction(latestEvent.action)}
              </span>
              <span className="text-muted small">
                {formatDateTime(latestEvent.created_at)}
              </span>
            </div>
            <div className="small text-muted">
              Last recorded action for this appointment.
            </div>
          </div>
        </div>
      ) : null}

      <div className="card shadow-sm border-0">
        <div className="card-header bg-white d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Activity Log</h5>
          <span className="badge bg-light text-dark">
            {sortedRows.length} events
          </span>
        </div>

        <div className="card-body">
          {sortedRows.length === 0 ? (
            <div className="text-muted">
              No activity found for this appointment.
            </div>
          ) : (
            <div className="d-flex flex-column gap-3">
              {sortedRows.map((item) => {
                const properties = parseProperties(item.properties);

                const rowPatientId = properties?.patient_id || null;
                const rowInvoiceId = properties?.invoice_id || null;
                const rowTreatmentPlanId =
                  properties?.treatment_plan_id || null;
                const rowPlanItemId =
                  properties?.treatment_plan_item_id || null;

                return (
                  <div key={item.id} className="border rounded p-3 bg-light">
                    <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-3">
                      <div>
                        <div className="d-flex align-items-center gap-2 flex-wrap">
                          <span
                            className={`badge ${actionBadgeClass(item.action)}`}
                          >
                            {prettyAction(item.action)}
                          </span>

                          <span className="small text-muted">
                            {formatDateTime(item.created_at)}
                          </span>
                        </div>

                        <div className="small text-muted mt-1">
                          Raw action: {item.action || "-"}
                        </div>
                      </div>

                      <span className="badge bg-secondary">
                        User #{item.user_id || "-"}
                      </span>
                    </div>

                    <div className="row g-3">
                      <InfoItem label="Log ID" value={item.id} />
                      <InfoItem label="Company ID" value={item.company_id} />
                      <InfoItem label="Subject ID" value={item.subject_id} />
                      <InfoItem
                        label="Subject Type"
                        value={shortSubjectType(item.subject_type)}
                      />

                      {properties && typeof properties === "object" ? (
                        <>
                          {"appointment_type" in properties ? (
                            <InfoItem
                              label="Appointment Type"
                              value={
                                <AppointmentTypeBadge
                                  type={properties.appointment_type}
                                />
                              }
                            />
                          ) : null}

                          {"old_status" in properties ? (
                            <InfoItem
                              label="Old Status"
                              value={
                                <StatusBadge status={properties.old_status} />
                              }
                            />
                          ) : null}

                          {"new_status" in properties ? (
                            <InfoItem
                              label="New Status"
                              value={
                                <StatusBadge status={properties.new_status} />
                              }
                            />
                          ) : null}

                          {"old_date" in properties ? (
                            <InfoItem
                              label="Old Date"
                              value={formatDate(properties.old_date)}
                            />
                          ) : null}

                          {"new_date" in properties ? (
                            <InfoItem
                              label="New Date"
                              value={formatDate(properties.new_date)}
                            />
                          ) : null}

                          {"date" in properties ? (
                            <InfoItem
                              label="Date"
                              value={formatDate(properties.date)}
                            />
                          ) : null}

                          {"old_time" in properties ? (
                            <InfoItem
                              label="Old Time"
                              value={formatTime(properties.old_time)}
                            />
                          ) : null}

                          {"new_time" in properties ? (
                            <InfoItem
                              label="New Time"
                              value={formatTime(properties.new_time)}
                            />
                          ) : null}

                          {"time" in properties ? (
                            <InfoItem
                              label="Time"
                              value={formatTime(properties.time)}
                            />
                          ) : null}

                          {"doctor_id" in properties ? (
                            <InfoItem
                              label="Doctor ID"
                              value={properties.doctor_id}
                            />
                          ) : null}
                          {"clinical_notes" in properties ? (
                            <InfoItem
                              label="Clinical Notes"
                              value={properties.clinical_notes}
                            />
                          ) : null}

                          {"diagnosis" in properties ? (
                            <InfoItem
                              label="Diagnosis"
                              value={properties.diagnosis}
                            />
                          ) : null}

                          {"next_step" in properties ? (
                            <InfoItem
                              label="Next Step"
                              value={properties.next_step}
                            />
                          ) : null}

                          {rowPatientId ? (
                            <InfoItem
                              label="Patient"
                              value={
                                <Link
                                  to={`/admin/erp/patients/${rowPatientId}/profile`}
                                  className="text-decoration-none"
                                >
                                  #{rowPatientId}
                                </Link>
                              }
                            />
                          ) : null}

                          {rowInvoiceId ? (
                            <InfoItem
                              label="Invoice"
                              value={
                                <Link
                                  to={`/admin/erp/invoices/${rowInvoiceId}`}
                                  className="text-decoration-none"
                                >
                                  {properties.invoice_number
                                    ? properties.invoice_number
                                    : `#${rowInvoiceId}`}
                                </Link>
                              }
                            />
                          ) : null}

                          {rowTreatmentPlanId ? (
                            <InfoItem
                              label="Treatment Plan"
                              value={
                                <Link
                                  to={`/admin/erp/treatment-plans/${rowTreatmentPlanId}`}
                                  className="text-decoration-none"
                                >
                                  #{rowTreatmentPlanId}
                                </Link>
                              }
                            />
                          ) : null}

                          {rowPlanItemId ? (
                            <InfoItem
                              label="Plan Item ID"
                              value={rowPlanItemId}
                            />
                          ) : null}

                          {"procedure_id" in properties ? (
                            <InfoItem
                              label="Procedure ID"
                              value={properties.procedure_id}
                            />
                          ) : null}

                          {"procedure" in properties ? (
                            <InfoItem
                              label="Procedure"
                              value={properties.procedure}
                            />
                          ) : null}

                          {"total" in properties ? (
                            <InfoItem
                              label="Total"
                              value={money(properties.total)}
                            />
                          ) : null}
                        </>
                      ) : null}

                      <div className="col-12 d-flex flex-wrap gap-2">
                        {rowPatientId ? (
                          <Link
                            to={`/admin/erp/patients/${rowPatientId}/profile`}
                            className="btn btn-sm btn-outline-primary"
                          >
                            Patient
                          </Link>
                        ) : null}

                        {rowTreatmentPlanId ? (
                          <Link
                            to={`/admin/erp/treatment-plans/${rowTreatmentPlanId}`}
                            className="btn btn-sm btn-outline-info"
                          >
                            Treatment Plan
                          </Link>
                        ) : null}

                        {rowInvoiceId ? (
                          <Link
                            to={`/admin/erp/invoices/${rowInvoiceId}`}
                            className="btn btn-sm btn-outline-success"
                          >
                            Invoice
                          </Link>
                        ) : null}
                      </div>

                      <div className="col-12">
                        <details>
                          <summary className="small text-primary fw-semibold">
                            Show raw properties
                          </summary>
                          <pre
                            className="mb-0 mt-2 p-3 bg-white border rounded"
                            style={{
                              whiteSpace: "pre-wrap",
                              wordBreak: "break-word",
                              fontSize: "0.875rem",
                            }}
                          >
                            {formatJson(item.properties)}
                          </pre>
                        </details>
                      </div>
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

function money(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(value || 0));
}

function KpiCard({ title, value }) {
  return (
    <div className="col-12 col-sm-6 col-xl-3">
      <div className="card border-0 shadow-sm h-100">
        <div className="card-body">
          <div className="text-muted small mb-1">{title}</div>
          <div className="fw-bold fs-5">{value ?? "-"}</div>
        </div>
      </div>
    </div>
  );
}

function InfoItem({ label, value }) {
  return (
    <div className="col-12 col-md-6">
      <div className="small text-muted">{label}</div>
      <div className="fw-semibold">{value ?? "-"}</div>
    </div>
  );
}

function prettyAction(action) {
  switch (action) {
    case "appointment.booked":
      return "Booked";
    case "appointment.rebooked":
      return "Rebooked";
    case "appointment.rescheduled":
      return "Rescheduled";
    case "appointment.cancelled":
      return "Cancelled";
    case "appointment.no_show":
      return "No Show";
    case "appointment.completed":
      return "Completed";
    case "treatment_plan_item.started":
      return "Procedure Started";
    case "appointment.updated":
      return "Updated";
    default:
      return action || "-";
  }
}

function actionBadgeClass(action) {
  switch (action) {
    case "appointment.booked":
    case "appointment.rebooked":
      return "bg-primary";
    case "appointment.rescheduled":
      return "bg-info text-dark";
    case "appointment.cancelled":
      return "bg-danger";
    case "appointment.no_show":
      return "bg-dark";
    case "appointment.completed":
      return "bg-success";
    case "treatment_plan_item.started":
      return "bg-warning text-dark";
    case "appointment.updated":
      return "bg-secondary";
    default:
      return "bg-secondary";
  }
}

function shortSubjectType(value) {
  if (!value) return "-";
  const parts = String(value).split("\\");
  return parts[parts.length - 1] || value;
}

function StatusBadge({ status }) {
  const value = String(status || "").toLowerCase();

  let cls = "secondary";
  if (["completed", "paid"].includes(value)) cls = "success";
  else if (["cancelled", "no_show", "unpaid"].includes(value)) cls = "danger";
  else if (["scheduled", "partially_paid", "planned"].includes(value))
    cls = "warning";
  else if (["in_progress", "active"].includes(value)) cls = "info";

  return <span className={`badge bg-${cls}`}>{status || "-"}</span>;
}

function AppointmentTypeBadge({ type }) {
  const value = String(type || "").toLowerCase();

  let cls = "secondary";
  let label = type || "-";

  if (value === "consultation") {
    cls = "primary";
    label = "Consultation";
  } else if (value === "treatment") {
    cls = "info";
    label = "Treatment";
  }

  return <span className={`badge bg-${cls}`}>{label}</span>;
}

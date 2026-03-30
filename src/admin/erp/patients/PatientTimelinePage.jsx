import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "../../../services/axios";
import { useTranslation } from "react-i18next";
import "./PatientTimelinePage.css";

export default function PatientTimelinePage() {
  const { t, i18n } = useTranslation();
  const { id } = useParams();

  const [patient, setPatient] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadTimeline();
  }, [id]);

  const loadTimeline = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await axios.get(`/erp/customers/${id}/timeline`);
      const payload = res.data?.data || {};

      setPatient(payload.patient || null);
      setTimeline(Array.isArray(payload.timeline) ? payload.timeline : []);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.msg ||
          t("Failed to load patient timeline."),
      );
    } finally {
      setLoading(false);
    }
  };

  const sortedTimeline = useMemo(() => {
    return [...timeline].sort((a, b) => {
      const aTime = new Date(a?.event_at || a?.created_at || 0).getTime();
      const bTime = new Date(b?.event_at || b?.created_at || 0).getTime();
      return bTime - aTime;
    });
  }, [timeline]);

  const formatCurrency = (value) => {
    const lang = i18n.language === "ar" ? "ar-EG" : "en-US";
    return new Intl.NumberFormat(lang, {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(value || 0));
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

  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: 320 }}
      >
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">{t("Loading...")}</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger d-flex justify-content-between align-items-center">
        <span>{error}</span>
        <button
          className="btn btn-sm btn-outline-danger"
          onClick={loadTimeline}
        >
          {t("Retry")}
        </button>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="alert alert-warning">
        {t("No patient timeline data available.")}
      </div>
    );
  }

  return (
    <div className="patient-timeline-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-text">
          <h1 className="page-title">{t("Patient Timeline")}</h1>
          <p className="page-subtitle">
            {t(
              "Full history: appointments, dental records, treatment flow, invoices and payments",
            )}
          </p>
        </div>

        <div className="header-actions">
          <Link
            to={`/admin/erp/patients/${id}/profile`}
            className="btn btn-outline-primary"
          >
            <i className="fas fa-user me-2"></i>
            {t("Profile")}
          </Link>
          <Link
            to={`/admin/erp/patients/${id}/statement`}
            className="btn btn-outline-success"
          >
            <i className="fas fa-file-invoice me-2"></i>
            {t("Statement")}
          </Link>
          <button className="btn btn-primary" onClick={loadTimeline}>
            <i className="fas fa-sync-alt me-2"></i>
            {t("Refresh")}
          </button>
        </div>
      </div>

      {/* Patient Info Card */}
      <div className="info-card">
        <div className="info-grid">
          <InfoItem label={t("Name")} value={patient.name} />
          <InfoItem label={t("Code")} value={patient.patient_code || "-"} />
          <InfoItem label={t("Email")} value={patient.email} />
          <InfoItem label={t("Phone")} value={patient.phone} />
        </div>
      </div>

      {/* Timeline Events */}
      <div className="timeline-card">
        <div className="timeline-header">
          <i className="fas fa-history me-2"></i>
          <h5 className="mb-0">{t("Timeline Events")}</h5>
          <span className="event-count">
            {sortedTimeline.length} {t("events")}
          </span>
        </div>

        <div className="timeline-body">
          {sortedTimeline.length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-calendar-times empty-icon"></i>
              <p className="empty-text">{t("No events found.")}</p>
            </div>
          ) : (
            <div className="timeline-list">
              {sortedTimeline.map((item, index) => (
                <div
                  key={`${item.type}-${item.data?.id || index}`}
                  className="timeline-item"
                >
                  <div className="timeline-item-header">
                    <div>
                      <div className="event-type">
                        {prettyType(item.type, t)}
                      </div>
                      <div className="event-time">
                        {formatDateTime(item.event_at || item.created_at)}
                      </div>
                    </div>
                    <span
                      className={`event-badge ${badgeClass(item.type, item.data?.status)}`}
                    >
                      {item.data?.status
                        ? t(item.data.status)
                        : prettyType(item.type, t)}
                    </span>
                  </div>

                  <div className="timeline-item-body">
                    <TimelineEventBody
                      item={item}
                      formatCurrency={formatCurrency}
                      formatDate={formatDate}
                      formatDateTime={formatDateTime}
                      t={t}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ================= COMPONENTS ================= */

function TimelineEventBody({
  item,
  formatCurrency,
  formatDate,
  formatDateTime,
  t,
}) {
  const data = item.data || {};

  if (item.type === "appointment") {
    return (
      <>
        <div className="info-grid compact">
          <InfoItem label={t("Doctor")} value={data.doctor_name} />
          <InfoItem
            label={t("Type")}
            value={prettyAppointmentType(data.appointment_type, t)}
          />
          <InfoItem
            label={t("Date")}
            value={formatDate(data.appointment_date)}
          />
          <InfoItem
            label={t("Time")}
            value={data.appointment_time?.slice(0, 5)}
          />
          <InfoItem label={t("Status")} value={t(data.status)} />
          <InfoItem label={t("Diagnosis")} value={data.diagnosis} />
          <InfoItem label={t("Next Step")} value={data.next_step} />
          <InfoItem label={t("Clinical Notes")} value={data.clinical_notes} />
          <InfoItem label={t("Notes")} value={data.notes} />
        </div>

        <div className="event-actions">
          {data.treatment_plan_id && (
            <Link
              to={`/admin/erp/treatment-plans/${data.treatment_plan_id}`}
              className="btn btn-sm btn-outline-info"
            >
              <i className="fas fa-notes-medical me-1"></i>
              {t("Treatment Plan")}
            </Link>
          )}
          {data.invoice_id && (
            <Link
              to={`/admin/erp/invoices/${data.invoice_id}`}
              className="btn btn-sm btn-outline-success"
            >
              <i className="fas fa-file-invoice me-1"></i>
              {t("Invoice")}
            </Link>
          )}
          {data.id && (
            <Link
              to={`/admin/erp/appointments/${data.id}/activity`}
              className="btn btn-sm btn-outline-secondary"
            >
              <i className="fas fa-history me-1"></i>
              {t("Appointment Activity")}
            </Link>
          )}
        </div>
      </>
    );
  }

  if (item.type === "dental_record") {
    const treatmentPlanItem =
      data.treatment_plan_item || data.treatmentPlanItem || null;

    return (
      <>
        <div className="info-grid compact">
          <InfoItem label={t("Procedure")} value={data.procedure_name} />
          <InfoItem label={t("Tooth")} value={data.tooth_number} />
          <InfoItem label={t("Surface")} value={data.surface} />
          <InfoItem label={t("Status")} value={t(data.status)} />
          <InfoItem label={t("Notes")} value={data.notes} />
          <InfoItem
            label={t("Flow")}
            value={
              treatmentPlanItem
                ? treatmentPlanItem.appointment_id
                  ? t("Appointment #{id}", {
                      id: treatmentPlanItem.appointment_id,
                    })
                  : t("Plan #{id}", { id: treatmentPlanItem.treatment_plan_id })
                : t("Not converted")
            }
          />
        </div>

        <div className="event-actions">
          {treatmentPlanItem?.treatment_plan_id && (
            <Link
              to={`/admin/erp/treatment-plans/${treatmentPlanItem.treatment_plan_id}`}
              className="btn btn-sm btn-outline-success"
            >
              <i className="fas fa-notes-medical me-1"></i>
              {t("Open Plan")}
            </Link>
          )}
          {treatmentPlanItem?.appointment_id && (
            <Link
              to={`/admin/erp/appointments/${treatmentPlanItem.appointment_id}/activity`}
              className="btn btn-sm btn-outline-primary"
            >
              <i className="fas fa-calendar-alt me-1"></i>
              {t("Open Appointment")}
            </Link>
          )}
        </div>
      </>
    );
  }

  if (item.type === "invoice") {
    return (
      <>
        <div className="info-grid compact">
          <InfoItem label={t("Invoice Number")} value={data.number} />
          <InfoItem label={t("Total")} value={formatCurrency(data.total)} />
          <InfoItem label={t("Status")} value={t(data.status)} />
          <InfoItem label={t("Issued At")} value={formatDate(data.issued_at)} />
          <InfoItem label={t("Appointment ID")} value={data.appointment_id} />
          <InfoItem
            label={t("Treatment Plan ID")}
            value={data.treatment_plan_id}
          />
        </div>

        <div className="event-actions">
          {data.id && (
            <Link
              to={`/admin/erp/invoices/${data.id}`}
              className="btn btn-sm btn-outline-success"
            >
              <i className="fas fa-file-invoice me-1"></i>
              {t("Open Invoice")}
            </Link>
          )}
          {data.treatment_plan_id && (
            <Link
              to={`/admin/erp/treatment-plans/${data.treatment_plan_id}`}
              className="btn btn-sm btn-outline-info"
            >
              <i className="fas fa-notes-medical me-1"></i>
              {t("Treatment Plan")}
            </Link>
          )}
        </div>
      </>
    );
  }

  if (item.type === "payment") {
    return (
      <div className="info-grid compact">
        <InfoItem label={t("Invoice ID")} value={data.invoice_id} />
        <InfoItem label={t("Amount")} value={formatCurrency(data.amount)} />
        <InfoItem
          label={t("Applied Amount")}
          value={formatCurrency(data.applied_amount)}
        />
        <InfoItem
          label={t("Credit Amount")}
          value={formatCurrency(data.credit_amount)}
        />
        <InfoItem label={t("Method")} value={t(data.method) || data.method} />
      </div>
    );
  }

  if (item.type === "refund") {
    return (
      <div className="info-grid compact">
        <InfoItem label={t("Payment ID")} value={data.payment_id} />
        <InfoItem label={t("Invoice ID")} value={data.invoice_id} />
        <InfoItem
          label={t("Refund Amount")}
          value={formatCurrency(data.amount)}
        />
        <InfoItem label={t("Applies To")} value={data.applies_to} />
      </div>
    );
  }

  return <div className="text-muted">{t("No details available.")}</div>;
}

/* ================= HELPERS ================= */

function InfoItem({ label, value }) {
  return (
    <div className="info-item">
      <div className="info-label">{label}</div>
      <div className="info-value">{value || "-"}</div>
    </div>
  );
}

function prettyType(type, t) {
  const typeMap = {
    appointment: "Appointment",
    dental_record: "Dental Record",
    invoice: "Invoice",
    payment: "Payment",
    refund: "Refund",
  };
  return t(typeMap[type] || type || "Event");
}

function prettyAppointmentType(type, t) {
  const value = String(type || "").toLowerCase();
  if (value === "consultation") return t("Consultation");
  if (value === "treatment") return t("Treatment");
  return type || "-";
}

function badgeClass(type, status) {
  const value = String(status || "").toLowerCase();

  if (type === "payment") return "badge-success";
  if (type === "refund") return "badge-danger";

  if (["paid", "completed"].includes(value)) return "badge-success";
  if (["unpaid", "cancelled", "no_show"].includes(value)) return "badge-danger";
  if (["scheduled", "partially_paid", "planned"].includes(value))
    return "badge-warning";
  if (["in_progress"].includes(value)) return "badge-info";

  return "badge-secondary";
}

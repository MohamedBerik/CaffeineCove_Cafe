import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "../../../services/axios";

export default function PatientTimelinePage() {
  const { id } = useParams();

  const [data, setData] = useState(null);
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

      setData(payload.patient || null);
      setTimeline(payload.timeline || []);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.msg ||
          "Failed to load patient timeline.",
      );
    } finally {
      setLoading(false);
    }
  };

  const money = (value) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(Number(value || 0));

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

  if (error) {
    return (
      <div className="alert alert-danger d-flex justify-content-between align-items-center">
        <span>{error}</span>
        <button
          className="btn btn-sm btn-outline-danger"
          onClick={loadTimeline}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="alert alert-warning">
        No patient timeline data available.
      </div>
    );
  }

  return (
    <div className="container-fluid px-0">
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
        <div>
          <h3 className="fw-bold mb-1">Patient Timeline</h3>
          <p className="text-muted mb-0">
            Chronological view of appointments, records, invoices, payments, and
            refunds
          </p>
        </div>

        <div className="d-flex flex-wrap gap-2">
          <Link
            to={`/admin/erp/patients/${id}/profile`}
            className="btn btn-outline-primary"
          >
            Profile
          </Link>

          <Link
            to={`/admin/erp/patients/${id}/statement`}
            className="btn btn-outline-success"
          >
            Statement
          </Link>

          <button className="btn btn-primary" onClick={loadTimeline}>
            Refresh
          </button>
        </div>
      </div>

      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body">
          <div className="row g-3">
            <InfoItem label="Patient Name" value={data.name} />
            <InfoItem label="Email" value={data.email} />
            <InfoItem label="Phone" value={data.phone} />
            <InfoItem label="Patient ID" value={data.id} />
          </div>
        </div>
      </div>

      <div className="card shadow-sm border-0">
        <div className="card-header bg-white">
          <h5 className="mb-0">Timeline Events</h5>
        </div>

        <div className="card-body">
          {timeline.length === 0 ? (
            <div className="text-muted">No timeline events found.</div>
          ) : (
            <div className="timeline-list">
              {timeline.map((item, index) => (
                <div
                  key={`${item.type}-${item.data?.id || index}`}
                  className="d-flex gap-3 pb-4 position-relative"
                >
                  <div className="flex-shrink-0">
                    <div
                      className={`rounded-circle d-flex align-items-center justify-content-center ${iconBg(item.type)}`}
                      style={{ width: 42, height: 42 }}
                    >
                      <i className={`${iconName(item.type)} text-white`}></i>
                    </div>
                  </div>

                  <div className="flex-grow-1 border rounded p-3 bg-light">
                    <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-2">
                      <div>
                        <div className="fw-bold text-capitalize">
                          {prettyType(item.type)}
                        </div>
                        <div className="text-muted small">
                          {formatDateTime(item.event_at || item.created_at)}
                        </div>
                      </div>

                      <div>
                        <span
                          className={`badge ${badgeClass(item.type, item.data?.status)}`}
                        >
                          {item.data?.status || prettyType(item.type)}
                        </span>
                      </div>
                    </div>

                    <TimelineEventBody item={item} money={money} />

                    {index !== timeline.length - 1 ? (
                      <div
                        className="position-absolute"
                        style={{
                          left: 20,
                          top: 48,
                          bottom: -8,
                          width: 2,
                          background: "#dee2e6",
                        }}
                      />
                    ) : null}
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

function TimelineEventBody({ item, money }) {
  const data = item.data || {};

  if (item.type === "appointment") {
    const patientId = data.patient_id || null;
    const invoiceId = data.invoice_id || null;
    const treatmentPlanId = data.treatment_plan_id || null;

    return (
      <>
        <div className="row g-2">
          <InfoItem label="Doctor" value={data.doctor_name} />
          <InfoItem
            label="Type"
            value={prettyAppointmentType(data.appointment_type)}
          />
          <InfoItem label="Date" value={data.appointment_date} />
          <InfoItem
            label="Time"
            value={String(data.appointment_time || "").slice(0, 5) || "-"}
          />
          <InfoItem label="Notes" value={data.notes} />
          <InfoItem label="Clinical Notes" value={data.clinical_notes} />
          <InfoItem label="Diagnosis" value={data.diagnosis} />
          <InfoItem label="Next Step" value={data.next_step} />
        </div>

        <div className="d-flex flex-wrap gap-2 mt-3">
          {patientId ? (
            <Link
              to={`/admin/erp/patients/${patientId}/profile`}
              className="btn btn-sm btn-outline-primary"
            >
              Patient
            </Link>
          ) : null}

          {treatmentPlanId ? (
            <Link
              to={`/admin/erp/treatment-plans/${treatmentPlanId}`}
              className="btn btn-sm btn-outline-info"
            >
              Treatment Plan
            </Link>
          ) : null}

          {invoiceId ? (
            <Link
              to={`/admin/erp/invoices/${invoiceId}`}
              className="btn btn-sm btn-outline-success"
            >
              Invoice
            </Link>
          ) : null}

          {data.id ? (
            <Link
              to={`/admin/erp/appointments/${data.id}/activity`}
              className="btn btn-sm btn-outline-secondary"
            >
              Appointment Activity
            </Link>
          ) : null}
        </div>
      </>
    );
  }

  if (item.type === "dental_record") {
    return (
      <div className="row g-2">
        <InfoItem label="Procedure" value={data.procedure_name} />
        <InfoItem label="Tooth" value={data.tooth_number} />
        <InfoItem label="Surface" value={data.surface} />
        <InfoItem label="Notes" value={data.notes} />
      </div>
    );
  }

  if (item.type === "invoice") {
    return (
      <div className="row g-2">
        <InfoItem label="Invoice Number" value={data.number} />
        <InfoItem label="Total" value={money(data.total)} />
        <InfoItem label="Issued At" value={data.issued_at} />
        <InfoItem label="Appointment ID" value={data.appointment_id} />
      </div>
    );
  }

  if (item.type === "payment") {
    return (
      <div className="row g-2">
        <InfoItem label="Invoice ID" value={data.invoice_id} />
        <InfoItem label="Amount" value={money(data.amount)} />
        <InfoItem label="Applied Amount" value={money(data.applied_amount)} />
        <InfoItem label="Method" value={data.method} />
      </div>
    );
  }

  if (item.type === "refund") {
    return (
      <div className="row g-2">
        <InfoItem label="Payment ID" value={data.payment_id} />
        <InfoItem label="Invoice ID" value={data.invoice_id} />
        <InfoItem label="Refund Amount" value={money(data.amount)} />
        <InfoItem label="Applies To" value={data.applies_to} />
      </div>
    );
  }

  return <div className="text-muted">No details available.</div>;
}

function InfoItem({ label, value }) {
  return (
    <div className="col-12 col-md-6">
      <div className="small text-muted">{label}</div>
      <div className="fw-semibold">{value || "-"}</div>
    </div>
  );
}

function prettyType(type) {
  switch (type) {
    case "appointment":
      return "Appointment";
    case "dental_record":
      return "Dental Record";
    case "invoice":
      return "Invoice";
    case "payment":
      return "Payment";
    case "refund":
      return "Refund";
    default:
      return type || "Event";
  }
}

function prettyAppointmentType(type) {
  const value = String(type || "").toLowerCase();

  if (value === "consultation") return "Consultation";
  if (value === "treatment") return "Treatment";

  return type || "-";
}

function iconName(type) {
  switch (type) {
    case "appointment":
      return "fas fa-calendar-check";
    case "dental_record":
      return "fas fa-tooth";
    case "invoice":
      return "fas fa-file-invoice-dollar";
    case "payment":
      return "fas fa-credit-card";
    case "refund":
      return "fas fa-undo-alt";
    default:
      return "fas fa-circle";
  }
}

function iconBg(type) {
  switch (type) {
    case "appointment":
      return "bg-primary";
    case "dental_record":
      return "bg-info";
    case "invoice":
      return "bg-warning";
    case "payment":
      return "bg-success";
    case "refund":
      return "bg-danger";
    default:
      return "bg-secondary";
  }
}

function badgeClass(type, status) {
  const value = String(status || "").toLowerCase();

  if (type === "payment") return "bg-success";
  if (type === "refund") return "bg-danger";

  if (["paid", "completed"].includes(value)) return "bg-success";
  if (["unpaid", "cancelled", "no_show"].includes(value)) return "bg-danger";
  if (["scheduled", "partially_paid", "planned"].includes(value))
    return "bg-warning text-dark";
  if (["in_progress"].includes(value)) return "bg-info text-dark";

  return "bg-secondary";
}

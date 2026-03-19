import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "../../../services/axios";

export default function PatientTimelinePage() {
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
          "Failed to load patient timeline.",
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

  const money = (value) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(Number(value || 0));

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
        style={{ minHeight: 320 }}
      >
        <div className="spinner-border text-primary" />
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

  if (!patient) {
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
            Full history: appointments, dental records, treatment flow, invoices
            and payments
          </p>
        </div>

        <div className="d-flex gap-2 flex-wrap">
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

      <div className="card mb-4 shadow-sm border-0">
        <div className="card-body">
          <div className="row g-3">
            <InfoItem label="Name" value={patient.name} />
            <InfoItem label="Code" value={patient.patient_code || "-"} />
            <InfoItem label="Email" value={patient.email} />
            <InfoItem label="Phone" value={patient.phone} />
          </div>
        </div>
      </div>

      <div className="card shadow-sm border-0">
        <div className="card-header bg-white">
          <h5 className="mb-0">Timeline Events</h5>
        </div>

        <div className="card-body">
          {sortedTimeline.length === 0 ? (
            <div className="text-muted">No events found.</div>
          ) : (
            <div className="d-flex flex-column gap-3">
              {sortedTimeline.map((item, index) => (
                <div
                  key={`${item.type}-${item.data?.id || index}`}
                  className="border rounded p-3 bg-light"
                >
                  <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-3">
                    <div>
                      <div className="fw-bold">{prettyType(item.type)}</div>
                      <div className="text-muted small">
                        {formatDateTime(item.event_at || item.created_at)}
                      </div>
                    </div>

                    <span
                      className={`badge ${badgeClass(item.type, item.data?.status)}`}
                    >
                      {item.data?.status || prettyType(item.type)}
                    </span>
                  </div>

                  <TimelineEventBody
                    item={item}
                    money={money}
                    formatDate={formatDate}
                  />
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

function TimelineEventBody({ item, money, formatDate }) {
  const data = item.data || {};

  if (item.type === "appointment") {
    return (
      <>
        <InfoGrid
          items={[
            ["Doctor", data.doctor_name],
            ["Type", prettyAppointmentType(data.appointment_type)],
            ["Date", formatDate(data.appointment_date)],
            ["Time", data.appointment_time?.slice(0, 5)],
            ["Status", data.status],
            ["Diagnosis", data.diagnosis],
            ["Next Step", data.next_step],
            ["Clinical Notes", data.clinical_notes],
            ["Notes", data.notes],
          ]}
        />

        <div className="mt-3 d-flex flex-wrap gap-2">
          {data.treatment_plan_id ? (
            <Link
              to={`/admin/erp/treatment-plans/${data.treatment_plan_id}`}
              className="btn btn-sm btn-outline-info"
            >
              Treatment Plan
            </Link>
          ) : null}

          {data.invoice_id ? (
            <Link
              to={`/admin/erp/invoices/${data.invoice_id}`}
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
    const treatmentPlanItem =
      data.treatment_plan_item || data.treatmentPlanItem || null;

    return (
      <>
        <InfoGrid
          items={[
            ["Procedure", data.procedure_name],
            ["Tooth", data.tooth_number],
            ["Surface", data.surface],
            ["Status", data.status],
            ["Notes", data.notes],
            [
              "Flow",
              treatmentPlanItem
                ? treatmentPlanItem.appointment_id
                  ? `Appointment #${treatmentPlanItem.appointment_id}`
                  : `Plan #${treatmentPlanItem.treatment_plan_id}`
                : "Not converted",
            ],
          ]}
        />

        <div className="mt-3 d-flex flex-wrap gap-2">
          {treatmentPlanItem?.treatment_plan_id ? (
            <Link
              to={`/admin/erp/treatment-plans/${treatmentPlanItem.treatment_plan_id}`}
              className="btn btn-sm btn-outline-success"
            >
              Open Plan
            </Link>
          ) : null}

          {treatmentPlanItem?.appointment_id ? (
            <Link
              to={`/admin/erp/appointments/${treatmentPlanItem.appointment_id}/activity`}
              className="btn btn-sm btn-outline-primary"
            >
              Open Appointment
            </Link>
          ) : null}
        </div>
      </>
    );
  }

  if (item.type === "invoice") {
    return (
      <>
        <InfoGrid
          items={[
            ["Invoice Number", data.number],
            ["Total", money(data.total)],
            ["Status", data.status],
            ["Issued At", formatDate(data.issued_at)],
            ["Appointment ID", data.appointment_id],
            ["Treatment Plan ID", data.treatment_plan_id],
          ]}
        />

        <div className="mt-3 d-flex flex-wrap gap-2">
          {data.id ? (
            <Link
              to={`/admin/erp/invoices/${data.id}`}
              className="btn btn-sm btn-outline-success"
            >
              Open Invoice
            </Link>
          ) : null}

          {data.treatment_plan_id ? (
            <Link
              to={`/admin/erp/treatment-plans/${data.treatment_plan_id}`}
              className="btn btn-sm btn-outline-info"
            >
              Treatment Plan
            </Link>
          ) : null}
        </div>
      </>
    );
  }

  if (item.type === "payment") {
    return (
      <InfoGrid
        items={[
          ["Invoice ID", data.invoice_id],
          ["Amount", money(data.amount)],
          ["Applied Amount", money(data.applied_amount)],
          ["Credit Amount", money(data.credit_amount)],
          ["Method", data.method],
        ]}
      />
    );
  }

  if (item.type === "refund") {
    return (
      <InfoGrid
        items={[
          ["Payment ID", data.payment_id],
          ["Invoice ID", data.invoice_id],
          ["Refund Amount", money(data.amount)],
          ["Applies To", data.applies_to],
        ]}
      />
    );
  }

  return <div className="text-muted">No details available.</div>;
}

/* ================= HELPERS ================= */

function InfoGrid({ items }) {
  return (
    <div className="row g-2">
      {items.map(([label, value], i) => (
        <div key={i} className="col-12 col-md-6">
          <div className="small text-muted">{label}</div>
          <div className="fw-semibold">{value || "-"}</div>
        </div>
      ))}
    </div>
  );
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

function badgeClass(type, status) {
  const value = String(status || "").toLowerCase();

  if (type === "payment") return "bg-success";
  if (type === "refund") return "bg-danger";

  if (["paid", "completed"].includes(value)) return "bg-success";
  if (["unpaid", "cancelled", "no_show"].includes(value)) return "bg-danger";
  if (["scheduled", "partially_paid", "planned"].includes(value)) {
    return "bg-warning text-dark";
  }
  if (["in_progress"].includes(value)) return "bg-info text-dark";

  return "bg-secondary";
}

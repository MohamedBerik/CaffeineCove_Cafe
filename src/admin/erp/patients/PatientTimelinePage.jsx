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

  // ✅ ترتيب الأحداث من الأحدث للأقدم
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
      <div className="alert alert-danger d-flex justify-content-between">
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
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold">Patient Timeline</h3>
          <p className="text-muted mb-0">
            Full history: appointments, dental records, treatment flow, invoices
            & payments
          </p>
        </div>

        <div className="d-flex gap-2">
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

      {/* Patient Info */}
      <div className="card mb-4 shadow-sm">
        <div className="card-body">
          <div className="row g-3">
            <InfoItem label="Name" value={patient.name} />
            <InfoItem label="Code" value={patient.patient_code} />
            <InfoItem label="Email" value={patient.email} />
            <InfoItem label="Phone" value={patient.phone} />
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="card shadow-sm">
        <div className="card-header bg-white">
          <h5 className="mb-0">Timeline Events</h5>
        </div>

        <div className="card-body">
          {sortedTimeline.length === 0 ? (
            <div className="text-muted">No events found</div>
          ) : (
            sortedTimeline.map((item, i) => (
              <div key={i} className="mb-4 border rounded p-3 bg-light">
                <div className="d-flex justify-content-between mb-2">
                  <strong>{prettyType(item.type)}</strong>
                  <span className="text-muted small">
                    {formatDateTime(item.event_at || item.created_at)}
                  </span>
                </div>

                <TimelineEventBody
                  item={item}
                  money={money}
                  formatDate={formatDate}
                />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

/* ================= COMPONENTS ================= */

function TimelineEventBody({ item, money, formatDate }) {
  const data = item.data || {};

  /* ===== Appointment ===== */
  if (item.type === "appointment") {
    return (
      <>
        <InfoGrid
          items={[
            ["Doctor", data.doctor_name],
            ["Date", formatDate(data.appointment_date)],
            ["Time", data.appointment_time?.slice(0, 5)],
            ["Status", data.status],
            ["Diagnosis", data.diagnosis],
            ["Next Step", data.next_step],
          ]}
        />

        <div className="mt-2 d-flex gap-2">
          {data.treatment_plan_id && (
            <Link
              to={`/admin/erp/treatment-plans/${data.treatment_plan_id}`}
              className="btn btn-sm btn-outline-info"
            >
              Treatment Plan
            </Link>
          )}

          {data.id && (
            <Link
              to={`/admin/erp/appointments/${data.id}/activity`}
              className="btn btn-sm btn-outline-secondary"
            >
              Activity
            </Link>
          )}
        </div>
      </>
    );
  }

  /* ===== Dental Record ===== */
  if (item.type === "dental_record") {
    const t = data.treatment_plan_item;

    return (
      <>
        <InfoGrid
          items={[
            ["Procedure", data.procedure_name],
            ["Tooth", data.tooth_number],
            ["Surface", data.surface],
            ["Notes", data.notes],
            [
              "Flow",
              t
                ? t.appointment_id
                  ? `Appointment #${t.appointment_id}`
                  : `Plan #${t.treatment_plan_id}`
                : "Not converted",
            ],
          ]}
        />

        <div className="mt-2 d-flex gap-2">
          {t?.treatment_plan_id && (
            <Link
              to={`/admin/erp/treatment-plans/${t.treatment_plan_id}`}
              className="btn btn-sm btn-outline-success"
            >
              Open Plan
            </Link>
          )}

          {t?.appointment_id && (
            <Link
              to={`/admin/erp/appointments/${t.appointment_id}/activity`}
              className="btn btn-sm btn-outline-primary"
            >
              Open Appointment
            </Link>
          )}
        </div>
      </>
    );
  }

  /* ===== Invoice ===== */
  if (item.type === "invoice") {
    return (
      <>
        <InfoGrid
          items={[
            ["Invoice", data.number],
            ["Total", money(data.total)],
            ["Date", formatDate(data.issued_at)],
          ]}
        />

        <Link
          to={`/admin/erp/invoices/${data.id}`}
          className="btn btn-sm btn-outline-success mt-2"
        >
          Open Invoice
        </Link>
      </>
    );
  }

  /* ===== Payment ===== */
  if (item.type === "payment") {
    return (
      <InfoGrid
        items={[
          ["Invoice", data.invoice_id],
          ["Amount", money(data.amount)],
          ["Method", data.method],
        ]}
      />
    );
  }

  /* ===== Refund ===== */
  if (item.type === "refund") {
    return (
      <InfoGrid
        items={[
          ["Invoice", data.invoice_id],
          ["Refund", money(data.amount)],
          ["Type", data.applies_to],
        ]}
      />
    );
  }

  return <div className="text-muted">No details</div>;
}

/* ================= HELPERS ================= */

function InfoGrid({ items }) {
  return (
    <div className="row g-2">
      {items.map(([label, value], i) => (
        <div key={i} className="col-md-6">
          <small className="text-muted">{label}</small>
          <div>{value || "-"}</div>
        </div>
      ))}
    </div>
  );
}

function InfoItem({ label, value }) {
  return (
    <div className="col-md-6">
      <small className="text-muted">{label}</small>
      <div>{value || "-"}</div>
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
      return type;
  }
}

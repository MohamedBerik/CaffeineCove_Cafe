import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "../../../services/axios";

export default function AppointmentActivityPage() {
  const { id } = useParams();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadActivity();
  }, [id]);

  const loadActivity = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await axios.get(`/erp/appointments/${id}/activity`);
      const payload = res.data || {};
      const activityRows = Array.isArray(payload.data) ? payload.data : [];

      setRows(activityRows);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.msg ||
          "Failed to load appointment activity.",
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

        <div className="d-flex gap-2">
          <Link
            to="/admin/erp/appointments"
            className="btn btn-outline-secondary"
          >
            Back to Appointments
          </Link>

          <button className="btn btn-primary" onClick={loadActivity}>
            Refresh
          </button>
        </div>
      </div>

      {error ? (
        <div className="alert alert-danger d-flex justify-content-between align-items-center">
          <span>{error}</span>
          <button
            className="btn btn-sm btn-outline-danger"
            onClick={loadActivity}
          >
            Retry
          </button>
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
                          {"old_status" in properties ? (
                            <InfoItem
                              label="Old Status"
                              value={properties.old_status}
                            />
                          ) : null}

                          {"new_status" in properties ? (
                            <InfoItem
                              label="New Status"
                              value={properties.new_status}
                            />
                          ) : null}

                          {"old_date" in properties ? (
                            <InfoItem
                              label="Old Date"
                              value={properties.old_date}
                            />
                          ) : null}

                          {"new_date" in properties ? (
                            <InfoItem
                              label="New Date"
                              value={properties.new_date}
                            />
                          ) : null}

                          {"old_time" in properties ? (
                            <InfoItem
                              label="Old Time"
                              value={properties.old_time}
                            />
                          ) : null}

                          {"new_time" in properties ? (
                            <InfoItem
                              label="New Time"
                              value={properties.new_time}
                            />
                          ) : null}

                          {"doctor_id" in properties ? (
                            <InfoItem
                              label="Doctor ID"
                              value={properties.doctor_id}
                            />
                          ) : null}

                          {"patient_id" in properties ? (
                            <InfoItem
                              label="Patient ID"
                              value={properties.patient_id}
                            />
                          ) : null}

                          {"invoice_id" in properties ? (
                            <InfoItem
                              label="Invoice ID"
                              value={properties.invoice_id}
                            />
                          ) : null}

                          {"invoice_number" in properties ? (
                            <InfoItem
                              label="Invoice Number"
                              value={properties.invoice_number}
                            />
                          ) : null}

                          {"treatment_plan_id" in properties ? (
                            <InfoItem
                              label="Treatment Plan ID"
                              value={properties.treatment_plan_id}
                            />
                          ) : null}

                          {"total" in properties ? (
                            <InfoItem label="Total" value={properties.total} />
                          ) : null}
                        </>
                      ) : null}

                      <div className="col-12">
                        <div className="small text-muted mb-1">Properties</div>
                        <pre
                          className="mb-0 p-3 bg-white border rounded"
                          style={{
                            whiteSpace: "pre-wrap",
                            wordBreak: "break-word",
                            fontSize: "0.875rem",
                          }}
                        >
                          {formatJson(item.properties)}
                        </pre>
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
    default:
      return "bg-secondary";
  }
}

function shortSubjectType(value) {
  if (!value) return "-";
  const parts = String(value).split("\\");
  return parts[parts.length - 1] || value;
}

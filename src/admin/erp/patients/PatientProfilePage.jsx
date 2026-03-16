import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "../../../services/axios";

export default function PatientProfilePage() {
  const { id } = useParams();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadProfile();
  }, [id]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await axios.get(`/erp/customers/${id}/profile`);
      setData(res.data?.data || null);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.msg ||
          "Failed to load patient profile",
      );
    } finally {
      setLoading(false);
    }
  };

  const money = (v) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(Number(v || 0));

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

  const patient = data?.patient || {};
  const appointments = data?.appointments || [];
  const dentalRecords = data?.dental_records || [];
  const treatmentPlans = data?.treatment_plans || [];
  const invoices = data?.invoices || [];

  const invoicesTotal = Number(data?.invoices_total || 0);
  const invoicesPaid = Number(data?.invoices_paid || 0);
  const invoicesRemaining = Number(data?.invoices_remaining || 0);
  const customerCreditBalance = Number(data?.customer_credit_balance || 0);

  const sortedAppointments = useMemo(() => {
    return [...appointments].sort((a, b) => {
      const aDate = new Date(
        `${a.appointment_date || ""} ${a.appointment_time || "00:00"}`,
      ).getTime();
      const bDate = new Date(
        `${b.appointment_date || ""} ${b.appointment_time || "00:00"}`,
      ).getTime();

      return bDate - aDate;
    });
  }, [appointments]);

  const sortedInvoices = useMemo(() => {
    return [...invoices].sort((a, b) => Number(b.id || 0) - Number(a.id || 0));
  }, [invoices]);

  if (loading) {
    return (
      <div className="text-center p-5">
        <div className="spinner-border text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger">
        {error}
        <button
          className="btn btn-sm btn-outline-danger ms-3"
          onClick={loadProfile}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data) {
    return <div className="alert alert-warning">No patient data</div>;
  }

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h3 className="fw-bold mb-1">{patient.name}</h3>
          <div className="text-muted">Code: {patient.patient_code || "-"}</div>
        </div>

        <div className="d-flex gap-2 flex-wrap">
          <Link
            to={`/admin/erp/patients/${id}/timeline`}
            className="btn btn-outline-info"
          >
            Timeline
          </Link>

          <Link
            to={`/admin/erp/patients/${id}/statement`}
            className="btn btn-outline-success"
          >
            Statement
          </Link>

          <button className="btn btn-primary" onClick={loadProfile}>
            Refresh
          </button>
        </div>
      </div>

      <div className="card mb-4 shadow-sm">
        <div className="card-body">
          <div className="row g-3">
            <InfoItem label="Email" value={patient.email || "-"} />
            <InfoItem label="Phone" value={patient.phone || "-"} />
            <InfoItem
              label="Status"
              value={<PatientStatusBadge status={patient.status} />}
            />
            <InfoItem label="Created" value={formatDate(patient.created_at)} />
          </div>
        </div>
      </div>

      <div className="row mb-4 g-3">
        <Kpi title="Appointments" value={appointments.length} />
        <Kpi title="Dental Records" value={dentalRecords.length} />
        <Kpi title="Treatment Plans" value={treatmentPlans.length} />
        <Kpi title="Invoices" value={invoices.length} />
        <Kpi
          title="Invoices Total"
          value={money(invoicesTotal)}
          isMoney
          color="primary"
        />
        <Kpi title="Paid" value={money(invoicesPaid)} isMoney color="success" />
        <Kpi
          title="Remaining"
          value={money(invoicesRemaining)}
          isMoney
          color="warning"
        />
        <Kpi
          title="Customer Credit Balance"
          value={money(customerCreditBalance)}
          isMoney
          color="secondary"
        />
      </div>

      <Section title="Appointments">
        {sortedAppointments.length === 0 ? (
          <Empty text="No appointments" />
        ) : (
          <Table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Time</th>
                <th>Doctor</th>
                <th>Type</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {sortedAppointments.map((a) => (
                <tr key={a.id}>
                  <td>{formatDate(a.appointment_date)}</td>
                  <td>{String(a.appointment_time || "").slice(0, 5) || "-"}</td>
                  <td>{a.doctor?.name || a.doctor_name || "-"}</td>
                  <td>{formatAppointmentType(a.appointment_type)}</td>
                  <td>
                    <AppointmentStatusBadge status={a.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Section>

      <Section title="Dental Records">
        {dentalRecords.length === 0 ? (
          <Empty text="No dental records" />
        ) : (
          <Table>
            <thead>
              <tr>
                <th>Tooth</th>
                <th>Surface</th>
                <th>Procedure</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {dentalRecords.map((r) => (
                <tr key={r.id}>
                  <td>{r.tooth_number || "-"}</td>
                  <td>{r.surface || "-"}</td>
                  <td>{r.procedure?.name || "-"}</td>
                  <td>
                    <RecordStatusBadge status={r.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Section>

      <Section title="Treatment Plans">
        {treatmentPlans.length === 0 ? (
          <Empty text="No treatment plans" />
        ) : (
          <Table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {treatmentPlans.map((p) => (
                <tr key={p.id}>
                  <td>
                    <Link
                      to={`/admin/erp/treatment-plans/${p.id}`}
                      className="text-decoration-none"
                    >
                      {p.title || "-"}
                    </Link>
                  </td>
                  <td>{money(p.total_cost)}</td>
                  <td>
                    <PlanStatusBadge status={p.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Section>

      <Section title="Invoices">
        {sortedInvoices.length === 0 ? (
          <Empty text="No invoices" />
        ) : (
          <Table>
            <thead>
              <tr>
                <th>Number</th>
                <th>Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {sortedInvoices.map((i) => (
                <tr key={i.id}>
                  <td>
                    <Link
                      to={`/admin/erp/invoices/${i.id}`}
                      className="text-decoration-none"
                    >
                      {i.number}
                    </Link>
                  </td>
                  <td>{money(i.total)}</td>
                  <td>
                    <InvoiceStatusBadge status={i.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Section>
    </div>
  );
}

function Kpi({ title, value, isMoney = false, color = "dark" }) {
  return (
    <div className="col-12 col-sm-6 col-xl-3">
      <div className="card shadow-sm border-0 h-100">
        <div className="card-body">
          <div className="text-muted small mb-1">{title}</div>
          <h4 className={`fw-bold mb-0 text-${color}`}>
            {isMoney ? value : (value ?? 0)}
          </h4>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="card mb-4 shadow-sm border-0">
      <div className="card-header bg-white">
        <h5 className="mb-0">{title}</h5>
      </div>
      <div className="card-body p-0">{children}</div>
    </div>
  );
}

function Table({ children }) {
  return (
    <div className="table-responsive">
      <table className="table table-hover mb-0 align-middle">{children}</table>
    </div>
  );
}

function Empty({ text }) {
  return <div className="p-3 text-muted">{text}</div>;
}

function InfoItem({ label, value }) {
  return (
    <div className="col-12 col-md-6 col-xl-3">
      <div className="small text-muted">{label}</div>
      <div className="fw-semibold">{value ?? "-"}</div>
    </div>
  );
}

function formatAppointmentType(value) {
  const type = String(value || "").toLowerCase();
  if (type === "consultation") return "Consultation";
  if (type === "treatment") return "Treatment";
  return "-";
}

function PatientStatusBadge({ status }) {
  const value = String(status || "").toLowerCase();
  let cls = "secondary";

  if (["1", "active", "enabled"].includes(value)) cls = "success";
  else if (["0", "inactive", "disabled"].includes(value)) cls = "danger";

  return <span className={`badge bg-${cls}`}>{String(status ?? "-")}</span>;
}

function AppointmentStatusBadge({ status }) {
  const value = String(status || "").toLowerCase();
  let cls = "secondary";

  if (["completed"].includes(value)) cls = "success";
  else if (["scheduled"].includes(value)) cls = "warning";
  else if (["cancelled", "no_show"].includes(value)) cls = "danger";

  return <span className={`badge bg-${cls}`}>{status || "-"}</span>;
}

function RecordStatusBadge({ status }) {
  const value = String(status || "").toLowerCase();
  let cls = "secondary";

  if (["completed"].includes(value)) cls = "success";
  else if (["planned"].includes(value)) cls = "warning";
  else if (["in_progress"].includes(value)) cls = "info";
  else if (["cancelled"].includes(value)) cls = "danger";

  return <span className={`badge bg-${cls}`}>{status || "-"}</span>;
}

function PlanStatusBadge({ status }) {
  const value = String(status || "").toLowerCase();
  let cls = "secondary";

  if (["active"].includes(value)) cls = "warning";
  else if (["completed"].includes(value)) cls = "success";
  else if (["cancelled"].includes(value)) cls = "danger";

  return <span className={`badge bg-${cls}`}>{status || "-"}</span>;
}

function InvoiceStatusBadge({ status }) {
  const value = String(status || "").toLowerCase();
  let cls = "secondary";

  if (["paid"].includes(value)) cls = "success";
  else if (["partially_paid"].includes(value)) cls = "warning";
  else if (["unpaid", "cancelled"].includes(value)) cls = "danger";

  return <span className={`badge bg-${cls}`}>{status || "-"}</span>;
}

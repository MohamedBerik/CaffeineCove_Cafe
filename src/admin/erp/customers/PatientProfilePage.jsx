import { useEffect, useState } from "react";
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

      setData(res.data.data);
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
    }).format(v || 0);

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

  const patient = data.patient;
  const appointments = data.appointments || [];
  const dentalRecords = data.dental_records || [];
  const treatmentPlans = data.treatment_plans || [];
  const invoices = data.invoices || [];

  return (
    <div className="container-fluid">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold">{patient.name}</h3>
          <div className="text-muted">Code: {patient.patient_code || "-"}</div>
        </div>

        <div className="d-flex gap-2">
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

      {/* Patient Info */}
      <div className="card mb-4 shadow-sm">
        <div className="card-body">
          <div className="row">
            <div className="col-md-3">
              <b>Email</b>
              <div>{patient.email || "-"}</div>
            </div>

            <div className="col-md-3">
              <b>Phone</b>
              <div>{patient.phone || "-"}</div>
            </div>

            <div className="col-md-3">
              <b>Status</b>
              <div>{patient.status}</div>
            </div>

            <div className="col-md-3">
              <b>Created</b>
              <div>{patient.created_at}</div>
            </div>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="row mb-4">
        <Kpi title="Appointments" value={appointments.length} />
        <Kpi title="Dental Records" value={dentalRecords.length} />
        <Kpi title="Treatment Plans" value={treatmentPlans.length} />
        <Kpi title="Invoices" value={invoices.length} />
      </div>

      {/* Appointments */}
      <Section title="Appointments">
        {appointments.length === 0 ? (
          <Empty text="No appointments" />
        ) : (
          <Table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Time</th>
                <th>Doctor</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {appointments.map((a) => (
                <tr key={a.id}>
                  <td>{a.appointment_date}</td>
                  <td>{a.appointment_time}</td>
                  <td>{a.doctor_name}</td>
                  <td>{a.status}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Section>

      {/* Dental Records */}
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
                  <td>{r.tooth_number}</td>
                  <td>{r.surface}</td>
                  <td>{r.procedure?.name}</td>
                  <td>{r.status}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Section>

      {/* Treatment Plans */}
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
                  <td>{p.title}</td>
                  <td>{money(p.total_cost)}</td>
                  <td>{p.status}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Section>

      {/* Invoices */}
      <Section title="Invoices">
        {invoices.length === 0 ? (
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
              {invoices.map((i) => (
                <tr key={i.id}>
                  <td>{i.number}</td>
                  <td>{money(i.total)}</td>
                  <td>{i.status}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Section>
    </div>
  );
}

/* Components */

function Kpi({ title, value }) {
  return (
    <div className="col-md-3 mb-3">
      <div className="card shadow-sm">
        <div className="card-body">
          <div className="text-muted">{title}</div>
          <h4 className="fw-bold">{value}</h4>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="card mb-4 shadow-sm">
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
      <table className="table table-hover mb-0">{children}</table>
    </div>
  );
}

function Empty({ text }) {
  return <div className="p-3 text-muted">{text}</div>;
}

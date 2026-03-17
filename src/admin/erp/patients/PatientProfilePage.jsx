import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "../../../services/axios";

export default function PatientProfilePage() {
  const { id } = useParams();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedTooth, setSelectedTooth] = useState(null);

  const [recordForm, setRecordForm] = useState({
    tooth_number: "",
    surface: "",
    procedure_id: "",
    notes: "",
    status: "planned",
  });

  const [savingRecord, setSavingRecord] = useState(false);
  const [recordError, setRecordError] = useState("");
  const [recordSuccess, setRecordSuccess] = useState("");

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

  useEffect(() => {
    if (!selectedTooth) return;

    setRecordError("");
    setRecordSuccess("");
    setRecordForm({
      tooth_number: String(selectedTooth),
      surface: "",
      procedure_id: "",
      notes: "",
      status: "planned",
    });
  }, [selectedTooth]);

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
  const procedures = data?.procedures || [];

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

  const toothSurfacesMap = useMemo(() => {
    const map = {};

    dentalRecords.forEach((r) => {
      const tooth = String(r.tooth_number || "").trim();
      if (!tooth) return;

      const surfaceKey = String(r.surface || "general")
        .toLowerCase()
        .trim();

      if (!map[tooth]) {
        map[tooth] = {};
      }

      if (!map[tooth][surfaceKey]) {
        map[tooth][surfaceKey] = r;
      }
    });

    return map;
  }, [dentalRecords]);

  const handleRecordChange = (e) => {
    const { name, value } = e.target;
    setRecordForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const saveDentalRecord = async (e) => {
    e.preventDefault();

    try {
      setSavingRecord(true);
      setRecordError("");
      setRecordSuccess("");

      await axios.post("/erp/dental-records", {
        tooth_number: recordForm.tooth_number,
        surface: recordForm.surface || null,
        procedure_id: Number(recordForm.procedure_id),
        customer_id: Number(id),
        notes: recordForm.notes || null,
        status: recordForm.status || "planned",
      });

      setRecordSuccess("Dental record added successfully.");
      await loadProfile();

      setRecordForm((prev) => ({
        ...prev,
        surface: "",
        procedure_id: "",
        notes: "",
        status: "planned",
      }));
    } catch (err) {
      const errors = err?.response?.data?.errors;
      if (errors) {
        const firstError = Object.values(errors)?.[0]?.[0];
        setRecordError(firstError || "Failed to add dental record.");
      } else {
        setRecordError(
          err?.response?.data?.message ||
            err?.response?.data?.msg ||
            "Failed to add dental record.",
        );
      }
    } finally {
      setSavingRecord(false);
    }
  };

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

      <Section title="Dental Chart">
        <DentalChart
          toothSurfacesMap={toothSurfacesMap}
          onSelectTooth={setSelectedTooth}
        />
      </Section>

      {selectedTooth ? (
        <Section title={`Tooth #${selectedTooth} Details`}>
          <ToothDetails
            tooth={selectedTooth}
            records={dentalRecords.filter(
              (r) =>
                String(r.tooth_number || "").trim() ===
                String(selectedTooth).trim(),
            )}
            procedures={procedures}
            recordForm={recordForm}
            onRecordChange={handleRecordChange}
            onSubmitRecord={saveDentalRecord}
            savingRecord={savingRecord}
            recordError={recordError}
            recordSuccess={recordSuccess}
          />
        </Section>
      ) : null}

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

function DentalChart({ toothSurfacesMap, onSelectTooth }) {
  const upperRight = ["1", "2", "3", "4", "5", "6", "7", "8"];
  const upperLeft = ["9", "10", "11", "12", "13", "14", "15", "16"];
  const lowerLeft = ["17", "18", "19", "20", "21", "22", "23", "24"];
  const lowerRight = ["25", "26", "27", "28", "29", "30", "31", "32"];

  return (
    <div className="p-3">
      <div className="small text-muted mb-3">
        Each tooth shows surfaces: O/I, M, D, B/F, L/P
      </div>

      <div className="mb-4">
        <div className="fw-semibold mb-2">Upper Jaw</div>
        <div className="d-flex flex-wrap gap-2 mb-2">
          {upperRight.map((tooth) => (
            <ToothCard
              key={tooth}
              tooth={tooth}
              surfaces={toothSurfacesMap[tooth] || {}}
              onSelect={onSelectTooth}
            />
          ))}
          {upperLeft.map((tooth) => (
            <ToothCard
              key={tooth}
              tooth={tooth}
              surfaces={toothSurfacesMap[tooth] || {}}
              onSelect={onSelectTooth}
            />
          ))}
        </div>
      </div>

      <div>
        <div className="fw-semibold mb-2">Lower Jaw</div>
        <div className="d-flex flex-wrap gap-2">
          {lowerLeft.map((tooth) => (
            <ToothCard
              key={tooth}
              tooth={tooth}
              surfaces={toothSurfacesMap[tooth] || {}}
              onSelect={onSelectTooth}
            />
          ))}
          {lowerRight.map((tooth) => (
            <ToothCard
              key={tooth}
              tooth={tooth}
              surfaces={toothSurfacesMap[tooth] || {}}
              onSelect={onSelectTooth}
            />
          ))}
        </div>
      </div>

      <div className="d-flex flex-wrap gap-3 mt-4 small">
        <LegendItem label="Completed" className="bg-success" />
        <LegendItem label="In Progress" className="bg-info" />
        <LegendItem label="Planned" className="bg-warning" />
        <LegendItem label="No Data" className="bg-light border" />
      </div>
    </div>
  );
}

function ToothCard({ tooth, surfaces, onSelect }) {
  const occlusal = surfaces.occlusal || surfaces.incisal || surfaces.general;
  const mesial = surfaces.mesial || surfaces.m;
  const distal = surfaces.distal || surfaces.d;
  const buccal = surfaces.buccal || surfaces.facial || surfaces.b || surfaces.f;
  const lingual =
    surfaces.lingual || surfaces.palatal || surfaces.l || surfaces.p;

  return (
    <div
      className="border rounded p-2 bg-white"
      style={{ width: 86, cursor: "pointer" }}
      onClick={() => onSelect(tooth)}
      title={buildToothTooltip(tooth, surfaces)}
    >
      <div className="text-center fw-bold small mb-2">{tooth}</div>

      <div
        className="mx-auto"
        style={{
          display: "grid",
          gridTemplateColumns: "18px 26px 18px",
          gridTemplateRows: "18px 26px 18px",
          gap: "2px",
          width: "66px",
        }}
      >
        <div></div>
        <SurfaceBox status={getSurfaceStatus(occlusal)} label="O/I" />
        <div></div>

        <SurfaceBox status={getSurfaceStatus(mesial)} label="M" />
        <SurfaceBox status={getSurfaceStatus(buccal)} label="B/F" center />
        <SurfaceBox status={getSurfaceStatus(distal)} label="D" />

        <div></div>
        <SurfaceBox status={getSurfaceStatus(lingual)} label="L/P" />
        <div></div>
      </div>
    </div>
  );
}

function SurfaceBox({ status, label, center = false }) {
  return (
    <div
      className={`rounded border ${getSurfaceClass(status)}`}
      style={{
        fontSize: center ? "0.55rem" : "0.5rem",
        minHeight: center ? 26 : 18,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 600,
      }}
    >
      {label}
    </div>
  );
}

function LegendItem({ label, className }) {
  return (
    <div className="d-flex align-items-center gap-2">
      <span
        className={className}
        style={{
          width: 16,
          height: 16,
          display: "inline-block",
          borderRadius: 4,
        }}
      />
      <span>{label}</span>
    </div>
  );
}

function getSurfaceStatus(record) {
  if (!record) return "empty";

  const status = String(record.status || "").toLowerCase();

  if (status === "completed") return "completed";
  if (status === "in_progress") return "in_progress";
  if (status === "planned") return "planned";

  return "empty";
}

function getSurfaceClass(status) {
  if (status === "completed") return "bg-success text-white border-success";
  if (status === "in_progress") return "bg-info text-dark border-info";
  if (status === "planned") return "bg-warning text-dark border-warning";

  return "bg-light text-muted";
}

function buildToothTooltip(tooth, surfaces) {
  const entries = Object.entries(surfaces || {});
  if (!entries.length) return `Tooth ${tooth}: No data`;

  const lines = entries.map(([surface, record]) => {
    return `${surface}: ${record?.procedure?.name || "-"} | ${record?.status || "-"}`;
  });

  return `Tooth ${tooth}\n${lines.join("\n")}`;
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

function ToothDetails({
  tooth,
  records,
  procedures,
  recordForm,
  onRecordChange,
  onSubmitRecord,
  savingRecord,
  recordError,
  recordSuccess,
}) {
  return (
    <div className="p-3">
      {recordError ? (
        <div className="alert alert-danger py-2">{recordError}</div>
      ) : null}

      {recordSuccess ? (
        <div className="alert alert-success py-2">{recordSuccess}</div>
      ) : null}

      <div className="mb-4">
        <div className="fw-semibold mb-3">Add Record for Tooth #{tooth}</div>

        <form onSubmit={onSubmitRecord}>
          <div className="row g-3">
            <div className="col-12 col-md-3">
              <label className="form-label fw-semibold">Tooth</label>
              <input
                type="text"
                className="form-control"
                name="tooth_number"
                value={recordForm.tooth_number}
                onChange={onRecordChange}
                readOnly
              />
            </div>

            <div className="col-12 col-md-3">
              <label className="form-label fw-semibold">Surface</label>
              <select
                className="form-select"
                name="surface"
                value={recordForm.surface}
                onChange={onRecordChange}
                required
              >
                <option value="">Select surface</option>
                <option value="occlusal">Occlusal</option>
                <option value="incisal">Incisal</option>
                <option value="mesial">Mesial</option>
                <option value="distal">Distal</option>
                <option value="buccal">Buccal</option>
                <option value="facial">Facial</option>
                <option value="lingual">Lingual</option>
                <option value="palatal">Palatal</option>
                <option value="general">General</option>
              </select>
            </div>

            <div className="col-12 col-md-3">
              <label className="form-label fw-semibold">Procedure</label>
              <select
                className="form-select"
                name="procedure_id"
                value={recordForm.procedure_id}
                onChange={onRecordChange}
                required
              >
                <option value="">Select procedure</option>
                {procedures.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-12 col-md-3">
              <label className="form-label fw-semibold">Status</label>
              <select
                className="form-select"
                name="status"
                value={recordForm.status}
                onChange={onRecordChange}
              >
                <option value="planned">Planned</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div className="col-12">
              <label className="form-label fw-semibold">Notes</label>
              <textarea
                className="form-control"
                rows="2"
                name="notes"
                value={recordForm.notes}
                onChange={onRecordChange}
                placeholder="Optional notes..."
              />
            </div>

            <div className="col-12">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={savingRecord}
              >
                {savingRecord ? "Saving..." : "Add Record"}
              </button>
            </div>
          </div>
        </form>
      </div>

      <div className="fw-semibold mb-3">Existing Records</div>

      {records.length === 0 ? (
        <div className="text-muted">No records for this tooth.</div>
      ) : (
        <div className="table-responsive">
          <table className="table table-sm table-bordered">
            <thead className="table-light">
              <tr>
                <th>Surface</th>
                <th>Procedure</th>
                <th>Status</th>
                <th>Notes</th>
              </tr>
            </thead>

            <tbody>
              {records.map((r) => (
                <tr key={r.id}>
                  <td>{r.surface || "-"}</td>
                  <td>{r.procedure?.name || "-"}</td>
                  <td>
                    <RecordStatusBadge status={r.status} />
                  </td>
                  <td>{r.notes || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

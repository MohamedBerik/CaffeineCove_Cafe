import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "../../../services/axios";
import { useTranslation } from "react-i18next";
import "./PatientProfilePage.css";
import RadiologyUploader from "../components/RadiologyUploader";
import RadiologyGallery from "../components/RadiologyGallery";
import "./PatientProfilePage.css";

// تحويل Universal (1-32) إلى FDI (string)
const universalToFDI = (universal) => {
  const map = {
    1: "18",
    2: "17",
    3: "16",
    4: "15",
    5: "14",
    6: "13",
    7: "12",
    8: "11",
    9: "21",
    10: "22",
    11: "23",
    12: "24",
    13: "25",
    14: "26",
    15: "27",
    16: "28",
    17: "38",
    18: "37",
    19: "36",
    20: "35",
    21: "34",
    22: "33",
    23: "32",
    24: "31",
    25: "41",
    26: "42",
    27: "43",
    28: "44",
    29: "45",
    30: "46",
    31: "47",
    32: "48",
  };
  return map[universal] || universal;
};

// الأسنان بالنظام العالمي (الداخلي) – مصفوفة الأرقام
const UNIVERSAL_TEETH = [
  [1, 2, 3, 4, 5, 6, 7, 8], // الفك العلوي الأيمن
  [9, 10, 11, 12, 13, 14, 15, 16], // العلوي الأيسر
  [17, 18, 19, 20, 21, 22, 23, 24], // السفلي الأيسر
  [25, 26, 27, 28, 29, 30, 31, 32], // السفلي الأيمن
];

export default function PatientProfilePage() {
  const { t, i18n } = useTranslation();
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

  const [editingRecordId, setEditingRecordId] = useState(null);
  const [savingRecord, setSavingRecord] = useState(false);
  const [deletingRecordId, setDeletingRecordId] = useState(null);

  const [recordError, setRecordError] = useState("");
  const [recordSuccess, setRecordSuccess] = useState("");

  const [convertRecordId, setConvertRecordId] = useState(null);
  const [convertForm, setConvertForm] = useState({
    treatment_plan_id: "",
    price: "",
  });
  const [convertingRecordId, setConvertingRecordId] = useState(null);
  const [convertError, setConvertError] = useState("");
  const [convertSuccess, setConvertSuccess] = useState("");

  const [notation, setNotation] = useState(
    () => localStorage.getItem("toothNotation") || "universal",
  );

  const handleNotationChange = (newNotation) => {
    setNotation(newNotation);
    localStorage.setItem("toothNotation", newNotation);
  };

  useEffect(() => {
    loadProfile();
  }, [id]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError("");
      setRecordError("");
      setRecordSuccess("");
      setConvertError("");
      setConvertSuccess("");

      const res = await axios.get(`/erp/customers/${id}/profile`);
      setData(res.data?.data || null);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.msg ||
          t("Failed to load patient profile"),
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedTooth) return;
    if (editingRecordId) return;

    setRecordError("");
    setRecordSuccess("");
    setRecordForm({
      tooth_number: String(selectedTooth),
      surface: "",
      procedure_id: "",
      notes: "",
      status: "planned",
    });
  }, [selectedTooth, editingRecordId]);

  const resetRecordForm = (toothValue = "") => {
    setEditingRecordId(null);
    setRecordError("");
    setRecordSuccess("");
    setRecordForm({
      tooth_number: toothValue,
      surface: "",
      procedure_id: "",
      notes: "",
      status: "planned",
    });
  };

  const formatCurrency = (value) => {
    const lang = i18n.language === "ar" ? "ar-EG" : "en-US";
    return new Intl.NumberFormat(lang, {
      style: "currency",
      currency: "EGP",
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

  const patient = data?.patient || {};
  const appointments = data?.appointments || [];
  const dentalRecords = data?.dental_records || [];
  const treatmentPlans = data?.treatment_plans || [];
  const invoices = data?.invoices || [];
  const procedures = data?.procedures || [];

  const invoicesTotal = Number(data?.invoices_total || 0);
  const invoicesDirectPaid = Number(data?.invoices_direct_paid || 0);
  const invoicesCreditApplied = Number(data?.invoices_credit_applied || 0);
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
      if (!map[tooth]) map[tooth] = {};
      map[tooth][surfaceKey] = r;
    });
    return map;
  }, [dentalRecords]);

  const selectedToothRecords = useMemo(() => {
    if (!selectedTooth) return [];
    return dentalRecords.filter(
      (r) =>
        String(r.tooth_number || "").trim() === String(selectedTooth).trim(),
    );
  }, [dentalRecords, selectedTooth]);

  const handleRecordChange = (e) => {
    const { name, value } = e.target;
    setRecordForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleConvertChange = (e) => {
    const { name, value } = e.target;
    setConvertForm((prev) => ({ ...prev, [name]: value }));
  };

  const saveDentalRecord = async (e) => {
    e.preventDefault();
    try {
      setSavingRecord(true);
      setRecordError("");
      setRecordSuccess("");

      const payload = {
        tooth_number: recordForm.tooth_number,
        surface: recordForm.surface || null,
        procedure_id: recordForm.procedure_id
          ? Number(recordForm.procedure_id)
          : null,
        customer_id: Number(id),
        notes: recordForm.notes || null,
        status: recordForm.status || "planned",
      };

      if (editingRecordId) {
        await axios.put(`/erp/dental-records/${editingRecordId}`, payload);
        setRecordSuccess(t("Dental record updated successfully."));
      } else {
        await axios.post("/erp/dental-records", payload);
        setRecordSuccess(t("Dental record added successfully."));
      }

      await loadProfile();
      resetRecordForm(String(selectedTooth || ""));
    } catch (err) {
      const errors = err?.response?.data?.errors;
      if (errors) {
        const firstError = Object.values(errors)?.[0]?.[0];
        setRecordError(firstError || t("Failed to save dental record."));
      } else {
        setRecordError(
          err?.response?.data?.message ||
            err?.response?.data?.msg ||
            t("Failed to save dental record."),
        );
      }
    } finally {
      setSavingRecord(false);
    }
  };

  const startEditRecord = (record) => {
    setEditingRecordId(record.id);
    setRecordError("");
    setRecordSuccess("");
    setRecordForm({
      tooth_number: String(record.tooth_number || ""),
      surface: record.surface || "",
      procedure_id: record.procedure_id ? String(record.procedure_id) : "",
      notes: record.notes || "",
      status: record.status || "planned",
    });
  };

  const deleteDentalRecord = async (recordId) => {
    const confirmed = window.confirm(t("Delete this dental record?"));
    if (!confirmed) return;

    try {
      setDeletingRecordId(recordId);
      setRecordError("");
      setRecordSuccess("");
      setConvertError("");
      setConvertSuccess("");

      await axios.delete(`/erp/dental-records/${recordId}`);

      if (editingRecordId === recordId)
        resetRecordForm(String(selectedTooth || ""));
      if (convertRecordId === recordId) {
        setConvertRecordId(null);
        setConvertForm({ treatment_plan_id: "", price: "" });
      }

      setRecordSuccess(t("Dental record deleted successfully."));
      await loadProfile();
    } catch (err) {
      setRecordError(
        err?.response?.data?.message ||
          err?.response?.data?.msg ||
          t("Failed to delete dental record."),
      );
    } finally {
      setDeletingRecordId(null);
    }
  };

  const openConvertForm = (record) => {
    setConvertRecordId(record.id);
    setConvertError("");
    setConvertSuccess("");
    setConvertForm({
      treatment_plan_id: "",
      price:
        record?.procedure?.default_price != null
          ? String(record.procedure.default_price)
          : "",
    });
  };

  const closeConvertForm = () => {
    setConvertRecordId(null);
    setConvertError("");
    setConvertForm({ treatment_plan_id: "", price: "" });
  };

  const submitConvertRecord = async (recordId) => {
    try {
      setConvertingRecordId(recordId);
      setConvertError("");
      setConvertSuccess("");

      const payload = {
        treatment_plan_id: Number(convertForm.treatment_plan_id),
      };
      if (convertForm.price !== "") payload.price = Number(convertForm.price);

      await axios.post(
        `/erp/dental-records/${recordId}/to-treatment-plan-item`,
        payload,
      );
      setConvertSuccess(
        t("Record converted to treatment plan item successfully."),
      );
      await loadProfile();
      closeConvertForm();
    } catch (err) {
      const errors = err?.response?.data?.errors;
      if (errors) {
        const firstError = Object.values(errors)?.[0]?.[0];
        setConvertError(firstError || t("Failed to convert record."));
      } else {
        setConvertError(
          err?.response?.data?.message ||
            err?.response?.data?.msg ||
            t("Failed to convert record."),
        );
      }
    } finally {
      setConvertingRecordId(null);
    }
  };

  const getRecordPrimaryAction = (record) => {
    const item = record?.treatment_plan_item;
    if (!item) {
      return {
        key: "convert",
        label: t("Convert to Treatment Plan"),
        className: "btn btn-sm btn-outline-success",
      };
    }
    if (!item.appointment_id) {
      return {
        key: "plan",
        label: t("Open Treatment Plan"),
        className: "btn btn-sm btn-outline-primary",
        to: `/admin/erp/treatment-plans/${item.treatment_plan_id}`,
      };
    }
    return {
      key: "appointment",
      label: t("Open Appointment"),
      className: "btn btn-sm btn-outline-primary",
      to: `/admin/erp/appointments/${item.appointment_id}/activity`,
    };
  };

  const getRecordMeta = (record) => {
    const item = record?.treatment_plan_item;
    if (!item) return t("Not converted yet");
    if (!item.appointment_id)
      return t("Plan #{id} • Waiting to start procedure", {
        id: item.treatment_plan_id,
      });
    return t("Plan #{planId} • Appointment #{appointmentId}", {
      planId: item.treatment_plan_id,
      appointmentId: item.appointment_id,
    });
  };

  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "400px" }}
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
        <button className="btn btn-sm btn-outline-danger" onClick={loadProfile}>
          {t("Retry")}
        </button>
      </div>
    );
  }

  if (!data) {
    return <div className="alert alert-warning">{t("No patient data")}</div>;
  }

  return (
    <div className="patient-profile-page">
      {/* Header */}
      <div className="profile-header">
        <div className="header-info">
          <h1 className="profile-name">{patient.name}</h1>
          <div className="profile-code">
            {t("Code")}: {patient.patient_code || "-"}
          </div>
        </div>

        <div className="header-actions">
          <Link
            to={`/admin/erp/patients/${id}/timeline`}
            className="btn btn-outline-info"
          >
            <i className="fas fa-history me-2"></i>
            {t("Timeline")}
          </Link>
          <Link
            to={`/admin/erp/patients/${id}/statement`}
            className="btn btn-outline-success"
          >
            <i className="fas fa-file-invoice me-2"></i>
            {t("Statement")}
          </Link>
          <button className="btn btn-primary" onClick={loadProfile}>
            <i className="fas fa-sync-alt me-2"></i>
            {t("Refresh")}
          </button>
        </div>
      </div>

      {/* Patient Info Card */}
      <div className="info-card">
        <div className="info-grid">
          <InfoItem label={t("Email")} value={patient.email || "-"} />
          <InfoItem label={t("Phone")} value={patient.phone || "-"} />
          <InfoItem
            label={t("Status")}
            value={<PatientStatusBadge status={patient.status} t={t} />}
          />
          <InfoItem
            label={t("Created")}
            value={formatDate(patient.created_at)}
          />
        </div>
      </div>

      {/* KPI Grid */}
      <div className="kpi-grid">
        <KpiCard
          title={t("Appointments")}
          value={appointments.length}
          icon="fas fa-calendar-check"
          color="primary"
        />
        <KpiCard
          title={t("Dental Records")}
          value={dentalRecords.length}
          icon="fas fa-tooth"
          color="info"
        />
        <KpiCard
          title={t("Treatment Plans")}
          value={treatmentPlans.length}
          icon="fas fa-notes-medical"
          color="warning"
        />
        <KpiCard
          title={t("Invoices")}
          value={invoices.length}
          icon="fas fa-file-invoice"
          color="secondary"
        />
        <KpiCard
          title={t("Invoices Total")}
          value={formatCurrency(invoicesTotal)}
          icon="fas fa-chart-line"
          color="primary"
          isMoney
        />
        <KpiCard
          title={t("Direct Paid")}
          value={formatCurrency(invoicesDirectPaid)}
          icon="fas fa-money-bill-wave"
          color="success"
          isMoney
        />
        <KpiCard
          title={t("Credit Applied")}
          value={formatCurrency(invoicesCreditApplied)}
          icon="fas fa-wallet"
          color="secondary"
          isMoney
        />
        <KpiCard
          title={t("Net Paid")}
          value={formatCurrency(invoicesPaid)}
          icon="fas fa-check-circle"
          color="info"
          isMoney
        />
        <KpiCard
          title={t("Remaining")}
          value={formatCurrency(invoicesRemaining)}
          icon="fas fa-hourglass-half"
          color="warning"
          isMoney
        />
        <KpiCard
          title={t("Customer Credit Balance")}
          value={formatCurrency(customerCreditBalance)}
          icon="fas fa-credit-card"
          color="secondary"
          isMoney
        />
      </div>

      {/* Appointments Section */}
      <Section title={t("Appointments")} icon="fas fa-calendar-alt">
        {sortedAppointments.length === 0 ? (
          <Empty text={t("No appointments")} />
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t("Date")}</th>
                  <th>{t("Time")}</th>
                  <th>{t("Doctor")}</th>
                  <th>{t("Type")}</th>
                  <th>{t("Status")}</th>
                </tr>
              </thead>
              <tbody>
                {sortedAppointments.map((a) => (
                  <tr key={a.id}>
                    <td data-label={t("Date")}>
                      {formatDate(a.appointment_date)}
                    </td>
                    <td data-label={t("Time")}>
                      {String(a.appointment_time || "").slice(0, 5) || "-"}
                    </td>
                    <td data-label={t("Doctor")}>
                      {a.doctor?.name || a.doctor_name || "-"}
                    </td>
                    <td data-label={t("Type")}>
                      {formatAppointmentType(a.appointment_type, t)}
                    </td>
                    <td data-label={t("Status")}>
                      <AppointmentStatusBadge status={a.status} t={t} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {/* Dental Chart */}
      <Section title={t("Dental Chart")} icon="fas fa-tooth">
        <DentalChart
          toothSurfacesMap={toothSurfacesMap}
          selectedTooth={selectedTooth}
          onSelectTooth={setSelectedTooth}
          t={t}
          notation={notation}
          onNotationChange={handleNotationChange}
        />
      </Section>

      {/* Tooth Details */}
      {selectedTooth && (
        <Section
          title={`${t("Tooth")} #${selectedTooth} ${t("Details")}`}
          icon="fas fa-teeth"
        >
          <ToothDetails
            tooth={selectedTooth}
            records={selectedToothRecords}
            procedures={procedures}
            treatmentPlans={treatmentPlans}
            recordForm={recordForm}
            editingRecordId={editingRecordId}
            onRecordChange={handleRecordChange}
            onSubmitRecord={saveDentalRecord}
            onResetForm={() => resetRecordForm(String(selectedTooth))}
            onStartEdit={startEditRecord}
            onDelete={deleteDentalRecord}
            deletingRecordId={deletingRecordId}
            savingRecord={savingRecord}
            recordError={recordError}
            recordSuccess={recordSuccess}
            convertRecordId={convertRecordId}
            convertForm={convertForm}
            onConvertChange={handleConvertChange}
            onOpenConvert={openConvertForm}
            onCloseConvert={closeConvertForm}
            onSubmitConvert={submitConvertRecord}
            convertingRecordId={convertingRecordId}
            convertError={convertError}
            convertSuccess={convertSuccess}
            getRecordPrimaryAction={getRecordPrimaryAction}
            getRecordMeta={getRecordMeta}
            t={t}
            formatCurrency={formatCurrency}
          />
        </Section>
      )}

      {/* Dental Records Table */}
      <Section title={t("Dental Records")} icon="fas fa-list">
        {dentalRecords.length === 0 ? (
          <Empty text={t("No dental records")} />
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t("Tooth")}</th>
                  <th>{t("Surface")}</th>
                  <th>{t("Procedure")}</th>
                  <th>{t("Status")}</th>
                  <th>{t("Actions")}</th>
                </tr>
              </thead>
              <tbody>
                {dentalRecords.map((r) => {
                  const isConvertOpen = convertRecordId === r.id;
                  const primaryAction = getRecordPrimaryAction(r);
                  return (
                    <tr key={r.id}>
                      <td data-label={t("Tooth")}>{r.tooth_number || "-"}</td>
                      <td data-label={t("Surface")}>{r.surface || "-"}</td>
                      <td data-label={t("Procedure")}>
                        {r.procedure?.name || "-"}
                      </td>
                      <td data-label={t("Status")}>
                        <RecordStatusBadge status={r.status} t={t} />
                      </td>
                      <td data-label={t("Actions")}>
                        <div className="action-group">
                          {primaryAction.key === "convert" ? (
                            <button
                              className={primaryAction.className}
                              onClick={() => openConvertForm(r)}
                            >
                              {primaryAction.label}
                            </button>
                          ) : (
                            <Link
                              to={primaryAction.to}
                              className={primaryAction.className}
                            >
                              {primaryAction.label}
                            </Link>
                          )}
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => {
                              setSelectedTooth(String(r.tooth_number || ""));
                              startEditRecord(r);
                            }}
                          >
                            {t("Edit")}
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => deleteDentalRecord(r.id)}
                            disabled={deletingRecordId === r.id}
                          >
                            {deletingRecordId === r.id
                              ? t("Deleting...")
                              : t("Delete")}
                          </button>
                        </div>
                        <div className="record-meta">{getRecordMeta(r)}</div>
                        {isConvertOpen && primaryAction.key === "convert" && (
                          <ConvertForm
                            convertForm={convertForm}
                            treatmentPlans={treatmentPlans}
                            onConvertChange={handleConvertChange}
                            onSubmitConvert={() => submitConvertRecord(r.id)}
                            onCloseConvert={closeConvertForm}
                            convertingRecordId={convertingRecordId}
                            recordId={r.id}
                            t={t}
                          />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {/* Treatment Plans */}
      <Section title={t("Treatment Plans")} icon="fas fa-notes-medical">
        {treatmentPlans.length === 0 ? (
          <Empty text={t("No treatment plans")} />
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t("Title")}</th>
                  <th>{t("Total")}</th>
                  <th>{t("Status")}</th>
                </tr>
              </thead>
              <tbody>
                {treatmentPlans.map((p) => (
                  <tr key={p.id}>
                    <td data-label={t("Title")}>
                      <Link
                        to={`/admin/erp/treatment-plans/${p.id}`}
                        className="data-link"
                      >
                        {p.title || "-"}
                      </Link>
                    </td>
                    <td data-label={t("Total")}>
                      {formatCurrency(p.total_cost)}
                    </td>
                    <td data-label={t("Status")}>
                      <PlanStatusBadge status={p.status} t={t} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {/* Invoices */}
      <Section title={t("Invoices")} icon="fas fa-file-invoice">
        {sortedInvoices.length === 0 ? (
          <Empty text={t("No invoices")} />
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t("Number")}</th>
                  <th>{t("Total")}</th>
                  <th>{t("Status")}</th>
                </tr>
              </thead>
              <tbody>
                {sortedInvoices.map((i) => (
                  <tr key={i.id}>
                    <td data-label={t("Number")}>
                      <Link
                        to={`/admin/erp/invoices/${i.id}`}
                        className="data-link"
                      >
                        {i.number}
                      </Link>
                    </td>
                    <td data-label={t("Total")}>{formatCurrency(i.total)}</td>
                    <td data-label={t("Status")}>
                      <InvoiceStatusBadge status={i.status} t={t} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {/* Radiology Section - New */}
      <Section title={t("Radiology")} icon="fas fa-x-ray">
        <RadiologyTabs
          patientId={id}
          selectedTooth={selectedTooth} // ✅
          dentalRecords={dentalRecords} // ✅
        />
      </Section>
    </div>
  );
}

// Helper Components
function KpiCard({ title, value, icon, color = "primary", isMoney = false }) {
  const colorMap = {
    primary: { bg: "rgba(26, 35, 126, 0.1)", text: "#1a237e" },
    success: { bg: "rgba(76, 175, 80, 0.1)", text: "#4caf50" },
    danger: { bg: "rgba(244, 67, 54, 0.1)", text: "#f44336" },
    warning: { bg: "rgba(255, 152, 0, 0.1)", text: "#ff9800" },
    info: { bg: "rgba(3, 169, 244, 0.1)", text: "#03a9f4" },
    secondary: { bg: "rgba(108, 117, 125, 0.1)", text: "#6c757d" },
  };
  const colors = colorMap[color] || colorMap.primary;

  return (
    <div className="kpi-card">
      <div
        className="kpi-icon"
        style={{ backgroundColor: colors.bg, color: colors.text }}
      >
        <i className={icon}></i>
      </div>
      <div className="kpi-content">
        <div className="kpi-title">{title}</div>
        <div className="kpi-value" style={{ color: colors.text }}>
          {value}
        </div>
      </div>
    </div>
  );
}

function Section({ title, icon, children }) {
  return (
    <div className="section-card">
      <div className="section-header">
        <i className={`${icon} me-2`}></i>
        <h5 className="mb-0">{title}</h5>
      </div>
      <div className="section-body">{children}</div>
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

function Empty({ text }) {
  return (
    <div className="empty-state">
      <i className="fas fa-inbox empty-icon"></i>
      <p className="empty-text">{text}</p>
    </div>
  );
}

function formatAppointmentType(value, t) {
  const type = String(value || "").toLowerCase();
  if (type === "consultation") return t("Consultation");
  if (type === "treatment") return t("Treatment");
  return "-";
}

// Badge Components
function PatientStatusBadge({ status, t }) {
  const value = String(status || "").toLowerCase();
  let variant = "secondary";
  let label = status || "-";

  if (value === "1" || value === "active") {
    variant = "success";
    label = t("Active");
  } else if (value === "0" || value === "inactive") {
    variant = "danger";
    label = t("Inactive");
  }

  return <span className={`status-badge status-${variant}`}>{label}</span>;
}

function AppointmentStatusBadge({ status, t }) {
  const value = String(status || "").toLowerCase();
  let variant = "secondary";
  let label = status || "-";

  if (value === "completed") {
    variant = "success";
    label = t("Completed");
  } else if (value === "cancelled") {
    variant = "danger";
    label = t("Cancelled");
  } else if (value === "no_show") {
    variant = "danger";
    label = t("No Show");
  } else if (value === "scheduled") {
    variant = "warning";
    label = t("Scheduled");
  }

  return <span className={`status-badge status-${variant}`}>{label}</span>;
}

function RecordStatusBadge({ status, t }) {
  const value = String(status || "").toLowerCase();
  let variant = "secondary";
  let label = status || "-";

  if (value === "completed") {
    variant = "success";
    label = t("Completed");
  } else if (value === "planned") {
    variant = "warning";
    label = t("Planned");
  } else if (value === "in_progress") {
    variant = "info";
    label = t("In Progress");
  } else if (value === "cancelled") {
    variant = "danger";
    label = t("Cancelled");
  }

  return <span className={`status-badge status-${variant}`}>{label}</span>;
}

function PlanStatusBadge({ status, t }) {
  const value = String(status || "").toLowerCase();
  let variant = "secondary";
  let label = status || "-";

  if (value === "active") {
    variant = "warning";
    label = t("Active");
  } else if (value === "completed") {
    variant = "success";
    label = t("Completed");
  } else if (value === "cancelled") {
    variant = "danger";
    label = t("Cancelled");
  }

  return <span className={`status-badge status-${variant}`}>{label}</span>;
}

function InvoiceStatusBadge({ status, t }) {
  const value = String(status || "").toLowerCase();
  let variant = "secondary";
  let label = status || "-";

  if (value === "paid") {
    variant = "success";
    label = t("Paid");
  } else if (value === "partially_paid") {
    variant = "warning";
    label = t("Partially Paid");
  } else if (value === "unpaid") {
    variant = "danger";
    label = t("Unpaid");
  } else if (value === "cancelled") {
    variant = "danger";
    label = t("Cancelled");
  }

  return <span className={`status-badge status-${variant}`}>{label}</span>;
}

// DentalChart Component
function DentalChart({
  toothSurfacesMap,
  selectedTooth,
  onSelectTooth,
  t,
  notation,
  onNotationChange,
}) {
  const upperRight = UNIVERSAL_TEETH[0];
  const upperLeft = UNIVERSAL_TEETH[1];
  const lowerLeft = UNIVERSAL_TEETH[2];
  const lowerRight = UNIVERSAL_TEETH[3];

  return (
    <div className="dental-chart">
      <div className="chart-header">
        <div className="chart-note">
          {t("Each tooth shows surfaces: O/I, M, D, B/F, L/P")}
        </div>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          {/* ✅ أزرار تبديل الترميز */}
          <button
            className={`btn btn-sm ${notation === "universal" ? "btn-primary" : "btn-outline-secondary"}`}
            onClick={() => onNotationChange("universal")}
          >
            {t("Universal (1-32)")}
          </button>
          <button
            className={`btn btn-sm ${notation === "fdi" ? "btn-primary" : "btn-outline-secondary"}`}
            onClick={() => onNotationChange("fdi")}
          >
            {t("FDI (11-48)")}
          </button>
          {selectedTooth && (
            <button
              className="btn btn-sm btn-outline-secondary"
              onClick={() => onSelectTooth(null)}
            >
              <i className="fas fa-times me-1"></i>
              {t("Clear Selection")}
            </button>
          )}
        </div>
      </div>

      <div className="jaw-section">
        <div className="jaw-title">{t("Upper Jaw")}</div>
        <div className="teeth-row">
          {upperRight.map((tooth) => (
            <ToothCard
              key={tooth}
              tooth={tooth}
              surfaces={toothSurfacesMap[tooth] || {}}
              onSelect={onSelectTooth}
              isSelected={String(selectedTooth) === String(tooth)}
              t={t}
              notation={notation} // ✅ أضف هذا
            />
          ))}
          {upperLeft.map((tooth) => (
            <ToothCard
              key={tooth}
              tooth={tooth}
              surfaces={toothSurfacesMap[tooth] || {}}
              onSelect={onSelectTooth}
              isSelected={String(selectedTooth) === String(tooth)}
              t={t}
              notation={notation} // ✅ أضف هذا
            />
          ))}
        </div>
      </div>

      <div className="jaw-section">
        <div className="jaw-title">{t("Lower Jaw")}</div>
        <div className="teeth-row">
          {lowerLeft.map((tooth) => (
            <ToothCard
              key={tooth}
              tooth={tooth}
              surfaces={toothSurfacesMap[tooth] || {}}
              onSelect={onSelectTooth}
              isSelected={String(selectedTooth) === String(tooth)}
              t={t}
              notation={notation} // ✅ أضف هذا
            />
          ))}
          {lowerRight.map((tooth) => (
            <ToothCard
              key={tooth}
              tooth={tooth}
              surfaces={toothSurfacesMap[tooth] || {}}
              onSelect={onSelectTooth}
              isSelected={String(selectedTooth) === String(tooth)}
              t={t}
              notation={notation} // ✅ أضف هذا
            />
          ))}
        </div>
      </div>

      <div className="legend">
        <LegendItem label={t("Completed")} className="completed" />
        <LegendItem label={t("In Progress")} className="in-progress" />
        <LegendItem label={t("Planned")} className="planned" />
        <LegendItem label={t("No Data")} className="no-data" />
      </div>
    </div>
  );
}

function ToothCard({ tooth, surfaces, onSelect, isSelected, t, notation }) {
  const occlusal = surfaces.occlusal || surfaces.incisal || surfaces.general;
  const mesial = surfaces.mesial || surfaces.m;
  const distal = surfaces.distal || surfaces.d;
  const buccal = surfaces.buccal || surfaces.facial || surfaces.b || surfaces.f;
  const lingual =
    surfaces.lingual || surfaces.palatal || surfaces.l || surfaces.p;
  const displayNumber = notation === "fdi" ? universalToFDI(tooth) : tooth;

  const getSurfaceStatus = (record) => {
    if (!record) return "empty";
    const status = String(record.status || "").toLowerCase();
    if (status === "completed") return "completed";
    if (status === "in_progress") return "in_progress";
    if (status === "planned") return "planned";
    return "empty";
  };

  const getSurfaceClass = (status) => {
    if (status === "completed") return "surface-completed";
    if (status === "in_progress") return "surface-in-progress";
    if (status === "planned") return "surface-planned";
    return "surface-empty";
  };

  const getSurfaceLabel = (record, defaultLabel) => {
    if (!record) return defaultLabel;
    return defaultLabel;
  };

  const buildTooltip = () => {
    const entries = Object.entries(surfaces || {});
    if (!entries.length) return `${t("Tooth")} ${tooth}: ${t("No data")}`;
    const lines = entries.map(
      ([surface, record]) =>
        `${surface}: ${record?.procedure?.name || "-"} | ${record?.status || "-"}`,
    );
    return `${t("Tooth")} ${tooth}\n${lines.join("\n")}`;
  };

  return (
    <div
      className={`tooth-card ${isSelected ? "selected" : ""}`}
      onClick={() => onSelect(tooth)}
      title={buildTooltip()}
    >
      <div className="tooth-number">{displayNumber}</div>
      <div className="tooth-surfaces">
        <div className="surface-row top">
          <div className="surface-placeholder"></div>
          <div
            className={`surface-box ${getSurfaceClass(getSurfaceStatus(occlusal))}`}
          >
            {getSurfaceLabel(occlusal, "O/I")}
          </div>
          <div className="surface-placeholder"></div>
        </div>
        <div className="surface-row middle">
          <div
            className={`surface-box ${getSurfaceClass(getSurfaceStatus(mesial))}`}
          >
            {getSurfaceLabel(mesial, "M")}
          </div>
          <div
            className={`surface-box center ${getSurfaceClass(getSurfaceStatus(buccal))}`}
          >
            {getSurfaceLabel(buccal, "B/F")}
          </div>
          <div
            className={`surface-box ${getSurfaceClass(getSurfaceStatus(distal))}`}
          >
            {getSurfaceLabel(distal, "D")}
          </div>
        </div>
        <div className="surface-row bottom">
          <div className="surface-placeholder"></div>
          <div
            className={`surface-box ${getSurfaceClass(getSurfaceStatus(lingual))}`}
          >
            {getSurfaceLabel(lingual, "L/P")}
          </div>
          <div className="surface-placeholder"></div>
        </div>
      </div>
    </div>
  );
}

function LegendItem({ label, className }) {
  const classMap = {
    completed: "legend-completed",
    "in-progress": "legend-in-progress",
    planned: "legend-planned",
    "no-data": "legend-no-data",
  };
  return (
    <div className="legend-item">
      <span
        className={`legend-color ${classMap[className] || "legend-no-data"}`}
      ></span>
      <span>{label}</span>
    </div>
  );
}

// ToothDetails Component
function ToothDetails({
  tooth,
  records,
  procedures,
  treatmentPlans,
  recordForm,
  editingRecordId,
  onRecordChange,
  onSubmitRecord,
  onResetForm,
  onStartEdit,
  onDelete,
  deletingRecordId,
  savingRecord,
  recordError,
  recordSuccess,
  convertRecordId,
  convertForm,
  onConvertChange,
  onOpenConvert,
  onCloseConvert,
  onSubmitConvert,
  convertingRecordId,
  convertError,
  convertSuccess,
  getRecordPrimaryAction,
  getRecordMeta,
  t,
  formatCurrency,
}) {
  const surfaceOptions = [
    { value: "", label: t("Select surface") },
    { value: "occlusal", label: t("Occlusal") },
    { value: "incisal", label: t("Incisal") },
    { value: "mesial", label: t("Mesial") },
    { value: "distal", label: t("Distal") },
    { value: "buccal", label: t("Buccal") },
    { value: "facial", label: t("Facial") },
    { value: "lingual", label: t("Lingual") },
    { value: "palatal", label: t("Palatal") },
    { value: "general", label: t("General") },
  ];

  const statusOptions = [
    { value: "planned", label: t("Planned") },
    { value: "in_progress", label: t("In Progress") },
    { value: "completed", label: t("Completed") },
    { value: "cancelled", label: t("Cancelled") },
  ];

  return (
    <div className="tooth-details">
      {recordError && <div className="alert alert-danger">{recordError}</div>}
      {recordSuccess && (
        <div className="alert alert-success">{recordSuccess}</div>
      )}
      {convertError && <div className="alert alert-danger">{convertError}</div>}
      {convertSuccess && (
        <div className="alert alert-success">{convertSuccess}</div>
      )}

      {/* Add/Edit Form */}
      <div className="record-form-section">
        <div className="form-header">
          <h6>{editingRecordId ? t("Edit Record") : t("Add Record")}</h6>
          {editingRecordId && (
            <button
              className="btn btn-sm btn-outline-secondary"
              onClick={onResetForm}
            >
              {t("Cancel Edit")}
            </button>
          )}
        </div>

        <form onSubmit={onSubmitRecord}>
          <div className="form-row">
            <div className="form-field">
              <label>{t("Tooth")}</label>
              <input
                type="text"
                className="form-control"
                name="tooth_number"
                value={recordForm.tooth_number}
                onChange={onRecordChange}
                readOnly
              />
            </div>
            <div className="form-field">
              <label>{t("Surface")} *</label>
              <select
                className="form-select"
                name="surface"
                value={recordForm.surface}
                onChange={onRecordChange}
                required
              >
                {surfaceOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label>{t("Procedure")} *</label>
              <select
                className="form-select"
                name="procedure_id"
                value={recordForm.procedure_id}
                onChange={onRecordChange}
                required
              >
                <option value="">{t("Select procedure")}</option>
                {procedures.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label>{t("Status")}</label>
              <select
                className="form-select"
                name="status"
                value={recordForm.status}
                onChange={onRecordChange}
              >
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-field full-width">
              <label>{t("Notes")}</label>
              <textarea
                className="form-control"
                rows="2"
                name="notes"
                value={recordForm.notes}
                onChange={onRecordChange}
                placeholder={t("Optional notes...")}
              />
            </div>
            <div className="form-actions">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={savingRecord}
              >
                {savingRecord
                  ? t("Saving...")
                  : editingRecordId
                    ? t("Update Record")
                    : t("Add Record")}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Existing Records Table */}
      <div className="records-table-section">
        <h6>{t("Existing Records")}</h6>
        {records.length === 0 ? (
          <div className="text-muted">{t("No records for this tooth.")}</div>
        ) : (
          <div className="table-responsive">
            <table className="records-table">
              <thead>
                <tr>
                  <th>{t("Surface")}</th>
                  <th>{t("Procedure")}</th>
                  <th>{t("Status")}</th>
                  <th>{t("Notes")}</th>
                  <th>{t("Actions")}</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => {
                  const isConvertOpen = convertRecordId === r.id;
                  const primaryAction = getRecordPrimaryAction(r);
                  return (
                    <tr key={r.id}>
                      <td data-label={t("Surface")}>{r.surface || "-"}</td>
                      <td data-label={t("Procedure")}>
                        {r.procedure?.name || "-"}
                      </td>
                      <td data-label={t("Status")}>
                        <RecordStatusBadge status={r.status} t={t} />
                      </td>
                      <td data-label={t("Notes")}>{r.notes || "-"}</td>
                      <td data-label={t("Actions")}>
                        <div className="action-group">
                          {primaryAction.key === "convert" ? (
                            <button
                              className={primaryAction.className}
                              onClick={() => onOpenConvert(r)}
                            >
                              {primaryAction.label}
                            </button>
                          ) : (
                            <Link
                              to={primaryAction.to}
                              className={primaryAction.className}
                            >
                              {primaryAction.label}
                            </Link>
                          )}
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => onStartEdit(r)}
                          >
                            {t("Edit")}
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => onDelete(r.id)}
                            disabled={deletingRecordId === r.id}
                          >
                            {deletingRecordId === r.id
                              ? t("Deleting...")
                              : t("Delete")}
                          </button>
                        </div>
                        <div className="record-meta">{getRecordMeta(r)}</div>
                        {isConvertOpen && primaryAction.key === "convert" && (
                          <ConvertForm
                            convertForm={convertForm}
                            treatmentPlans={treatmentPlans}
                            onConvertChange={onConvertChange}
                            onSubmitConvert={() => onSubmitConvert(r.id)}
                            onCloseConvert={onCloseConvert}
                            convertingRecordId={convertingRecordId}
                            recordId={r.id}
                            t={t}
                            formatCurrency={formatCurrency}
                          />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ConvertForm Component
function ConvertForm({
  convertForm,
  treatmentPlans,
  onConvertChange,
  onSubmitConvert,
  onCloseConvert,
  convertingRecordId,
  recordId,
  t,
  formatCurrency,
}) {
  return (
    <div className="convert-form">
      <div className="convert-header">{t("Convert to Treatment Plan")}</div>
      <div className="convert-fields">
        <div className="convert-field">
          <label>{t("Treatment Plan")} *</label>
          <select
            className="form-select form-select-sm"
            name="treatment_plan_id"
            value={convertForm.treatment_plan_id}
            onChange={onConvertChange}
          >
            <option value="">{t("Select treatment plan")}</option>
            {treatmentPlans.map((plan) => (
              <option key={plan.id} value={plan.id}>
                {plan.title || `${t("Plan")} #${plan.id}`}
              </option>
            ))}
          </select>
        </div>
        <div className="convert-field">
          <label>{t("Price")}</label>
          <input
            type="number"
            min="0"
            step="0.01"
            className="form-control form-control-sm"
            name="price"
            placeholder={t("Optional price override")}
            value={convertForm.price}
            onChange={onConvertChange}
          />
        </div>
        <div className="convert-actions">
          <button
            className="btn btn-sm btn-success"
            onClick={onSubmitConvert}
            disabled={convertingRecordId === recordId}
          >
            {convertingRecordId === recordId
              ? t("Converting...")
              : t("Confirm")}
          </button>
          <button
            className="btn btn-sm btn-outline-secondary"
            onClick={onCloseConvert}
            disabled={convertingRecordId === recordId}
          >
            {t("Cancel")}
          </button>
        </div>
      </div>
    </div>
  );
}

// Radiology Tabs Component
function RadiologyTabs({ patientId, selectedTooth, dentalRecords }) {
  // ✅ استقبل الخواص الجديدة
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState("gallery");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleUploadSuccess = () => {
    setRefreshTrigger((prev) => prev + 1);
    setActiveTab("gallery");
  };

  // ✅ تحديد dentalRecordId المناسب
  let activeDentalRecordId = null;
  if (selectedTooth && dentalRecords) {
    const matchingRecords = dentalRecords.filter(
      (r) =>
        String(r.tooth_number || "").trim() === String(selectedTooth).trim(),
    );
    // إذا وُجد سجل واحد فقط لهذا السن، استخدم معرفه تلقائيًا
    if (matchingRecords.length === 1) {
      activeDentalRecordId = matchingRecords[0].id;
    }
  }

  return (
    <div className="radiology-tabs">
      <div className="radiology-tabs-header">
        <button
          className={`tab-btn ${activeTab === "gallery" ? "active" : ""}`}
          onClick={() => setActiveTab("gallery")}
        >
          <i className="fas fa-images me-2"></i>
          {t("Image Gallery")}
        </button>
        <button
          className={`tab-btn ${activeTab === "upload" ? "active" : ""}`}
          onClick={() => setActiveTab("upload")}
        >
          <i className="fas fa-upload me-2"></i>
          {t("Upload New")}
        </button>
      </div>

      <div className="radiology-tabs-content">
        {activeTab === "gallery" && (
          <RadiologyGallery
            patientId={patientId}
            refreshTrigger={refreshTrigger}
          />
        )}
        {activeTab === "upload" && (
          <RadiologyUploader
            patientId={patientId}
            onUploadSuccess={handleUploadSuccess}
            dentalRecordId={activeDentalRecordId} // ✅ تمريره تلقائيًا
          />
        )}
      </div>
    </div>
  );
}

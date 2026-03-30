import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import axios from "../../../services/axios";
import { useTranslation } from "react-i18next";
import "./DentalRecordsListPage.css";

export default function DentalRecordsListPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const highlightRecordId = searchParams.get("record_id") || "";

  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [plans, setPlans] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [openConvertId, setOpenConvertId] = useState(null);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const [converting, setConverting] = useState(false);

  useEffect(() => {
    loadRecordsAndPlans();
  }, []);

  const loadRecordsAndPlans = async () => {
    try {
      setLoading(true);
      setError("");
      setActionMessage("");
      setActionError("");

      const [recordsRes, plansRes] = await Promise.all([
        axios.get("/erp/dental-records"),
        axios.get("/erp/treatment-plans"),
      ]);

      const recordsPayload = recordsRes.data || {};
      const plansPayload = plansRes.data || {};

      const recordRows = Array.isArray(recordsPayload.data)
        ? recordsPayload.data
        : recordsPayload.data?.data || [];

      const planRows = Array.isArray(plansPayload.data)
        ? plansPayload.data
        : plansPayload.data?.data || [];

      setRows(recordRows);
      setMeta(recordsPayload.meta || recordsPayload.data?.meta || null);
      setPlans(planRows);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.msg ||
          t("Failed to load dental records."),
      );
    } finally {
      setLoading(false);
    }
  };

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();

    const result = rows.filter((item) => {
      const recordId = String(item.id || "").toLowerCase();
      const patientName = String(item.customer?.name || "").toLowerCase();
      const patientEmail = String(item.customer?.email || "").toLowerCase();
      const procedureName = String(item.procedure?.name || "").toLowerCase();
      const tooth = String(item.tooth_number || "").toLowerCase();
      const surface = String(item.surface || "").toLowerCase();
      const status = String(item.status || "").toLowerCase();
      const notes = String(item.notes || "").toLowerCase();

      return (
        recordId.includes(q) ||
        patientName.includes(q) ||
        patientEmail.includes(q) ||
        procedureName.includes(q) ||
        tooth.includes(q) ||
        surface.includes(q) ||
        status.includes(q) ||
        notes.includes(q)
      );
    });

    if (!highlightRecordId) return result;

    return [...result].sort((a, b) => {
      const aHighlighted = String(a.id) === String(highlightRecordId) ? 1 : 0;
      const bHighlighted = String(b.id) === String(highlightRecordId) ? 1 : 0;

      if (aHighlighted !== bHighlighted) {
        return bHighlighted - aHighlighted;
      }

      return Number(b.id || 0) - Number(a.id || 0);
    });
  }, [rows, search, highlightRecordId]);

  const openConvert = (record) => {
    setOpenConvertId(record.id);
    setSelectedPlanId("");
    setActionMessage("");
    setActionError("");
  };

  const closeConvert = () => {
    setOpenConvertId(null);
    setSelectedPlanId("");
    setActionMessage("");
    setActionError("");
  };

  const availablePlansForRecord = (record) => {
    return plans.filter(
      (plan) => String(plan.customer_id) === String(record.customer?.id),
    );
  };

  const convertRecord = async (recordId) => {
    try {
      if (!selectedPlanId) {
        setActionError(t("Please select a treatment plan first."));
        return;
      }

      setConverting(true);
      setActionMessage("");
      setActionError("");

      await axios.post(
        `/erp/dental-records/${recordId}/to-treatment-plan-item`,
        {
          treatment_plan_id: Number(selectedPlanId),
        },
      );

      navigate(`/admin/erp/treatment-plans/${selectedPlanId}`);
      return;
    } catch (err) {
      const errors = err?.response?.data?.errors;
      if (errors) {
        const firstError = Object.values(errors)?.[0]?.[0];
        setActionError(firstError || t("Failed to convert dental record."));
      } else {
        setActionError(
          err?.response?.data?.message ||
            err?.response?.data?.msg ||
            t("Failed to convert dental record."),
        );
      }
    } finally {
      setConverting(false);
    }
  };

  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "320px" }}
      >
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">{t("Loading...")}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="dental-records-page">
      {/* Header Section */}
      <div className="page-header">
        <div className="header-text">
          <h1 className="page-title">{t("Dental Records")}</h1>
          <p className="page-subtitle">
            {t("Review patient chart records, procedures, teeth, and statuses")}
          </p>
        </div>

        <div className="header-actions">
          <Link
            to="/admin/erp/dental-records/create"
            className="btn btn-outline-primary"
          >
            <i className="fas fa-tooth me-2"></i>
            {t("Create Dental Record")}
          </Link>

          <button className="btn btn-primary" onClick={loadRecordsAndPlans}>
            <i className="fas fa-sync-alt me-2"></i>
            {t("Refresh")}
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="alert alert-danger alert-dismissible fade show">
          <i className="fas fa-exclamation-circle me-2"></i>
          {error}
          <button
            type="button"
            className="btn-close"
            onClick={() => setError("")}
          ></button>
        </div>
      )}

      {actionMessage && (
        <div className="alert alert-success alert-dismissible fade show">
          <i className="fas fa-check-circle me-2"></i>
          {actionMessage}
          <button
            type="button"
            className="btn-close"
            onClick={() => setActionMessage("")}
          ></button>
        </div>
      )}

      {actionError && (
        <div className="alert alert-danger alert-dismissible fade show">
          <i className="fas fa-exclamation-triangle me-2"></i>
          {actionError}
          <button
            type="button"
            className="btn-close"
            onClick={() => setActionError("")}
          ></button>
        </div>
      )}

      {/* Search Card */}
      <div className="search-card">
        <div className="search-card-header">
          <i className="fas fa-search me-2"></i>
          <h5 className="mb-0">{t("Search Records")}</h5>
        </div>
        <div className="search-card-body">
          <div className="search-grid">
            <div className="search-group">
              <label className="search-label">
                <i className="fas fa-filter me-1"></i>
                {t("Search")}
              </label>
              <input
                type="text"
                className="form-control"
                placeholder={t(
                  "Patient, procedure, tooth, surface, status, notes...",
                )}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="search-group">
              <label className="search-label">
                <i className="fas fa-database me-1"></i>
                {t("Total Records")}
              </label>
              <div className="total-badge">{meta?.total ?? rows.length}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Records Table Card */}
      <div className="records-card">
        <div className="records-card-header">
          <i className="fas fa-list me-2"></i>
          <h5 className="mb-0">{t("Dental Records List")}</h5>
          <span className="record-count">
            {filteredRows.length} {t("records")}
          </span>
        </div>

        <div className="records-card-body">
          {filteredRows.length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-tooth empty-icon"></i>
              <p className="empty-text">{t("No dental records found.")}</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="records-table">
                <thead>
                  <tr>
                    <th>{t("Patient")}</th>
                    <th>{t("Procedure")}</th>
                    <th>{t("Tooth")}</th>
                    <th>{t("Surface")}</th>
                    <th>{t("Status")}</th>
                    <th>{t("Notes")}</th>
                    <th>{t("Actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((record) => {
                    const matchingPlans = availablePlansForRecord(record);
                    const isHighlighted =
                      String(record.id) === String(highlightRecordId);

                    return (
                      <>
                        <tr
                          key={record.id}
                          className={isHighlighted ? "highlighted-row" : ""}
                        >
                          <td data-label={t("Patient")}>
                            <div className="patient-info">
                              <div className="patient-name">
                                {record.customer?.name || "-"}
                              </div>
                              <div className="patient-email">
                                {record.customer?.email || "-"}
                              </div>
                            </div>
                          </td>
                          <td data-label={t("Procedure")}>
                            {record.procedure?.name || "-"}
                          </td>
                          <td data-label={t("Tooth")}>
                            {record.tooth_number || "-"}
                          </td>
                          <td data-label={t("Surface")}>
                            {record.surface || "-"}
                          </td>
                          <td data-label={t("Status")}>
                            <StatusBadge status={record.status} t={t} />
                          </td>
                          <td data-label={t("Notes")} className="notes-cell">
                            {record.notes || "-"}
                          </td>
                          <td data-label={t("Actions")}>
                            <div className="action-buttons">
                              {record.customer?.id && (
                                <>
                                  <Link
                                    to={`/admin/erp/patients/${record.customer.id}/profile`}
                                    className="btn btn-sm btn-outline-primary"
                                    title={t("View Patient")}
                                  >
                                    <i className="fas fa-user"></i>
                                    <span>{t("Patient")}</span>
                                  </Link>

                                  <Link
                                    to={`/admin/erp/patients/${record.customer.id}/timeline`}
                                    className="btn btn-sm btn-outline-info"
                                    title={t("View Timeline")}
                                  >
                                    <i className="fas fa-history"></i>
                                    <span>{t("Timeline")}</span>
                                  </Link>
                                </>
                              )}

                              <button
                                className="btn btn-sm btn-outline-success"
                                onClick={() => openConvert(record)}
                                title={t("Convert to Treatment Plan")}
                              >
                                <i className="fas fa-exchange-alt"></i>
                                <span>{t("Convert")}</span>
                              </button>
                            </div>
                          </td>
                        </tr>

                        {openConvertId === record.id && (
                          <tr className="convert-row">
                            <td colSpan="7">
                              <div className="convert-form">
                                <div className="convert-header">
                                  <i className="fas fa-exchange-alt me-2"></i>
                                  <strong>
                                    {t("Convert to Treatment Plan")}
                                  </strong>
                                </div>

                                <div className="convert-fields">
                                  <div className="convert-field">
                                    <label>{t("Select Treatment Plan")}</label>
                                    <select
                                      className="form-select"
                                      value={selectedPlanId}
                                      onChange={(e) =>
                                        setSelectedPlanId(e.target.value)
                                      }
                                    >
                                      <option value="">
                                        {t("Select plan")}
                                      </option>
                                      {matchingPlans.map((plan) => (
                                        <option key={plan.id} value={plan.id}>
                                          {plan.title} - {t(plan.status || "-")}
                                        </option>
                                      ))}
                                    </select>
                                    {matchingPlans.length === 0 && (
                                      <div className="form-hint error">
                                        <i className="fas fa-exclamation-triangle me-1"></i>
                                        {t(
                                          "No treatment plans found for this patient.",
                                        )}
                                      </div>
                                    )}
                                  </div>

                                  <div className="convert-actions">
                                    <button
                                      className="btn btn-success"
                                      onClick={() => convertRecord(record.id)}
                                      disabled={
                                        converting || matchingPlans.length === 0
                                      }
                                    >
                                      {converting ? (
                                        <>
                                          <span className="spinner-border spinner-border-sm me-2"></span>
                                          {t("Converting...")}
                                        </>
                                      ) : (
                                        <>
                                          <i className="fas fa-check me-2"></i>
                                          {t("Confirm Convert")}
                                        </>
                                      )}
                                    </button>

                                    <button
                                      className="btn btn-outline-secondary"
                                      onClick={closeConvert}
                                      type="button"
                                    >
                                      <i className="fas fa-times me-2"></i>
                                      {t("Cancel")}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// StatusBadge Component
function StatusBadge({ status, t }) {
  const value = String(status || "").toLowerCase();
  let variant = "secondary";
  let label = status || "-";

  if (value === "completed") {
    variant = "success";
    label = t("Completed");
  } else if (value === "cancelled") {
    variant = "danger";
    label = t("Cancelled");
  } else if (value === "planned") {
    variant = "warning";
    label = t("Planned");
  } else if (value === "in_progress") {
    variant = "info";
    label = t("In Progress");
  }

  return <span className={`status-badge status-${variant}`}>{label}</span>;
}

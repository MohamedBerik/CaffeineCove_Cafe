import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "../../../services/axios";
import { useTranslation } from "react-i18next";

const SURFACE_OPTIONS = [
  { value: "", labelKey: "Select surface" },
  { value: "occlusal", labelKey: "Occlusal" },
  { value: "incisal", labelKey: "Incisal" },
  { value: "mesial", labelKey: "Mesial" },
  { value: "distal", labelKey: "Distal" },
  { value: "buccal", labelKey: "Buccal" },
  { value: "facial", labelKey: "Facial" },
  { value: "lingual", labelKey: "Lingual" },
  { value: "palatal", labelKey: "Palatal" },
  { value: "general", labelKey: "General" },
];

export default function TreatmentPlanDetailsPage() {
  const { t, i18n } = useTranslation();
  const { id } = useParams();

  const [plan, setPlan] = useState(null);
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState(null);
  const [cashSummary, setCashSummary] = useState(null);
  const [procedures, setProcedures] = useState([]);
  const [doctors, setDoctors] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [itemForm, setItemForm] = useState({
    procedure_id: "",
    tooth_number: "",
    surface: "",
    notes: "",
    price: "",
    planned_sessions: 1,
  });

  const [savingItem, setSavingItem] = useState(false);
  const [deletingItemId, setDeletingItemId] = useState(null);

  const [itemError, setItemError] = useState("");
  const [itemSuccess, setItemSuccess] = useState("");

  const [openStartItemId, setOpenStartItemId] = useState(null);
  const [startingItemId, setStartingItemId] = useState(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotError, setSlotError] = useState("");
  const [availableSlots, setAvailableSlots] = useState([]);

  const [startForm, setStartForm] = useState({
    doctor_id: "",
    appointment_date: "",
    appointment_time: "",
    notes: "",
  });

  useEffect(() => {
    loadAll();
  }, [id]);

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

  const loadAll = async (options = {}) => {
    const { keepMessages = false } = options;

    try {
      setLoading(true);
      setError("");

      if (!keepMessages) {
        setItemError("");
        setItemSuccess("");
      }

      const [
        planRes,
        itemsRes,
        summaryRes,
        cashRes,
        proceduresRes,
        doctorsRes,
      ] = await Promise.all([
        axios.get(`/erp/treatment-plans/${id}`),
        axios.get(`/erp/treatment-plans/${id}/items`),
        axios.get(`/erp/treatment-plans/${id}/summary`),
        axios.get(`/erp/treatment-plans/${id}/cash-summary`),
        axios.get(`/erp/procedures`),
        axios.get(`/erp/doctors`),
      ]);

      setPlan(planRes.data?.data || planRes.data || null);
      setItems(itemsRes.data?.data || []);
      setSummary(summaryRes.data?.data || null);
      setCashSummary(cashRes.data?.data || null);

      const proceduresPayload = proceduresRes.data || {};
      const proceduresRows = Array.isArray(proceduresPayload.data)
        ? proceduresPayload.data
        : proceduresPayload.data?.data || [];
      setProcedures(proceduresRows);

      const doctorsPayload = doctorsRes.data || {};
      const doctorRows = Array.isArray(doctorsPayload.data)
        ? doctorsPayload.data
        : doctorsPayload.data?.data || [];
      setDoctors(doctorRows);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.msg ||
          t("Failed to load treatment plan details."),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleItemChange = (e) => {
    const { name, value } = e.target;

    if (name === "procedure_id") {
      const selectedProcedure = procedures.find(
        (p) => String(p.id) === String(value),
      );

      setItemForm((prev) => ({
        ...prev,
        procedure_id: value,
        price:
          prev.price !== ""
            ? prev.price
            : selectedProcedure?.default_price != null
              ? String(selectedProcedure.default_price)
              : "",
      }));
      return;
    }

    setItemForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const addItem = async (e) => {
    e.preventDefault();

    try {
      setSavingItem(true);
      setItemError("");
      setItemSuccess("");

      const payload = {
        procedure_id: Number(itemForm.procedure_id),
        tooth_number: itemForm.tooth_number || null,
        surface: itemForm.surface || null,
        notes: itemForm.notes || null,
        planned_sessions: Math.max(Number(itemForm.planned_sessions || 1), 1),
      };

      if (itemForm.price !== "") {
        payload.price = Number(itemForm.price);
      }

      await axios.post(`/erp/treatment-plans/${id}/items`, payload);

      setItemSuccess(t("Item added successfully."));

      setItemForm({
        procedure_id: "",
        tooth_number: "",
        surface: "",
        notes: "",
        price: "",
        planned_sessions: 1,
      });

      await loadAll({ keepMessages: true });
    } catch (err) {
      const errors = err?.response?.data?.errors;
      if (errors) {
        const firstError = Object.values(errors)?.[0]?.[0];
        setItemError(firstError || t("Failed to add item."));
      } else {
        setItemError(
          err?.response?.data?.message ||
            err?.response?.data?.msg ||
            t("Failed to add item."),
        );
      }
    } finally {
      setSavingItem(false);
    }
  };

  const deleteItem = async (itemId) => {
    const confirmed = window.confirm(t("Delete this item?"));
    if (!confirmed) return;

    try {
      setDeletingItemId(itemId);
      setItemError("");
      setItemSuccess("");

      await axios.delete(`/erp/treatment-plan-items/${itemId}`);

      setItemSuccess(t("Item deleted successfully."));
      await loadAll({ keepMessages: true });
    } catch (err) {
      setItemError(
        err?.response?.data?.message ||
          err?.response?.data?.msg ||
          t("Failed to delete item."),
      );
    } finally {
      setDeletingItemId(null);
    }
  };

  const openStartForm = (item) => {
    setItemError("");
    setItemSuccess("");
    setSlotError("");
    setAvailableSlots([]);
    setOpenStartItemId(item.id);

    const today = new Date().toISOString().slice(0, 10);

    setStartForm({
      doctor_id: "",
      appointment_date: today,
      appointment_time: "",
      notes: item.notes || "",
    });
  };

  const closeStartForm = () => {
    setOpenStartItemId(null);
    setSlotError("");
    setAvailableSlots([]);
    setStartForm({
      doctor_id: "",
      appointment_date: "",
      appointment_time: "",
      notes: "",
    });
  };

  const loadSlots = async () => {
    try {
      setLoadingSlots(true);
      setSlotError("");
      setAvailableSlots([]);
      setStartForm((prev) => ({
        ...prev,
        appointment_time: "",
      }));

      if (!startForm.doctor_id || !startForm.appointment_date) {
        setSlotError(t("Please select doctor and date first."));
        return;
      }

      const res = await axios.get("/erp/appointments/available-slots", {
        params: {
          doctor_id: startForm.doctor_id,
          date: startForm.appointment_date,
        },
      });

      const payload = res.data || {};
      const slotRows = Array.isArray(payload.data)
        ? payload.data
        : payload.data?.slots || payload.data || [];

      setAvailableSlots(Array.isArray(slotRows) ? slotRows : []);
    } catch (err) {
      setSlotError(
        err?.response?.data?.message ||
          err?.response?.data?.msg ||
          t("Failed to load available slots."),
      );
    } finally {
      setLoadingSlots(false);
    }
  };

  const startProcedure = async (itemId) => {
    try {
      setStartingItemId(itemId);
      setItemError("");
      setItemSuccess("");
      setSlotError("");

      const payload = {
        appointment_date: startForm.appointment_date,
        appointment_time: startForm.appointment_time,
        notes: startForm.notes || null,
      };

      if (startForm.doctor_id) {
        payload.doctor_id = Number(startForm.doctor_id);
      }

      await axios.post(`/erp/treatment-plan-items/${itemId}/start`, payload);

      setItemSuccess(t("Procedure started successfully."));
      closeStartForm();
      await loadAll({ keepMessages: true });
    } catch (err) {
      const errors = err?.response?.data?.errors;
      if (errors) {
        const firstError = Object.values(errors)?.[0]?.[0];
        setItemError(firstError || t("Failed to start procedure."));
      } else {
        setItemError(
          err?.response?.data?.message ||
            err?.response?.data?.msg ||
            t("Failed to start procedure."),
        );
      }
    } finally {
      setStartingItemId(null);
    }
  };

  const normalizeSlots = (slots) => {
    return slots.map((slot) => {
      if (typeof slot === "string") {
        return { value: slot, label: slot, available: true };
      }

      return {
        value: slot.time || slot.value || "",
        label: slot.time || slot.label || slot.value || "",
        available: slot.available ?? true,
      };
    });
  };

  const normalizedSlots = useMemo(
    () => normalizeSlots(availableSlots),
    [availableSlots],
  );

  const getCompletedSessions = (item) => Number(item.completed_sessions || 0);

  const getPlannedSessions = (item) =>
    Math.max(Number(item.planned_sessions || 1), 1);

  const getRemainingSessions = (item) =>
    Math.max(getPlannedSessions(item) - getCompletedSessions(item), 0);

  const getProgress = (item) => {
    const planned = getPlannedSessions(item);
    const completed = getCompletedSessions(item);

    return Math.min(Math.max(Math.round((completed / planned) * 100), 0), 100);
  };

  const getUiProcedureStatus = (item) => {
    const rawStatus = String(item.status || "planned").toLowerCase();
    const completed = getCompletedSessions(item);
    const planned = getPlannedSessions(item);

    if (rawStatus === "cancelled") return "cancelled";
    if (completed >= planned) return "completed";
    if (rawStatus === "in_progress") return "in_progress";
    if (completed > 0) return "in_progress";
    return "not_started";
  };

  const getStatusLabel = (item) => {
    const status = getUiProcedureStatus(item);
    const statusMap = {
      completed: t("Completed"),
      in_progress: t("In Progress"),
      cancelled: t("Cancelled"),
      not_started: t("Not Started"),
    };
    return statusMap[status] || t("Not Started");
  };

  const getStatusClass = (item) => {
    const status = getUiProcedureStatus(item);
    const classMap = {
      completed: "success",
      in_progress: "info",
      cancelled: "danger",
      not_started: "warning",
    };
    return classMap[status] || "secondary";
  };

  const canStartProcedure = (item) => {
    const uiStatus = getUiProcedureStatus(item);
    const remaining = getRemainingSessions(item);

    if (remaining <= 0) return false;
    if (uiStatus === "in_progress" && item.appointment_id) return false;

    return true;
  };

  const canOpenAppointment = (item) => {
    return !!item.appointment_id;
  };

  const getStartButtonLabel = (item) => {
    const completed = getCompletedSessions(item);
    return completed > 0 ? t("Next Session") : t("Start Procedure");
  };

  const totalPlanned = items.reduce(
    (sum, i) => sum + Number(i.planned_sessions || 0),
    0,
  );

  const totalCompleted = items.reduce(
    (sum, i) => sum + Number(i.completed_sessions || 0),
    0,
  );

  const totalProgress =
    totalPlanned > 0 ? Math.round((totalCompleted / totalPlanned) * 100) : 0;

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

  if (error) {
    return (
      <div className="alert alert-danger d-flex justify-content-between align-items-center">
        <span>{error}</span>
        <button className="btn btn-sm btn-outline-danger" onClick={loadAll}>
          {t("Retry")}
        </button>
      </div>
    );
  }

  const planData = plan || {};
  const customer = planData.customer || {};
  const invoices = summary?.invoices || [];
  const totals = summary?.totals || {};
  const cash = cashSummary?.cash || {};
  const credit = cashSummary?.customer_credit_balance || {};

  return (
    <div className="treatment-plan-details-page">
      {/* Header Section */}
      <div className="page-header">
        <div className="header-text">
          <h1 className="page-title">{t("Treatment Plan Details")}</h1>
          <p className="page-subtitle">
            {t("Review plan items, progress, invoices, and cash flow")}
          </p>
        </div>

        <div className="header-actions">
          <Link
            to="/admin/erp/treatment-plans"
            className="btn btn-outline-secondary"
          >
            <i className="fas fa-arrow-left me-2"></i>
            {t("Back to Plans")}
          </Link>

          {customer.id && (
            <Link
              to={`/admin/erp/patients/${customer.id}/profile`}
              className="btn btn-outline-primary"
            >
              <i className="fas fa-user me-2"></i>
              {t("Patient Profile")}
            </Link>
          )}

          <button className="btn btn-primary" onClick={loadAll}>
            <i className="fas fa-sync-alt me-2"></i>
            {t("Refresh")}
          </button>
        </div>
      </div>

      {/* Plan Info Card */}
      <div className="info-card">
        <div className="info-card-header">
          <i className="fas fa-info-circle me-2"></i>
          <h5 className="mb-0">{t("Plan Information")}</h5>
        </div>
        <div className="info-card-body">
          <div className="details-grid">
            <InfoItem label={t("Title")} value={planData.title} />
            <InfoItem label={t("Patient")} value={customer.name} />
            <InfoItem label={t("Email")} value={customer.email} />
            <InfoItem
              label={t("Status")}
              value={<StatusBadge status={planData.status} t={t} />}
            />
            <InfoItem
              label={t("Total Cost")}
              value={formatCurrency(planData.total_cost)}
            />
            <InfoItem
              label={t("Created")}
              value={formatDate(planData.created_at)}
            />
            <div className="info-item full-width">
              <div className="info-label">{t("Notes")}</div>
              <div className="info-value">{planData.notes || "-"}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Card */}
      <div className="progress-card">
        <div className="progress-header">
          <span className="progress-title">{t("Treatment Progress")}</span>
          <span className="progress-percentage">{totalProgress}%</span>
        </div>
        <div className="progress-bar-container">
          <div
            className="progress-bar-fill"
            style={{ width: `${totalProgress}%` }}
          />
        </div>
        <div className="progress-stats">
          {t("{{completed}} / {{planned}} sessions completed", {
            completed: totalCompleted,
            planned: totalPlanned,
          })}
        </div>
      </div>

      {/* KPI Grid */}
      <div className="kpi-grid">
        <KpiCard
          title={t("Total Invoiced")}
          value={formatCurrency(totals.total_invoiced)}
          color="primary"
        />
        <KpiCard
          title={t("Direct Paid")}
          value={formatCurrency(totals.direct_paid)}
          color="success"
        />
        <KpiCard
          title={t("Credit Applied")}
          value={formatCurrency(totals.credit_applied)}
          color="secondary"
        />
        <KpiCard
          title={t("Total Paid")}
          value={formatCurrency(totals.total_paid)}
          color="success"
        />
        <KpiCard
          title={t("Total Refunded")}
          value={formatCurrency(totals.total_refunded)}
          color="danger"
        />
        <KpiCard
          title={t("Net Paid")}
          value={formatCurrency(totals.net_paid)}
          color="info"
        />
        <KpiCard
          title={t("Remaining")}
          value={formatCurrency(totals.remaining_on_plan)}
          color="warning"
        />
        <KpiCard
          title={t("Cash In")}
          value={formatCurrency(cash.cash_in)}
          color="success"
        />
        <KpiCard
          title={t("Net Cash")}
          value={formatCurrency(cash.net_cash)}
          color="dark"
        />
        <KpiCard
          title={t("Customer Credit")}
          value={formatCurrency(credit.net_credit)}
          color="secondary"
        />
      </div>

      <div className="two-columns">
        {/* Add Item Form */}
        <div className="add-item-card">
          <div className="card-header-custom">
            <i className="fas fa-plus-circle me-2"></i>
            <h5 className="mb-0">{t("Add Plan Item")}</h5>
          </div>

          <div className="card-body-custom">
            {itemError && <div className="alert alert-danger">{itemError}</div>}
            {itemSuccess && (
              <div className="alert alert-success">{itemSuccess}</div>
            )}

            <form onSubmit={addItem}>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">{t("Procedure")} *</label>
                  <select
                    className="form-select"
                    name="procedure_id"
                    value={itemForm.procedure_id}
                    onChange={handleItemChange}
                    required
                  >
                    <option value="">{t("Select procedure")}</option>
                    {procedures.map((procedure) => (
                      <option key={procedure.id} value={procedure.id}>
                        {procedure.name}
                        {procedure.default_price != null
                          ? ` (${formatCurrency(procedure.default_price)})`
                          : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">{t("Tooth")}</label>
                  <input
                    type="text"
                    className="form-control"
                    name="tooth_number"
                    value={itemForm.tooth_number}
                    onChange={handleItemChange}
                    placeholder={t("e.g., 16, 24, 36")}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{t("Surface")}</label>
                  <select
                    className="form-select"
                    name="surface"
                    value={itemForm.surface}
                    onChange={handleItemChange}
                  >
                    {SURFACE_OPTIONS.map((option) => (
                      <option
                        key={option.value || "empty"}
                        value={option.value}
                      >
                        {t(option.labelKey)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">{t("Price")}</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="form-control"
                    name="price"
                    value={itemForm.price}
                    onChange={handleItemChange}
                    placeholder={t("Optional")}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{t("Sessions")}</label>
                  <input
                    type="number"
                    min="1"
                    className="form-control"
                    name="planned_sessions"
                    value={itemForm.planned_sessions}
                    onChange={handleItemChange}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{t("Add")}</label>
                  <button
                    type="submit"
                    className="btn btn-primary w-100"
                    disabled={savingItem}
                  >
                    {savingItem ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        {t("Adding...")}
                      </>
                    ) : (
                      <>
                        <i className="fas fa-plus me-2"></i>
                        {t("Add Item")}
                      </>
                    )}
                  </button>
                </div>

                <div className="form-group full-width">
                  <label className="form-label">{t("Notes")}</label>
                  <textarea
                    className="form-control"
                    rows="2"
                    name="notes"
                    value={itemForm.notes}
                    onChange={handleItemChange}
                    placeholder={t("Optional notes...")}
                  />
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Plan Items Table */}
        <div className="items-card">
          <div className="card-header-custom">
            <i className="fas fa-list-ul me-2"></i>
            <h5 className="mb-0">{t("Plan Items")}</h5>
            <span className="item-count">
              {items.length} {t("items")}
            </span>
          </div>

          <div className="card-body-custom">
            {items.length === 0 ? (
              <div className="empty-state">
                <i className="fas fa-inbox empty-icon"></i>
                <p className="empty-text">{t("No items found.")}</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="items-table">
                  <thead>
                    <tr>
                      <th>{t("Procedure")}</th>
                      <th>{t("Tooth")}</th>
                      <th>{t("Surface")}</th>
                      <th>{t("Price")}</th>
                      <th>{t("Sessions")}</th>
                      <th>{t("Remaining")}</th>
                      <th>{t("Progress")}</th>
                      <th>{t("Status")}</th>
                      <th>{t("Notes")}</th>
                      <th>{t("Actions")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => {
                      const isStartOpen = openStartItemId === item.id;

                      return (
                        <FragmentRow
                          key={item.id}
                          row={
                            <tr>
                              <td data-label={t("Procedure")}>
                                <div className="procedure-name">
                                  {item.procedureRef?.name ||
                                    item.procedure ||
                                    "-"}
                                </div>
                              </td>
                              <td data-label={t("Tooth")}>
                                {item.tooth_number || "-"}
                              </td>
                              <td data-label={t("Surface")}>
                                {item.surface || "-"}
                              </td>
                              <td
                                data-label={t("Price")}
                                className="amount-cell"
                              >
                                {formatCurrency(item.price)}
                              </td>
                              <td data-label={t("Sessions")}>
                                <span className="sessions-badge">
                                  {getCompletedSessions(item)}/
                                  {getPlannedSessions(item)}
                                </span>
                              </td>
                              <td data-label={t("Remaining")}>
                                {getRemainingSessions(item)}
                              </td>
                              <td data-label={t("Progress")}>
                                <div className="progress-mini">
                                  <div
                                    className="progress-mini-bar"
                                    style={{ width: `${getProgress(item)}%` }}
                                  />
                                  <span className="progress-mini-text">
                                    {getProgress(item)}%
                                  </span>
                                </div>
                              </td>
                              <td data-label={t("Status")}>
                                <span
                                  className={`status-badge status-${getStatusClass(item)}`}
                                >
                                  {getStatusLabel(item)}
                                </span>
                              </td>
                              <td
                                data-label={t("Notes")}
                                className="notes-cell"
                              >
                                {item.notes || "-"}
                              </td>
                              <td data-label={t("Actions")}>
                                <div className="action-buttons">
                                  {canStartProcedure(item) && (
                                    <button
                                      className="btn btn-sm btn-outline-success"
                                      onClick={() => openStartForm(item)}
                                      title={getStartButtonLabel(item)}
                                    >
                                      <i className="fas fa-play"></i>
                                      <span>{getStartButtonLabel(item)}</span>
                                    </button>
                                  )}

                                  {canOpenAppointment(item) && (
                                    <Link
                                      to={`/admin/erp/appointments/${item.appointment_id}/activity`}
                                      className="btn btn-sm btn-outline-primary"
                                      title={t("Open Appointment")}
                                    >
                                      <i className="fas fa-calendar-alt"></i>
                                      <span>{t("Appointment")}</span>
                                    </Link>
                                  )}

                                  <button
                                    className="btn btn-sm btn-outline-danger"
                                    onClick={() => deleteItem(item.id)}
                                    disabled={deletingItemId === item.id}
                                    title={t("Delete")}
                                  >
                                    <i className="fas fa-trash"></i>
                                    <span>{t("Delete")}</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          }
                          extraRow={
                            isStartOpen ? (
                              <tr className="start-row">
                                <td colSpan="10">
                                  <div className="start-form">
                                    <div className="start-form-header">
                                      <i className="fas fa-calendar-plus me-2"></i>
                                      <strong>
                                        {getCompletedSessions(item) > 0
                                          ? t("Start Next Session")
                                          : t("Start Procedure")}
                                      </strong>
                                    </div>

                                    <div className="start-form-info">
                                      <i className="fas fa-info-circle me-2"></i>
                                      {t(
                                        "This will create a treatment appointment for this plan item. When that appointment is completed, one session will be billed and the completed sessions count will be increased.",
                                      )}
                                    </div>

                                    <div className="start-form-grid">
                                      <div className="start-field">
                                        <label>{t("Doctor")}</label>
                                        <select
                                          className="form-select"
                                          value={startForm.doctor_id}
                                          onChange={(e) => {
                                            setStartForm((prev) => ({
                                              ...prev,
                                              doctor_id: e.target.value,
                                              appointment_time: "",
                                            }));
                                            setAvailableSlots([]);
                                            setSlotError("");
                                          }}
                                        >
                                          <option value="">
                                            {t("Select doctor")}
                                          </option>
                                          {doctors.map((doctor) => (
                                            <option
                                              key={doctor.id}
                                              value={doctor.id}
                                            >
                                              {doctor.name}
                                            </option>
                                          ))}
                                        </select>
                                      </div>

                                      <div className="start-field">
                                        <label>{t("Date")}</label>
                                        <input
                                          type="date"
                                          className="form-control"
                                          value={startForm.appointment_date}
                                          onChange={(e) => {
                                            setStartForm((prev) => ({
                                              ...prev,
                                              appointment_date: e.target.value,
                                              appointment_time: "",
                                            }));
                                            setAvailableSlots([]);
                                            setSlotError("");
                                          }}
                                        />
                                      </div>

                                      <div className="start-field">
                                        <label>{t("Available Slots")}</label>
                                        <button
                                          type="button"
                                          className="btn btn-outline-primary w-100"
                                          onClick={loadSlots}
                                          disabled={
                                            loadingSlots ||
                                            !startForm.doctor_id ||
                                            !startForm.appointment_date
                                          }
                                        >
                                          {loadingSlots ? (
                                            <>
                                              <span className="spinner-border spinner-border-sm me-2"></span>
                                              {t("Loading Slots...")}
                                            </>
                                          ) : (
                                            <>
                                              <i className="fas fa-sync-alt me-2"></i>
                                              {t("Load Slots")}
                                            </>
                                          )}
                                        </button>
                                      </div>

                                      <div className="start-field">
                                        <label>{t("Time")}</label>
                                        <select
                                          className="form-select"
                                          value={startForm.appointment_time}
                                          onChange={(e) =>
                                            setStartForm((prev) => ({
                                              ...prev,
                                              appointment_time: e.target.value,
                                            }))
                                          }
                                        >
                                          <option value="">
                                            {t("Select slot")}
                                          </option>
                                          {normalizedSlots.map((slot, idx) => (
                                            <option
                                              key={`${slot.value}-${idx}`}
                                              value={slot.value}
                                            >
                                              {slot.label}
                                              {!slot.available &&
                                                ` (${t("Unavailable")})`}
                                            </option>
                                          ))}
                                        </select>
                                      </div>

                                      {slotError && (
                                        <div className="start-field full-width">
                                          <div className="slot-error">
                                            {slotError}
                                          </div>
                                        </div>
                                      )}

                                      <div className="start-field full-width">
                                        <label>{t("Notes")}</label>
                                        <textarea
                                          className="form-control"
                                          rows="2"
                                          value={startForm.notes}
                                          onChange={(e) =>
                                            setStartForm((prev) => ({
                                              ...prev,
                                              notes: e.target.value,
                                            }))
                                          }
                                          placeholder={t("Optional notes...")}
                                        />
                                      </div>

                                      <div className="start-actions">
                                        <button
                                          className="btn btn-success"
                                          onClick={() =>
                                            startProcedure(item.id)
                                          }
                                          disabled={
                                            startingItemId === item.id ||
                                            !startForm.appointment_time
                                          }
                                        >
                                          {startingItemId === item.id ? (
                                            <>
                                              <span className="spinner-border spinner-border-sm me-2"></span>
                                              {t("Starting...")}
                                            </>
                                          ) : (
                                            <>
                                              <i className="fas fa-check me-2"></i>
                                              {t("Confirm Start")}
                                            </>
                                          )}
                                        </button>

                                        <button
                                          className="btn btn-outline-secondary"
                                          onClick={closeStartForm}
                                          disabled={startingItemId === item.id}
                                        >
                                          <i className="fas fa-times me-2"></i>
                                          {t("Close")}
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            ) : null
                          }
                        />
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Invoices and Cash Summary */}
      <div className="two-columns">
        <div className="invoices-card">
          <div className="card-header-custom">
            <i className="fas fa-file-invoice me-2"></i>
            <h5 className="mb-0">{t("Linked Invoices")}</h5>
            <span className="invoice-count">
              {invoices.length} {t("invoices")}
            </span>
          </div>

          <div className="card-body-custom">
            {invoices.length === 0 ? (
              <div className="empty-state small">
                <p className="empty-text">
                  {t("No invoices linked to this plan.")}
                </p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="invoices-table">
                  <thead>
                    <tr>
                      <th>{t("Number")}</th>
                      <th>{t("Total")}</th>
                      <th>{t("Direct Paid")}</th>
                      <th>{t("Credit Applied")}</th>
                      <th>{t("Net Paid")}</th>
                      <th>{t("Remaining")}</th>
                      <th>{t("Status")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((inv) => (
                      <tr key={inv.id}>
                        <td data-label={t("Number")}>
                          <Link
                            to={`/admin/erp/invoices/${inv.id}`}
                            className="invoice-link"
                          >
                            {inv.number}
                          </Link>
                        </td>
                        <td data-label={t("Total")} className="amount-cell">
                          {formatCurrency(inv.total)}
                        </td>
                        <td
                          data-label={t("Direct Paid")}
                          className="amount-cell"
                        >
                          {formatCurrency(inv.direct_paid)}
                        </td>
                        <td
                          data-label={t("Credit Applied")}
                          className="amount-cell"
                        >
                          {formatCurrency(inv.credit_applied)}
                        </td>
                        <td data-label={t("Net Paid")} className="amount-cell">
                          {formatCurrency(inv.net_paid)}
                        </td>
                        <td
                          data-label={t("Remaining")}
                          className="amount-cell remaining"
                        >
                          {formatCurrency(inv.remaining)}
                        </td>
                        <td data-label={t("Status")}>
                          <StatusBadge status={inv.status} t={t} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="cash-summary-card">
          <div className="card-header-custom">
            <i className="fas fa-chart-line me-2"></i>
            <h5 className="mb-0">{t("Cash Summary")}</h5>
          </div>

          <div className="card-body-custom">
            <div className="cash-grid">
              <InfoItem
                label={t("Cash In")}
                value={formatCurrency(cash.cash_in)}
              />
              <InfoItem
                label={t("Invoice Refunds")}
                value={formatCurrency(cash.cash_out_invoice_refunds)}
              />
              <InfoItem
                label={t("Credit Refunds")}
                value={formatCurrency(cash.cash_out_credit_refunds)}
              />
              <InfoItem
                label={t("Net Cash")}
                value={formatCurrency(cash.net_cash)}
              />
              <InfoItem
                label={t("Credit Issued")}
                value={formatCurrency(credit.credit_issued)}
              />
              <InfoItem
                label={t("Credit Used")}
                value={formatCurrency(credit.credit_used)}
              />
              <InfoItem
                label={t("Net Credit")}
                value={formatCurrency(credit.net_credit)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper Components
function FragmentRow({ row, extraRow }) {
  return (
    <>
      {row}
      {extraRow}
    </>
  );
}

function KpiCard({ title, value, color = "primary" }) {
  const colorMap = {
    primary: { bg: "rgba(26, 35, 126, 0.1)", text: "#1a237e" },
    success: { bg: "rgba(76, 175, 80, 0.1)", text: "#4caf50" },
    danger: { bg: "rgba(244, 67, 54, 0.1)", text: "#f44336" },
    warning: { bg: "rgba(255, 152, 0, 0.1)", text: "#ff9800" },
    info: { bg: "rgba(3, 169, 244, 0.1)", text: "#03a9f4" },
    secondary: { bg: "rgba(108, 117, 125, 0.1)", text: "#6c757d" },
    dark: { bg: "rgba(33, 37, 41, 0.1)", text: "#212529" },
  };

  const colors = colorMap[color] || colorMap.primary;

  return (
    <div className="kpi-card">
      <div className="kpi-card-content">
        <div className="kpi-title">{title}</div>
        <div className="kpi-value" style={{ color: colors.text }}>
          {value}
        </div>
      </div>
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

function StatusBadge({ status, t }) {
  const value = String(status || "").toLowerCase();
  let variant = "secondary";
  let label = status || "-";

  if (["completed", "paid"].includes(value)) variant = "success";
  else if (["cancelled", "unpaid"].includes(value)) variant = "danger";
  else if (["active", "partially_paid", "planned"].includes(value))
    variant = "warning";
  else if (["in_progress"].includes(value)) variant = "info";

  return <span className={`status-badge status-${variant}`}>{t(label)}</span>;
}

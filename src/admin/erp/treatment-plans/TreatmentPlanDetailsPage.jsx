import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "../../../services/axios";

export default function TreatmentPlanDetailsPage() {
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
  const [itemError, setItemError] = useState("");
  const [itemSuccess, setItemSuccess] = useState("");

  const [openStartItemId, setOpenStartItemId] = useState(null);
  const [startingItem, setStartingItem] = useState(false);
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

  const loadAll = async () => {
    try {
      setLoading(true);
      setError("");
      setItemError("");
      setItemSuccess("");

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

      setPlan(planRes.data || null);
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
          "Failed to load treatment plan details.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleItemChange = (e) => {
    const { name, value } = e.target;
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
        planned_sessions: Number(itemForm.planned_sessions || 1),
      };

      if (itemForm.price !== "") {
        payload.price = Number(itemForm.price);
      }

      await axios.post(`/erp/treatment-plans/${id}/items`, payload);

      setItemSuccess("Item added successfully.");

      setItemForm({
        procedure_id: "",
        tooth_number: "",
        surface: "",
        notes: "",
        price: "",
        planned_sessions: 1,
      });

      await loadAll();
    } catch (err) {
      const errors = err?.response?.data?.errors;
      if (errors) {
        const firstError = Object.values(errors)?.[0]?.[0];
        setItemError(firstError || "Failed to add item.");
      } else {
        setItemError(
          err?.response?.data?.message ||
            err?.response?.data?.msg ||
            "Failed to add item.",
        );
      }
    } finally {
      setSavingItem(false);
    }
  };

  const deleteItem = async (itemId) => {
    const confirmed = window.confirm("Delete this item?");
    if (!confirmed) return;

    try {
      setItemError("");
      setItemSuccess("");

      await axios.delete(`/erp/treatment-plan-items/${itemId}`);

      setItemSuccess("Item deleted successfully.");
      await loadAll();
    } catch (err) {
      setItemError(
        err?.response?.data?.message ||
          err?.response?.data?.msg ||
          "Failed to delete item.",
      );
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
        setSlotError("Please select doctor and date first.");
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
          "Failed to load available slots.",
      );
    } finally {
      setLoadingSlots(false);
    }
  };

  const startProcedure = async (itemId) => {
    try {
      setStartingItem(true);
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

      setItemSuccess("Procedure started successfully.");
      closeStartForm();
      await loadAll();
    } catch (err) {
      const errors = err?.response?.data?.errors;
      if (errors) {
        const firstError = Object.values(errors)?.[0]?.[0];
        setItemError(firstError || "Failed to start procedure.");
      } else {
        setItemError(
          err?.response?.data?.message ||
            err?.response?.data?.msg ||
            "Failed to start procedure.",
        );
      }
    } finally {
      setStartingItem(false);
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
    if (rawStatus === "in_progress" || completed > 0) return "in_progress";
    return "not_started";
  };

  const getStatusLabel = (item) => {
    const status = getUiProcedureStatus(item);

    if (status === "completed") return "Completed";
    if (status === "in_progress") return "In progress";
    if (status === "cancelled") return "Cancelled";
    return "Not started";
  };

  const getStatusClass = (item) => {
    const status = getUiProcedureStatus(item);

    if (status === "completed") return "success";
    if (status === "in_progress") return "info";
    if (status === "cancelled") return "danger";
    return "warning";
  };

  const canStartProcedure = (item) => {
    const uiStatus = getUiProcedureStatus(item);
    const remaining = getRemainingSessions(item);

    if (remaining <= 0) return false;
    if (uiStatus === "in_progress") return false;

    return true;
  };

  const canOpenAppointment = (item) => {
    const uiStatus = getUiProcedureStatus(item);
    return uiStatus === "in_progress" && !!item.appointment_id;
  };

  const getStartButtonLabel = (item) => {
    const completed = getCompletedSessions(item);
    return completed > 0 ? "Next Session" : "Start Procedure";
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
        <button className="btn btn-sm btn-outline-danger" onClick={loadAll}>
          Retry
        </button>
      </div>
    );
  }

  const planData = plan?.data || plan || {};
  const customer = planData.customer || {};
  const invoices = summary?.invoices || [];
  const totals = summary?.totals || {};
  const cash = cashSummary?.cash || {};
  const credit = cashSummary?.customer_credit_balance || {};

  return (
    <div className="container-fluid px-0">
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
        <div>
          <h3 className="fw-bold mb-1">Treatment Plan Details</h3>
          <p className="text-muted mb-0">
            Review plan items, invoices, summary, and cash flow
          </p>
        </div>

        <div className="d-flex flex-wrap gap-2">
          <Link
            to="/admin/erp/treatment-plans"
            className="btn btn-outline-secondary"
          >
            Back to Plans
          </Link>

          {customer.id ? (
            <Link
              to={`/admin/erp/patients/${customer.id}/profile`}
              className="btn btn-outline-primary"
            >
              Patient Profile
            </Link>
          ) : null}

          <button className="btn btn-primary" onClick={loadAll}>
            Refresh
          </button>
        </div>
      </div>

      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body">
          <div className="row g-3">
            <InfoItem label="Title" value={planData.title} />
            <InfoItem label="Patient" value={customer.name} />
            <InfoItem label="Email" value={customer.email} />
            <InfoItem
              label="Status"
              value={<StatusBadge status={planData.status} />}
            />
            <InfoItem label="Total Cost" value={money(planData.total_cost)} />
            <InfoItem label="Created" value={formatDate(planData.created_at)} />
            <div className="col-12">
              <div className="small text-muted">Notes</div>
              <div className="fw-semibold">{planData.notes || "-"}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body">
          <div className="d-flex justify-content-between mb-2">
            <div className="fw-semibold">Treatment Progress</div>
            <div>{totalProgress}%</div>
          </div>

          <div className="progress" style={{ height: "10px" }}>
            <div
              className="progress-bar"
              style={{ width: `${totalProgress}%` }}
            />
          </div>

          <div className="small text-muted mt-2">
            {totalCompleted} / {totalPlanned} sessions completed
          </div>
        </div>
      </div>

      <div className="row g-3 mb-4">
        <KpiCard
          title="Total Invoiced"
          value={money(totals.total_invoiced)}
          color="primary"
        />
        <KpiCard
          title="Total Paid"
          value={money(totals.total_paid)}
          color="success"
        />
        <KpiCard
          title="Total Refunded"
          value={money(totals.total_refunded)}
          color="danger"
        />

        <KpiCard title="Net Paid" value={money(totals.net_paid)} color="info" />
        <KpiCard
          title="Remaining"
          value={money(totals.remaining_on_plan)}
          color="warning"
        />
        <KpiCard title="Cash In" value={money(cash.cash_in)} color="success" />
        <KpiCard title="Net Cash" value={money(cash.net_cash)} color="dark" />
        <KpiCard
          title="Customer Credit"
          value={money(credit.net_credit)}
          color="secondary"
        />
      </div>

      <div className="row g-4">
        <div className="col-12">
          <div className="card shadow-sm border-0">
            <div className="card-header bg-white">
              <h5 className="mb-0">Add Plan Item</h5>
            </div>

            <div className="card-body">
              {itemError ? (
                <div className="alert alert-danger py-2">{itemError}</div>
              ) : null}

              {itemSuccess ? (
                <div className="alert alert-success py-2">{itemSuccess}</div>
              ) : null}

              <form className="row g-3" onSubmit={addItem}>
                <div className="col-12 col-md-4">
                  <label className="form-label fw-semibold">Procedure</label>
                  <select
                    className="form-select"
                    name="procedure_id"
                    value={itemForm.procedure_id}
                    onChange={handleItemChange}
                    required
                  >
                    <option value="">Select procedure</option>
                    {procedures.map((procedure) => (
                      <option key={procedure.id} value={procedure.id}>
                        {procedure.name}
                        {procedure.default_price != null
                          ? ` (${money(procedure.default_price)})`
                          : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-12 col-md-2">
                  <label className="form-label fw-semibold">Tooth</label>
                  <input
                    type="text"
                    className="form-control"
                    name="tooth_number"
                    value={itemForm.tooth_number}
                    onChange={handleItemChange}
                    placeholder="16"
                  />
                </div>

                <div className="col-12 col-md-2">
                  <label className="form-label fw-semibold">Surface</label>
                  <input
                    type="text"
                    className="form-control"
                    name="surface"
                    value={itemForm.surface}
                    onChange={handleItemChange}
                    placeholder="occlusal"
                  />
                </div>

                <div className="col-12 col-md-2">
                  <label className="form-label fw-semibold">Price</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="form-control"
                    name="price"
                    value={itemForm.price}
                    onChange={handleItemChange}
                    placeholder="Optional"
                  />
                </div>

                <div className="col-12 col-md-2">
                  <label className="form-label fw-semibold">Sessions</label>
                  <input
                    type="number"
                    min="1"
                    className="form-control"
                    name="planned_sessions"
                    value={itemForm.planned_sessions}
                    onChange={handleItemChange}
                  />
                </div>

                <div className="col-12 col-md-2 d-grid">
                  <label className="form-label fw-semibold invisible">
                    Add
                  </label>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={savingItem}
                  >
                    {savingItem ? "Adding..." : "Add Item"}
                  </button>
                </div>

                <div className="col-12">
                  <label className="form-label fw-semibold">Notes</label>
                  <textarea
                    className="form-control"
                    rows="2"
                    name="notes"
                    value={itemForm.notes}
                    onChange={handleItemChange}
                    placeholder="Optional notes..."
                  />
                </div>
              </form>
            </div>
          </div>
        </div>

        <div className="col-12 col-xl-7">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-header bg-white">
              <h5 className="mb-0">Plan Items</h5>
            </div>
            <div className="card-body p-0">
              {items.length === 0 ? (
                <div className="p-3 text-muted">No items found.</div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Procedure</th>
                        <th>Tooth</th>
                        <th>Surface</th>
                        <th>Price</th>
                        <th>Sessions</th>
                        <th>Remaining</th>
                        <th style={{ minWidth: 180 }}>Progress</th>
                        <th>Status</th>
                        <th>Notes</th>
                        <th>Actions</th>
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
                                <td>
                                  <div className="fw-semibold">
                                    {item.procedureRef?.name ||
                                      item.procedure ||
                                      "-"}
                                  </div>
                                </td>

                                <td>{item.tooth_number || "-"}</td>
                                <td>{item.surface || "-"}</td>
                                <td>{money(item.price)}</td>

                                <td>
                                  <span className="fw-semibold">
                                    {getCompletedSessions(item)}
                                  </span>
                                  /{getPlannedSessions(item)}
                                </td>

                                <td>{getRemainingSessions(item)}</td>

                                <td style={{ minWidth: 180 }}>
                                  <div className="d-flex justify-content-between small">
                                    <span>{getProgress(item)}%</span>
                                    <span>
                                      {getCompletedSessions(item)} /{" "}
                                      {getPlannedSessions(item)}
                                    </span>
                                  </div>

                                  <div
                                    className="progress"
                                    style={{ height: "6px" }}
                                  >
                                    <div
                                      className="progress-bar"
                                      style={{ width: `${getProgress(item)}%` }}
                                    />
                                  </div>
                                </td>

                                <td>
                                  <span
                                    className={`badge bg-${getStatusClass(item)}`}
                                  >
                                    {getStatusLabel(item)}
                                  </span>
                                </td>

                                <td>{item.notes || "-"}</td>

                                <td>
                                  <div className="d-flex flex-wrap gap-2">
                                    {canStartProcedure(item) ? (
                                      <button
                                        className="btn btn-sm btn-outline-success"
                                        type="button"
                                        onClick={() => openStartForm(item)}
                                      >
                                        {getStartButtonLabel(item)}
                                      </button>
                                    ) : null}

                                    {canOpenAppointment(item) ? (
                                      <Link
                                        to={`/admin/erp/appointments/${item.appointment_id}/activity`}
                                        className="btn btn-sm btn-outline-primary"
                                      >
                                        Open Appointment
                                      </Link>
                                    ) : null}

                                    <button
                                      className="btn btn-sm btn-outline-danger"
                                      onClick={() => deleteItem(item.id)}
                                      type="button"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            }
                            extraRow={
                              isStartOpen ? (
                                <tr>
                                  <td colSpan="10" className="bg-light">
                                    <div className="p-3">
                                      <div className="fw-semibold mb-2">
                                        {getCompletedSessions(item) > 0
                                          ? "Start Next Session"
                                          : "Start Procedure"}
                                      </div>

                                      <div className="alert alert-light border py-2 small">
                                        This will create a treatment appointment
                                        for this plan item. When that
                                        appointment is completed, one session
                                        will be billed and the completed
                                        sessions count will be increased.
                                      </div>

                                      <div className="row g-3 align-items-end">
                                        <div className="col-12 col-md-3">
                                          <label className="form-label fw-semibold">
                                            Doctor
                                          </label>
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
                                              Select doctor
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

                                        <div className="col-12 col-md-3">
                                          <label className="form-label fw-semibold">
                                            Date
                                          </label>
                                          <input
                                            type="date"
                                            className="form-control"
                                            value={startForm.appointment_date}
                                            onChange={(e) => {
                                              setStartForm((prev) => ({
                                                ...prev,
                                                appointment_date:
                                                  e.target.value,
                                                appointment_time: "",
                                              }));
                                              setAvailableSlots([]);
                                              setSlotError("");
                                            }}
                                          />
                                        </div>

                                        <div className="col-12 col-md-3">
                                          <label className="form-label fw-semibold">
                                            Available Slots
                                          </label>
                                          <div className="d-grid">
                                            <button
                                              type="button"
                                              className="btn btn-outline-primary"
                                              onClick={loadSlots}
                                              disabled={loadingSlots}
                                            >
                                              {loadingSlots
                                                ? "Loading Slots..."
                                                : "Load Slots"}
                                            </button>
                                          </div>
                                        </div>

                                        <div className="col-12 col-md-3">
                                          <label className="form-label fw-semibold">
                                            Time
                                          </label>
                                          <select
                                            className="form-select"
                                            value={startForm.appointment_time}
                                            onChange={(e) =>
                                              setStartForm((prev) => ({
                                                ...prev,
                                                appointment_time:
                                                  e.target.value,
                                              }))
                                            }
                                          >
                                            <option value="">
                                              Select slot
                                            </option>
                                            {normalizedSlots.map(
                                              (slot, index) => (
                                                <option
                                                  key={`${slot.value}-${index}`}
                                                  value={slot.value}
                                                  disabled={
                                                    slot.available === false
                                                  }
                                                >
                                                  {slot.label}
                                                </option>
                                              ),
                                            )}
                                          </select>
                                        </div>

                                        {slotError ? (
                                          <div className="col-12">
                                            <div className="alert alert-warning py-2 mb-0">
                                              {slotError}
                                            </div>
                                          </div>
                                        ) : null}

                                        <div className="col-12 col-md-8">
                                          <label className="form-label fw-semibold">
                                            Notes
                                          </label>
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
                                          />
                                        </div>

                                        <div className="col-12 col-md-4 d-flex gap-2">
                                          <button
                                            type="button"
                                            className="btn btn-success"
                                            onClick={() =>
                                              startProcedure(item.id)
                                            }
                                            disabled={
                                              startingItem ||
                                              !startForm.appointment_time
                                            }
                                          >
                                            {startingItem
                                              ? "Starting..."
                                              : "Confirm Start"}
                                          </button>

                                          <button
                                            type="button"
                                            className="btn btn-outline-secondary"
                                            onClick={closeStartForm}
                                          >
                                            Close
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

        <div className="col-12 col-xl-5">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-header bg-white">
              <h5 className="mb-0">Linked Invoices</h5>
            </div>
            <div className="card-body p-0">
              {invoices.length === 0 ? (
                <div className="p-3 text-muted">
                  No invoices linked to this plan.
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Number</th>
                        <th>Total</th>
                        <th>Net Paid</th>
                        <th>Remaining</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoices.map((inv) => (
                        <tr key={inv.id}>
                          <td>
                            <Link
                              to={`/admin/erp/invoices/${inv.id}`}
                              className="text-decoration-none"
                            >
                              {inv.number}
                            </Link>
                          </td>
                          <td>{money(inv.total)}</td>
                          <td>{money(inv.net_paid)}</td>
                          <td>{money(inv.remaining)}</td>
                          <td>
                            <StatusBadge status={inv.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-12">
          <div className="card shadow-sm border-0">
            <div className="card-header bg-white">
              <h5 className="mb-0">Cash Summary</h5>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <InfoItem label="Cash In" value={money(cash.cash_in)} />
                <InfoItem
                  label="Invoice Refunds"
                  value={money(cash.cash_out_invoice_refunds)}
                />
                <InfoItem
                  label="Credit Refunds"
                  value={money(cash.cash_out_credit_refunds)}
                />
                <InfoItem label="Net Cash" value={money(cash.net_cash)} />
                <InfoItem
                  label="Credit Issued"
                  value={money(credit.credit_issued)}
                />
                <InfoItem
                  label="Credit Used"
                  value={money(credit.credit_used)}
                />
                <InfoItem label="Net Credit" value={money(credit.net_credit)} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FragmentRow({ row, extraRow }) {
  return (
    <>
      {row}
      {extraRow}
    </>
  );
}

function KpiCard({ title, value, color = "primary" }) {
  return (
    <div className="col-12 col-sm-6 col-xl-3">
      <div className="card border-0 shadow-sm h-100">
        <div className="card-body">
          <div className="text-muted small mb-1">{title}</div>
          <div className={`fs-4 fw-bold text-${color}`}>{value}</div>
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

function StatusBadge({ status }) {
  const value = String(status || "").toLowerCase();

  let cls = "secondary";
  if (["completed", "paid"].includes(value)) cls = "success";
  else if (["cancelled", "unpaid"].includes(value)) cls = "danger";
  else if (["active", "partially_paid"].includes(value)) cls = "warning";

  return <span className={`badge bg-${cls}`}>{status}</span>;
}

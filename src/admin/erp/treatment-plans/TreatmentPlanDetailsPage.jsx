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

  const getCompletedSessions = (item) => Number(item.completed_sessions || 0);
  const getPlannedSessions = (item) => Number(item.planned_sessions || 1);

  const getRemainingSessions = (item) =>
    Math.max(getPlannedSessions(item) - getCompletedSessions(item), 0);

  const getUiProcedureStatus = (item) => {
    const rawStatus = String(item.status || "planned").toLowerCase();
    const remaining = getRemainingSessions(item);

    if (rawStatus === "cancelled") return "cancelled";
    if (rawStatus === "in_progress") return;
    ("in_progress");
    if (remaining <= 0) return "completed";

    return "planned";
  };

  const canStartProcedure = (item) => {
    const uiStatus = getUiProcedureStatus(item);
    const remaining = getRemainingSessions(item);

    if (remaining <= 0) return false;
    if (uiStatus === "in_progress") return false;

    return true;
  };

  const getStartButtonLabel = (item) => {
    const completed = getCompletedSessions(item);
    return completed > 0 ? "Next Session" : "Start Procedure";
  };

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

  const planData = plan?.data || plan || {};
  const customer = planData.customer || {};

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  return (
    <div className="container-fluid">
      <h3 className="fw-bold mb-3">Treatment Plan</h3>

      <div className="card shadow-sm border-0">
        <div className="card-header bg-white">
          <h5 className="mb-0">Plan Items</h5>
        </div>

        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead className="table-light">
                <tr>
                  <th>Procedure</th>
                  <th>Price</th>
                  <th>Sessions</th>
                  <th>Remaining</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {items.map((item) => {
                  const remaining = getRemainingSessions(item);
                  const status = getUiProcedureStatus(item);
                  return (
                    <tr key={item.id}>
                      <td>{item.procedure}</td>
                      <td>{money(item.price)}</td>
                      <td>
                        {getCompletedSessions(item)}/{getPlannedSessions(item)}
                      </td>
                      <td>{remaining}</td>
                      <td>
                        <ProcedureStatusBadge status={status} />
                      </td>

                      <td>
                        {canStartProcedure(item) && (
                          <button
                            className="btn btn-sm btn-outline-success"
                            onClick={() => openStartForm(item)}
                          >
                            {getStartButtonLabel(item)}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProcedureStatusBadge({ status }) {
  const value = String(status || "planned").toLowerCase();

  let cls = "secondary";

  if (["planned"].includes(value)) cls = "warning";
  else if (["in_progress"].includes(value)) cls = "info";
  else if (["completed"].includes(value)) cls = "success";
  else if (["cancelled"].includes(value)) cls = "danger";

  return <span className={`badge bg-${cls}`}>{value}</span>;
}

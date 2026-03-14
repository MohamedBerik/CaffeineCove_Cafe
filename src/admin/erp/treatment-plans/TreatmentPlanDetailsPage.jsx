import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "../../../services/axios";

export default function TreatmentPlanDetailsPage() {
  const { id } = useParams();

  const [plan, setPlan] = useState(null);
  const [items, setItems] = useState([]);
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

  const [openStartItemId, setOpenStartItemId] = useState(null);
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

      const [planRes, itemsRes, proceduresRes, doctorsRes] = await Promise.all([
        axios.get(`/erp/treatment-plans/${id}`),
        axios.get(`/erp/treatment-plans/${id}/items`),
        axios.get(`/erp/procedures`),
        axios.get(`/erp/doctors`),
      ]);

      setPlan(planRes.data?.data || planRes.data);
      setItems(itemsRes.data?.data || []);

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
      setError("Failed to load treatment plan.");
    } finally {
      setLoading(false);
    }
  };

  const getCompletedSessions = (item) => Number(item.completed_sessions || 0);
  const getPlannedSessions = (item) => Number(item.planned_sessions || 1);

  const getRemainingSessions = (item) =>
    Math.max(getPlannedSessions(item) - getCompletedSessions(item), 0);

  const getUiStatus = (item) => {
    const remaining = getRemainingSessions(item);

    if (item.status === "cancelled") return "cancelled";
    if (item.status === "in_progress") return "in_progress";
    if (remaining === 0) return "completed";

    return "planned";
  };

  const canStartProcedure = (item) => {
    const remaining = getRemainingSessions(item);
    const status = getUiStatus(item);

    if (remaining <= 0) return false;
    if (status === "in_progress") return false;

    return true;
  };

  const startLabel = (item) =>
    getCompletedSessions(item) > 0 ? "Next Session" : "Start Procedure";

  const money = (value) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(Number(value || 0));

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  const planData = plan || {};
  const customer = planData.customer || {};

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between mb-4">
        <div>
          <h3 className="fw-bold">Treatment Plan</h3>
          <div className="text-muted">{customer.name || "-"}</div>
        </div>

        <Link
          to="/admin/erp/treatment-plans"
          className="btn btn-outline-secondary"
        >
          Back
        </Link>
      </div>

      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-6">
              <div className="small text-muted">Title</div>
              <div className="fw-semibold">{planData.title}</div>
            </div>

            <div className="col-md-6">
              <div className="small text-muted">Patient</div>
              <div className="fw-semibold">{customer.name}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="card shadow-sm border-0">
        <div className="card-header bg-white">
          <h5 className="mb-0">Plan Items</h5>
        </div>

        <div className="card-body p-0">
          {items.length === 0 ? (
            <div className="p-3 text-muted">No items</div>
          ) : (
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
                    const status = getUiStatus(item);

                    return (
                      <tr key={item.id}>
                        <td>
                          <div className="fw-semibold">
                            {item.procedureRef?.name || item.procedure}
                          </div>
                          <div className="small text-muted">
                            Tooth {item.tooth_number || "-"}
                          </div>
                        </td>

                        <td>{money(item.price)}</td>

                        <td>
                          {getCompletedSessions(item)}/
                          {getPlannedSessions(item)}
                        </td>

                        <td>{remaining}</td>

                        <td>
                          <ProcedureStatusBadge status={status} />
                        </td>

                        <td>
                          <div className="d-flex gap-2">
                            {canStartProcedure(item) && (
                              <button
                                className="btn btn-sm btn-outline-success"
                                onClick={() => setOpenStartItemId(item.id)}
                              >
                                {startLabel(item)}
                              </button>
                            )}

                            {item.appointment_id &&
                              status === "in_progress" && (
                                <Link
                                  to={`/admin/erp/appointments`}
                                  className="btn btn-sm btn-outline-primary"
                                >
                                  Open Appointment
                                </Link>
                              )}
                          </div>
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
    </div>
  );
}

function ProcedureStatusBadge({ status }) {
  let cls = "secondary";

  if (status === "planned") cls = "warning";
  if (status === "in_progress") cls = "info";
  if (status === "completed") cls = "success";
  if (status === "cancelled") cls = "danger";

  return <span className={`badge bg-${cls}`}>{status}</span>;
}

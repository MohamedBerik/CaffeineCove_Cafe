import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import axios from "../../../services/axios";

export default function DentalRecordsListPage() {
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
  const [searchParams] = useSearchParams();
  const highlightRecordId = searchParams.get("record_id") || "";

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
          "Failed to load dental records.",
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
        setActionError("Please select a treatment plan first.");
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

      setActionMessage(
        "Dental record converted to treatment plan item successfully.",
      );
      await loadRecordsAndPlans();
      closeConvert();
    } catch (err) {
      const errors = err?.response?.data?.errors;
      if (errors) {
        const firstError = Object.values(errors)?.[0]?.[0];
        setActionError(firstError || "Failed to convert dental record.");
      } else {
        setActionError(
          err?.response?.data?.message ||
            err?.response?.data?.msg ||
            "Failed to convert dental record.",
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
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid px-0">
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
        <div>
          <h3 className="fw-bold mb-1">Dental Records</h3>
          <p className="text-muted mb-0">
            Review patient chart records, procedures, teeth, and statuses
          </p>
        </div>

        <div className="d-flex gap-2">
          <Link
            to="/admin/erp/dental-records/create"
            className="btn btn-outline-primary"
          >
            Create Dental Record
          </Link>

          <button className="btn btn-primary" onClick={loadRecordsAndPlans}>
            Refresh
          </button>
        </div>
      </div>

      {error ? (
        <div className="alert alert-danger d-flex justify-content-between align-items-center">
          <span>{error}</span>
          <button
            className="btn btn-sm btn-outline-danger"
            onClick={loadRecordsAndPlans}
          >
            Retry
          </button>
        </div>
      ) : null}

      {actionMessage ? (
        <div className="alert alert-success">{actionMessage}</div>
      ) : null}
      {actionError ? (
        <div className="alert alert-danger">{actionError}</div>
      ) : null}

      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body">
          <div className="row g-3 align-items-center">
            <div className="col-12 col-lg-8">
              <label className="form-label fw-semibold">Search</label>
              <input
                type="text"
                className="form-control"
                placeholder="Patient, procedure, tooth, surface, status, notes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="col-12 col-lg-4">
              <label className="form-label fw-semibold">Total Loaded</label>
              <div className="form-control bg-light">
                {meta?.total ?? rows.length}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card shadow-sm border-0">
        <div className="card-header bg-white">
          <h5 className="mb-0">Dental Records List</h5>
        </div>

        <div className="card-body p-0">
          {filteredRows.length === 0 ? (
            <div className="p-4 text-muted">No dental records found.</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th style={{ minWidth: 220 }}>Patient</th>
                    <th style={{ minWidth: 180 }}>Procedure</th>
                    <th style={{ minWidth: 100 }}>Tooth</th>
                    <th style={{ minWidth: 120 }}>Surface</th>
                    <th style={{ minWidth: 120 }}>Status</th>
                    <th style={{ minWidth: 220 }}>Notes</th>
                    <th style={{ minWidth: 260 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((record) => {
                    const matchingPlans = availablePlansForRecord(record);

                    return (
                      <>
                        <tr
                          key={record.id}
                          className={
                            String(record.id) === String(highlightRecordId)
                              ? "table-warning"
                              : ""
                          }
                          style={
                            String(record.id) === String(highlightRecordId)
                              ? { boxShadow: "inset 4px 0 0 #ffc107" }
                              : {}
                          }
                        >
                          <td>
                            <div className="fw-semibold">
                              {record.customer?.name || "-"}
                            </div>
                            <div className="small text-muted">
                              {record.customer?.email || "-"}
                            </div>
                          </td>

                          <td>{record.procedure?.name || "-"}</td>
                          <td>{record.tooth_number || "-"}</td>
                          <td>{record.surface || "-"}</td>
                          <td>
                            <StatusBadge status={record.status} />
                          </td>
                          <td>{record.notes || "-"}</td>
                          <td>
                            <div className="d-flex flex-wrap gap-2">
                              {record.customer?.id ? (
                                <Link
                                  to={`/admin/erp/patients/${record.customer.id}/profile`}
                                  className="btn btn-sm btn-outline-primary"
                                >
                                  Patient
                                </Link>
                              ) : null}

                              {record.customer?.id ? (
                                <Link
                                  to={`/admin/erp/patients/${record.customer.id}/timeline`}
                                  className="btn btn-sm btn-outline-info"
                                >
                                  Timeline
                                </Link>
                              ) : null}

                              <button
                                className="btn btn-sm btn-outline-success"
                                onClick={() => openConvert(record)}
                              >
                                Convert
                              </button>
                            </div>
                          </td>
                        </tr>

                        {openConvertId === record.id ? (
                          <tr>
                            <td colSpan="7" className="bg-light">
                              <div className="p-3">
                                <div className="row g-3 align-items-end">
                                  <div className="col-12 col-md-8">
                                    <label className="form-label fw-semibold">
                                      Select Treatment Plan
                                    </label>
                                    <select
                                      className="form-select"
                                      value={selectedPlanId}
                                      onChange={(e) =>
                                        setSelectedPlanId(e.target.value)
                                      }
                                    >
                                      <option value="">Select plan</option>
                                      {matchingPlans.map((plan) => (
                                        <option key={plan.id} value={plan.id}>
                                          {plan.title} - {plan.status}
                                        </option>
                                      ))}
                                    </select>
                                    {matchingPlans.length === 0 ? (
                                      <div className="small text-danger mt-2">
                                        No treatment plans found for this
                                        patient.
                                      </div>
                                    ) : null}
                                  </div>

                                  <div className="col-12 col-md-4 d-flex gap-2">
                                    <button
                                      className="btn btn-success"
                                      onClick={() => convertRecord(record.id)}
                                      disabled={
                                        converting || matchingPlans.length === 0
                                      }
                                    >
                                      {converting
                                        ? "Converting..."
                                        : "Confirm Convert"}
                                    </button>

                                    <button
                                      className="btn btn-outline-secondary"
                                      onClick={closeConvert}
                                      type="button"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        ) : null}
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

function StatusBadge({ status }) {
  const value = String(status || "").toLowerCase();

  let cls = "secondary";

  if (["completed"].includes(value)) cls = "success";
  else if (["cancelled"].includes(value)) cls = "danger";
  else if (["planned"].includes(value)) cls = "warning";
  else if (["in_progress"].includes(value)) cls = "info";

  return <span className={`badge bg-${cls}`}>{status}</span>;
}

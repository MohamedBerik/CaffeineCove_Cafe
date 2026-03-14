import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "../../../services/axios";

export default function AppointmentsListPage() {
  const navigate = useNavigate();

  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [doctors, setDoctors] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");
  const [actingId, setActingId] = useState(null);

  const [openCompleteId, setOpenCompleteId] = useState(null);

  const [completeForm, setCompleteForm] = useState({
    doctor_name: "",
    notes: "",
  });

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      setLoading(true);
      setError("");

      const [appointmentsRes, doctorsRes] = await Promise.all([
        axios.get("/erp/appointments"),
        axios.get("/erp/doctors"),
      ]);

      const appointmentsPayload = appointmentsRes.data || {};
      const doctorsPayload = doctorsRes.data || {};

      const rowsData = Array.isArray(appointmentsPayload.data)
        ? appointmentsPayload.data
        : appointmentsPayload.data?.data || [];

      const doctorRows = Array.isArray(doctorsPayload.data)
        ? doctorsPayload.data
        : doctorsPayload.data?.data || [];

      setRows(rowsData);
      setMeta(
        appointmentsPayload.meta || appointmentsPayload.data?.meta || null,
      );
      setDoctors(doctorRows);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.msg ||
          "Failed to load appointments.",
      );
    } finally {
      setLoading(false);
    }
  };

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();

    return rows.filter((item) => {
      const patient = String(item.patient?.name || "").toLowerCase();
      const doctor = String(
        item.doctor?.name || item.doctor_name || "",
      ).toLowerCase();
      const status = String(item.status || "").toLowerCase();

      const matchesSearch = !q || patient.includes(q) || doctor.includes(q);

      const matchesStatus =
        !statusFilter || status === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [rows, search, statusFilter]);

  const clearMessages = () => {
    setActionError("");
    setActionSuccess("");
  };

  const openCompleteFormFor = (item) => {
    clearMessages();

    setOpenCompleteId(item.id);

    setCompleteForm({
      doctor_name: item.doctor?.name || item.doctor_name || "",
      notes: item.notes || "",
    });
  };

  const submitComplete = async (appointmentId) => {
    try {
      clearMessages();

      setActingId(`complete-${appointmentId}`);

      const payload = {
        doctor_name: completeForm.doctor_name || null,
        notes: completeForm.notes || null,
      };

      const res = await axios.post(
        `/erp/appointments/${appointmentId}/complete`,
        payload,
      );

      const invoiceId = res?.data?.invoice_id;

      setActionSuccess("Appointment completed successfully");

      await loadAll();

      // redirect to payment page
      if (invoiceId) {
        navigate(`/admin/erp/invoices/${invoiceId}`);
      }
    } catch (err) {
      setActionError(
        err?.response?.data?.message ||
          err?.response?.data?.msg ||
          "Failed to complete appointment",
      );
    } finally {
      setActingId(null);
      setOpenCompleteId(null);
    }
  };

  if (loading) {
    return (
      <div className="text-center p-5">
        <div className="spinner-border text-primary"></div>
      </div>
    );
  }

  return (
    <div className="container-fluid px-0">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold mb-1">Appointments</h3>
          <p className="text-muted mb-0">
            Manage clinic appointments and visits
          </p>
        </div>

        <Link to="/admin/erp/appointments/create" className="btn btn-primary">
          Book Appointment
        </Link>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {actionError && <div className="alert alert-danger">{actionError}</div>}
      {actionSuccess && (
        <div className="alert alert-success">{actionSuccess}</div>
      )}

      <div className="card shadow-sm border-0">
        <div className="card-body p-0">
          <table className="table table-hover mb-0">
            <thead className="table-light">
              <tr>
                <th>ID</th>
                <th>Patient</th>
                <th>Doctor</th>
                <th>Date</th>
                <th>Time</th>
                <th>Status</th>
                <th style={{ width: 240 }}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredRows.map((item) => {
                const status = String(item.status || "").toLowerCase();
                const canComplete = status === "scheduled";

                return (
                  <>
                    <tr key={item.id}>
                      <td>#{item.id}</td>

                      <td>{item.patient?.name || "-"}</td>

                      <td>{item.doctor?.name || item.doctor_name || "-"}</td>

                      <td>{item.appointment_date}</td>

                      <td>{String(item.appointment_time || "").slice(0, 5)}</td>

                      <td>
                        <span className="badge bg-warning">{item.status}</span>
                      </td>

                      <td>
                        <div className="d-flex gap-2">
                          {canComplete && (
                            <button
                              className="btn btn-sm btn-success"
                              onClick={() => openCompleteFormFor(item)}
                            >
                              Complete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>

                    {openCompleteId === item.id && (
                      <tr>
                        <td colSpan="7" className="bg-light">
                          <div className="p-3">
                            <div className="row g-3">
                              <div className="col-md-4">
                                <label className="form-label">Doctor</label>

                                <input
                                  className="form-control"
                                  value={completeForm.doctor_name}
                                  onChange={(e) =>
                                    setCompleteForm((prev) => ({
                                      ...prev,
                                      doctor_name: e.target.value,
                                    }))
                                  }
                                />
                              </div>

                              <div className="col-md-8">
                                <label className="form-label">Notes</label>

                                <textarea
                                  className="form-control"
                                  rows="2"
                                  value={completeForm.notes}
                                  onChange={(e) =>
                                    setCompleteForm((prev) => ({
                                      ...prev,
                                      notes: e.target.value,
                                    }))
                                  }
                                />
                              </div>

                              <div className="col-12 d-flex gap-2">
                                <button
                                  className="btn btn-success"
                                  onClick={() => submitComplete(item.id)}
                                  disabled={actingId === `complete-${item.id}`}
                                >
                                  Confirm Complete
                                </button>

                                <button
                                  className="btn btn-outline-secondary"
                                  onClick={() => setOpenCompleteId(null)}
                                >
                                  Cancel
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
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "../../../services/axios";

export default function DoctorAvailabilityPage() {
  const { id } = useParams();

  const [doctor, setDoctor] = useState(null);
  const [rows, setRows] = useState([]);
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadDoctor();
  }, [id]);

  const loadDoctor = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await axios.get(`/erp/doctors/${id}`);
      const payload = res.data || {};

      setDoctor(payload.data || payload);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.msg ||
          "Failed to load doctor details.",
      );
    } finally {
      setLoading(false);
    }
  };

  const loadAvailability = async () => {
    try {
      setChecking(true);
      setError("");
      setRows([]);

      if (!date) {
        setError("Please select a date first.");
        return;
      }

      const res = await axios.get(`/erp/doctors/${id}/availability`, {
        params: { date },
      });

      const payload = res.data || {};
      const availabilityRows = Array.isArray(payload.data)
        ? payload.data
        : payload.data?.slots || payload.data || [];

      setRows(Array.isArray(availabilityRows) ? availabilityRows : []);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.msg ||
          "Failed to load doctor availability.",
      );
    } finally {
      setChecking(false);
    }
  };

  const normalizeSlot = (slot) => {
    if (typeof slot === "string") {
      return { label: slot, available: true };
    }

    return {
      label: slot.time || slot.label || slot.value || "-",
      available: slot.available ?? true,
    };
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
          <h3 className="fw-bold mb-1">Doctor Availability</h3>
          <p className="text-muted mb-0">
            Check available slots for this doctor
          </p>
        </div>

        <div className="d-flex gap-2">
          <Link to="/admin/erp/doctors" className="btn btn-outline-secondary">
            Back to Doctors
          </Link>

          <Link
            to={`/admin/erp/appointments/create?doctor_id=${id}`}
            className="btn btn-outline-success"
          >
            Book Appointment
          </Link>
        </div>
      </div>

      {error ? <div className="alert alert-danger">{error}</div> : null}

      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body">
          <div className="row g-3">
            <InfoItem label="Doctor Name" value={doctor?.name} />
            <InfoItem label="Email" value={doctor?.email} />
            <InfoItem label="Phone" value={doctor?.phone} />
            <InfoItem label="Specialty" value={doctor?.specialty} />
            <InfoItem
              label="Working Hours"
              value={`${doctor?.work_start || "-"} ${doctor?.work_end ? `→ ${doctor.work_end}` : ""}`}
            />
            <InfoItem label="Slot Minutes" value={doctor?.slot_minutes} />
          </div>
        </div>
      </div>

      <div className="card shadow-sm border-0 mb-4">
        <div className="card-header bg-white">
          <h5 className="mb-0">Check Availability</h5>
        </div>

        <div className="card-body">
          <div className="row g-3 align-items-end">
            <div className="col-12 col-md-4">
              <label className="form-label fw-semibold">Date</label>
              <input
                type="date"
                className="form-control"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            <div className="col-12 col-md-3 d-grid">
              <button
                className="btn btn-primary"
                onClick={loadAvailability}
                disabled={checking}
              >
                {checking ? "Checking..." : "Load Availability"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="card shadow-sm border-0">
        <div className="card-header bg-white">
          <h5 className="mb-0">Available Slots</h5>
        </div>

        <div className="card-body">
          {rows.length === 0 ? (
            <div className="text-muted">No slots loaded yet.</div>
          ) : (
            <div className="d-flex flex-wrap gap-2">
              {rows.map((slot, index) => {
                const item = normalizeSlot(slot);

                return (
                  <span
                    key={`${item.label}-${index}`}
                    className={`badge fs-6 px-3 py-2 bg-${item.available ? "success" : "secondary"}`}
                  >
                    {item.label}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoItem({ label, value }) {
  return (
    <div className="col-12 col-md-4">
      <div className="small text-muted">{label}</div>
      <div className="fw-semibold">{value || "-"}</div>
    </div>
  );
}

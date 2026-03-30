import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "../../../services/axios";
import { useTranslation } from "react-i18next";
import "./DoctorAvailabilityPage.css";

export default function DoctorAvailabilityPage() {
  const { t, i18n } = useTranslation();
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
          t("Failed to load doctor details."),
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
        setError(t("Please select a date first."));
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
          t("Failed to load doctor availability."),
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
          <span className="visually-hidden">{t("Loading...")}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="doctor-availability-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-text">
          <h1 className="page-title">{t("Doctor Availability")}</h1>
          <p className="page-subtitle">
            {t("Check available slots for this doctor")}
          </p>
        </div>

        <div className="header-actions">
          <Link to="/admin/erp/doctors" className="btn btn-outline-secondary">
            <i className="fas fa-arrow-left me-2"></i>
            {t("Back to Doctors")}
          </Link>

          <Link
            to={`/admin/erp/appointments/create?doctor_id=${id}`}
            className="btn btn-outline-success"
          >
            <i className="fas fa-calendar-plus me-2"></i>
            {t("Book Appointment")}
          </Link>
        </div>
      </div>

      {/* Error Alert */}
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

      {/* Doctor Info Card */}
      <div className="info-card">
        <div className="info-card-header">
          <i className="fas fa-user-md me-2"></i>
          <h5 className="mb-0">{t("Doctor Information")}</h5>
        </div>
        <div className="info-card-body">
          <div className="info-grid">
            <InfoItem label={t("Doctor Name")} value={doctor?.name} />
            <InfoItem label={t("Email")} value={doctor?.email} />
            <InfoItem label={t("Phone")} value={doctor?.phone} />
            <InfoItem label={t("Specialty")} value={doctor?.specialty} />
            <InfoItem
              label={t("Working Hours")}
              value={
                doctor?.work_start && doctor?.work_end
                  ? `${doctor.work_start} → ${doctor.work_end}`
                  : "-"
              }
            />
            <InfoItem
              label={t("Slot Duration")}
              value={
                doctor?.slot_minutes
                  ? `${doctor.slot_minutes} ${t("minutes")}`
                  : "-"
              }
            />
          </div>
        </div>
      </div>

      {/* Availability Check Card */}
      <div className="availability-card">
        <div className="availability-card-header">
          <i className="fas fa-calendar-check me-2"></i>
          <h5 className="mb-0">{t("Check Availability")}</h5>
        </div>

        <div className="availability-card-body">
          <div className="availability-form">
            <div className="date-field">
              <label className="field-label">
                <i className="fas fa-calendar-day me-1"></i>
                {t("Select Date")}
              </label>
              <input
                type="date"
                className="form-control"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            <button
              className="btn btn-primary btn-load"
              onClick={loadAvailability}
              disabled={checking}
            >
              {checking ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  {t("Checking...")}
                </>
              ) : (
                <>
                  <i className="fas fa-search me-2"></i>
                  {t("Load Availability")}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Available Slots Card */}
      <div className="slots-card">
        <div className="slots-card-header">
          <i className="fas fa-clock me-2"></i>
          <h5 className="mb-0">{t("Available Slots")}</h5>
          {date && rows.length > 0 && (
            <span className="selected-date">
              <i className="fas fa-calendar me-1"></i>
              {formatDate(date)}
            </span>
          )}
        </div>

        <div className="slots-card-body">
          {rows.length === 0 ? (
            <div className="empty-slots">
              <i className="fas fa-calendar-times empty-icon"></i>
              <p className="empty-text">
                {date
                  ? t("No slots available for this date")
                  : t("Select a date to check availability")}
              </p>
            </div>
          ) : (
            <div className="slots-grid">
              {rows.map((slot, index) => {
                const item = normalizeSlot(slot);
                return (
                  <div
                    key={`${item.label}-${index}`}
                    className={`slot-item ${item.available ? "available" : "unavailable"}`}
                  >
                    <i
                      className={`fas fa-${item.available ? "check-circle" : "times-circle"} me-2`}
                    ></i>
                    <span className="slot-time">{item.label}</span>
                    {!item.available && (
                      <span className="slot-badge">{t("Booked")}</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// InfoItem Component
function InfoItem({ label, value }) {
  return (
    <div className="info-item">
      <div className="info-label">{label}</div>
      <div className="info-value">{value || "-"}</div>
    </div>
  );
}

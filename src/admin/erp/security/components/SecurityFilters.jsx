import { memo } from "react";
import { useTranslation } from "react-i18next";

const SecurityFilters = memo(({ filters, onChange }) => {
  const { t } = useTranslation();

  const handleChange = (e) => {
    const { name, value } = e.target;
    onChange({ ...filters, [name]: value });
  };

  return (
    <div className="card mb-4">
      <div className="card-body">
        <div className="row g-3">
          <div className="col-md-3">
            <label className="form-label">{t("Event Type")}</label>
            <select
              name="type"
              className="form-select"
              value={filters.type}
              onChange={handleChange}
            >
              <option value="">{t("All Types")}</option>
              <option value="failed_login">{t("Failed Login")}</option>
              <option value="suspicious_activity">
                {t("Suspicious Activity")}
              </option>
              <option value="admin_override">{t("Admin Override")}</option>
            </select>
          </div>
          <div className="col-md-3">
            <label className="form-label">{t("Email")}</label>
            <input
              type="text"
              name="email"
              className="form-control"
              placeholder={t("Search by email")}
              value={filters.email}
              onChange={handleChange}
            />
          </div>
          <div className="col-md-2">
            <label className="form-label">{t("From")}</label>
            <input
              type="date"
              name="dateFrom"
              className="form-control"
              value={filters.dateFrom}
              onChange={handleChange}
            />
          </div>
          <div className="col-md-2">
            <label className="form-label">{t("To")}</label>
            <input
              type="date"
              name="dateTo"
              className="form-control"
              value={filters.dateTo}
              onChange={handleChange}
            />
          </div>
          <div className="col-md-2 d-flex align-items-end">
            <button
              className="btn btn-outline-secondary w-100"
              onClick={() =>
                onChange({ type: "", email: "", dateFrom: "", dateTo: "" })
              }
            >
              {t("Clear Filters")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

export default SecurityFilters;

import { memo } from "react";
import { useTranslation } from "react-i18next";

const SecurityFilters = ({ filters, onFilterChange }) => {
  const { t } = useTranslation();

  return (
    <div className="security-filters">
      <div className="filter-group">
        <label>
          <i className="fas fa-tag"></i> {t("Type")}
        </label>
        <select
          value={filters.type}
          onChange={(e) => onFilterChange("type", e.target.value)}
        >
          <option value="">{t("All Types")}</option>
          <option value="failed_login">{t("Failed Login")}</option>
          <option value="suspicious_activity">
            {t("Suspicious Activity")}
          </option>
          <option value="admin_override">{t("Admin Override")}</option>
        </select>
      </div>

      <div className="filter-group">
        <label>
          <i className="fas fa-envelope"></i> {t("Email")}
        </label>
        <input
          type="text"
          value={filters.email}
          onChange={(e) => onFilterChange("email", e.target.value)}
          placeholder={t("Search by email")}
        />
      </div>

      <div className="filter-group">
        <label>
          <i className="fas fa-calendar"></i> {t("Date")}
        </label>
        <input
          type="date"
          value={filters.date}
          onChange={(e) => onFilterChange("date", e.target.value)}
        />
      </div>

      {(filters.type || filters.email || filters.date) && (
        <button
          className="btn-clear-filters"
          onClick={() => {
            onFilterChange("type", "");
            onFilterChange("email", "");
            onFilterChange("date", "");
          }}
        >
          <i className="fas fa-times"></i> {t("Clear Filters")}
        </button>
      )}
    </div>
  );
};

export default memo(SecurityFilters);

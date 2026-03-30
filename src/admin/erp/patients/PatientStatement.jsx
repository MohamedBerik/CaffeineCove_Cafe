import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import api from "../../../services/axios";
import { notifyError } from "../../../utils/notify";
import { useTranslation } from "react-i18next";
import "./PatientStatement.css";

const PatientStatement = () => {
  const { t, i18n } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const uiEntity = useMemo(() => {
    return location.pathname.includes("/patients/") ? "patient" : "customer";
  }, [location.pathname]);

  const uiTitle = uiEntity === "patient" ? t("Patient") : t("Customer");
  const profilePath =
    uiEntity === "patient"
      ? `/admin/erp/patients/${id}/profile`
      : `/admin/erp/customers/${id}`;
  const timelinePath =
    uiEntity === "patient"
      ? `/admin/erp/patients/${id}/timeline`
      : `/admin/erp/patients/${id}/timeline`;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [activeFilter, setActiveFilter] = useState("all");

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fetchStatement = async (params = {}) => {
    setLoading(true);
    try {
      const res = await api.get(`/erp/customers/${id}/statement`, { params });
      setData(res.data);
    } catch (e) {
      console.error(e);
      notifyError(
        t("Failed to load {{entity}} statement", { entity: uiEntity }),
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatement();
  }, [id, uiEntity]);

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

  const handleFilter = () => {
    fetchStatement({
      from: from || undefined,
      to: to || undefined,
    });
    setActiveFilter("custom");
  };

  const handleQuickFilter = (days) => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    const fromDate = date.toISOString().split("T")[0];

    setFrom(fromDate);
    setTo("");
    fetchStatement({ from: fromDate });
    setActiveFilter(String(days));
  };

  const handlePrint = () => window.print();

  const handleReset = () => {
    setFrom("");
    setTo("");
    setActiveFilter("all");
    fetchStatement();
  };

  const getEntryTypeLabel = (type) => {
    const value = String(type || "").toLowerCase();
    const typeMap = {
      invoice: "Invoice",
      payment: "Payment",
      refund: "Refund",
      credit: "Credit",
      debit: "Debit",
    };
    return t(typeMap[value] || type || "-");
  };

  if (loading) {
    return (
      <div className="statement-loading">
        <div className="loading-spinner"></div>
        <p>{t("Loading {{entity}} statement...", { entity: uiEntity })}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="statement-error">
        <i className="fas fa-exclamation-circle"></i>
        <p>{t("Failed to load statement data")}</p>
        <button className="btn btn-primary" onClick={() => navigate(-1)}>
          {t("Go Back")}
        </button>
      </div>
    );
  }

  const { customer, period, opening_balance, entries, closing_balance } = data;

  const renderEntryLinks = (row) => {
    return (
      <div className="entry-links d-flex flex-wrap gap-2 mt-2">
        {row.invoice_id && (
          <Link
            to={`/admin/erp/invoices/${row.invoice_id}`}
            className="btn btn-sm btn-outline-success"
            title={t("View Invoice")}
          >
            <i className="fas fa-file-invoice me-1"></i>
            {t("Invoice")}
          </Link>
        )}

        {row.appointment_id && (
          <Link
            to={`/admin/erp/appointments/${row.appointment_id}/activity`}
            className="btn btn-sm btn-outline-primary"
            title={t("View Appointment")}
          >
            <i className="fas fa-calendar-alt me-1"></i>
            {t("Appointment")}
          </Link>
        )}

        {row.treatment_plan_id && (
          <Link
            to={`/admin/erp/treatment-plans/${row.treatment_plan_id}`}
            className="btn btn-sm btn-outline-info"
            title={t("View Treatment Plan")}
          >
            <i className="fas fa-notes-medical me-1"></i>
            {t("Plan")}
          </Link>
        )}
      </div>
    );
  };

  const renderMobileView = () => (
    <div className="customer-statement-mobile">
      <div className="mobile-header">
        <button className="btn-back" onClick={() => navigate(-1)}>
          <i className="fas fa-arrow-left"></i>
        </button>
        <h3>
          {uiTitle} {t("Statement")}
        </h3>
        <button className="btn-print" onClick={handlePrint}>
          <i className="fas fa-print"></i>
        </button>
      </div>

      <div className="customer-info-card">
        <div className="customer-header">
          <div className="customer-avatar">
            <i className="fas fa-user-circle"></i>
          </div>
          <div>
            <h4>{customer?.name || "-"}</h4>
            <p className="customer-code">
              {customer?.patient_code || customer?.code || t("No code")}
            </p>
          </div>
        </div>

        <div className="customer-details">
          {customer?.phone && (
            <div className="detail">
              <i className="fas fa-phone"></i>
              <span>{customer.phone}</span>
            </div>
          )}
          {customer?.email && (
            <div className="detail">
              <i className="fas fa-envelope"></i>
              <span>{customer.email}</span>
            </div>
          )}
        </div>

        <div className="d-flex flex-wrap gap-2 mt-3">
          <Link to={profilePath} className="btn btn-outline-primary btn-sm">
            <i className="fas fa-user me-1"></i>
            {t("Profile")}
          </Link>
          <Link to={timelinePath} className="btn btn-outline-info btn-sm">
            <i className="fas fa-history me-1"></i>
            {t("Timeline")}
          </Link>
        </div>
      </div>

      <div className="filters-section">
        <div className="quick-filters">
          <button
            className={`filter-btn ${activeFilter === "all" ? "active" : ""}`}
            onClick={handleReset}
          >
            {t("All Time")}
          </button>
          <button
            className={`filter-btn ${activeFilter === "30" ? "active" : ""}`}
            onClick={() => handleQuickFilter(30)}
          >
            {t("Last 30 Days")}
          </button>
          <button
            className={`filter-btn ${activeFilter === "90" ? "active" : ""}`}
            onClick={() => handleQuickFilter(90)}
          >
            {t("Last 90 Days")}
          </button>
        </div>

        <div className="date-filters">
          <div className="date-input">
            <label>{t("From")}</label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>
          <div className="date-input">
            <label>{t("To")}</label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
          <button className="btn-apply" onClick={handleFilter}>
            {t("Apply")}
          </button>
          <button className="btn-reset" onClick={handleReset}>
            {t("Reset")}
          </button>
        </div>
      </div>

      <div className="summary-cards">
        <div className="summary-card">
          <div className="summary-label">{t("Opening Balance")}</div>
          <div className="summary-value">{formatCurrency(opening_balance)}</div>
        </div>
        <div className="summary-card">
          <div className="summary-label">{t("Closing Balance")}</div>
          <div className="summary-value">{formatCurrency(closing_balance)}</div>
        </div>
        <div className="summary-card">
          <div className="summary-label">{t("Total Entries")}</div>
          <div className="summary-value">{entries?.length || 0}</div>
        </div>
      </div>

      <div className="period-info">
        <i className="fas fa-calendar-alt"></i>
        <span>
          {formatDate(period?.from) || "-"} → {formatDate(period?.to) || "-"}
        </span>
      </div>

      <div className="statement-entries">
        <div className="entry-section">
          <div className="entry-header opening">
            <h5>{t("Opening Balance")}</h5>
            <span className="balance">{formatCurrency(opening_balance)}</span>
          </div>
        </div>

        {!entries || entries.length === 0 ? (
          <div className="no-entries">
            <i className="fas fa-file-invoice"></i>
            <p>{t("No entries in this period")}</p>
          </div>
        ) : (
          entries.map((row, index) => (
            <div key={row.id || index} className="entry-card">
              <div className="entry-date">
                <span className="date">{formatDate(row.entry_date)}</span>
                <span className={`entry-type type-${row.type}`}>
                  {getEntryTypeLabel(row.type)}
                </span>
              </div>

              <div className="entry-details">
                <h6>{row.description || "-"}</h6>
                <div className="entry-meta">
                  {row.invoice_id && (
                    <span>
                      {t("Invoice")} #{row.invoice_id}
                    </span>
                  )}
                  {row.payment_id && (
                    <span>
                      {t("Payment")} #{row.payment_id}
                    </span>
                  )}
                  {row.refund_id && (
                    <span>
                      {t("Refund")} #{row.refund_id}
                    </span>
                  )}
                  {row.treatment_plan_id && (
                    <span>
                      {t("Plan")} #{row.treatment_plan_id}
                    </span>
                  )}
                </div>
                {renderEntryLinks(row)}
              </div>

              <div className="entry-amounts">
                <div className="amount debit">
                  <span>{t("Debit")}</span>
                  <span>{formatCurrency(row.debit)}</span>
                </div>
                <div className="amount credit">
                  <span>{t("Credit")}</span>
                  <span>{formatCurrency(row.credit)}</span>
                </div>
                <div className="amount balance">
                  <span>{t("Balance")}</span>
                  <span>{formatCurrency(row.balance)}</span>
                </div>
              </div>
            </div>
          ))
        )}

        <div className="entry-section">
          <div className="entry-header closing">
            <h5>{t("Closing Balance")}</h5>
            <span className="balance">{formatCurrency(closing_balance)}</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDesktopView = () => (
    <div className="customer-statement-desktop">
      <div className="statement-header">
        <div className="header-left">
          <button className="btn-back" onClick={() => navigate(-1)}>
            <i className="fas fa-arrow-left"></i>
          </button>
          <div>
            <h1>
              {uiTitle} {t("Statement")}
            </h1>
            <p className="header-subtitle">
              {t("Account summary and transaction details")}
            </p>
          </div>
        </div>

        <div className="header-right d-flex gap-2">
          <Link to={profilePath} className="btn btn-outline-primary">
            <i className="fas fa-user me-1"></i>
            {t("Profile")}
          </Link>
          <Link to={timelinePath} className="btn btn-outline-info">
            <i className="fas fa-history me-1"></i>
            {t("Timeline")}
          </Link>
          <button className="btn-print" onClick={handlePrint}>
            <i className="fas fa-print me-1"></i> {t("Print Statement")}
          </button>
        </div>
      </div>

      <div className="statement-content">
        <div className="customer-profile">
          <div className="profile-header">
            <div className="profile-avatar">
              <i className="fas fa-user-circle"></i>
            </div>
            <div className="profile-info">
              <h3>{customer?.name || "-"}</h3>
              <div className="profile-details">
                {customer?.patient_code && (
                  <span>
                    {t("Code")}: {customer.patient_code}
                  </span>
                )}
                {customer?.phone && (
                  <span>
                    <i className="fas fa-phone"></i> {customer.phone}
                  </span>
                )}
                {customer?.email && (
                  <span>
                    <i className="fas fa-envelope"></i> {customer.email}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="filters-panel">
          <div className="quick-filters">
            <h4>{t("Quick Filters")}</h4>
            <div className="filter-buttons">
              <button
                className={`filter-btn ${activeFilter === "all" ? "active" : ""}`}
                onClick={handleReset}
              >
                {t("All Time")}
              </button>
              <button
                className={`filter-btn ${activeFilter === "30" ? "active" : ""}`}
                onClick={() => handleQuickFilter(30)}
              >
                {t("Last 30 Days")}
              </button>
              <button
                className={`filter-btn ${activeFilter === "90" ? "active" : ""}`}
                onClick={() => handleQuickFilter(90)}
              >
                {t("Last 90 Days")}
              </button>
            </div>
          </div>

          <div className="date-filters">
            <h4>{t("Custom Date Range")}</h4>
            <div className="date-inputs">
              <div className="input-group">
                <label>{t("From Date")}</label>
                <input
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                />
              </div>
              <div className="input-group">
                <label>{t("To Date")}</label>
                <input
                  type="date"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                />
              </div>
              <button className="btn-apply" onClick={handleFilter}>
                {t("Apply Filter")}
              </button>
              <button className="btn-reset" onClick={handleReset}>
                {t("Reset")}
              </button>
            </div>
          </div>

          <div className="period-display">
            <h4>{t("Statement Period")}</h4>
            <div className="period-range">
              <i className="fas fa-calendar"></i>
              <span>
                {formatDate(period?.from) || "-"} {t("to")}{" "}
                {formatDate(period?.to) || "-"}
              </span>
            </div>
          </div>
        </div>

        <div className="summary-cards">
          <div className="summary-card">
            <div className="card-header">
              <i className="fas fa-wallet"></i>
              <h5>{t("Opening Balance")}</h5>
            </div>
            <div className="card-value">{formatCurrency(opening_balance)}</div>
          </div>
          <div className="summary-card">
            <div className="card-header">
              <i className="fas fa-chart-line"></i>
              <h5>{t("Closing Balance")}</h5>
            </div>
            <div className="card-value">{formatCurrency(closing_balance)}</div>
          </div>
          <div className="summary-card">
            <div className="card-header">
              <i className="fas fa-list"></i>
              <h5>{t("Total Entries")}</h5>
            </div>
            <div className="card-value">{entries?.length || 0}</div>
          </div>
        </div>

        <div className="statement-table">
          <div className="table-header">
            <h3>
              <i className="fas fa-receipt"></i> {t("Statement Entries")}
            </h3>
          </div>

          <div className="table-container">
            <table className="statement-table-content">
              <thead>
                <tr>
                  <th>{t("Date")}</th>
                  <th>{t("Description")}</th>
                  <th>{t("Type")}</th>
                  <th className="text-right">{t("Debit")}</th>
                  <th className="text-right">{t("Credit")}</th>
                  <th className="text-right">{t("Balance")}</th>
                </tr>
              </thead>
              <tbody>
                <tr className="opening-row">
                  <td colSpan="5" className="opening-label">
                    <i className="fas fa-sign-in-alt"></i>{" "}
                    {t("Opening Balance")}
                  </td>
                  <td className="text-right opening-balance">
                    {formatCurrency(opening_balance)}
                  </td>
                </tr>

                {!entries || entries.length === 0 ? (
                  <tr className="no-data-row">
                    <td colSpan="6" className="text-center">
                      <i className="fas fa-file-invoice-dollar"></i>
                      <p>{t("No entries in this period")}</p>
                    </td>
                  </tr>
                ) : (
                  entries.map((row, index) => (
                    <tr key={row.id || index} className="entry-row">
                      <td className="entry-date">
                        {formatDate(row.entry_date)}
                      </td>
                      <td>
                        <div className="entry-description">
                          {row.description || "-"}
                        </div>
                        <div className="entry-meta">
                          {row.invoice_id && (
                            <span>
                              {t("Invoice")} #{row.invoice_id}
                            </span>
                          )}
                          {row.payment_id && (
                            <span>
                              {t("Payment")} #{row.payment_id}
                            </span>
                          )}
                          {row.refund_id && (
                            <span>
                              {t("Refund")} #{row.refund_id}
                            </span>
                          )}
                          {row.treatment_plan_id && (
                            <span>
                              {t("Plan")} #{row.treatment_plan_id}
                            </span>
                          )}
                          {row.appointment_id && (
                            <span>
                              {t("Appointment")} #{row.appointment_id}
                            </span>
                          )}
                        </div>
                        {renderEntryLinks(row)}
                      </td>
                      <td>
                        <span className={`type-badge type-${row.type}`}>
                          {getEntryTypeLabel(row.type)}
                        </span>
                      </td>
                      <td className="text-right debit-col">
                        {formatCurrency(row.debit)}
                      </td>
                      <td className="text-right credit-col">
                        {formatCurrency(row.credit)}
                      </td>
                      <td className="text-right balance-col">
                        {formatCurrency(row.balance)}
                      </td>
                    </tr>
                  ))
                )}

                <tr className="closing-row">
                  <td colSpan="5" className="closing-label">
                    <i className="fas fa-sign-out-alt"></i>{" "}
                    {t("Closing Balance")}
                  </td>
                  <td className="text-right closing-balance">
                    {formatCurrency(closing_balance)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );

  return isMobile ? renderMobileView() : renderDesktopView();
};

export default PatientStatement;

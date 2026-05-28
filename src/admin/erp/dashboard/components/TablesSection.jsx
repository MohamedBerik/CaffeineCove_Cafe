import { memo } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import EmptyState from "./EmptyState";
import StatusBadge from "./StatusBadge";

const TablesSection = ({
  recentAppointments,
  recentInvoices,
  recentPayments,
  recentPurchaseOrders,
  lowStockSupplies,
  failedReminders,
  formatCurrency,
  formatDate,
  formatTime,
  formatDateTime,
  i18n,
}) => {
  const { t } = useTranslation();

  return (
    <div className="tables-grid">
      {/* Recent Appointments */}
      <div className="dashboard-card">
        <div className="card-header-custom">
          <div className="card-title-wrapper">
            <i className="fas fa-calendar-alt"></i>
            <h5 className="card-title">{t("Recent Appointments")}</h5>
          </div>
          <Link to="/admin/erp/appointments/calendar" className="card-link">
            {t("View All")} <i className="fas fa-arrow-right"></i>
          </Link>
        </div>
        <div className="card-body-custom">
          {recentAppointments.length === 0 ? (
            <EmptyState text={t("No recent appointments.")} />
          ) : (
            <div className="table-responsive">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>{t("Patient")}</th>
                    <th>{t("Doctor")}</th>
                    <th>{t("Date")}</th>
                    <th>{t("Status")}</th>
                  </tr>
                </thead>
                <tbody>
                  {recentAppointments.map((item) => (
                    <tr key={item.id}>
                      <td data-label={t("Patient")}>
                        {item.patient?.id ? (
                          <Link
                            to={`/admin/erp/patients/${item.patient.id}/profile`}
                            className="patient-link"
                          >
                            {item.patient?.name || "-"}
                          </Link>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td data-label={t("Doctor")}>
                        {item.doctor?.name || item.doctor_name || "-"}
                      </td>
                      <td data-label={t("Date")}>
                        {formatDate(item.appointment_date, i18n.language)}{" "}
                        {formatTime(item.appointment_time)}
                      </td>
                      <td data-label={t("Status")}>
                        <StatusBadge status={item.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Recent Invoices */}
      <div className="dashboard-card">
        <div className="card-header-custom">
          <div className="card-title-wrapper">
            <i className="fas fa-file-invoice"></i>
            <h5 className="card-title">{t("Recent Invoices")}</h5>
          </div>
          <Link to="/admin/erp/invoices" className="card-link">
            {t("View All")} <i className="fas fa-arrow-right"></i>
          </Link>
        </div>
        <div className="card-body-custom">
          {recentInvoices.length === 0 ? (
            <EmptyState text={t("No recent invoices.")} />
          ) : (
            <div className="table-responsive">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>{t("Number")}</th>
                    <th>{t("Total")}</th>
                    <th>{t("Status")}</th>
                    <th>{t("Issued")}</th>
                  </tr>
                </thead>
                <tbody>
                  {recentInvoices.map((item) => (
                    <tr key={item.id}>
                      <td data-label={t("Number")}>
                        <Link
                          to={`/admin/erp/invoices/${item.id}`}
                          className="invoice-link"
                        >
                          {item.number}
                        </Link>
                      </td>
                      <td data-label={t("Total")} className="fw-semibold">
                        {formatCurrency(item.total)}
                      </td>
                      <td data-label={t("Status")}>
                        <StatusBadge status={item.status} />
                      </td>
                      <td data-label={t("Issued")}>
                        {formatDate(
                          item.issued_at || item.created_at,
                          i18n.language,
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Recent Payments */}
      <div className="dashboard-card">
        <div className="card-header-custom">
          <div className="card-title-wrapper">
            <i className="fas fa-credit-card"></i>
            <h5 className="card-title">{t("Recent Payments")}</h5>
          </div>
          <Link to="/admin/erp/invoices" className="card-link">
            {t("View All")} <i className="fas fa-arrow-right"></i>
          </Link>
        </div>
        <div className="card-body-custom">
          {recentPayments.length === 0 ? (
            <EmptyState text={t("No recent payments.")} />
          ) : (
            <div className="table-responsive">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>{t("Invoice")}</th>
                    <th>{t("Applied")}</th>
                    <th>{t("Method")}</th>
                    <th>{t("Paid At")}</th>
                  </tr>
                </thead>
                <tbody>
                  {recentPayments.map((item) => (
                    <tr key={item.id}>
                      <td data-label={t("Invoice")}>
                        <Link
                          to={`/admin/erp/invoices/${item.invoice_id}`}
                          className="invoice-link"
                        >
                          #{item.invoice_id}
                        </Link>
                      </td>
                      <td
                        data-label={t("Applied")}
                        className="fw-semibold text-success"
                      >
                        {formatCurrency(item.applied_amount)}
                      </td>
                      <td data-label={t("Method")} className="text-capitalize">
                        {item.method || "-"}
                      </td>
                      <td data-label={t("Paid At")}>
                        {formatDateTime(
                          item.paid_at || item.created_at,
                          i18n.language,
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Recent Purchase Orders */}
      <div className="dashboard-card">
        <div className="card-header-custom">
          <div className="card-title-wrapper">
            <i className="fas fa-truck"></i>
            <h5 className="card-title">{t("Recent Purchase Orders")}</h5>
          </div>
          <Link to="/admin/erp/purchase-orders" className="card-link">
            {t("View All")} <i className="fas fa-arrow-right"></i>
          </Link>
        </div>
        <div className="card-body-custom">
          {recentPurchaseOrders.length === 0 ? (
            <EmptyState text={t("No recent purchase orders.")} />
          ) : (
            <div className="table-responsive">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>{t("PO #")}</th>
                    <th>{t("Supplier")}</th>
                    <th>{t("Total")}</th>
                    <th>{t("Paid")}</th>
                    <th>{t("Remaining")}</th>
                    <th>{t("Status")}</th>
                  </tr>
                </thead>
                <tbody>
                  {recentPurchaseOrders.map((po) => (
                    <tr key={po.id}>
                      <td data-label={t("PO #")}>
                        <Link
                          to={`/admin/erp/purchase-orders/${po.id}`}
                          className="invoice-link"
                        >
                          {po.number}
                        </Link>
                      </td>
                      <td data-label={t("Supplier")}>{po.supplier || "-"}</td>
                      <td data-label={t("Total")}>
                        {formatCurrency(po.total)}
                      </td>
                      <td data-label={t("Paid")}>
                        {formatCurrency(po.total_paid)}
                      </td>
                      <td data-label={t("Remaining")}>
                        {formatCurrency(po.remaining)}
                      </td>
                      <td data-label={t("Status")}>
                        <StatusBadge status={po.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Low Stock Supplies */}
      {lowStockSupplies.length > 0 && (
        <div className="dashboard-card warning-card">
          <div className="card-header-custom">
            <div className="card-title-wrapper">
              <i className="fas fa-exclamation-triangle"></i>
              <h5 className="card-title">{t("Low Stock Supplies")}</h5>
            </div>
            <Link to="/admin/erp/supplies" className="card-link">
              {t("View All")} <i className="fas fa-arrow-right"></i>
            </Link>
          </div>
          <div className="card-body-custom">
            <div className="table-responsive">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>{t("Name")}</th>
                    <th>{t("In Stock")}</th>
                    <th>{t("Unit Cost")}</th>
                    <th>{t("Total Value")}</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStockSupplies.map((item) => (
                    <tr key={item.id}>
                      <td data-label={t("Name")}>
                        <Link
                          to={`/admin/erp/supplies/${item.id}/edit`}
                          className="invoice-link"
                        >
                          {item.name}
                        </Link>
                      </td>
                      <td
                        data-label={t("In Stock")}
                        className="text-danger fw-bold"
                      >
                        {item.stock_quantity}
                      </td>
                      <td data-label={t("Unit Cost")}>
                        {formatCurrency(item.unit_cost)}
                      </td>
                      <td data-label={t("Total Value")}>
                        {formatCurrency(item.inventory_value)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Failed Reminders */}
      {failedReminders.length > 0 && (
        <div className="dashboard-card warning-card">
          <div className="card-header-custom">
            <div className="card-title-wrapper">
              <i className="fas fa-bell-slash"></i>
              <h5 className="card-title">{t("Failed Reminders")}</h5>
            </div>
          </div>
          <div className="card-body-custom">
            <div className="table-responsive">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>{t("Appointment")}</th>
                    <th>{t("Doctor")}</th>
                    <th>{t("Date")}</th>
                    <th>{t("Retries")}</th>
                    <th>{t("Last Attempt")}</th>
                  </tr>
                </thead>
                <tbody>
                  {failedReminders.map((item) => (
                    <tr key={item.id}>
                      <td data-label={t("Appointment")}>#{item.id}</td>
                      <td data-label={t("Doctor")}>
                        {item.doctor_name || "-"}
                      </td>
                      <td data-label={t("Date")}>
                        {formatDate(item.appointment_date, i18n.language)}
                      </td>
                      <td
                        data-label={t("Retries")}
                        className="text-danger fw-bold"
                      >
                        {item.reminder_retry_count}
                      </td>
                      <td data-label={t("Last Attempt")}>
                        {formatDateTime(
                          item.reminder_last_attempt_at,
                          i18n.language,
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default memo(TablesSection);

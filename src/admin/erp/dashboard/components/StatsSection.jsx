import { memo } from "react";
import { useTranslation } from "react-i18next";
import KpiCard from "./KpiCard";

const StatsSection = ({ kpis, formatCurrency }) => {
  const { t } = useTranslation();

  const totalRevenue = kpis.revenue?.current || 0;
  const completionRate = kpis.appointments?.current
    ? Math.round(
        (kpis.completed_appointments?.current / kpis.appointments?.current) *
          100,
      )
    : 0;
  const reminderStats = kpis.reminders?.stats || {}; // غير متوفر مباشرة، سنمرره من الخارج

  return (
    <>
      {/* Quick Stats */}
      <div className="quick-stats">
        <div className="quick-stat-card">
          <div className="stat-icon primary">
            <i className="fas fa-calendar-check"></i>
          </div>
          <div className="stat-info">
            <span className="stat-value">
              {kpis.appointments?.current ?? 0}
            </span>
            <span className="stat-label">{t("Appointments")}</span>
          </div>
          <div className="stat-trend up">
            <i className="fas fa-arrow-up"></i>
            <span>{completionRate}%</span>
          </div>
        </div>
        <div className="quick-stat-card">
          <div className="stat-icon success">
            <i className="fas fa-dollar-sign"></i>
          </div>
          <div className="stat-info">
            <span className="stat-value">{formatCurrency(totalRevenue)}</span>
            <span className="stat-label">{t("Total Revenue")}</span>
          </div>
        </div>
        <div className="quick-stat-card">
          <div className="stat-icon warning">
            <i className="fas fa-clock"></i>
          </div>
          <div className="stat-info">
            <span className="stat-value">
              {kpis.reminders?.stats?.pending ?? 0}
            </span>
            <span className="stat-label">{t("Pending Reminders")}</span>
          </div>
        </div>
        <div className="quick-stat-card">
          <div className="stat-icon info">
            <i className="fas fa-users"></i>
          </div>
          <div className="stat-info">
            <span className="stat-value">
              {kpis.total_patients?.current ?? 0}
            </span>
            <span className="stat-label">{t("New Patients")}</span>
          </div>
        </div>
      </div>

      {/* Financial Overview */}
      <div className="section-header">
        <h2>{t("Financial Overview")}</h2>
        <p>{t("Key financial health indicators")}</p>
      </div>
      <div className="kpis-grid">
        <KpiCard
          title={t("Net Profit")}
          value={formatCurrency(kpis.net_profit?.current || 0)}
          icon="fas fa-chart-pie"
          color={(kpis.net_profit?.current || 0) >= 0 ? "success" : "danger"}
          delta={kpis.net_profit?.delta}
          deltaLabel={t("vs previous")}
        />
        <KpiCard
          title={t("Outstanding Receivables")}
          value={formatCurrency(kpis.outstanding_receivables?.current || 0)}
          icon="fas fa-hand-holding-usd"
          color="warning"
          link="/admin/erp/invoices"
        />
        <KpiCard
          title={t("Outstanding Payables")}
          value={formatCurrency(kpis.outstanding_payables?.current || 0)}
          icon="fas fa-money-check-alt"
          color="danger"
          link="/admin/erp/purchase-orders"
        />
      </div>
    </>
  );
};

export default memo(StatsSection);

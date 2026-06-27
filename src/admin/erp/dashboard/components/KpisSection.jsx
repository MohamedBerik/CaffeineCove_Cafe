import { memo } from "react";
import { useTranslation } from "react-i18next";
import KpiCard from "./KpiCard";

const KpisSection = ({ kpis, formatCurrency }) => {
  const { t } = useTranslation();

  return (
    <>
      <div className="section-header">
        <h2>{t("Key Performance Indicators")}</h2>
        <p>{t("Monitor your clinic's performance at a glance")}</p>
      </div>
      <div className="kpis-grid">
        <KpiCard
          title={t("Revenue")}
          value={formatCurrency(kpis.revenue?.current || 0)}
          icon="fas fa-money-bill-wave"
          color="success"
          delta={kpis.revenue?.delta}
          deltaLabel={t("vs previous")}
        />
        <KpiCard
          title={t("Appointments")}
          value={kpis.appointments?.current || 0}
          icon="fas fa-calendar-check"
          color="primary"
          delta={kpis.appointments?.delta}
          deltaLabel={t("vs previous")}
        />
        <KpiCard
          title={t("Completed")}
          value={kpis.completed_appointments?.current || 0}
          icon="fas fa-check-circle"
          color="info"
          delta={kpis.completed_appointments?.delta}
          deltaLabel={t("vs previous")}
        />
        <KpiCard
          title={t("Cancelled")}
          value={kpis.cancelled_appointments?.current || 0}
          icon="fas fa-times-circle"
          color="danger"
          delta={kpis.cancelled_appointments?.delta}
          deltaLabel={t("vs previous")}
        />
        <KpiCard
          title={t("No Show")}
          value={kpis.no_show_appointments?.current || 0}
          icon="fas fa-user-slash"
          color="warning"
          delta={kpis.no_show_appointments?.delta}
          deltaLabel={t("vs previous")}
        />
        <KpiCard
          title={t("Unpaid Invoices")}
          value={kpis.unpaid_invoices?.current || 0}
          icon="fas fa-file-invoice"
          color="danger"
          delta={kpis.unpaid_invoices?.delta}
          deltaLabel={t("vs previous")}
          link="/admin/erp/invoices"
        />
        <KpiCard
          title={t("Paid Invoices")}
          value={kpis.paid_invoices?.current || 0}
          icon="fas fa-check-double"
          color="success"
          delta={kpis.paid_invoices?.delta}
          deltaLabel={t("vs previous")}
          link="/admin/erp/invoices"
        />
        <KpiCard
          title={t("New Patients")}
          value={kpis.total_patients?.current || 0}
          icon="fas fa-user-plus"
          color="primary"
          delta={kpis.total_patients?.delta}
          deltaLabel={t("vs previous")}
          link="/admin/erp/patients"
        />
      </div>
    </>
  );
};

export default memo(KpisSection);

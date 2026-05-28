import { memo } from "react";
import { useTranslation } from "react-i18next";
import KpiCard from "./KpiCard";

const PurchasesSection = ({ kpis, formatCurrency }) => {
  const { t } = useTranslation();

  return (
    <>
      <div className="section-header">
        <h2>{t("Purchases")}</h2>
        <p>{t("Monitor your procurement and supplier payments")}</p>
      </div>
      <div className="kpis-grid">
        <KpiCard
          title={t("Purchase Total")}
          value={formatCurrency(kpis.purchase_total?.current || 0)}
          icon="fas fa-shopping-cart"
          color="info"
          delta={kpis.purchase_total?.delta}
          deltaLabel={t("vs previous")}
        />
        <KpiCard
          title={t("Orders Count")}
          value={kpis.purchase_orders_count?.current || 0}
          icon="fas fa-clipboard-list"
          color="primary"
          delta={kpis.purchase_orders_count?.delta}
          deltaLabel={t("vs previous")}
        />
        <KpiCard
          title={t("Paid to Suppliers")}
          value={formatCurrency(kpis.supplier_payments?.current || 0)}
          icon="fas fa-credit-card"
          color="success"
          delta={kpis.supplier_payments?.delta}
          deltaLabel={t("vs previous")}
        />
        <KpiCard
          title={t("Purchase Returns")}
          value={formatCurrency(kpis.purchase_returns?.current || 0)}
          icon="fas fa-undo-alt"
          color="danger"
          delta={kpis.purchase_returns?.delta}
          deltaLabel={t("vs previous")}
        />
        <KpiCard
          title={t("Net Purchases")}
          value={formatCurrency(kpis.purchase_net?.current || 0)}
          icon="fas fa-receipt"
          color="primary"
          delta={kpis.purchase_net?.delta}
          deltaLabel={t("vs previous")}
        />
        <KpiCard
          title={
            (kpis.purchase_balance?.current || 0) < 0
              ? t("Supplier Credits")
              : t("Purchase Balance")
          }
          value={
            (kpis.purchase_balance?.current || 0) < 0
              ? formatCurrency(Math.abs(kpis.purchase_balance?.current || 0))
              : formatCurrency(kpis.purchase_balance?.current || 0)
          }
          icon={
            (kpis.purchase_balance?.current || 0) < 0
              ? "fas fa-hand-holding-heart"
              : "fas fa-balance-scale"
          }
          color={
            (kpis.purchase_balance?.current || 0) < 0 ? "success" : "secondary"
          }
          delta={kpis.purchase_balance?.delta}
          deltaLabel={t("vs previous")}
        />
      </div>
    </>
  );
};

export default memo(PurchasesSection);

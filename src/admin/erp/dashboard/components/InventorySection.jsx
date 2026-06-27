import { memo } from "react";
import { useTranslation } from "react-i18next";
import KpiCard from "./KpiCard";

const InventorySection = ({ kpis, formatCurrency }) => {
  const { t } = useTranslation();

  return (
    <>
      <div className="section-header">
        <h2>{t("Inventory")}</h2>
        <p>{t("Stock levels and inventory valuation")}</p>
      </div>
      <div className="kpis-grid">
        <KpiCard
          title={t("Low Stock Supplies")}
          value={kpis.low_stock_supplies?.current || 0}
          icon="fas fa-exclamation-triangle"
          color="warning"
          link="/admin/erp/supplies"
        />
        <KpiCard
          title={t("Inventory Value")}
          value={formatCurrency(kpis.inventory_value?.current || 0)}
          icon="fas fa-boxes"
          color="info"
          link="/admin/erp/supplies"
        />
      </div>
    </>
  );
};

export default memo(InventorySection);

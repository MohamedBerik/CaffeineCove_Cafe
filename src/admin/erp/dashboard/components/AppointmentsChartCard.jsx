import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const AppointmentsTooltip = React.memo(({ active, payload, t }) => {
  if (!active || !payload?.length) return null;
  const total = payload.find((p) => p.dataKey === "total")?.value || 0;
  const completed = payload.find((p) => p.dataKey === "completed")?.value || 0;
  const cancelled = payload.find((p) => p.dataKey === "cancelled")?.value || 0;

  return (
    <div className="custom-tooltip">
      <div className="tooltip-current">
        <span className="tooltip-label">{t("Total")}:</span>
        <span className="tooltip-value">{total}</span>
      </div>
      <div className="tooltip-current">
        <span className="tooltip-label">{t("Completed")}:</span>
        <span className="tooltip-value" style={{ color: "#4caf50" }}>
          {completed}
        </span>
      </div>
      <div className="tooltip-current">
        <span className="tooltip-label">{t("Cancelled")}:</span>
        <span className="tooltip-value" style={{ color: "#ef4444" }}>
          {cancelled}
        </span>
      </div>
    </div>
  );
});

const AppointmentsChartCard = ({ data, t }) => {
  if (!data || data.length === 0) {
    return (
      <div className="chart-card">
        <div className="chart-header">
          <i className="fas fa-calendar-check"></i>
          <h4>{t("Appointments Overview")}</h4>
        </div>
        <div className="chart-empty">{t("No data available")}</div>
      </div>
    );
  }

  return (
    <div className="chart-card">
      <div className="chart-header">
        <i className="fas fa-calendar-check"></i>
        <h4>{t("Appointments Overview")}</h4>
      </div>
      <div className="chart-legend">
        <div className="legend-item">
          <span className="legend-color total"></span>
          <span>{t("Total Appointments")}</span>
        </div>
        <div className="legend-item">
          <span className="legend-color completed"></span>
          <span>{t("Completed")}</span>
        </div>
        <div className="legend-item">
          <span className="legend-color cancelled"></span>
          <span>{t("Cancelled")}</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data}>
          <XAxis dataKey="label" />
          <YAxis />
          <Tooltip content={<AppointmentsTooltip t={t} />} />
          <Bar dataKey="total" fill="#1a237e" radius={[8, 8, 0, 0]} />
          <Bar dataKey="completed" fill="#4caf50" radius={[8, 8, 0, 0]} />
          <Bar dataKey="cancelled" fill="#ef4444" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default React.memo(AppointmentsChartCard);

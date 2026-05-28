import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const AppointmentsTooltip = ({ active, payload, t }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="custom-tooltip">
      <div className="tooltip-current">
        <span className="tooltip-label">{t("Total")}:</span>
        <span className="tooltip-value">{payload[0]?.value || 0}</span>
      </div>
      <div className="tooltip-current">
        <span className="tooltip-label">{t("Completed")}:</span>
        <span className="tooltip-value" style={{ color: "#4caf50" }}>
          {payload[1]?.value || 0}
        </span>
      </div>
      <div className="tooltip-current">
        <span className="tooltip-label">{t("Cancelled")}:</span>
        <span className="tooltip-value" style={{ color: "#ef4444" }}>
          {payload[2]?.value || 0}
        </span>
      </div>
    </div>
  );
};

export default function AppointmentsChartCard({ data, t }) {
  if (!data || data.length === 0)
    return (
      <div className="chart-card">
        <div className="chart-header">
          <i className="fas fa-calendar-check"></i>
          <h4>{t("Appointments Overview")}</h4>
        </div>
        <div className="chart-empty">{t("No data available")}</div>
      </div>
    );

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
}

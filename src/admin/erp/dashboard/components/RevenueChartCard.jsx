import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { getAnomalyColor } from "../helpers";

const CustomTooltipWrapper = ({ active, payload, formatCurrency, t }) => {
  if (!active || !payload?.length) return null;
  const currentValue = payload.find((p) => p.dataKey === "current")?.value || 0;
  const previousValue =
    payload.find((p) => p.dataKey === "previous")?.value || 0;
  const anomaly = payload[0]?.payload?.anomaly;
  const change =
    previousValue !== 0
      ? ((currentValue - previousValue) / previousValue) * 100
      : 0;

  return (
    <div className="custom-tooltip">
      <div className="tooltip-current">
        <span className="tooltip-label">{t("Current")}:</span>
        <span className="tooltip-value">{formatCurrency(currentValue)}</span>
      </div>
      <div className="tooltip-previous">
        <span className="tooltip-label">{t("Previous")}:</span>
        <span className="tooltip-value">{formatCurrency(previousValue)}</span>
      </div>
      {previousValue > 0 && (
        <div
          className={`tooltip-change ${change >= 0 ? "positive" : "negative"}`}
        >
          <span className="tooltip-label">{t("Change")}:</span>
          <span className="tooltip-value">
            {change >= 0 ? "↑" : "↓"} {Math.abs(change).toFixed(1)}%
          </span>
        </div>
      )}
      {anomaly && (
        <div
          className="tooltip-anomaly"
          style={{ borderColor: getAnomalyColor(anomaly.priority) }}
        >
          <span className="anomaly-icon">⚠️</span>
          <span className="anomaly-message">{t(anomaly.message)}</span>
        </div>
      )}
    </div>
  );
};

export default function RevenueChartCard({
  data,
  t,
  formatCurrency,
  AnimatedDot,
  chartRef,
  focusRange,
  setFocusRange,
  showComparison,
}) {
  if (!data || data.length === 0)
    return (
      <div className="chart-card">
        <div className="chart-header">
          <i className="fas fa-chart-line"></i>
          <h4>{t("Revenue Overview")}</h4>
        </div>
        <div className="chart-empty">{t("No data available")}</div>
      </div>
    );

  return (
    <div className="chart-card" ref={chartRef}>
      <div className="chart-header">
        <i className="fas fa-chart-line"></i>
        <h4>{t("Revenue Overview")}</h4>
      </div>
      <div className="chart-legend">
        <div className="legend-item">
          <span className="legend-color current"></span>
          <span>{t("Current Period")}</span>
        </div>
        {showComparison && (
          <div className="legend-item">
            <span className="legend-color previous"></span>
            <span>{t("Previous Period")}</span>
          </div>
        )}
        {data.some((d) => d.anomaly) && (
          <div className="legend-item">
            <span className="legend-color anomaly"></span>
            <span>{t("Anomaly Detected")}</span>
          </div>
        )}
      </div>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data}>
          <XAxis dataKey="label" />
          <YAxis />
          <Tooltip
            content={
              <CustomTooltipWrapper formatCurrency={formatCurrency} t={t} />
            }
          />
          <Line
            type="monotone"
            dataKey="current"
            stroke="#1a237e"
            strokeWidth={3}
            dot={<AnimatedDot />}
            isAnimationActive={true}
            animationDuration={500}
          />
          {showComparison && (
            <Line
              type="monotone"
              dataKey="previous"
              stroke="#9ca3af"
              strokeDasharray="5 5"
              strokeWidth={2}
              dot={false}
              isAnimationActive={true}
              animationDuration={400}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
      {focusRange && (
        <button className="reset-view-btn" onClick={() => setFocusRange(null)}>
          <i className="fas fa-expand"></i> {t("Reset View")}
        </button>
      )}
    </div>
  );
}

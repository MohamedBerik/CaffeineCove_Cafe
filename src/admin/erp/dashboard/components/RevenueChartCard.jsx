import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { getAnomalyColor } from "../helpers"; // التصحيح

const CustomTooltipWrapper = ({ active, payload, formatCurrency, t }) => {
  if (!active || !payload?.length) return null;
  const currentItem = payload?.find?.((p) => p.dataKey === "current");
  const previousItem = payload?.find?.((p) => p.dataKey === "previous");
  const currentValue = currentItem?.value || 0;
  const previousValue = previousItem?.value || 0;
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

const AnimatedDot = (props) => {
  const { cx, cy, payload } = props;
  if (!payload?.anomaly) return null;
  return (
    <g>
      <circle
        cx={cx}
        cy={cy}
        r={8}
        className="pulse-dot"
        fill={getAnomalyColor(payload.anomaly.priority)}
      />
      <text
        x={cx}
        y={cy - 12}
        fontSize="12"
        textAnchor="middle"
        fill={getAnomalyColor(payload.anomaly.priority)}
      >
        ⚠️
      </text>
    </g>
  );
};

export default function RevenueChartCard({
  data,
  t,
  formatCurrency,
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
    <div className="chart-card">
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
          <YAxis tickFormatter={(v) => formatCurrency(v)} />
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
    </div>
  );
}

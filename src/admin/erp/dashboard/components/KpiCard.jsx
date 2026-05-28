import { memo } from "react";
import { Link } from "react-router-dom";

const colorMap = {
  primary: { bg: "rgba(26, 35, 126, 0.1)", text: "#1a237e", border: "#1a237e" },
  info: { bg: "rgba(3, 169, 244, 0.1)", text: "#03a9f4", border: "#03a9f4" },
  success: { bg: "rgba(76, 175, 80, 0.1)", text: "#4caf50", border: "#4caf50" },
  danger: { bg: "rgba(244, 67, 54, 0.1)", text: "#f44336", border: "#f44336" },
  warning: { bg: "rgba(255, 152, 0, 0.1)", text: "#ff9800", border: "#ff9800" },
  secondary: {
    bg: "rgba(108, 117, 125, 0.1)",
    text: "#6c757d",
    border: "#6c757d",
  },
  dark: { bg: "rgba(33, 37, 41, 0.1)", text: "#212529", border: "#212529" },
};

const KpiCard = ({
  title,
  value,
  icon,
  color = "primary",
  link,
  trend,
  delta,
  deltaLabel,
}) => {
  const colors = colorMap[color] || colorMap.primary;
  const safeDelta = Number(delta ?? 0);

  const cardContent = (
    <div className={`kpi-card premium-card ${link ? "clickable" : ""}`}>
      <div className="kpi-card-header">
        <div
          className="kpi-icon-wrapper"
          style={{ backgroundColor: colors.bg }}
        >
          <i className={icon} style={{ color: colors.text }}></i>
        </div>
        {trend && (
          <div
            className={`kpi-trend ${trend.includes("+") ? "positive" : "negative"}`}
          >
            <i
              className={`fas fa-arrow-${trend.includes("+") ? "up" : "down"}`}
            ></i>
            <span>{trend}</span>
          </div>
        )}
      </div>
      <div className="kpi-card-body">
        <span className="kpi-value">{value}</span>
        <span className="kpi-title">{title}</span>
        {delta !== undefined && (
          <div
            className={`kpi-delta ${safeDelta >= 0 ? "positive" : "negative"}`}
          >
            <i className={`fas fa-arrow-${safeDelta >= 0 ? "up" : "down"}`}></i>
            <span>
              {Math.abs(safeDelta).toFixed(1)}% {deltaLabel}
            </span>
          </div>
        )}
      </div>
    </div>
  );

  if (!link) return cardContent;
  return (
    <Link to={link} className="kpi-link-wrapper">
      {cardContent}
    </Link>
  );
};

export default memo(KpiCard);

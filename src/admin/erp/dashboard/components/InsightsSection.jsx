import { memo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { insightIconMap } from "../constants";

const InsightsSection = ({ insights, expandedInsight, setExpandedInsight }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  if (!insights || insights.length === 0) return null;

  return (
    <div className="insights-container">
      <div className="insights-header">
        <i className="fas fa-lightbulb"></i>
        <h4>{t("Smart Insights")}</h4>
      </div>
      {insights.map((insight, i) => (
        <div
          key={i}
          className={`insight-card ${insight.priority} ${insight.explanation ? "expandable" : ""} ${insight.action?.url ? "clickable" : ""}`}
          role="button"
          tabIndex={0}
          onClick={() => {
            if (insight.explanation) {
              setExpandedInsight(expandedInsight === i ? null : i);
            }
            if (insight.action?.url && !insight.explanation) {
              navigate(insight.action.url);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              if (insight.explanation) {
                setExpandedInsight(expandedInsight === i ? null : i);
              }
              if (insight.action?.url && !insight.explanation) {
                navigate(insight.action.url);
              }
            }
          }}
          style={{
            cursor:
              insight.explanation || insight.action?.url
                ? "pointer"
                : "default",
          }}
        >
          <div className="insight-icon">
            {insightIconMap[insight.category] || "📊"}
          </div>
          <div className="insight-content">
            <span className="insight-category">{t(insight.category)}</span>
            <p>{t(insight.message)}</p>
            {expandedInsight === i && insight.explanation && (
              <div className="insight-explanation">
                <p className="explanation-summary">
                  {t(insight.explanation.summary)}
                </p>
                <ul className="explanation-factors">
                  {insight.explanation.factors.map((factor, idx) => (
                    <li key={idx}>
                      <span>{t(factor.label)}</span>
                      <strong className={factor.value > 10 ? "high" : ""}>
                        {factor.value}
                      </strong>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {insight.action?.label && !insight.explanation && (
              <span className="insight-action">
                {t(insight.action.label)} →
              </span>
            )}
            {insight.explanation && (
              <span className="expand-indicator">
                {expandedInsight === i ? "▲" : "▼"} {t("Show details")}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default memo(InsightsSection);

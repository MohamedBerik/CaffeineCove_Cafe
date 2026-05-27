// dashboard/helpers.js
import { useTranslation } from "react-i18next";

export const useFormatCurrency = () => {
  const { i18n } = useTranslation();
  return (value) =>
    new Intl.NumberFormat(i18n.language === "ar" ? "ar-EG" : "en-US", {
      style: "currency",
      currency: "EGP",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(value || 0));
};

export const formatDate = (value, i18n) => {
  if (!value) return "-";
  try {
    const lang = i18n.language === "ar" ? "ar-EG" : "en-US";
    return new Date(value).toLocaleDateString(lang, {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  } catch {
    return value;
  }
};

export const formatDateTime = (value, i18n) => {
  if (!value) return "-";
  try {
    const lang = i18n.language === "ar" ? "ar-EG" : "en-US";
    return new Date(value).toLocaleString(lang, {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return value;
  }
};

export const formatTime = (value) => {
  if (!value) return "-";
  try {
    return String(value).slice(0, 5);
  } catch {
    return value;
  }
};

export const generateSummary = (kpis, t) => {
  const messages = [];
  const priorityOrder = { negative: 3, warning: 2, positive: 1 };

  const revenueDelta = kpis.revenue?.delta || 0;
  if (revenueDelta > 10)
    messages.push({ type: "positive", message: t("summary_revenue_up") });
  else if (revenueDelta < -10)
    messages.push({ type: "negative", message: t("summary_revenue_down") });

  const appointmentsDelta = kpis.appointments?.delta || 0;
  if (appointmentsDelta > 15)
    messages.push({ type: "positive", message: t("summary_appointments_up") });

  const noShowCount = kpis.no_show_appointments?.current || 0;
  if (noShowCount > 5)
    messages.push({ type: "warning", message: t("summary_no_show_high") });

  const unpaidCount = kpis.unpaid_invoices?.current || 0;
  if (unpaidCount > 10)
    messages.push({ type: "warning", message: t("summary_unpaid_high") });

  const cancelledDelta = kpis.cancelled_appointments?.delta || 0;
  if (cancelledDelta > 20)
    messages.push({ type: "warning", message: t("summary_cancelled_up") });

  return messages
    .sort((a, b) => priorityOrder[b.type] - priorityOrder[a.type])
    .slice(0, 3);
};

// ========================= Helpers =========================
//   const formatLog = (log) => {
//     const type = log.subject_type;
//     const action = log.action;
//     if (type === "Appointment") {
//       if (action === "created") return t("New appointment created");
//       if (action === "updated") return t("Appointment updated");
//       if (action === "deleted") return t("Appointment deleted");
//     }
//     if (type === "Invoice") {
//       if (action === "created") return t("New invoice created");
//       if (action === "paid") return t("Invoice paid");
//     }
//     if (type === "Payment") return t("New payment recorded");
//     if (type === "Customer") return t("Customer updated");
//     return `${type} ${action}`;
//   };

//   const AnimatedDot = (props) => {
//     const { cx, cy, payload } = props;
//     if (!payload?.anomaly) return null;
//     return (
//       <g>
//         <circle
//           cx={cx}
//           cy={cy}
//           r={8}
//           className="pulse-dot"
//           fill={getAnomalyColor(payload.anomaly.priority)}
//         />
//         <text
//           x={cx}
//           y={cy - 12}
//           fontSize="12"
//           textAnchor="middle"
//           fill={getAnomalyColor(payload.anomaly.priority)}
//         >
//           ⚠️
//         </text>
//       </g>
//     );
//   };

//   const formatCurrency = (value) => {
//     const lang = i18n.language === "ar" ? "ar-EG" : "en-US";
//     return new Intl.NumberFormat(lang, {
//       style: "currency",
//       currency: "EGP",
//       minimumFractionDigits: 2,
//       maximumFractionDigits: 2,
//     }).format(Number(value || 0));
//   };

//   const formatDateTime = (value) => {
//     if (!value) return "-";
//     try {
//       const lang = i18n.language === "ar" ? "ar-EG" : "en-US";
//       return new Date(value).toLocaleString(lang, {
//         year: "numeric",
//         month: "short",
//         day: "2-digit",
//         hour: "2-digit",
//         minute: "2-digit",
//       });
//     } catch {
//       return value;
//     }
//   };

//   const formatDate = (value) => {
//     if (!value) return "-";
//     try {
//       const lang = i18n.language === "ar" ? "ar-EG" : "en-US";
//       return new Date(value).toLocaleDateString(lang, {
//         year: "numeric",
//         month: "short",
//         day: "2-digit",
//       });
//     } catch {
//       return value;
//     }
//   };

//   const formatTime = (value) => {
//     if (!value) return "-";
//     try {
//       return String(value).slice(0, 5);
//     } catch {
//       return value;
//     }
//   };

//   const generateSummary = (kpis) => {
//     const messages = [];
//     const priorityOrder = { negative: 3, warning: 2, positive: 1 };
//     const revenueDelta = kpis.revenue?.delta || 0;
//     if (revenueDelta > 10) {
//       messages.push({ type: "positive", message: t("summary_revenue_up") });
//     } else if (revenueDelta < -10) {
//       messages.push({ type: "negative", message: t("summary_revenue_down") });
//     }
//     const appointmentsDelta = kpis.appointments?.delta || 0;
//     if (appointmentsDelta > 15) {
//       messages.push({
//         type: "positive",
//         message: t("summary_appointments_up"),
//       });
//     }
//     const noShowCount = kpis.no_show_appointments?.current || 0;
//     if (noShowCount > 5) {
//       messages.push({ type: "warning", message: t("summary_no_show_high") });
//     }
//     const unpaidCount = kpis.unpaid_invoices?.current || 0;
//     if (unpaidCount > 10) {
//       messages.push({ type: "warning", message: t("summary_unpaid_high") });
//     }
//     const cancelledDelta = kpis.cancelled_appointments?.delta || 0;
//     if (cancelledDelta > 20) {
//       messages.push({ type: "warning", message: t("summary_cancelled_up") });
//     }
//     return messages
//       .sort((a, b) => priorityOrder[b.type] - priorityOrder[a.type])
//       .slice(0, 3);
//   };

//   const summaryMessages = useMemo(() => {
//     const kpis = dashboard?.kpis;
//     if (!kpis) return [];
//     return generateSummary(kpis);
//   }, [dashboard?.kpis, t]);

//   useEffect(() => {
//     const insights = dashboard?.insights || [];
//     if (insights.length > 0) {
//       const highIndex = insights.findIndex((i) => i.priority === "high");
//       if (highIndex !== -1) {
//         setExpandedInsight(highIndex);
//       }
//     }
//   }, [dashboard?.insights]);

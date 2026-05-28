import { useTranslation } from "react-i18next";

export const getAnomalyColor = (priority) => {
  switch (priority) {
    case "high":
      return "#ef4444";
    case "medium":
      return "#f59e0b";
    default:
      return "#eab308";
  }
};

export const getGreeting = (t) => {
  const hour = new Date().getHours();
  if (hour < 12) return t("Good Morning");
  if (hour < 18) return t("Good Afternoon");
  return t("Good Evening");
};

export const formatCurrency = (value, language) => {
  const lang = language === "ar" ? "ar-EG" : "en-US";
  return new Intl.NumberFormat(lang, {
    style: "currency",
    currency: "EGP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
};

export const formatDate = (value, language) => {
  if (!value) return "-";
  try {
    const lang = language === "ar" ? "ar-EG" : "en-US";
    return new Date(value).toLocaleDateString(lang, {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  } catch {
    return value;
  }
};

export const formatDateTime = (value, language) => {
  if (!value) return "-";
  try {
    const lang = language === "ar" ? "ar-EG" : "en-US";
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
  return String(value).slice(0, 5);
};

export const useFormatCurrency = () => {
  const { i18n } = useTranslation();
  return (value) => formatCurrency(value, i18n.language);
};

// نفس generateSummary الأصلية بالضبط مع مفاتيح الترجمة والترتيب والاقتصاص
export const generateSummary = (kpis, t) => {
  const messages = [];
  const priorityOrder = { negative: 3, warning: 2, positive: 1 };
  const revenueDelta = kpis.revenue?.delta || 0;
  if (revenueDelta > 10) {
    messages.push({ type: "positive", message: t("summary_revenue_up") });
  } else if (revenueDelta < -10) {
    messages.push({ type: "negative", message: t("summary_revenue_down") });
  }
  const appointmentsDelta = kpis.appointments?.delta || 0;
  if (appointmentsDelta > 15) {
    messages.push({
      type: "positive",
      message: t("summary_appointments_up"),
    });
  }
  const noShowCount = kpis.no_show_appointments?.current || 0;
  if (noShowCount > 5) {
    messages.push({ type: "warning", message: t("summary_no_show_high") });
  }
  const unpaidCount = kpis.unpaid_invoices?.current || 0;
  if (unpaidCount > 10) {
    messages.push({ type: "warning", message: t("summary_unpaid_high") });
  }
  const cancelledDelta = kpis.cancelled_appointments?.delta || 0;
  if (cancelledDelta > 20) {
    messages.push({ type: "warning", message: t("summary_cancelled_up") });
  }
  return messages
    .sort((a, b) => priorityOrder[b.type] - priorityOrder[a.type])
    .slice(0, 3);
};

export const safeNumber = (v) => Number(v || 0);

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

export const generateSummary = (kpis, t) => {
  const messages = [];
  if ((kpis.revenue?.delta || 0) > 0) {
    messages.push({
      type: "positive",
      message: t("Revenue increased compared to previous period"),
    });
  }
  if ((kpis.cancelled_appointments?.current || 0) > 10) {
    messages.push({
      type: "negative",
      message: t("High appointment cancellation rate detected"),
    });
  }
  if ((kpis.unpaid_invoices?.current || 0) > 0) {
    messages.push({
      type: "warning",
      message: t("There are unpaid invoices requiring attention"),
    });
  }
  return messages;
};

export const safeNumber = (v) => Number(v || 0);
